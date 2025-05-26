document.addEventListener('DOMContentLoaded', async () => {
    console.log('My Reservations page DOM fully loaded and parsed.');
    document.body.classList.add('main-content-visible'); // Ensure content is visible

    const reservationListContainer = document.getElementById('reservation-list-container');
    const noReservationsMessage = document.getElementById('no-reservations-message');

    if (!reservationListContainer || !noReservationsMessage) {
        console.error('Required containers for displaying reservations are missing.');
        return;
    }

    try {
        // Fetch all order data (assuming fetchOrderDataOnce is globally available from carsData.js)
        const ordersData = await fetchOrderDataOnce(); 
        // ordersData is expected to be an object like { orders: [...] }

        if (ordersData && ordersData.orders && ordersData.orders.length > 0) {
            displayReservations(ordersData.orders, reservationListContainer);
            noReservationsMessage.style.display = 'none';
            reservationListContainer.style.display = 'block'; // Ensure it's visible
        } else {
            console.log('No reservations found or data is in unexpected format.', ordersData);
            reservationListContainer.innerHTML = ''; // Clear any previous content
            reservationListContainer.style.display = 'none';
            noReservationsMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching or displaying reservations:', error);
        reservationListContainer.innerHTML = '<p style="color:red; text-align:center;">Could not load reservations. Please try again later.</p>';
        reservationListContainer.style.display = 'block';
        noReservationsMessage.style.display = 'none';
    }
});

function displayReservations(orders, container) {
    container.innerHTML = ''; // Clear previous content

    orders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'reservation-list-item';

        // Format order date (assuming order.rental.orderDate exists)
        let formattedOrderDate = 'N/A';
        if (order.rental && order.rental.orderDate) {
            try {
                formattedOrderDate = new Date(order.rental.orderDate).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric' 
                });
            } catch (e) {
                console.warn('Could not format order date:', order.rental.orderDate, e);
            }
        }
        
        // Basic car model display, can be enhanced if car details are more deeply nested or need fetching
        const carDisplay = order.car ? `${order.car.brand || 'N/A'} ${order.car.carModel || 'N/A'} (VIN: ${order.car.vin || 'N/A'})` : 'Vehicle data missing';

        orderItem.innerHTML = `
            <h3>
                Order ID: ${order.orderId || 'N/A'}
                <span class="order-date">Booked on: ${formattedOrderDate}</span>
            </h3>
            <p><strong>Customer:</strong> ${order.customer ? order.customer.name : 'N/A'}</p>
            <p><strong>Vehicle:</strong> ${carDisplay}</p>
            <p><strong>Rental Period:</strong> ${order.rental ? order.rental.rentalPeriod + ' day(s)' : 'N/A'}</p>
            <p><strong>Total Price:</strong> $${order.rental ? order.rental.totalPrice : 'N/A'}</p>
            <a href="order_confirmation.html?orderId=${order.orderId || ''}" class="details-link">View Details <i class="fas fa-arrow-right"></i></a>
        `;
        container.appendChild(orderItem);
    });
} 