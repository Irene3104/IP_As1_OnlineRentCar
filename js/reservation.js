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

    // ======== Header Search Functionality START ==========
    const headerSearchInput = document.getElementById('reservation-page-search-input');
    const headerSearchButton = document.getElementById('reservation-page-search-button');
    let suggestionsContainerHeader = null; 

    function getHeaderSuggestionsContainer() {
        console.log("[Debug] getHeaderSuggestionsContainer called");
        if (!suggestionsContainerHeader) {
            const searchBarWrapper = headerSearchInput ? headerSearchInput.closest('.header-search-bar') : null;
            if (!searchBarWrapper) {
                console.error('[Debug] Header search bar wrapper (.header-search-bar) not found.');
                return null;
            }

            const containerParent = searchBarWrapper.parentNode;
            if (!containerParent) {
                console.error('[Debug] Parent node of header search bar wrapper not found.');
                return null;
            }
            
            if (window.getComputedStyle(containerParent).position === 'static') {
                containerParent.style.position = 'relative';
            }

            suggestionsContainerHeader = document.createElement('div');
            suggestionsContainerHeader.id = 'header-suggestions-container';
            suggestionsContainerHeader.style.position = 'absolute';
            
            suggestionsContainerHeader.style.top = (searchBarWrapper.offsetTop + searchBarWrapper.offsetHeight) + 'px'; 
            suggestionsContainerHeader.style.left = searchBarWrapper.offsetLeft + 'px';
            suggestionsContainerHeader.style.width = searchBarWrapper.offsetWidth + 'px';
            
            suggestionsContainerHeader.style.zIndex = '1001'; 
            suggestionsContainerHeader.style.backgroundColor = '#fff';
            suggestionsContainerHeader.style.border = '1px solid #ddd';
            suggestionsContainerHeader.style.borderTop = 'none';
            suggestionsContainerHeader.style.maxHeight = '280px';
            suggestionsContainerHeader.style.overflowY = 'auto';
            suggestionsContainerHeader.style.boxSizing = 'border-box';
            
            containerParent.appendChild(suggestionsContainerHeader);
            console.log("[Debug] suggestionsContainerHeader appended to DOM:", suggestionsContainerHeader);
        }
        return suggestionsContainerHeader;
    }

    async function updateHeaderSearchSuggestions(term) {
        console.log(`[Debug] updateHeaderSearchSuggestions called with term: ${term}`);
        const container = getHeaderSuggestionsContainer();
        if (!container) {
            console.error("[Debug] Suggestions container is null in updateHeaderSearchSuggestions.");
            return;
        }

        container.innerHTML = '';
        container.style.display = 'none';

        if (!term || term.length < 1) return;

        if (!allCarsData || allCarsData.length === 0) {
            console.log('Fetching car data for header search...');
            await fetchCarDataOnce(); 
        }
        if (!allCarsData || allCarsData.length === 0) {
            console.warn('Car data unavailable for header search.');
            return; 
        }

        const lowerTerm = term.toLowerCase();
        const matchedCars = allCarsData.filter(car =>
            car.brand.toLowerCase().includes(lowerTerm) ||
            car.carModel.toLowerCase().includes(lowerTerm) ||
            car.carType.toLowerCase().includes(lowerTerm)
        ).slice(0, 7); 

        if (matchedCars.length > 0) {
            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.padding = '0';
            ul.style.margin = '0';

            matchedCars.forEach(car => {
                const li = document.createElement('li');
                const isAvailable = car.available;

                li.innerHTML = `
                    <div style="padding: 10px 15px; cursor: ${isAvailable ? 'pointer' : 'not-allowed'}; border-bottom: 1px solid #eee; ${!isAvailable ? 'opacity: 0.6;' : ''}">
                        <strong>${car.brand} ${car.carModel}</strong> (${car.carType})
                        <small style="color: ${isAvailable ? '#28a745' : '#dc3545'}; float: right; font-weight: bold;">
                            ${isAvailable ? 'Available' : 'Rented Out'}
                        </small>
                    </div>
                `;
                
                if (isAvailable) {
                    li.addEventListener('mouseover', () => li.style.backgroundColor = '#f9f9f9');
                    li.addEventListener('mouseout', () => li.style.backgroundColor = '#fff');
                    
                    li.addEventListener('click', () => {
                        if (car.vin) {
                            window.location.href = `reservation.html?vin=${car.vin}`;
                        }
                        container.style.display = 'none';
                    });
                } else {
                    li.addEventListener('click', () => {
                        alert('This car is currently rented out and cannot be selected.');
                        container.style.display = 'none';
                    });
                }
                ul.appendChild(li);
            });
            container.appendChild(ul);
            container.style.display = 'block';
            console.log("[Debug] Suggestions displayed with items:", matchedCars);
        } else {
          container.innerHTML = '<p style="padding: 10px 15px; color: #6c757d;">No matches found.</p>';
          container.style.display = 'block';
          console.log("[Debug] No suggestions found for term:", term);
        }
    }

    if (headerSearchInput) {
        headerSearchInput.addEventListener('input', (e) => {
            console.log("[Debug] Header search input event. Value:", e.target.value);
            updateHeaderSearchSuggestions(e.target.value);
        });
        headerSearchInput.addEventListener('focus', (e) => { 
            if(e.target.value.length > 0) {
                 updateHeaderSearchSuggestions(e.target.value);
            }
        });
    }

    if (headerSearchButton) {
        headerSearchButton.addEventListener('click', () => {
            const currentSearchTerm = headerSearchInput ? headerSearchInput.value.trim() : '';
            if (currentSearchTerm) {
                const firstSuggestionItem = suggestionsContainerHeader ? suggestionsContainerHeader.querySelector('li') : null;
                if (firstSuggestionItem && suggestionsContainerHeader.style.display === 'block') {
                    firstSuggestionItem.click(); 
                } else {
                    window.location.href = `index.html?search=${encodeURIComponent(currentSearchTerm)}`;
                }
            } else {
                if(headerSearchInput) headerSearchInput.focus();
            }
        });
    }

    document.addEventListener('click', function(event) {
        const container = suggestionsContainerHeader;
        if (container && headerSearchInput && 
            !headerSearchInput.contains(event.target) && 
            !container.contains(event.target) &&
            event.target !== headerSearchButton) {
            container.style.display = 'none';
        }
    });
    // ======== Header Search Functionality END ==========
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
            window.location.href = 'index.html';
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
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    let orderIdForRedirect = null; // Store orderId for redirection

    try {
        // 1. Construct Order Data (same as before but ensure all fields are correctly populated)
        const formData = getFormData();
        const currentDate = new Date().toISOString();

        // Ensure car details are complete, especially pricePerDay
        const carDetailsForOrder = {
            vin: car.vin,
            brand: car.brand,
            carModel: car.carModel, // Ensure this is 'carModel' as used in other places
            pricePerDay: car.pricePerDay 
        };

        const newOrder = {
            orderId: 'ord_' + Date.now() + Math.random().toString(36).substr(2, 5),
            customer: {
                name: formData.customerName,
                phoneNumber: formData.customerPhone,
                email: formData.customerEmail,
                driversLicense: formData.customerLicense // Corrected field name based on typical use
            },
            car: carDetailsForOrder,
            rental: {
                startDate: formData.startDate,
                rentalPeriod: parseInt(formData.rentalPeriod),
                orderDate: currentDate,
                totalPrice: parseFloat(document.getElementById('total-price').textContent.replace(/[^\d.-]/g, ''))
            },
            status: 'pending' // Initial status, confirmation link will change it
        };

        console.log('Submitting new order:', newOrder);

        // 2. Save the Order via php/save_order.php
        const saveOrderResponse = await fetch('php/save_order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newOrder), // Send the complete newOrder object
        });

        const saveResult = await saveOrderResponse.json();
        console.log('Save order result:', saveResult);

        if (!saveOrderResponse.ok || !saveResult.success) {
            throw new Error(saveResult.message || 'Failed to save the order.');
        }

        orderIdForRedirect = newOrder.orderId; // Get orderId from the successfully saved order
        console.log('Order saved. Order ID:', orderIdForRedirect);

        // 3. Update Car Availability via php/update_car_status.php
        console.log(`Updating car VIN: ${car.vin} to unavailable`);
        const updateCarStatusResponse = await fetch('php/update_car_status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vin: car.vin, available: false }),
        });

        const updateCarResult = await updateCarStatusResponse.json();
        console.log('Update car status result:', updateCarResult);

        if (!updateCarStatusResponse.ok || !updateCarResult.success) {
            console.warn('Order saved, but failed to update car status:', updateCarResult.message);
        }

        // 4. If all successful (or if order save was successful and car update failure is tolerated for now):
        showMessage('Order submitted successfully! Redirecting to confirmation page...', 'success');
        clearFormData();
        carsDataFetched = false; // Force re-fetch of car data on next page load (e.g., index)
        ordersDataFetched = false; // Force re-fetch of order data
        
        setTimeout(() => {
            window.location.href = `order_confirmation.html?orderId=${orderIdForRedirect}`;
        }, 2500); // Slightly longer delay for message visibility

    } catch (error) {
        console.error('Error during reservation process:', error);
        showMessage(`Error submitting reservation: ${error.message}`, 'error');
        
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-check"></i> Confirm Reservation';
    } finally {
        // if (loadingIndicator) loadingIndicator.style.display = 'none';
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
 * Displays a message in the reservation message container.
 * type can be 'success', 'error', or 'info' (default).
 */
function showMessage(message, type = 'info') {
    // Using alert() for all message types as per feedback
    console.log(`[showMessage] Type: ${type}, Message: ${message}`);
    
    if (type === 'success') {
        alert(`Success: ${message}`);
    } else if (type === 'error') {
        alert(`Error: ${message}`);
    } else {
        alert(`Info: ${message}`);
    }

}

/**
 * Hides the reservation message container.
 */
function hideMessage() {
    const messageContainer = document.getElementById('reservation-message-container');
    if (messageContainer) {
        messageContainer.style.display = 'none';
        messageContainer.innerHTML = ''; // Clear content
        messageContainer.className = 'message-container'; // Reset classes
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
