// js/main.js
// This file will handle the main functionalities for the car rental website.
// - Displaying car data (fetched via carsData.js)
// - Handling search and filter logic
// - Managing interactions on the homepage

// `allCarsData` is now defined and managed in js/carsData.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. Initializing page...');
    
    const introScreen = document.getElementById('intro-screen');
    const mainPageWrapper = document.getElementById('main-page-wrapper'); 
    
    if (introScreen && !sessionStorage.getItem('introShown')) { 
        document.body.classList.add('intro-active');
        if (mainPageWrapper) {
            mainPageWrapper.style.opacity = '0'; 
        }

        setTimeout(() => {
            introScreen.classList.add('hidden'); 
            document.body.classList.add('main-content-visible'); 
            
            if (mainPageWrapper) {
                mainPageWrapper.style.opacity = '1'; 
            }

            sessionStorage.setItem('introShown', 'true'); 
            setTimeout(() => { 
                document.body.classList.remove('intro-active'); 
            }, 700); 
            initHomepage(); 
        }, 3000); 
    } else {
        if(introScreen) introScreen.style.display = 'none'; 
        if(mainPageWrapper) mainPageWrapper.style.opacity = '1'; 
        document.body.classList.add('main-content-visible'); 
        document.body.classList.remove('intro-active'); 
        initHomepage(); 
    }
});

/**
 * Populates filter dropdowns (car type and brand) based on available car data.
 * @param {Array} cars - An array of car objects.
 */
function populateFilters(cars) {
    const typeFilter = document.getElementById('filter-type');
    const brandFilter = document.getElementById('filter-brand');

    if (!typeFilter || !brandFilter) {
        console.error('Filter select elements not found!');
        return;
    }
    
    typeFilter.innerHTML = '<option value="">All Types</option>';
    brandFilter.innerHTML = '<option value="">All Brands</option>';

    const carTypes = [...new Set(cars.map(car => car.carType))];
    const carBrands = [...new Set(cars.map(car => car.brand))];

    carTypes.sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });

    carBrands.sort().forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
}

/**
 * Displays the car data in the car grid on the homepage.
 * @param {Array} carsToDisplay - An array of car objects to display.
 */
function displayCars(carsToDisplay) {
    console.log('Attempting to display cars (main.js):', carsToDisplay);
    const carGrid = document.querySelector('.car-grid');
    if (!carGrid) {
        console.error('Car grid container (.car-grid) not found in the DOM!');
        return;
    }

    carGrid.innerHTML = '';

    if (!carsToDisplay || carsToDisplay.length === 0) {
        carGrid.innerHTML = '<p>No cars match your criteria. Please try different filters or search terms.</p>';
        console.log('No cars to display, showing default message (main.js).');
        return;
    }

    carsToDisplay.forEach(car => {
        const carCard = document.createElement('div');
        carCard.classList.add('car-card');
        if (!car.available) {
            carCard.classList.add('unavailable');
        }

        carCard.innerHTML = `
            <img src="${car.image || 'images/default-car.png'}" alt="${car.brand} ${car.carModel}" class="car-image" onerror="this.onerror=null;this.src='images/default-car.png';">
            <div class="car-details">
                <h4 class="car-title">${car.brand} ${car.carModel} (${car.yearOfManufacture})</h4>
                <p class="car-type">Type: ${car.carType}</p>
                <p class="car-price">$${car.pricePerDay}<span class="per-day">/day</span></p>
                <p class="car-description">${car.description || 'No description available.'}</p>
                <p class="car-availability">Status: ${car.available ? 'Available' : 'Rented Out'}</p>
            </div>
            <button class="rent-button btn btn-primary" data-vin="${car.vin}" ${!car.available ? 'disabled' : ''}>
                ${car.available ? 'Rent Now' : 'Unavailable'}
            </button>
        `;

        const rentButton = carCard.querySelector('.rent-button');
        if (rentButton && car.available) {
            rentButton.addEventListener('click', () => {
                window.location.href = `reservation.html?vin=${car.vin}`;
            });
        }
        carGrid.appendChild(carCard);
    });
    console.log('Finished displaying cars (main.js).');
}

/**
 * Updates real-time search suggestions based on the input.
 * Relies on `allCarsData` being populated from carsData.js
 * @param {string} term - The current search term.
 */
function updateRealtimeSuggestions(term) {
    const suggestionsContainer = document.getElementById('suggestions-container');
    const searchInput = document.getElementById('search-input');
    if (!suggestionsContainer || !searchInput) return;

    suggestionsContainer.innerHTML = '';
    const suggestionsList = document.querySelector('.suggestions-list');
    if (suggestionsList) suggestionsList.style.display = 'none';
    searchInput.classList.remove('suggestions-active');

    if (!term || term.length < 2) {
        return;
    }

    const uniqueSuggestions = new Set();
    if (allCarsData && allCarsData.length > 0) { 
        allCarsData.forEach(car => {
            if (car.carType.toLowerCase().includes(term)) uniqueSuggestions.add(car.carType);
            if (car.brand.toLowerCase().includes(term)) uniqueSuggestions.add(car.brand);
            if (car.carModel.toLowerCase().includes(term)) uniqueSuggestions.add(car.carModel);
        });
    } else {
        console.warn('allCarsData is not populated. Suggestions might be incomplete.');
    }

    const filteredSuggestions = [...uniqueSuggestions].filter(s => s.toLowerCase().startsWith(term)).slice(0, 5);

    if (filteredSuggestions.length > 0) {
        const ul = document.createElement('ul');
        ul.classList.add('suggestions-list');
        filteredSuggestions.forEach(suggestionText => {
            const li = document.createElement('li');
            li.textContent = suggestionText;
            li.addEventListener('click', () => {
                searchInput.value = suggestionText;
                suggestionsContainer.innerHTML = '';
                const currentSuggestionsList = suggestionsContainer.querySelector('.suggestions-list'); 
                if (currentSuggestionsList) currentSuggestionsList.style.display = 'none';
                searchInput.classList.remove('suggestions-active');
                applyFiltersAndSearch();
            });
            ul.appendChild(li);
        });
        suggestionsContainer.appendChild(ul);
        ul.style.display = 'block';
        searchInput.classList.add('suggestions-active');
    }
}

/**
 * Filters and searches cars based on current input and select values.
 * Relies on `allCarsData` being populated from carsData.js
 */
function applyFiltersAndSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedType = document.getElementById('filter-type').value;
    const selectedBrand = document.getElementById('filter-brand').value;

    if (!allCarsData) { 
        console.warn("allCarsData not available for filtering yet.");
        displayCars([]); 
        return;
    }

    let filteredCars = allCarsData;

    if (selectedType) {
        filteredCars = filteredCars.filter(car => car.carType === selectedType);
    }

    if (selectedBrand) {
        filteredCars = filteredCars.filter(car => car.brand === selectedBrand);
    }

    if (searchTerm) {
        filteredCars = filteredCars.filter(car => 
            car.carModel.toLowerCase().includes(searchTerm) ||
            car.brand.toLowerCase().includes(searchTerm) ||
            car.carType.toLowerCase().includes(searchTerm) ||
            (car.description && car.description.toLowerCase().includes(searchTerm))
        );
    }

    displayCars(filteredCars);
}

/**
 * Resets all filters and search input, then re-displays all cars.
 */
function resetAllFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-brand').value = '';
    applyFiltersAndSearch();
}

/**
 * Initializes the homepage: fetches data, populates filters, displays cars, and sets up event listeners.
 */
async function initHomepage() {
    const cars = await fetchCarDataOnce(); 
    console.log('Cars data received in initHomepage:', cars);
    if (cars) { 
        populateFilters(cars);
        displayCars(cars);
    }
    setupEventListeners(); 
    setupNewScrollButton(); 
}

// Add a global click listener to hide suggestions when clicking outside
document.addEventListener('click', function(event) {
    const suggestionsContainer = document.getElementById('suggestions-container');
    const searchInput = document.getElementById('search-input');
    if (!suggestionsContainer || !searchInput) return;

    if (!searchInput.contains(event.target) && !suggestionsContainer.contains(event.target)) {
        const suggestionsList = suggestionsContainer.querySelector('.suggestions-list');
        if (suggestionsList) suggestionsList.style.display = 'none';
        searchInput.classList.remove('suggestions-active');
    }
});

// Note: Further functions for search, filtering, and other interactions will be added here. 

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const filterType = document.getElementById('filter-type');
    const filterBrand = document.getElementById('filter-brand');
    const resetFiltersButton = document.getElementById('reset-filters');
    const applyFiltersButton = document.getElementById('apply-filters');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFiltersAndSearch();
            updateRealtimeSuggestions(searchInput.value.toLowerCase());
        });
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= 2) { 
                // updateRealtimeSuggestions(searchInput.value.toLowerCase()); 
            }
        });
    }
    if (filterType) {
        filterType.addEventListener('change', () => applyFiltersAndSearch());
    }
    if (filterBrand) {
        filterBrand.addEventListener('change', () => applyFiltersAndSearch());
    }
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', resetAllFilters);
    }
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', () => {
            applyFiltersAndSearch();
            const carGridSection = document.getElementById('car-grid-section');
            if (carGridSection) {
                // Use the existing smoothScroll function if it's suitable, 
                // or a simpler scrollIntoView if smoothScroll is jQuery-dependent and we want to avoid it here.
                // For now, let's assume smoothScroll can take a DOM element or a selector.
                smoothScroll($('#car-grid-section')); // Using jQuery selector as per smoothScroll function
            }
        });
    }

    const carGrid = document.querySelector('.car-grid');
    if (carGrid) {
        carGrid.addEventListener('click', function(event) {
            if (event.target.classList.contains('rent-button') && !event.target.disabled) {
                const vin = event.target.dataset.vin;
                if (vin) {
                    window.location.href = `reservation.html?vin=${vin}`;
                }
            }
        });
    }
}

// Ensure clearSuggestions is defined if used
/*
function clearSuggestions() {
    const suggestionsContainer = document.getElementById('suggestions-container');
    if (suggestionsContainer) {
        suggestionsContainer.innerHTML = '';
        const searchInput = document.getElementById('search-input');
        if(searchInput) searchInput.classList.remove('suggestions-active');
    }
}
*/

// New Scroll Button Logic (jQuery based)
function smoothScroll(target, time) {
    const headerHeight = $('header').outerHeight() || 0; 
    if (!time) { time = 1000; } 

    if (target === 'toTop') {
        $('html,body').animate({
            scrollTop: 0
        }, time);
    } else {
        $('html,body').animate({
            scrollTop: target.offset().top - headerHeight
        }, time);
    }
}

function setupNewScrollButton() {
    let hasMadeInitialJump = false;
    const scrollButton = $('#scroll');
    const searchShortcutButton = $('#search-shortcut-button');
    const buttonWrapper = $('#scroll-search-button-wrapper'); // Get the wrapper
    const heroSection = $('#hero');
    const footer = $('footer');

    function checkFooterOverlapAndPageEnd() {
        if (!buttonWrapper.length || !footer.length || !buttonWrapper.hasClass('clicked')) {
            return; 
        }

        const wrapperTop = buttonWrapper.offset().top; // Use wrapper's offset
        const wrapperHeight = buttonWrapper.outerHeight();
        const wrapperBottom = wrapperTop + wrapperHeight;
        const footerTop = footer.offset().top;

        const viewportScrollTop = $(window).scrollTop();
        const viewportHeight = $(window).height();
        const documentScrollHeight = $(document).height();
        
        const overlapsFooter = wrapperBottom >= footerTop;
        const atPageVeryBottom = Math.ceil(viewportScrollTop + viewportHeight) >= documentScrollHeight - 5;

        let shouldBeUp = false;
        if (hasMadeInitialJump && (overlapsFooter || atPageVeryBottom)) {
            shouldBeUp = true;
        }

        const currentRotationIsUp = scrollButton.hasClass('rotate');

        if (shouldBeUp) {
            if (!currentRotationIsUp) {
                scrollButton.addClass('rotate');
                scrollButton.css('transform', 'rotate(180deg)');
            }
        } else { 
            if (currentRotationIsUp) {
                scrollButton.removeClass('rotate');
                scrollButton.css('transform', 'rotate(0deg)');
            }
        }
    }

    if (heroSection.length && buttonWrapper.length) {
        const heroBottom = heroSection.offset().top + heroSection.outerHeight();
        const heroCenterX = heroSection.offset().left + heroSection.outerWidth() / 2;
        
        buttonWrapper.css({
            top: (heroBottom - scrollButton.outerHeight() - 20) + 'px', // Position based on #scroll initially
            left: heroCenterX + 'px',
            position: 'absolute',
            transform: 'translateX(-50%)' // Center the wrapper (which contains centered button)
        });
        buttonWrapper.addClass('visible'); 
        // checkFooterOverlapAndPageEnd(); // Not yet clicked, so not relevant
    }

    // Event listener for the new search shortcut button
    if (searchShortcutButton.length) {
        searchShortcutButton.on('click', function() {
            const heroRightContent = $('.hero-right-content'); // Target the whole right content area
            if (heroRightContent.length) {
                const headerHeight = $('header').outerHeight() || 0;
                $('html,body').animate({
                    scrollTop: heroRightContent.offset().top - headerHeight - 20 // Keep some offset from top
                }, 1000);
            }
        });
    }

    scrollButton.on("click", function(){
        const $thisScroll = $(this); // Referring to #scroll button

        if (!buttonWrapper.hasClass('clicked')) {
            searchShortcutButton.show(); // Show search button when wrapper moves to fixed
            buttonWrapper.css({
                position: 'fixed',
                left: 'auto',
                transform: 'translateX(0)' // Reset transform used for initial centering
            })
            .animate({
                right: '20px',
                top: ($(window).height() - buttonWrapper.outerHeight() - 20) + 'px', // Use wrapper height
            }, 600, function() {
                if ($thisScroll.hasClass('rotate')) {
                    $thisScroll.css('transform', 'rotate(180deg)');
                } else {
                    $thisScroll.css('transform', 'rotate(0deg)');
                }
                checkFooterOverlapAndPageEnd(); 
            })
            .addClass('clicked');
        } 

        const isRotated = $thisScroll.hasClass('rotate');

        if (isRotated) { 
            $('html,body').animate({ scrollTop: 0 }, 1000, function() {
                hasMadeInitialJump = false; 
                checkFooterOverlapAndPageEnd(); 
            });
        } else { 
            const sections = $('main section');
            if (!hasMadeInitialJump && sections.length > 0) {
                const firstSection = $(sections[0]);
                if (firstSection.length) {
                    const headerHeight = $('header').outerHeight() || 0;
                    $('html,body').animate({
                        scrollTop: firstSection.offset().top - headerHeight
                    }, 1000, function() {
                        hasMadeInitialJump = true;
                        checkFooterOverlapAndPageEnd(); 
                    });
                }
            } else {
                const viewportHeight = $(window).height();
                const documentScrollHeight = $(document).height();
                const viewportScrollTop = $(window).scrollTop();

                if (Math.ceil(viewportScrollTop + viewportHeight) < documentScrollHeight - 5) {
                    window.scrollBy({ top: viewportHeight * 0.8, left: 0, behavior: 'smooth' });
                } else {
                    checkFooterOverlapAndPageEnd(); 
                }
            }
        }
    
        const arrowSpan = $thisScroll.find('span');
        arrowSpan.removeClass('arrow-bounce');
        void arrowSpan[0].offsetWidth; 
        arrowSpan.addClass('arrow-bounce');
    });

    $(window).on('scroll resize', checkFooterOverlapAndPageEnd);
}

// Ensure initHomepage is called correctly (e.g., after intro)
// (The DOMContentLoaded listener structure should handle this by calling initHomepage)

// ... (rest of the file, ensure applyFiltersAndSearch, displayCars, populateFilters, fetchCarDataOnce, allCarsData are correctly defined and used)

// Note: Further functions for search, filtering, and other interactions will be added here. 