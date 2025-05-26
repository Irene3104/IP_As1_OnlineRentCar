<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

$ordersFilePath = '../data/orders.json';
$dataDir = '../data';

// 데이터 디렉터리가 없으면 생성
if (!file_exists($dataDir)) {
    if (!mkdir($dataDir, 0777, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create data directory.']);
        exit;
    }
}

// 입력 데이터 가져오기
$jsonPayload = file_get_contents('php://input');
$newOrderData = json_decode($jsonPayload, true);

// 입력된 JSON 유효성 검사
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload: ' . json_last_error_msg()]);
    exit;
}

// 새 주문 데이터에 필수 필드(orderId)가 있는지 확인
if (!isset($newOrderData['orderId'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'New order data is malformed. Missing orderId.']);
    exit;
}

$allOrdersData = ['orders' => []]; // 기본 구조

// 기존 주문 파일 읽기
if (file_exists($ordersFilePath)) {
    if (filesize($ordersFilePath) > 0) {
        $currentOrdersJson = file_get_contents($ordersFilePath);
        if ($currentOrdersJson === false) {
            http_response_code(500); // Internal Server Error
            error_log("Could not read existing orders file: $ordersFilePath");
            echo json_encode(['success' => false, 'message' => 'Error reading orders data.']);
            exit;
        }
        $decodedData = json_decode($currentOrdersJson, true);
        if (json_last_error() === JSON_ERROR_NONE && isset($decodedData['orders']) && is_array($decodedData['orders'])) {
            $allOrdersData = $decodedData;
        } else {
            error_log("Invalid JSON or structure in $ordersFilePath. Reinitializing. JSON error: " . json_last_error_msg());
            // 파일 내용이 손상되었을 수 있으므로, 백업을 고려하거나 빈 배열로 시작
        }
    }
    // 파일이 존재하지만 비어있는 경우, $allOrdersData는 ['orders' => []]로 유지됨
}

// 새 주문 추가
$allOrdersData['orders'][] = $newOrderData; // array_push와 동일, 직접 할당이 더 명확할 수 있음

// 업데이트된 주문 데이터를 파일에 저장
if (file_put_contents($ordersFilePath, json_encode($allOrdersData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE))) {
    http_response_code(201); // Created (또는 200 OK)
    echo json_encode(['success' => true, 'message' => 'Order saved successfully.', 'order' => $newOrderData]);
} else {
    http_response_code(500); // Internal Server Error
    error_log("Failed to write to orders file: $ordersFilePath. Check permissions and path.");
    echo json_encode(['success' => false, 'message' => 'Failed to save order. Check server logs.']);
}
?> 