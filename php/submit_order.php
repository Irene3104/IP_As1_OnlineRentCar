<?php
// php/submit_order.php
// This script handles the submission of car rental orders.

// Set the content type of the response to JSON.
header('Content-Type: application/json');

// Define file paths relative to this script
$base_dir = __DIR__; // Gets the directory of the current script
$cars_file_path = $base_dir . '../../data/cars.json';
$orders_file_path = $base_dir . '../../data/orders.json';

// Function to read JSON file
function read_json_file($file_path) {
    if (!file_exists($file_path) || !is_readable($file_path)) {
        error_log("File not found or not readable: " . $file_path);
        return null;
    }
    $json_data = file_get_contents($file_path);
    if ($json_data === false) {
        error_log("Failed to read file: " . $file_path);
        return null;
    }
    $decoded_data = json_decode($json_data, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON decode error for file " . $file_path . ": " . json_last_error_msg());
        return null;
    }
    return $decoded_data;
}

// Function to write JSON file
function write_json_file($file_path, $data) {
    if (!is_writable(dirname($file_path)) || (file_exists($file_path) && !is_writable($file_path))) {
        error_log("Directory or file not writable: " . $file_path);
        return false;
    }
    $json_data = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json_data === false) {
        error_log("JSON encode error: " . json_last_error_msg());
        return false;
    }
    if (file_put_contents($file_path, $json_data) === false) {
        error_log("Failed to write file: " . $file_path);
        return false;
    }
    return true;
}

// Get the input data from the request body
$input_data = json_decode(file_get_contents('php://input'), true);

// Basic validation for overall structure
if (!$input_data || !isset($input_data['customer']) || !isset($input_data['rental']) || !isset($input_data['carVin'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input data structure.']);
    exit;
}

$customer_details = $input_data['customer'];
$rental_details = $input_data['rental'];
$car_vin_to_rent = $input_data['carVin'];

// Validate customer details
if (empty($customer_details['name']) || empty($customer_details['phoneNumber']) || 
    empty($customer_details['email']) || !filter_var($customer_details['email'], FILTER_VALIDATE_EMAIL) || 
    empty($customer_details['driversLicenseNumber'])) {
    echo json_encode(['success' => false, 'message' => 'Missing or invalid customer details.']);
    exit;
}

// Validate rental details
if (empty($rental_details['startDate']) || empty($rental_details['rentalPeriod']) || 
    !is_numeric($rental_details['rentalPeriod']) || $rental_details['rentalPeriod'] < 1) {
    // Basic date format check (YYYY-MM-DD)
    if (!preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $rental_details['startDate'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid start date format.']);
        exit;
    }
    echo json_encode(['success' => false, 'message' => 'Invalid rental details.']);
    exit;
}

// --- Attempt to lock files to prevent race conditions (basic example) ---
// This is a simplified approach. Robust file locking can be complex.
$cars_fp = fopen($cars_file_path, 'r+');
$orders_fp = fopen($orders_file_path, 'a+'); // Open for reading and writing, create if not exists

if (!$cars_fp || !$orders_fp) {
    if ($cars_fp) fclose($cars_fp);
    if ($orders_fp) fclose($orders_fp);
    error_log("Failed to open JSON files for locking/reading.");
    echo json_encode(['success' => false, 'message' => 'Server error: Could not access data files.']);
    exit;
}

// Try to get exclusive lock (non-blocking for this example, adjust if needed)
$locked_cars = flock($cars_fp, LOCK_EX | LOCK_NB); 
$locked_orders = flock($orders_fp, LOCK_EX | LOCK_NB);

if (!$locked_cars || !$locked_orders) {
    if ($locked_cars) flock($cars_fp, LOCK_UN); // Release if acquired
    if ($locked_orders) flock($orders_fp, LOCK_UN); // Release if acquired
    fclose($cars_fp);
    fclose($orders_fp);
    error_log("Failed to acquire lock on data files.");
    echo json_encode(['success' => false, 'message' => 'Server busy. Please try again in a moment.']);
    exit;
}

// Re-read files after acquiring lock
rewind($cars_fp);
$cars_json_data = stream_get_contents($cars_fp);
$cars_data = json_decode($cars_json_data, true);

rewind($orders_fp);
$orders_json_data = stream_get_contents($orders_fp);
$orders_data = json_decode($orders_json_data, true);

if ($cars_data === null || (empty($orders_json_data) && !is_array($orders_data))) { // Allow orders to be initially empty array
    flock($cars_fp, LOCK_UN);
    flock($orders_fp, LOCK_UN);
    fclose($cars_fp);
    fclose($orders_fp);
    error_log("Error reading JSON data after lock.");
    echo json_encode(['success' => false, 'message' => 'Error reading data files.']);
    exit;
}
if (!isset($orders_data['orders']) || !is_array($orders_data['orders'])) {
    $orders_data = ['orders' => []]; // Initialize if orders key is missing or not an array
}


$car_to_rent_index = -1;
$car_details_for_order = null;

foreach ($cars_data['cars'] as $index => $car) {
    if ($car['vin'] === $car_vin_to_rent) {
        if ($car['available']) {
            $car_to_rent_index = $index;
            $car_details_for_order = $car;
            break;
        } else {
            flock($cars_fp, LOCK_UN);
            flock($orders_fp, LOCK_UN);
            fclose($cars_fp);
            fclose($orders_fp);
            echo json_encode(['success' => false, 'message' => 'Sorry, this car was just rented out. Please choose another.']);
            exit;
        }
    }
}

if ($car_to_rent_index === -1 || $car_details_for_order === null) {
    flock($cars_fp, LOCK_UN);
    flock($orders_fp, LOCK_UN);
    fclose($cars_fp);
    fclose($orders_fp);
    echo json_encode(['success' => false, 'message' => 'Selected car not found or invalid VIN.']);
    exit;
}

$total_price = $car_details_for_order['pricePerDay'] * (int)$rental_details['rentalPeriod'];

$order_id = uniqid('snapcar_'); // 고유한 주문 ID 생성

$new_order = [
    'orderId' => $order_id, // 생성된 주문 ID 추가
    'customer' => $customer_details,
    'car' => [
        'vin' => $car_vin_to_rent,
        'brand' => $car_details_for_order['brand'],
        'carModel' => $car_details_for_order['carModel']
    ],
    'rental' => [
        'startDate' => $rental_details['startDate'],
        'rentalPeriod' => (int)$rental_details['rentalPeriod'],
        'totalPrice' => $total_price,
        'orderDate' => date('Y-m-d H:i:s')
    ]
];

array_unshift($orders_data['orders'], $new_order);
$cars_data['cars'][$car_to_rent_index]['available'] = false;

// Truncate files before writing new content
ftruncate($cars_fp, 0);
rewind($cars_fp);
ftruncate($orders_fp, 0);
rewind($orders_fp);

$car_write_success = write_json_file_from_handle($cars_fp, $cars_data);
$order_write_success = write_json_file_from_handle($orders_fp, $orders_data);

// Release locks and close files
flock($cars_fp, LOCK_UN);
flock($orders_fp, LOCK_UN);
fclose($cars_fp);
fclose($orders_fp);

if ($order_write_success && $car_write_success) {
    echo json_encode([
        'success' => true, 
        'message' => 'Your reservation has been confirmed successfully!',
        'orderId' => $order_id // 생성된 주문 ID를 응답에 포함
    ]);
} else {
    error_log("Failed to write updated data to JSON files. car_write: " . ($car_write_success?'Y':'N') . ", order_write: " . ($order_write_success?'Y':'N'));
    echo json_encode(['success' => false, 'message' => 'An error occurred while saving your reservation details. Please contact support.']);
}

// Helper function to write JSON using file handle (for use with flock)
function write_json_file_from_handle($fp, $data) {
    $json_data = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json_data === false) {
        error_log("JSON encode error during handle write: " . json_last_error_msg());
        return false;
    }
    if (fwrite($fp, $json_data) === false) {
        error_log("Failed to write to file handle.");
        return false;
    }
    return true;
}

?> 