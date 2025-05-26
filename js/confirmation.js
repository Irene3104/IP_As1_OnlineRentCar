document.addEventListener('DOMContentLoaded', async () => {
    console.log('Order confirmation page loaded');
    document.body.classList.add('main-content-visible');
    
    const orderIdSpan = document.getElementById('confirmed-order-id');
    const orderDateSpan = document.getElementById('confirmed-order-date');
    const customerNameSpan = document.getElementById('confirmed-customer-name');
    const customerEmailSpan = document.getElementById('confirmed-customer-email');
    const customerPhoneSpan = document.getElementById('confirmed-customer-phone');
    const carModelSpan = document.getElementById('confirmed-car-model');
    const carVinSpan = document.getElementById('confirmed-car-vin');
    const startDateSpan = document.getElementById('confirmed-start-date');
    const rentalPeriodSpan = document.getElementById('confirmed-rental-period');
    const totalPriceSpan = document.getElementById('confirmed-total-price');

    const orderDetailsContainer = document.getElementById('order-details-container');
    const loadingMessageDiv = document.getElementById('loading-message');
    const errorMessageDiv = document.getElementById('confirmation-error-message');

    // Check if all necessary elements exist
    if (!orderIdSpan || !orderDateSpan || !customerNameSpan || !customerEmailSpan || !customerPhoneSpan || 
        !carModelSpan || !carVinSpan || !startDateSpan || !rentalPeriodSpan || !totalPriceSpan || 
        !orderDetailsContainer || !loadingMessageDiv || !errorMessageDiv) {
        console.error('One or more key confirmation page elements are missing from the DOM.');
        if(errorMessageDiv) {
            errorMessageDiv.style.display = 'block';
        }
        if(loadingMessageDiv) {
            loadingMessageDiv.style.display = 'none';
        }
        return;
    }

    // Show loading message initially
    console.log('[Confirmation Page] Initializing: Hiding details, Hiding error, Showing loading');
    loadingMessageDiv.style.display = 'block';
    orderDetailsContainer.style.display = 'none';
    errorMessageDiv.style.display = 'none';

    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('orderId');
    console.log('[Confirmation Page] Order ID from URL:', orderIdFromUrl);

    if (!orderIdFromUrl) {
        console.warn('No orderId found in URL for confirmation page.');
        showError();
        return;
    }

    console.log('Looking for order ID:', orderIdFromUrl);

    try {
        // Fetch order data
        await fetchOrderDataOnce();
        console.log('[Confirmation Page] All loaded orders:', JSON.parse(JSON.stringify(allOrdersData)));

        if (!allOrdersData || !allOrdersData.orders || allOrdersData.orders.length === 0) {
            console.error('No orders found in allOrdersData or data is not in expected format.');
            showError();
            return;
        }

        console.log('Available orders:', allOrdersData.orders);

        // Add this for debugging
        if (allOrdersData && allOrdersData.orders && allOrdersData.orders.length > 0) {
            console.log('[confirmation.js] Before forEach, first order.orderId:', allOrdersData.orders[0].orderId);
        }
        console.log('[Confirmation Page] Searching for orderId:', orderIdFromUrl);
        allOrdersData.orders.forEach((order, index) => {
            console.log(`[Confirmation Page] Keys of order at index ${index}:`, Object.keys(order));
            console.log(`[Confirmation Page] order.hasOwnProperty('orderId') at index ${index}:`, order.hasOwnProperty('orderId'));
            console.log(`[Confirmation Page] Processing order at index ${index}:`, JSON.stringify(order)); 
            console.log(`[Confirmation Page] order.orderId at index ${index}:`, order.orderId, 'Type:', typeof order.orderId);
        });
        console.log('[Confirmation Page] orderIdFromUrl type:', typeof orderIdFromUrl);

        // Find the specific order
        const foundOrder = allOrdersData.orders.find(order => order.orderId === orderIdFromUrl);
        console.log('[Confirmation Page] Found order:', foundOrder);

        if (foundOrder) {
            console.log('Order found:', foundOrder);
            displayOrderDetails(foundOrder);
        } else {
            console.warn(`[Confirmation Page] Order with ID ${orderIdFromUrl} not found in loaded orders.`);
            showError();
        }

    } catch (error) {
        console.error('Error loading order data:', error);
        showError();
    }

    function displayOrderDetails(order) {
        try {
            console.log('[Confirmation Page] displayOrderDetails: Showing details, Hiding loading, Hiding error');
            orderDetailsContainer.style.display = 'block';
            loadingMessageDiv.style.display = 'none';
            errorMessageDiv.style.display = 'none';

            // Populate order details
            orderIdSpan.textContent = order.orderId || 'N/A';
            orderDateSpan.textContent = order.rental.orderDate ? 
                new Date(order.rental.orderDate).toLocaleString() : 'N/A';
            customerNameSpan.textContent = order.customer.name || 'N/A';
            customerEmailSpan.textContent = order.customer.email || 'N/A';
            customerPhoneSpan.textContent = order.customer.phoneNumber || 'N/A';
            carModelSpan.textContent = `${order.car.brand || ''} ${order.car.carModel || ''}`.trim() || 'N/A';
            carVinSpan.textContent = order.car.vin || 'N/A';
            
            // Format start date properly
            if (order.rental.startDate) {
                const startDate = new Date(order.rental.startDate + 'T00:00:00');
                startDateSpan.textContent = startDate.toLocaleDateString();
            } else {
                startDateSpan.textContent = 'N/A';
            }
            
            rentalPeriodSpan.textContent = order.rental.rentalPeriod || 'N/A';
            totalPriceSpan.textContent = order.rental.totalPrice !== undefined ? 
                order.rental.totalPrice.toFixed(2) : 'N/A';
            
        } catch (error) {
            console.error('Error displaying order details:', error);
            showError();
        }
    }

    function showError() {
        console.log('[Confirmation Page] showError: Hiding details, Hiding loading, Showing error');
        loadingMessageDiv.style.display = 'none';
        orderDetailsContainer.style.display = 'none';
        errorMessageDiv.style.display = 'block';
    }
}); 