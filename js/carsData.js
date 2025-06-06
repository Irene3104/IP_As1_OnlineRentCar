// js/carsData.js
// This file will handle fetching and storing the global car data.

let allCarsData = []; // Global store for car data
let allOrdersData = []; // 모든 주문 데이터를 저장할 전역 변수
let carsDataFetched = false;
let ordersDataFetched = false; // 주문 데이터 로드 상태 플래그

/**
 * Fetches car data from cars.json if it hasn't been fetched already.
 * Stores the data in the global allCarsData array.
 */
async function fetchCarDataOnce() {
    if (carsDataFetched) {
        // console.log('Car data already fetched, attempting to re-fetch for latest status...');
        // 데이터를 항상 최신으로 유지하기 위해, carsDataFetched가 true여도 다시 fetch 시도 (캐시 옵션과 함께)
    }
    try {
        // console.log('Fetching car data...');
        const response = await fetch('data/cars.json', { cache: 'no-store' }); // cache: 'no-store' 옵션 추가
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json(); 
        allCarsData = jsonData.cars; 
        carsDataFetched = true; // 데이터는 한 번 가져왔다는 플래그는 유지하되, 내용은 매번 갱신될 수 있음
        // console.log('Car data fetched/refreshed successfully:', allCarsData);
        return allCarsData; 
    } catch (error) {
        console.error('Error fetching car data:', error);
        // 에러 발생 시 기존 데이터 유지 또는 빈 배열로 초기화 결정 필요
        // 여기서는 기존 데이터를 반환하거나, 문제가 계속되면 빈 배열로 할 수 있습니다.
        // allCarsData = []; // 이전처럼 에러 시 비우는 옵션
        return allCarsData; // 에러 발생 시 현재 메모리에 있는 (아마도 이전의) 데이터 반환
    }
}

/**
 * Fetches order data from orders.json if it hasn't been fetched already.
 * Stores the data in the global allOrdersData array.
 */
async function fetchOrderDataOnce() {
    if (ordersDataFetched) {
        // console.log('Order data already fetched.');
        return allOrdersData; // Return the already fetched data
    }
    try {
        console.log('[carsData.js] fetchOrderDataOnce called');
        // console.log('Fetching order data...');
        const response = await fetch('data/orders.json', { cache: 'no-store' });
        console.log('[carsData.js] fetch response status:', response.status);

        if (!response.ok) {
            // orders.json 파일이 처음에는 비어있을 수 있으므로, 404는 치명적 오류로 간주하지 않음
            if (response.status === 404) {
                console.warn('orders.json not found, initializing with empty orders list.');
                allOrdersData = { orders: [] }; // 기본 구조로 초기화
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } else {
            const text = await response.text();
            console.log('[carsData.js] fetched text (trimmed length):', text.trim().length);
            if (text.trim() === '') {
                // 파일이 비어있는 경우 (예: 첫 주문 전)
                console.warn('orders.json is empty, initializing with empty orders list.');
                allOrdersData = { orders: [] }; // 기본 구조로 초기화
            } else {
                console.log('[carsData.js] Attempting JSON.parse');
                allOrdersData = JSON.parse(text); // 이 시점에서는 { orders: [{orderId: ...}, ...] } 형태일 것입니다.
                if (allOrdersData && allOrdersData.orders && allOrdersData.orders.length > 0) {
                    console.log('[carsData.js] After parse, first order.orderId:', allOrdersData.orders[0].orderId);
                } else {
                    console.log('[carsData.js] After parse, allOrdersData.orders is not as expected or is empty. allOrdersData:', JSON.stringify(allOrdersData));
                }
            }
        }
        ordersDataFetched = true;
        // console.log('Order data fetched successfully:', allOrdersData);
        return allOrdersData; // Return the fetched data
    } catch (error) {
        console.error('Error fetching or parsing order data:', error);
        allOrdersData = { orders: [] }; // 에러 발생 시 빈 주문 목록으로 초기화
        return allOrdersData; // Return empty object in case of error
    }
}

// 예시: 페이지 로드 시 또는 필요에 따라 호출
// (async () => {
//     await fetchCarDataOnce();
//     await fetchOrderDataOnce();
//     console.log('Initial data loaded:', allCarsData, allOrdersData);
// })();

// Optional: Immediately attempt to fetch data when this script is loaded,
// so it's available for other scripts that might run on DOMContentLoaded.
// However, this might run before the DOM is fully ready for other interactions.
// It's often safer to call this explicitly when needed, e.g., at the start of initHomepage or initReservationPage.
// For now, let's define it and other scripts can call it. 