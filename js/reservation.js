// js/reservation.js
// Handles logic for the reservation.html page with improved UI and functionality

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Reservation page DOM fully loaded and parsed.');
    clearFormData(); // Clear any previously saved form data on page load

    // Ensure car data is fetched
    if (!allCarsData || allCarsData.length === 0) {
        console.log('Car data not found, fetching now for reservation page...');
        await fetchCarDataOnce();
    }

    // Make the main content wrapper visible
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
            displaySelectedCarInfo(car);
            if (car.available) {
                console.log('Car is available. Setting up reservation form.');
                setupReservationForm(car);
                loadFormData(); // Load any saved form data
                hideMessage();
            } else {
                console.log('Car is not available.');
                showMessage('This car is currently rented out. Please choose another vehicle.', 'error');
                hideForm();
            }
        } else {
            console.log('Car with VIN not found.');
            showMessage('Invalid car selection. Please go back and select a car.', 'error');
            hideForm();
        }
    } else {
        console.log('No Car VIN in URL.');
        showMessage('Please select a car from our fleet to make a reservation.', 'error');
        hideForm();
    }
});

/**
 * Finds a car by its VIN from the global allCarsData array.
 */
function findCarByVin(vin) {
    if (!allCarsData || allCarsData.length === 0) {
        console.warn('allCarsData is empty or not loaded. Cannot find car by VIN.');
        return null;
    }
    return allCarsData.find(car => car.vin === vin) || null;
}

/**
 * Displays the selected car's information in the new card format.
 */
function displaySelectedCarInfo(car) {
    const container = document.getElementById('selected-car-card');
    if (!container) return;

    container.innerHTML = `
        <img src="${car.image || 'images/default-car.png'}" 
             alt="${car.brand} ${car.carModel}" 
             class="selected-car-image" 
             onerror="this.onerror=null;this.src='images/default-car.png';">
        <div class="selected-car-details">
            <h4>${car.brand} ${car.carModel} (${car.yearOfManufacture})</h4>
            <p><strong>Type:</strong> ${car.carType}</p>
            <p><strong>Fuel:</strong> ${car.fuelType}</p>
            <p><strong>Mileage:</strong> ${car.mileage}</p>
            <p class="selected-car-price">$${car.pricePerDay}/day</p>
        </div>
    `;
}

/**
 * Sets up the reservation form with event listeners and validation.
 */
function setupReservationForm(car) {
    const form = document.getElementById('reservation-form');
    if (!form) return;

    // Set minimum date to today
    const startDateInput = document.getElementById('start-date');
    if (startDateInput) {
        const today = new Date().toISOString().split('T')[0];
        startDateInput.min = today;
        startDateInput.value = today; // Set default to today
    }

    // Set default rental period
    const rentalPeriodInput = document.getElementById('rental-period');
    if (rentalPeriodInput) {
        rentalPeriodInput.value = '1';
    }

    // Initial price calculation
    updatePriceCalculation(car.pricePerDay);

    // Add event listeners
    setupFormEventListeners(car);
}

/**
 * Sets up all form event listeners for validation and interaction.
 */
function setupFormEventListeners(car) {
    const form = document.getElementById('reservation-form');
    const submitButton = document.getElementById('submit-reservation');
    const cancelButton = document.getElementById('cancel-reservation');
    const inputs = form.querySelectorAll('input[required]');

    // Real-time validation and price calculation
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input);
            validateForm();
            if (input.id === 'rental-period' || input.id === 'start-date') {
                updatePriceCalculation(car.pricePerDay);
            }
            saveFormData();
        });

        input.addEventListener('blur', () => {
            validateInput(input);
            validateForm();
        });
    });

    // Form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            console.log('Form validation failed on submit');
            return;
        }
        await submitReservation(car);
    });

    // Cancel button
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? All entered information will be lost.')) {
                clearFormData();
                window.location.href = 'index.html';
            }
        });
    }

    // Initial validation
    validateForm();
}

/**
 * Validates a single input field.
 */
function validateInput(input) {
    const errorElement = document.getElementById(input.id.replace(/^(customer-|start-|rental-)/, '') + '-error');
    let isValid = true;
    let errorMessage = '';

    // Clear previous error state
    input.classList.remove('error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }

    const value = input.value.trim();

    if (!value && input.required) {
        isValid = false;
        errorMessage = 'This field is required.';
    } else if (value) {
        switch (input.type) {
            case 'email':
                if (!isValidEmail(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address.';
                }
                break;
            case 'tel':
                if (!isValidPhoneNumber(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid phone number.';
                }
                break;
            case 'date':
                const today = new Date();
                const selectedDate = new Date(value);
                today.setHours(0, 0, 0, 0);
                selectedDate.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    isValid = false;
                    errorMessage = 'Start date cannot be in the past.';
                }
                break;
            case 'number':
                const numValue = parseInt(value);
                if (isNaN(numValue) || numValue < 1 || numValue > 30) {
                    isValid = false;
                    errorMessage = 'Rental period must be between 1 and 30 days.';
                }
                break;
        }
    }

    if (!isValid) {
        input.classList.add('error');
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
        }
    }

    return isValid;
}

/**
 * Validates the entire form and enables/disables submit button.
 */
function validateForm() {
    const form = document.getElementById('reservation-form');
    const submitButton = document.getElementById('submit-reservation');
    const inputs = form.querySelectorAll('input[required]');
    
    let allValid = true;
    inputs.forEach(input => {
        if (!validateInput(input)) {
            allValid = false;
        }
    });

    if (submitButton) {
        submitButton.disabled = !allValid;
    }

    return allValid;
}

/**
 * Updates the price calculation display.
 */
function updatePriceCalculation(pricePerDay) {
    const rentalPeriodInput = document.getElementById('rental-period');
    const dailyRateElement = document.getElementById('daily-rate');
    const displayRentalPeriodElement = document.getElementById('display-rental-period');
    const totalPriceElement = document.getElementById('total-price');

    const period = parseInt(rentalPeriodInput?.value) || 0;
    const totalPrice = period * pricePerDay;

    if (dailyRateElement) dailyRateElement.textContent = `$${pricePerDay}`;
    if (displayRentalPeriodElement) displayRentalPeriodElement.textContent = `${period} day${period !== 1 ? 's' : ''}`;
    if (totalPriceElement) totalPriceElement.textContent = `$${totalPrice}`;
}

/**
 * Submits the reservation to the server.
 */
async function submitReservation(car) {
    const submitButton = document.getElementById('submit-reservation');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    try {
        const formData = getFormData();
        const orderData = {
            customer: {
                name: formData.customerName,
                phoneNumber: formData.customerPhone,
                email: formData.customerEmail,
                driversLicenseNumber: formData.customerLicense
            },
            rental: {
                startDate: formData.startDate,
                rentalPeriod: parseInt(formData.rentalPeriod)
            },
            carVin: car.vin
        };

        console.log('Submitting order data:', orderData);

        const response = await fetch('php/submit_order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Order submission result:', result);

        if (result.success) {
            showMessage('Reservation submitted successfully! Redirecting to confirmation page...', 'success');
            clearFormData();
            
            // Redirect to confirmation page after a short delay
            setTimeout(() => {
                window.location.href = `order_confirmation.html?orderId=${result.orderId}`;
            }, 2000);
        } else {
            throw new Error(result.message || 'Unknown error occurred');
        }

    } catch (error) {
        console.error('Error submitting reservation:', error);
        showMessage(`Error submitting reservation: ${error.message}`, 'error');
        
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-check"></i> Confirm Reservation';
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

/**
 * Gets form data as an object.
 */
function getFormData() {
    return {
        customerName: document.getElementById('customer-name')?.value || '',
        customerPhone: document.getElementById('customer-phone')?.value || '',
        customerEmail: document.getElementById('customer-email')?.value || '',
        customerLicense: document.getElementById('customer-license')?.value || '',
        startDate: document.getElementById('start-date')?.value || '',
        rentalPeriod: document.getElementById('rental-period')?.value || '1'
    };
}

/**
 * Shows a message to the user.
 */
function showMessage(message, type = 'info') {
    const container = document.getElementById('reservation-message-container');
    if (!container) return;

    container.className = `message-container ${type}`;
    container.innerHTML = `<p>${message}</p>`;
    container.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideMessage();
        }, 5000);
    }
}

/**
 * Hides the message container.
 */
function hideMessage() {
    const container = document.getElementById('reservation-message-container');
    if (container) {
        container.style.display = 'none';
    }
}

/**
 * Hides the reservation form.
 */
function hideForm() {
    const container = document.getElementById('reservation-form-container');
    if (container) {
        container.style.display = 'none';
    }
}

/**
 * Saves form data to localStorage.
 */
function saveFormData() {
    const formData = getFormData();
    localStorage.setItem('reservationFormData', JSON.stringify(formData));
}

/**
 * Loads form data from localStorage.
 */
function loadFormData() {
    const savedData = localStorage.getItem('reservationFormData');
    if (!savedData) return;

    try {
        const formData = JSON.parse(savedData);
        
        // Populate form fields
        Object.keys(formData).forEach(key => {
            const input = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (input && formData[key]) {
                input.value = formData[key];
            }
        });

        // Trigger validation and price calculation
        const form = document.getElementById('reservation-form');
        if (form) {
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                input.dispatchEvent(new Event('input'));
            });
        }
    } catch (error) {
        console.error('Error loading saved form data:', error);
        clearFormData();
    }
}

/**
 * Clears saved form data from localStorage.
 */
function clearFormData() {
    localStorage.removeItem('reservationFormData');
}

/**
 * Validates email format.
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates phone number format.
 */
function isValidPhoneNumber(phone) {
    // Allow digits, spaces, dashes, parentheses, and optional leading +
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
    return phoneRegex.test(phone);
}

// TODO: Add CSS for form elements, error messages, .selected-car-card in style.css 