<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); // 개발 중 오류 확인, 프로덕션에서는 변경

header('Content-Type: application/json');

$carsFilePath = '../data/cars.json';
$dataDir = '../data';

// 데이터 디렉터리가 없으면 생성 (cars.json이 있을 가능성이 높지만, 안전을 위해)
if (!file_exists($dataDir)) {
    if (!mkdir($dataDir, 0777, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create data directory.']);
        exit;
    }
}

// 입력 데이터 가져오기
$jsonPayload = file_get_contents('php://input');
$requestData = json_decode($jsonPayload, true);

// 입력된 JSON 유효성 검사
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload: ' . json_last_error_msg()]);
    exit;
}

// 필수 입력 필드 (vin, available) 확인
if (!isset($requestData['vin']) || !isset($requestData['available']) || !is_bool($requestData['available'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Missing or invalid parameters. "vin" (string) and "available" (boolean) are required.']);
    exit;
}

$carVinToUpdate = $requestData['vin'];
$newAvailability = $requestData['available'];

// cars.json 파일 존재 및 읽기 가능 여부 확인
if (!file_exists($carsFilePath) || filesize($carsFilePath) === 0) {
    http_response_code(404); // Not Found
    error_log("Cars data file not found or empty: $carsFilePath");
    echo json_encode(['success' => false, 'message' => 'Car data file not found or is empty.']);
    exit;
}

$carsJson = file_get_contents($carsFilePath);
if ($carsJson === false) {
    http_response_code(500); // Internal Server Error
    error_log("Could not read cars data file: $carsFilePath");
    echo json_encode(['success' => false, 'message' => 'Error reading car data.']);
    exit;
}

$allCarsData = json_decode($carsJson, true);
if (json_last_error() !== JSON_ERROR_NONE || !isset($allCarsData['cars']) || !is_array($allCarsData['cars'])) {
    http_response_code(500); // Internal Server Error
    error_log("Invalid JSON or structure in $carsFilePath. JSON error: " . json_last_error_msg());
    echo json_encode(['success' => false, 'message' => 'Error parsing car data.']);
    exit;
}

$carFound = false;
foreach ($allCarsData['cars'] as $index => $car) {
    if (isset($car['vin']) && $car['vin'] === $carVinToUpdate) {
        $allCarsData['cars'][$index]['available'] = $newAvailability;
        $carFound = true;
        break;
    }
}

if (!$carFound) {
    http_response_code(404); // Not Found
    echo json_encode(['success' => false, 'message' => "Car with VIN '$carVinToUpdate' not found."]);
    exit;
}

// 업데이트된 차량 데이터를 파일에 저장
if (file_put_contents($carsFilePath, json_encode($allCarsData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE))) {
    http_response_code(200); // OK
    echo json_encode(['success' => true, 'message' => "Car VIN '$carVinToUpdate' availability updated to " . ($newAvailability ? 'true' : 'false') . "."]);
} else {
    http_response_code(500); // Internal Server Error
    error_log("Failed to write to cars file: $carsFilePath. Check permissions and path.");
    echo json_encode(['success' => false, 'message' => 'Failed to update car status. Check server logs.']);
}
?> 