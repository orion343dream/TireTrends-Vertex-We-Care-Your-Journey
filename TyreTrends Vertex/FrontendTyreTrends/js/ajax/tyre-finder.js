// tyre-finder.js

// Base API URL
const API_BASE_URL = "http://localhost:8080/api/v1";

// Global state
let searchResults = [];
let makes = [];
let models = [];
let trims = [];
let brands = [];
let categories = [];
let userVehicles = [];

// Search parameters
let searchParams = {
    make: '',
    model: '',
    year: '',
    trim: '',
    tireSize: ''
};

// Filter parameters
let filterParams = {
    brand: '',
    type: '',
    priceRange: '',
    sort: 'recommended'
};

// Initialize page when DOM is ready
$(document).ready(function() {
    init();
});

/**
 * Initialize the page
 */
function init() {
    // Check if user is authenticated and load their vehicles
    checkAuthentication();

    // Setup tire finder tabs
    setupTabs();

    // Setup vehicle search form
    setupVehicleSearch();

    // Setup tire size search form
    setupTireSizeSearch();

    // Setup filter controls
    setupFilters();

    // Populate year dropdown
    populateYearDropdown();

    // Setup modify search button
    $('#modifySearchBtn').on('click', function() {
        // Hide results section
        $('#resultsSection').removeClass('show');

        // Scroll to top
        $('html, body').animate({ scrollTop: 0 }, 'smooth');
    });

    // Load brands for filter
    loadBrands();

    // Check URL parameters for any pre-filled search
    checkUrlParameters();
}

/**
 * Check if user is authenticated and load their vehicles if they are
 */
function checkAuthentication() {
    const token = localStorage.getItem('token');

    if (token) {
        // Load user vehicles
        loadUserVehicles(token);
    }
}

/**
 * Load user vehicles if authenticated
 * @param {string} token Authentication token
 */
function loadUserVehicles(token) {
    $.ajax({
        url: `${API_BASE_URL}/vehicles`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            if (response.code === 200 && response.data) {
                userVehicles = response.data;

                // If we have vehicles and URL contains vehicleId parameter, use it
                const urlParams = new URLSearchParams(window.location.search);
                const vehicleId = urlParams.get('vehicle');

                if (vehicleId) {
                    const selectedVehicle = userVehicles.find(v => v.id == vehicleId);
                    if (selectedVehicle) {
                        // Pre-fill vehicle form with selected vehicle
                        $('#vehicleMake').val(selectedVehicle.make);
                        $('#vehicleModel').val(selectedVehicle.model);
                        $('#vehicleYear').val(selectedVehicle.year);

                        // Fetch trims
                        fetchTrims(selectedVehicle.make, selectedVehicle.model, selectedVehicle.year);

                        // If vehicle has trim, select it
                        if (selectedVehicle.trim) {
                            setTimeout(() => {
                                $('#vehicleTrim').val(selectedVehicle.trim);
                            }, 500);
                        }

                        // Auto-search for tires
                        setTimeout(() => {
                            $('#vehicleSearchForm').submit();
                        }, 800);
                    }
                }
            }
        },
        error: function(xhr) {
            console.error('Error loading user vehicles:', xhr);
        }
    });
}

/**
 * Check URL parameters for pre-filled search
 */
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for tire size parameter
    const size = urlParams.get('size');
    if (size) {
        // Try to parse the size (format: 205/55R16)
        const sizeRegex = /^(\d+)\/(\d+)R(\d+)$/;
        const match = size.match(sizeRegex);

        if (match && match.length === 4) {
            const [_, width, ratio, diameter] = match;

            // Fill in size form
            $('#tireWidth').val(width);
            $('#aspectRatio').val(ratio);
            $('#wheelDiameter').val(diameter);

            // Update preview
            $('#sizePreview').text(size);

            // Switch to size tab
            $('.finder-tab[data-tab="size"]').click();

            // Auto-search
            setTimeout(() => {
                $('#tireSizeForm').submit();
            }, 500);
        }
    }

    // Check for make, model, year parameters
    const make = urlParams.get('make');
    const model = urlParams.get('model');
    const year = urlParams.get('year');

    if (make && model && year) {
        // Fill in vehicle form
        $('#vehicleMake').val(make);
        $('#vehicleModel').val(model);
        $('#vehicleYear').val(year);

        // Fetch trims
        fetchTrims(make, model, year);

        // Check for trim parameter
        const trim = urlParams.get('trim');
        if (trim) {
            setTimeout(() => {
                $('#vehicleTrim').val(trim);
            }, 500);
        }

        // Auto-search
        setTimeout(() => {
            $('#vehicleSearchForm').submit();
        }, 800);
    }
}

/**
 * Load brands for filter
 */
function loadBrands() {
    $.ajax({
        url: `${API_BASE_URL}/brands`,
        method: 'GET',
        success: function(response) {
            if (response.code === 200) {
                brands = response.data;
            }
        },
        error: function(xhr) {
            console.error('Error loading brands:', xhr);
        }
    });
}

/**
 * Setup tire finder tabs
 */
function setupTabs() {
    $('.finder-tab').on('click', function() {
        // Remove active class from all tabs
        $('.finder-tab').removeClass('active');

        // Add active class to clicked tab
        $(this).addClass('active');

        // Hide all tab contents
        $('.finder-content').removeClass('active');

        // Show selected tab content
        const tabId = $(this).data('tab');
        $(`#${tabId}Content`).addClass('active');
    });
}

/**
 * Populate year dropdown with recent years
 */
function populateYearDropdown() {
    const yearSelect = $('#vehicleYear');
    const currentYear = new Date().getFullYear();

    // Clear existing options except placeholder
    yearSelect.find('option:not(:first)').remove();

    // Add years from current year plus 1 down to 1990
    for (let year = currentYear + 1; year >= 1990; year--) {
        yearSelect.append(`<option value="${year}">${year}</option>`);
    }
}

/**
 * Setup vehicle search form
 */
function setupVehicleSearch() {
    // Make input with auto-suggestions
    $('#vehicleMake').on('input', function() {
        const query = $(this).val().trim();

        if (query.length >= 2) {
            // Fetch makes matching query
            fetchMakes(query);
        } else {
            // Hide suggestions
            $('#makeSuggestions').removeClass('show');
        }
    });

    // Model input with auto-suggestions
    $('#vehicleModel').on('input', function() {
        const query = $(this).val().trim();
        const make = $('#vehicleMake').val().trim();

        if (query.length >= 2 && make) {
            // Fetch models matching query for selected make
            fetchModels(make, query);
        } else {
            // Hide suggestions
            $('#modelSuggestions').removeClass('show');
        }
    });

    // Year select change event
    $('#vehicleYear').on('change', function() {
        const make = $('#vehicleMake').val().trim();
        const model = $('#vehicleModel').val().trim();
        const year = $(this).val();

        if (make && model && year) {
            // Fetch trims for selected vehicle
            fetchTrims(make, model, year);
        }
    });

    // Form submission
    $('#vehicleSearchForm').on('submit', function(e) {
        e.preventDefault();

        // Validate form
        if (validateVehicleForm()) {
            // Get form values
            const make = $('#vehicleMake').val().trim();
            const model = $('#vehicleModel').val().trim();
            const year = $('#vehicleYear').val();
            const trim = $('#vehicleTrim').val();

            // Update search parameters
            searchParams.make = make;
            searchParams.model = model;
            searchParams.year = year;
            searchParams.trim = trim;
            searchParams.tireSize = '';

            // Search for matching tires
            searchTires('vehicle');
        }
    });
}

/**
 * Setup tire size search form
 */
function setupTireSizeSearch() {
    // Update size preview as user types
    function updateSizePreview() {
        const width = $('#tireWidth').val() || '205';
        const ratio = $('#aspectRatio').val() || '55';
        const diameter = $('#wheelDiameter').val() || '16';

        $('#sizePreview').text(`${width}/${ratio}R${diameter}`);
    }

    $('#tireWidth, #aspectRatio, #wheelDiameter').on('input', updateSizePreview);

    // Form submission
    $('#tireSizeForm').on('submit', function(e) {
        e.preventDefault();

        // Validate form
        if (validateTireSizeForm()) {
            // Get form values
            const width = $('#tireWidth').val();
            const ratio = $('#aspectRatio').val();
            const diameter = $('#wheelDiameter').val();

            // Construct tire size string
            const tireSize = `${width}/${ratio}R${diameter}`;

            // Update search parameters
            searchParams.make = '';
            searchParams.model = '';
            searchParams.year = '';
            searchParams.trim = '';
            searchParams.tireSize = tireSize;

            // Search for matching tires
            searchTires('size');
        }
    });
}

/**
 * Setup filter controls
 */
function setupFilters() {
    // Brand filter
    $('#brandFilter').on('change', function() {
        filterParams.brand = $(this).val();
        applyFilters();
    });

    // Type filter
    $('#typeFilter').on('change', function() {
        filterParams.type = $(this).val();
        applyFilters();
    });

    // Price filter
    $('#priceFilter').on('change', function() {
        filterParams.priceRange = $(this).val();
        applyFilters();
    });

    // Sort filter
    $('#sortFilter').on('change', function() {
        filterParams.sort = $(this).val();
        applyFilters();
    });
}

/**
 * Fetch makes matching query
 * @param {string} query Search query
 */
function fetchMakes(query) {
    // Try to fetch from the API first
    $.ajax({
        url: `${API_BASE_URL}/brands`,
        method: 'GET',
        success: function(response) {
            if (response.code === 200 && response.data) {
                // Extract makes from brands
                const fetchedMakes = response.data.map(brand => brand.name);

                // Filter makes by query
                const filteredMakes = fetchedMakes.filter(make =>
                    make.toLowerCase().includes(query.toLowerCase())
                );

                // Store filtered makes
                makes = filteredMakes;

                // Show suggestions
                showSuggestions('make', filteredMakes);
            } else {
                // Fallback to static list if API fails or returns no data
                fallbackToStaticMakes(query);
            }
        },
        error: function(xhr) {
            console.error('Error fetching makes:', xhr);
            fallbackToStaticMakes(query);
        }
    });

    function fallbackToStaticMakes(query) {
        const staticMakes = [
            'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
            'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar',
            'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz',
            'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Subaru', 'Toyota', 'Volkswagen', 'Volvo'
        ];

        // Filter makes by query
        const filteredMakes = staticMakes.filter(make =>
            make.toLowerCase().includes(query.toLowerCase())
        );

        // Store filtered makes
        makes = filteredMakes;

        // Show suggestions
        showSuggestions('make', filteredMakes);
    }
}

/**
 * Fetch models matching query for selected make
 * @param {string} make Vehicle make
 * @param {string} query Search query
 */
function fetchModels(make, query) {
    // In a production environment, you would fetch models from an API endpoint
    // For this demo, we'll use static data based on selected make
    let mockModels = [];

    // Since we don't have a specific endpoint for models, we'll use static data
    switch (make.toLowerCase()) {
        case 'toyota':
            mockModels = ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', 'Prius', 'Sienna', '4Runner', 'Avalon'];
            break;
        case 'honda':
            mockModels = ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey', 'HR-V', 'Ridgeline', 'Fit', 'Passport', 'Insight'];
            break;
        case 'ford':
            mockModels = ['F-150', 'Escape', 'Explorer', 'Mustang', 'Edge', 'Expedition', 'Ranger', 'Bronco', 'Fusion', 'Focus'];
            break;
        case 'chevrolet':
            mockModels = ['Silverado', 'Equinox', 'Tahoe', 'Traverse', 'Malibu', 'Suburban', 'Colorado', 'Trax', 'Blazer', 'Camaro'];
            break;
        case 'bmw':
            mockModels = ['3 Series', '5 Series', 'X3', 'X5', '7 Series', 'X1', 'X7', '4 Series', '8 Series', 'i4'];
            break;
        case 'nissan':
            mockModels = ['Altima', 'Maxima', 'Sentra', 'Rogue', 'Murano', 'Pathfinder', 'Frontier', 'Titan', 'Versa', 'Kicks'];
            break;
        case 'mercedes-benz':
            mockModels = ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'CLA', 'CLS'];
            break;
        case 'audi':
            mockModels = ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8'];
            break;
        default:
            mockModels = ['Model 1', 'Model 2', 'Model 3', 'Sedan', 'SUV', 'Truck', 'Compact', 'Crossover'];
    }

    // Filter models by query
    const filteredModels = mockModels.filter(model =>
        model.toLowerCase().includes(query.toLowerCase())
    );

    // Store filtered models
    models = filteredModels;

    // Show suggestions
    showSuggestions('model', filteredModels);
}

/**
 * Fetch trims for selected vehicle
 * @param {string} make Vehicle make
 * @param {string} model Vehicle model
 * @param {string} year Vehicle year
 */
function fetchTrims(make, model, year) {
    // In a production environment, you would fetch trims from an API endpoint
    // For this demo, we'll use static data based on selected make and model
    let mockTrims = [];

    // Generate some mock trims based on make and model
    if (make.toLowerCase() === 'toyota' && model.toLowerCase() === 'camry') {
        mockTrims = ['L', 'LE', 'SE', 'XLE', 'XSE', 'TRD', 'Hybrid LE', 'Hybrid SE', 'Hybrid XLE'];
    } else if (make.toLowerCase() === 'honda' && model.toLowerCase() === 'accord') {
        mockTrims = ['LX', 'Sport', 'Sport SE', 'EX-L', 'Touring', 'Hybrid', 'Hybrid EX', 'Hybrid EX-L'];
    } else if (make.toLowerCase() === 'ford' && model.toLowerCase() === 'f-150') {
        mockTrims = ['XL', 'XLT', 'Lariat', 'King Ranch', 'Platinum', 'Limited', 'Raptor', 'Tremor'];
    } else {
        mockTrims = ['Base', 'Sport', 'Luxury', 'Premium', 'Limited', 'GT', 'Touring'];
    }

    // Store trims
    trims = mockTrims;

    // Update trim dropdown
    updateTrimDropdown(mockTrims);
}

/**
 * Update trim dropdown with fetched trims
 * @param {Array} trims Array of trim options
 */
function updateTrimDropdown(trims) {
    const trimSelect = $('#vehicleTrim');

    // Clear existing options except placeholder
    trimSelect.find('option:not(:first)').remove();

    // Add new trim options
    trims.forEach(trim => {
        trimSelect.append(`<option value="${trim}">${trim}</option>`);
    });
}

/**
 * Show suggestions dropdown
 * @param {string} type Type of suggestions ('make' or 'model')
 * @param {Array} suggestions Array of suggestion items
 */
function showSuggestions(type, suggestions) {
    const suggestionsContainer = $(`#${type}Suggestions`);

    // Clear container
    suggestionsContainer.empty();

    // If no suggestions or empty query, hide dropdown
    if (!suggestions || suggestions.length === 0) {
        suggestionsContainer.removeClass('show');
        return;
    }

    // Add suggestions to container
    suggestions.forEach(suggestion => {
        const item = $('<div>', {
            class: 'suggestion-item',
            text: suggestion
        });

        // Add click event
        item.on('click', function() {
            // Set input value
            $(`#vehicle${type.charAt(0).toUpperCase() + type.slice(1)}`).val(suggestion);

            // Hide suggestions
            suggestionsContainer.removeClass('show');

            // If make is selected, clear model and trims
            if (type === 'make') {
                $('#vehicleModel').val('');

                // Clear trim dropdown
                $('#vehicleTrim').find('option:not(:first)').remove();
            }

            // If model is selected, fetch trims if make and year are also selected
            if (type === 'model') {
                const make = $('#vehicleMake').val().trim();
                const year = $('#vehicleYear').val();

                if (make && year) {
                    fetchTrims(make, suggestion, year);
                }
            }
        });

        suggestionsContainer.append(item);
    });

    // Show dropdown
    suggestionsContainer.addClass('show');
}

/**
 * Validate vehicle search form
 * @returns {boolean} Whether form is valid
 */
function validateVehicleForm() {
    // Get form values
    const make = $('#vehicleMake').val().trim();
    const model = $('#vehicleModel').val().trim();
    const year = $('#vehicleYear').val();

    // Clear previous errors
    clearErrors();

    // Validate required fields
    let isValid = true;

    if (!make) {
        showError('vehicleMake', 'Please enter the vehicle make');
        isValid = false;
    }

    if (!model) {
        showError('vehicleModel', 'Please enter the vehicle model');
        isValid = false;
    }

    if (!year) {
        showError('vehicleYear', 'Please select the vehicle year');
        isValid = false;
    }

    return isValid;
}

/**
 * Validate tire size search form
 * @returns {boolean} Whether form is valid
 */
function validateTireSizeForm() {
    // Get form values
    const width = $('#tireWidth').val().trim();
    const ratio = $('#aspectRatio').val().trim();
    const diameter = $('#wheelDiameter').val().trim();

    // Clear previous errors
    clearErrors();

    // Validate required fields
    let isValid = true;

    if (!width) {
        showError('tireWidth', 'Please enter the tire width');
        isValid = false;
    } else if (isNaN(width) || width < 0 || width > 500) {
        showError('tireWidth', 'Please enter a valid tire width (0-500)');
        isValid = false;
    }

    if (!ratio) {
        showError('aspectRatio', 'Please enter the aspect ratio');
        isValid = false;
    } else if (isNaN(ratio) || ratio < 0 || ratio > 100) {
        showError('aspectRatio', 'Please enter a valid aspect ratio (0-100)');
        isValid = false;
    }

    if (!diameter) {
        showError('wheelDiameter', 'Please enter the wheel diameter');
        isValid = false;
    } else if (isNaN(diameter) || diameter < 0 || diameter > 30) {
        showError('wheelDiameter', 'Please enter a valid wheel diameter (0-30)');
        isValid = false;
    }

    return isValid;
}

/**
 * Search for tires based on vehicle or size
 * @param {string} searchType Type of search ('vehicle' or 'size')
 */
function searchTires(searchType) {
    // Show loading state
    $('#resultsContainer').html('<div class="spinner-container"><div class="spinner"></div></div>');

    // Show results section
    $('#resultsSection').addClass('show');

    // Scroll to results
    $('#resultsSection')[0].scrollIntoView({ behavior: 'smooth' });

    if (searchType === 'vehicle') {
        // Check if user has saved vehicles or wants to use guest mode
        const token = localStorage.getItem('token');

        if (token && userVehicles.length > 0) {
            // Try to find matching vehicle in the user's saved vehicles
            const matchingVehicle = userVehicles.find(v =>
                v.make.toLowerCase() === searchParams.make.toLowerCase() &&
                v.model.toLowerCase() === searchParams.model.toLowerCase() &&
                v.year.toString() === searchParams.year.toString() &&
                (!searchParams.trim || v.trim === searchParams.trim)
            );

            if (matchingVehicle && matchingVehicle.tireSizesFront) {
                // If we found a match with tire size, use it
                searchProductsBySize(matchingVehicle.tireSizesFront);
            } else {
                // Otherwise, search by general parameters
                searchProductsByVehicleParams();
            }
        } else {
            // If not logged in or no vehicles, use general parameters
            searchProductsByVehicleParams();
        }
    } else if (searchType === 'size') {
        // Search directly by size
        searchProductsBySize(searchParams.tireSize);
    }
}

/**
 * Search products by vehicle parameters
 */
function searchProductsByVehicleParams() {
    // Build query parameters
    const params = {
        query: `${searchParams.make} ${searchParams.model} ${searchParams.year} ${searchParams.trim || ''}`.trim(),
        categoryId: 1 // Assuming category ID 1 is tires
    };

    // Call API
    $.ajax({
        url: `${API_BASE_URL}/products/search`,
        method: 'GET',
        data: params,
        success: function(response) {
            handleSearchResults(response);
        },
        error: function(xhr) {
            handleSearchError(xhr);
        }
    });
}

/**
 * Search products by tire size
 * @param {string} tireSize Tire size string (e.g. "205/55R16")
 */
function searchProductsBySize(tireSize) {
    // Call API with tire size parameter
    $.ajax({
        url: `${API_BASE_URL}/products/search`,
        method: 'GET',
        data: {
            size: tireSize,
            categoryId: 1 // Assuming category ID 1 is tires
        },
        success: function(response) {
            handleSearchResults(response);
        },
        error: function(xhr) {
            handleSearchError(xhr);
        }
    });
}

/**
 * Handle search results response
 * @param {Object} response API response object
 */
function handleSearchResults(response) {
    if (response.code === 200) {
        // Store search results (handle both array and page results)
        if (Array.isArray(response.data)) {
            searchResults = response.data;
        } else if (response.data && response.data.content) {
            searchResults = response.data.content;
        } else {
            searchResults = [];
        }

        // Update results count
        $('#resultsCount').text(`${searchResults.length} products found`);

        // Render results
        renderSearchResults(searchResults);

        // Populate brand filter
        populateBrandFilter(searchResults);
    } else {
        $('#resultsContainer').html(`
            <div class="no-results">
                <div class="no-results-icon">❌</div>
                <h3 class="no-results-title">Error</h3>
                <p class="no-results-message">${response.message || 'Failed to search for tires. Please try again later.'}</p>
            </div>
        `);
    }
}

/**
 * Handle search error
 * @param {Object} xhr XHR error object
 */
function handleSearchError(xhr) {
    console.error('Error searching tires:', xhr);

    // Show error message
    $('#resultsContainer').html(`
        <div class="no-results">
            <div class="no-results-icon">❌</div>
            <h3 class="no-results-title">Error</h3>
            <p class="no-results-message">Failed to search for tires. Please try again later.</p>
        </div>
    `);
}

/**
 * Render search results
 * @param {Array} results Array of product results
 */
function renderSearchResults(results) {
    const resultsContainer = $('#resultsContainer');

    // Clear container
    resultsContainer.empty();

    // If no results, show message
    if (!results || results.length === 0) {
        resultsContainer.html(`
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3 class="no-results-title">No Matching Tires Found</h3>
                <p class="no-results-message">We couldn't find any tires matching your search criteria. Try adjusting your search or contact us for assistance.</p>
                <button class="btn" id="clearSearchBtn">Clear Search</button>
            </div>
        `);

        // Add event listener for clear search button
        $('#clearSearchBtn').on('click', function() {
            // Hide results section
            $('#resultsSection').removeClass('show');

            // Reset forms
            $('#vehicleSearchForm')[0].reset();
            $('#tireSizeForm')[0].reset();

            // Update size preview
            $('#sizePreview').text('205/55R16');

            // Scroll to top
            $('html, body').animate({ scrollTop: 0 }, 'smooth');
        });

        return;
    }

    // Create results grid
    const resultsGrid = $('<div>', { class: 'results-grid' });

    // Add each product to grid
    results.forEach(product => {
        resultsGrid.append(createProductCard(product));
    });

    // Add grid to container
    resultsContainer.append(resultsGrid);
}

/**
 * Create product card element
 * @param {Object} product Product data
 * @returns {jQuery} Product card element
 */
function createProductCard(product) {
    const productCard = $('<div>', { class: 'product-card' });

    // Generate stars based on rating
    const rating = product.rating || 0;
    const wholeStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - wholeStars - (hasHalfStar ? 1 : 0);

    let starsHtml = '';
    for (let i = 0; i < wholeStars; i++) {
        starsHtml += '<span class="star">★</span>';
    }
    if (hasHalfStar) {
        starsHtml += '<span class="star">★</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<span class="star">☆</span>';
    }

    // Format product type for display
    const productType = product.type
        ? product.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : '';

    // Calculate price with discounts if applicable
    let priceHtml = `$${(product.price || 0).toFixed(2)}`;
    if (product.discountPrice) {
        priceHtml = `
            <span style="text-decoration: line-through; color: #999; margin-right: 8px;">$${product.price.toFixed(2)}</span>
            <span style="color: #d65a31;">$${product.discountPrice.toFixed(2)}</span>
        `;
    }

    productCard.html(`
        <div class="product-image">
            <img src="${product.imageUrl || '../assets/images/tire-placeholder.jpg'}" alt="${product.name}" onerror="this.src='../assets/images/tire-placeholder.jpg'">
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-meta">
                <span>${product.size || ''}</span>
                <span>${productType}</span>
            </div>
            <div class="product-rating">
                ${starsHtml}
                <span>(${product.reviewCount || 0})</span>
            </div>
            <div class="product-price">${priceHtml}</div>
            <a href="product-detail.html?id=${product.id}" class="btn">View Details</a>
        </div>
    `);

    return productCard;
}

/**
 * Populate brand filter dropdown with unique brands from results
 * @param {Array} results Array of product results
 */
function populateBrandFilter(results) {
    const brandFilter = $('#brandFilter');

    // Clear existing options except placeholder
    brandFilter.find('option:not(:first)').remove();

    // Get unique brands from results
    const uniqueBrands = [...new Set(results.map(product => product.brandName).filter(Boolean))];

    // Sort brands alphabetically
    uniqueBrands.sort();

    // Add brand options
    uniqueBrands.forEach(brand => {
        brandFilter.append(`<option value="${brand}">${brand}</option>`);
    });
}

/**
 * Apply filters to search results
 */
function applyFilters() {
    // If no search results, return
    if (!searchResults || searchResults.length === 0) {
        return;
    }

    // Filter results
    let filteredResults = [...searchResults];

    // Apply brand filter
    if (filterParams.brand) {
        filteredResults = filteredResults.filter(product =>
            product.brandName === filterParams.brand
        );
    }

    // Apply type filter
    if (filterParams.type) {
        filteredResults = filteredResults.filter(product =>
            product.type === filterParams.type
        );
    }

    // Apply price filter
    if (filterParams.priceRange) {
        const [min, max] = filterParams.priceRange.split('-').map(Number);

        filteredResults = filteredResults.filter(product => {
            const price = product.price || 0;

            if (max) {
                return price >= min && price <= max;
            } else {
                return price >= min;
            }
        });
    }

    // Apply sorting
    switch (filterParams.sort) {
        case 'price-low':
            filteredResults.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-high':
            filteredResults.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'rating':
            filteredResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'popularity':
            filteredResults.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
            break;
        default:
            // Default sorting (recommended) - no change
            break;
    }

    // Update results count
    $('#resultsCount').text(`${filteredResults.length} products found`);

    // Render filtered results
    renderSearchResults(filteredResults);
}

/**
 * Show error message for a specific field
 * @param {string} fieldId Field ID
 * @param {string} message Error message
 */
function showError(fieldId, message) {
    const errorElement = $(`#${fieldId}Error`);
    const field = $(`#${fieldId}`);

    if (errorElement.length && field.length) {
        errorElement.text(message);
        errorElement.addClass('visible');
        field.addClass('error');
    }
}

/**
 * Clear all error messages
 */
function clearErrors() {
    $('.error-message').text('').removeClass('visible');
    $('.form-control.error').removeClass('error');
}

/**
 * Show alert message
 * @param {string} type Alert type ('success', 'error', or 'info')
 * @param {string} message Alert message
 */
function showAlert(type, message) {
    const alertId = `alert${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const alertElement = $(`#${alertId}`);

    if (alertElement.length) {
        alertElement.text(message);
        alertElement.addClass('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertElement.removeClass('show');
        }, 5000);
    }

    /**
     * Search for tires based on vehicle or size
     * @param {string} searchType Type of search ('vehicle' or 'size')
     */
    function searchTires(searchType) {
        // Show loading state
        $('#resultsContainer').html('<div class="spinner-container"><div class="spinner"></div></div>');

        // Show results section
        $('#resultsSection').addClass('show');

        // Scroll to results
        $('#resultsSection')[0].scrollIntoView({ behavior: 'smooth' });

        // Always use direct search approach
        if (searchType === 'vehicle') {
            const params = {
                make: searchParams.make,
                model: searchParams.model,
                year: searchParams.year
            };

            if (searchParams.trim) {
                params.trim = searchParams.trim;
            }

            // Call API - no authentication required
            $.ajax({
                url: `${API_BASE_URL}/products/search`,
                method: 'GET',
                data: params,
                success: function(response) {
                    handleSearchResults(response);
                },
                error: function(xhr) {
                    handleSearchError(xhr);
                }
            });
        } else if (searchType === 'size') {
            // Search directly by size - no authentication required
            const tireSize = searchParams.tireSize;

            $.ajax({
                url: `${API_BASE_URL}/products/search`,
                method: 'GET',
                data: { size: tireSize },
                success: function(response) {
                    handleSearchResults(response);
                },
                error: function(xhr) {
                    handleSearchError(xhr);
                }
            });
        }
    }
}

