document.addEventListener('DOMContentLoaded', async () => {
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
        if(errorMessageDiv) errorMessageDiv.style.display = 'block'; // Show generic error if essential spans are missing
        if(loadingMessageDiv) loadingMessageDiv.style.display = 'none';
        return;
    }

    loadingMessageDiv.style.display = 'block'; // Show loading message
    orderDetailsContainer.style.display = 'none';
    errorMessageDiv.style.display = 'none';

    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('orderId');

    if (!orderIdFromUrl) {
        console.warn('No orderId found in URL for confirmation page.');
        orderDetailsContainer.style.display = 'none';
        errorMessageDiv.style.display = 'block';
        loadingMessageDiv.style.display = 'none';
        return;
    }

    // Fetch order data (ensure carsData.js is loaded before this script)
    await fetchOrderDataOnce(); 

    if (!allOrdersData || !allOrdersData.orders || allOrdersData.orders.length === 0) {
        console.error('No orders found in allOrdersData or data is not in expected format.');
        orderDetailsContainer.style.display = 'none';
        errorMessageDiv.style.display = 'block';
        loadingMessageDiv.style.display = 'none';
        return;
    }

    const foundOrder = allOrdersData.orders.find(order => order.orderId === orderIdFromUrl);

    loadingMessageDiv.style.display = 'none'; // Hide loading message

    if (foundOrder) {
        orderIdSpan.textContent = foundOrder.orderId;
        orderDateSpan.textContent = foundOrder.rental.orderDate ? new Date(foundOrder.rental.orderDate).toLocaleString() : 'N/A';
        customerNameSpan.textContent = foundOrder.customer.name || 'N/A';
        customerEmailSpan.textContent = foundOrder.customer.email || 'N/A';
        customerPhoneSpan.textContent = foundOrder.customer.phoneNumber || 'N/A';
        carModelSpan.textContent = `${foundOrder.car.brand || ''} ${foundOrder.car.carModel || ''}`.trim() || 'N/A';
        carVinSpan.textContent = foundOrder.car.vin || 'N/A';
        startDateSpan.textContent = foundOrder.rental.startDate ? new Date(foundOrder.rental.startDate + 'T00:00:00').toLocaleDateString() : 'N/A';
        rentalPeriodSpan.textContent = foundOrder.rental.rentalPeriod || 'N/A';
        totalPriceSpan.textContent = foundOrder.rental.totalPrice !== undefined ? foundOrder.rental.totalPrice.toFixed(2) : 'N/A';
        
        orderDetailsContainer.style.display = 'block';
        errorMessageDiv.style.display = 'none';
    } else {
        console.warn(`Order with ID ${orderIdFromUrl} not found.`);
        orderDetailsContainer.style.display = 'none';
        errorMessageDiv.style.display = 'block';
    }
}); 