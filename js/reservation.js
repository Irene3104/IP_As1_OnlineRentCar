// js/reservation.js
// Handles logic for the reservation.html page.

document.addEventListener('DOMContentLoaded', async () => {
    alert("최신 reservation.js 로드됨 - DOMContentLoaded 시작"); // 테스트용 alert
    clearFormData(); // Clear any previously saved form data on page load
    console.log('Reservation page DOM fully loaded and parsed. Form data has been cleared.');

    // Ensure car data is fetched (it might have been fetched by index.html if user navigated from there,
    // but if reservation.html is opened directly, we need to ensure it's loaded).
    if (!allCarsData || allCarsData.length === 0) {
        console.log('Car data not found, fetching now for reservation page...');
        await fetchCarDataOnce(); // fetchCarDataOnce is defined in carsData.js
    }

    // Make the main content wrapper visible
    // This class is used by CSS to set opacity and transform for a fade-in/slide-in effect.
    document.body.classList.add('main-content-visible');

    const selectedCarInfoContainer = document.getElementById('selected-car-info-container');
    const reservationFormContainer = document.getElementById('reservation-form-container');
    const reservationMessageContainer = document.getElementById('reservation-message-container');

    if (!selectedCarInfoContainer || !reservationFormContainer || !reservationMessageContainer) {
        console.error('One or more key reservation page containers are missing from the DOM.');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const carVin = urlParams.get('vin');

    if (carVin) {
        console.log('Car VIN from URL:', carVin);
        const car = findCarByVin(carVin);

        if (car) {
            console.log('Car found:', car);
            displaySelectedCarInfo(car, selectedCarInfoContainer);
            if (car.available) {
                console.log('Car is available. Displaying reservation form.');
                displayReservationForm(car, reservationFormContainer);
                loadFormData(); // Load any saved form data
                reservationMessageContainer.style.display = 'none';
            } else {
                console.log('Car is not available.');
                showReservationMessage('This car is currently rented out. Please choose another vehicle.', reservationMessageContainer);
                reservationFormContainer.innerHTML = ''; // Clear form area
            }
        } else {
            console.log('Car with VIN not found.');
            showReservationMessage('Invalid car selection. Please go back and select a car.', reservationMessageContainer);
        }
    } else {
        console.log('No Car VIN in URL.');
        showReservationMessage('Please select a car from our fleet to make a reservation.', reservationMessageContainer);
    }
});

/**
 * Finds a car by its VIN from the global allCarsData array.
 * @param {string} vin - The VIN of the car to find.
 * @returns {object|null} The car object if found, otherwise null.
 */
function findCarByVin(vin) {
    if (!allCarsData || allCarsData.length === 0) {
        console.warn('allCarsData is empty or not loaded. Cannot find car by VIN.');
        return null;
    }
    return allCarsData.find(car => car.vin === vin) || null;
}

/**
 * Displays the selected car's information.
 * @param {object} car - The car object.
 * @param {HTMLElement} container - The HTML element to display car info in.
 */
function displaySelectedCarInfo(car, container) {
    container.innerHTML = `
        <div class="selected-car-card">
            <h3>Your Selected Ride:</h3>
            <img src="${car.image || 'images/default-car.png'}" alt="${car.brand} ${car.carModel}" class="selected-car-image" onerror="this.onerror=null;this.src='images/default-car.png';">
            <div class="selected-car-details">
                <h4 class="selected-car-title">${car.brand} ${car.carModel} (${car.yearOfManufacture})</h4>
                <p class="selected-car-price">Price: $${car.pricePerDay}<span class="per-day">/day</span></p>
                <p class="selected-car-type">Type: ${car.carType}</p>
                <!-- VIN is intentionally not displayed to the user -->
            </div>
        </div>
    `;
    // TODO: Add CSS for .selected-car-card and its children for better presentation
}

/**
 * Displays the reservation form.
 * @param {object} car - The car object (to get price per day).
 * @param {HTMLElement} container - The HTML element to display the form in.
 */
function displayReservationForm(car, container) {
    container.innerHTML = `
        <form id="reservation-form">
            <h4>Enter Your Details:</h4>
            
            <div class="form-group">
                <label for="name">Full Name:</label>
                <input type="text" id="name" name="name" required>
                <small class="error-message"></small>
            </div>
            
            <div class="form-group">
                <label for="phone">Phone Number:</label>
                <input type="tel" id="phone" name="phone" required>
                <small class="error-message"></small>
            </div>

            <div class="form-group">
                <label for="email">Email Address:</label>
                <input type="email" id="email" name="email" required>
                <small class="error-message"></small>
            </div>

            <div class="form-group">
                <label for="license">License No.:</label>
                <input type="text" id="license" name="license" required>
                <small class="error-message"></small>
            </div>

            <div class="form-group">
                <label for="start-date">Start Date:</label>
                <input type="date" id="start-date" name="startDate" required>
                <small class="error-message"></small>
            </div>

            <div class="form-group">
                <label for="rental-period">Rental Period (days):</label>
                <input type="number" id="rental-period" name="rentalPeriod" min="1" value="1" required>
                <small class="error-message"></small>
            </div>

            <div class="total-price-container">
                <strong>Total Price: $<span id="total-price">0.00</span></strong>
            </div>

            <div class="form-actions">
                <button type="submit" id="submit-order-button" class="btn btn-primary" disabled>Submit Order</button>
                <button type="button" id="cancel-button" class="btn btn-secondary">Cancel</button>
            </div>
        </form>
    `;

    // Add event listeners for form validation, total price calculation, save/load data, and submission
    setupFormEventListeners(car.pricePerDay, car.vin);
}

/**
 * Shows a message in the reservation message container.
 * @param {string} message - The message to display.
 * @param {HTMLElement} container - The HTML element to display the message in.
 */
function showReservationMessage(message, container) {
    // Fallback if container argument is somehow lost, though it shouldn't be.
    const targetContainer = container || document.getElementById('reservation-message-container');
    if (targetContainer) {
        targetContainer.innerHTML = `<p>${message}</p>`;
        targetContainer.style.display = 'block';
    } else {
        console.error('CRITICAL: reservationMessageContainer not found in showReservationMessage. Message:', message);
        // As a last resort, use alert, though this is bad UX.
        alert(message);
    }
}

/**
 * Sets up event listeners for the reservation form.
 * Includes input validation, total price calculation, and form data persistence.
 * @param {number} pricePerDay - The price per day of the selected car.
 * @param {string} carVin - The VIN of the selected car.
 */
function setupFormEventListeners(pricePerDay, carVin) {
    const form = document.getElementById('reservation-form');
    const submitButton = document.getElementById('submit-order-button');
    const rentalPeriodInput = document.getElementById('rental-period');
    const startDateInput = document.getElementById('start-date');
    const totalPriceDisplay = document.getElementById('total-price');
    const inputs = form.querySelectorAll('input[required]'); // All required input fields
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const licenseInput = document.getElementById('license');
    const cancelButton = document.getElementById('cancel-button');

    // Function to calculate and display total price
    const calculateTotalPrice = () => {
        const period = parseInt(rentalPeriodInput.value) || 0;
        const startDate = startDateInput.value;
        let finalPrice = 0;
        if (period >= 1 && startDate) { // Ensure period is valid and start date is selected
            finalPrice = period * pricePerDay;
        }
        totalPriceDisplay.textContent = finalPrice.toFixed(2);
    };

    // Function to validate a single input field
    const validateInput = (input) => {
        console.log('[Debug] Validating input:', input.id, 'Value:', input.value, 'Required:', input.required);

        const errorMessageElement = input.nextElementSibling;
        let isValid = true;
        const labelText = input.previousElementSibling.textContent.replace(':','');

        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('is-invalid');
            if(errorMessageElement) errorMessageElement.textContent = `${labelText} is required.`;
        } else {
            // Specific validations
            if (input.id === 'email' && !isValidEmail(input.value)) {
                isValid = false;
                input.classList.add('is-invalid');
                if(errorMessageElement) errorMessageElement.textContent = 'Please enter a valid email address.';
            } else if (input.id === 'phone' && !isValidPhoneNumber(input.value)) { // Basic phone validation
                isValid = false;
                input.classList.add('is-invalid');
                if(errorMessageElement) errorMessageElement.textContent = 'Please enter a valid phone number (e.g., 10 digits, or with + and spaces/dashes).';
            } else if (input.id === 'start-date') {
                const today = new Date();
                const selectedDate = new Date(input.value);
                today.setHours(0, 0, 0, 0); // Compare dates only, not time
                selectedDate.setHours(0, 0, 0, 0); // Ensure time part doesn't affect comparison for past dates

                if (selectedDate < today) {
                    isValid = false;
                    input.classList.add('is-invalid');
                    if(errorMessageElement) errorMessageElement.textContent = 'Start date cannot be in the past.';
                } else {
                    input.classList.remove('is-invalid');
                    if(errorMessageElement) errorMessageElement.textContent = '';
                }
            } else if (input.id === 'rental-period' && (parseInt(input.value) < 1 || isNaN(parseInt(input.value)))) {
                isValid = false;
                input.classList.add('is-invalid');
                if(errorMessageElement) errorMessageElement.textContent = 'Rental period must be at least 1 day.';
            } else {
                input.classList.remove('is-invalid');
                if(errorMessageElement) errorMessageElement.textContent = '';
            }
        }
        console.log('[Debug] Input:', input.id, 'Is Valid:', isValid, 'Error Msg:', errorMessageElement ? errorMessageElement.textContent : 'N/A');
        return isValid;
    };

    // Function to validate all inputs and enable/disable submit button
    const validateForm = () => {
        let allValid = true;
        inputs.forEach(input => {
            if (!validateInput(input)) {
                allValid = false;
            }
        });
        console.log('[Debug] Final form validation result (allValid for submit button):', allValid);
        submitButton.disabled = !allValid;
        return allValid;
    };

    // Event listeners for real-time validation and total price calculation
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input); // Validate the current input field
            validateForm();       // Check all fields to enable/disable submit button
            if (input.id === 'rental-period' || input.id === 'start-date') {
                calculateTotalPrice();
            }
            saveFormData(); // Save form data on every input
        });
    });
    
    // Initial calculation and validation
    calculateTotalPrice();
    validateForm();

    // Form submission handler
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!validateForm()) { // Final validation check just in case
            console.log('Form is invalid. Submission prevented. (From submit event listener)');
            return;
        }
        console.log('Form submitted');
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        const formData = new FormData(form);
        // const orderData = Object.fromEntries(formData.entries()); // 이전 방식

        // PHP가 기대하는 구조로 orderData 객체 생성
        const orderData = {
            customer: {
                name: formData.get('name'),
                phoneNumber: formData.get('phone'),
                email: formData.get('email'),
                driversLicenseNumber: formData.get('license')
            },
            rental: {
                startDate: formData.get('startDate'),
                rentalPeriod: formData.get('rentalPeriod') // PHP에서 숫자로 변환할 것임
            },
            carVin: carVin, // carVin은 setupFormEventListeners에서 전달받은 파라미터
            // totalPrice는 PHP에서 다시 계산하므로, 여기서 보내는 것은 선택 사항입니다.
            // 만약 보내려면, PHP가 이 값을 어떻게 사용할지 확인해야 합니다.
            // totalPrice: parseFloat(document.getElementById('total-price').textContent)
        };
        
        // if (!carVin) { // carVin은 이제 orderData.carVin으로 이미 할당됨
        //     console.error('Critical: Car VIN not available for submission. Passed carVin was:', carVin);
        //     showReservationMessage('Error: Car information is missing. Cannot submit order. Please refresh and try again.', document.getElementById('reservation-message-container'));
        //     submitButton.disabled = false;
        //     submitButton.textContent = 'Submit Order';
        //     return;
        // }
        // orderData.vin = carVin; // 이전 방식: 이제 orderData.carVin 사용

        // orderData.totalPrice = parseFloat(document.getElementById('total-price').textContent); // 이전 방식

        console.log("[Debug] Data being sent to PHP:", JSON.stringify(orderData, null, 2));

        try {
            // Ensure the fetch URL is relative to the Rentcar/php/ directory for XAMPP
            const response = await fetch('php/submit_order.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            // Check if the response is okay (status in the range 200-299)
            if (!response.ok) {
                // Try to get more error info from response if possible
                let errorText = `Server responded with ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json(); // Attempt to parse as JSON
                    errorText += ` - ${errorData.message || 'No additional message from server.'}`;
                } catch (e) {
                    // If not JSON, maybe HTML error page, try to get text
                    try {
                        const textError = await response.text();
                        console.error("Server error response (text):");
                        // Avoid displaying full HTML page in simple alert/message. Log for dev.
                        // For user display, a generic message is better if text is too long/complex.
                        // errorText += ` (Details: ${textError.substring(0,100)}...)`; 
                    } catch (textE) { /* ignore text parsing error */ }
                }
                throw new Error(errorText);
            }

            const result = await response.json();
            console.log('Order submission result:', result);

            if (result.success) {
                showReservationMessage(`Order successfully submitted! Your order ID is ${result.orderId}.`, document.getElementById('reservation-message-container'));
                clearFormData(); // Clear form and localStorage
                form.reset();
                // submitButton.style.display = 'none'; // 리디렉션할 것이므로 버튼 숨김은 선택 사항
                
                // 주문 확인 페이지로 리디렉션
                window.location.href = `order_confirmation.html?orderId=${result.orderId}`;

                // Update car availability locally if needed (or rely on next page load)
                const carToUpdate = findCarByVin(orderData.carVin);
                if (carToUpdate) {
                    carToUpdate.available = false;
                    // Potentially update allCarsData and re-save to localStorage if carsData.js handles that
                }
            } else {
                showReservationMessage(`Error submitting order: ${result.message || 'Unknown error.'}`, document.getElementById('reservation-message-container'));
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Order';
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            showReservationMessage(`Error submitting order: ${error.message}. Please check console or try again later. Ensure XAMPP or a PHP server is running.`, document.getElementById('reservation-message-container'));
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Order';
        }
    });

    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            form.reset();
            clearFormData(); // Clear localStorage
            calculateTotalPrice(); // Reset total price display
            inputs.forEach(input => {
                input.classList.remove('is-invalid');
                const errorMessageElement = input.nextElementSibling;
                if(errorMessageElement) errorMessageElement.textContent = '';
            });
            validateForm(); // Re-validate to set initial state of button
            window.location.href = 'index.html'; // Redirect to homepage
        });
    }

    // Load saved data on page load (after form is displayed)
    loadFormData(); 
    calculateTotalPrice(); // Calculate price based on loaded data if any
    validateForm(); // Validate based on loaded data
}

/**
 * Saves form data to localStorage.
 */
function saveFormData() {
    const form = document.getElementById('reservation-form');
    if (!form) return;
    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        license: document.getElementById('license').value,
        startDate: document.getElementById('start-date').value,
        rentalPeriod: document.getElementById('rental-period').value
    };
    localStorage.setItem('reservationFormData', JSON.stringify(formData));
}

/**
 * Loads form data from localStorage.
 */
function loadFormData() {
    const savedData = localStorage.getItem('reservationFormData');
    if (savedData) {
        const formData = JSON.parse(savedData);
        if(document.getElementById('name')) document.getElementById('name').value = formData.name || '';
        if(document.getElementById('phone')) document.getElementById('phone').value = formData.phone || '';
        if(document.getElementById('email')) document.getElementById('email').value = formData.email || '';
        if(document.getElementById('license')) document.getElementById('license').value = formData.license || '';
        if(document.getElementById('start-date')) document.getElementById('start-date').value = formData.startDate || '';
        if(document.getElementById('rental-period')) document.getElementById('rental-period').value = formData.rentalPeriod || '1';
    }
}

/**
 * Clears saved form data from localStorage.
 */
function clearFormData() {
    localStorage.removeItem('reservationFormData');
}

/**
 * Basic email validation.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function for basic phone number validation (example)
function isValidPhoneNumber(phone) {
    // Allows digits, spaces, dashes, parentheses, and optional leading +
    // This is a very basic example. For robust validation, consider a library.
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
    return phoneRegex.test(phone);
}

// TODO: Add CSS for form elements, error messages, .selected-car-card in style.css 