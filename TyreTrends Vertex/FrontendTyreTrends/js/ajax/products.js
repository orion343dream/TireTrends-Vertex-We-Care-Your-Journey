const API_BASE_URL = "http://localhost:8080/api/v1";

/**
 * TireNest - Products JavaScript
 * Handles product listings, filtering, sorting, and pagination
 */

$(document).ready(function() {
    // Define the backend API base URL
    const API_BASE_URL = "http://localhost:8080/api/v1";

    // Initialize state for filtering and pagination
    const state = {
        currentPage: 0,
        totalPages: 0,
        filters: {
            categoryId: null,
            brandId: null,
            type: null,
            size: null,
            minPrice: null,
            maxPrice: null,
            query: null
        },
        sort: 'id,desc'
    };

    // Parse URL parameters on load
    parseUrlParams();

    // Load products on page load
    loadProducts();

    // Load brands for filter
    loadBrandsForFilter();

    // Load categories for filter
    loadCategoriesForFilter();

    // Setup event listeners
    setupEventListeners();

    /**
     * Get authentication headers for API requests
     * @returns {Object} Headers including authorization if available
     */
    function getAuthHeaders() {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Parse URL parameters to set initial filters
     */
    function parseUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);

        // Parse page number
        const page = urlParams.get('page');
        if (page) {
            state.currentPage = Math.max(0, parseInt(page) - 1); // Convert to 0-based
        }

        // Parse filters
        if (urlParams.get('categoryId')) {
            state.filters.categoryId = urlParams.get('categoryId');
        }

        if (urlParams.get('brandId')) {
            state.filters.brandId = urlParams.get('brandId');
        }

        if (urlParams.get('type')) {
            state.filters.type = urlParams.get('type');
        }

        if (urlParams.get('size')) {
            state.filters.size = urlParams.get('size');
        }

        if (urlParams.get('minPrice')) {
            state.filters.minPrice = urlParams.get('minPrice');
            $('#minPrice').val(state.filters.minPrice);
        }

        if (urlParams.get('maxPrice')) {
            state.filters.maxPrice = urlParams.get('maxPrice');
            $('#maxPrice').val(state.filters.maxPrice);
        }

        if (urlParams.get('query')) {
            state.filters.query = urlParams.get('query');
        }

        // Parse sort option
        if (urlParams.get('sort')) {
            state.sort = urlParams.get('sort');

            // Update sort dropdown
            const sortValue = urlParams.get('sort');
            let dropdownValue = 'featured';

            if (sortValue === 'price,asc') {
                dropdownValue = 'price-low';
            } else if (sortValue === 'price,desc') {
                dropdownValue = 'price-high';
            } else if (sortValue === 'rating,desc') {
                dropdownValue = 'rating';
            } else if (sortValue === 'id,desc') {
                dropdownValue = 'newest';
            }

            $('#sortOptions').val(dropdownValue);
        }
    }

    /**
     * Setup event listeners for user interactions
     */
    function setupEventListeners() {
        // Apply filters button
        $('#applyFilters').on('click', function() {
            updateFiltersFromInputs();
            state.currentPage = 0; // Reset to first page
            loadProducts();
            updateUrl();
        });

        // Reset filters button
        $('#resetFilters').on('click', function() {
            resetFilters();
            loadProducts();
            updateUrl();
        });

        // Sort dropdown change
        $('#sortOptions').on('change', function() {
            const sortValue = $(this).val();

            switch (sortValue) {
                case 'price-low':
                    state.sort = 'price,asc';
                    break;
                case 'price-high':
                    state.sort = 'price,desc';
                    break;
                case 'rating':
                    state.sort = 'rating,desc';
                    break;
                case 'newest':
                    state.sort = 'id,desc';
                    break;
                default:
                    state.sort = 'id,desc'; // Default (featured)
            }

            state.currentPage = 0; // Reset to first page
            loadProducts();
            updateUrl();
        });

        // Mobile filter toggle
        $('#toggleFilters').on('click', function() {
            const filtersSidebar = $('#filtersSidebar');
            filtersSidebar.toggleClass('active');
            $(this).text(filtersSidebar.hasClass('active') ? 'Hide Filters' : 'Show Filters');
        });

        // Search form
        $('#searchForm').on('submit', function(e) {
            e.preventDefault();
            state.filters.query = $('#searchInput').val().trim();
            state.currentPage = 0;
            loadProducts();
            updateUrl();
        });
    }

    /**
     * Load products from API based on current state
     */
    function loadProducts() {
        const productsGrid = $('#productsGrid');
        const productsCount = $('#productsCount');

        // Show loading spinner
        productsGrid.html('<div class="spinner-container"><div class="spinner"></div></div>');

        // Determine if we should use the basic endpoint or search endpoint
        const hasFilters = state.filters.categoryId ||
            state.filters.brandId ||
            state.filters.type ||
            state.filters.size ||
            state.filters.minPrice ||
            state.filters.maxPrice ||
            state.filters.query;

        // Parse the sort parameter correctly
        const sortProperty = state.sort.split(',')[0];
        const sortDirection = state.sort.split(',')[1] || 'asc';

        // Build API URL
        let apiUrl;
        if (hasFilters) {
            apiUrl = `${API_BASE_URL}/products/search?`;
            const params = new URLSearchParams({
                page: state.currentPage,
                size: 12
            });

            // Add sort parameter correctly
            params.append('sort', sortProperty);
            params.append('direction', sortDirection);

            // Add filters
            if (state.filters.categoryId) params.append('categoryId', state.filters.categoryId);
            if (state.filters.brandId) params.append('brandId', state.filters.brandId);
            if (state.filters.type) params.append('type', state.filters.type);
            if (state.filters.size) params.append('size', state.filters.size);
            if (state.filters.minPrice) params.append('minPrice', state.filters.minPrice);
            if (state.filters.maxPrice) params.append('maxPrice', state.filters.maxPrice);
            if (state.filters.query) params.append('query', state.filters.query);

            apiUrl += params.toString();
        } else {
            // Use the basic products endpoint when no filters are applied
            apiUrl = `${API_BASE_URL}/products?page=${state.currentPage}&size=12&sort=${sortProperty}&direction=${sortDirection}`;
        }

        console.log('Fetching products from:', apiUrl);

        $.ajax({
            url: apiUrl,
            method: 'GET',
            headers: getAuthHeaders(),
            success: function(response) {
                console.log('API Response:', response);

                if (response && response.code === 200 && response.data) {
                    const productsPage = response.data;

                    if (!productsPage.content || !Array.isArray(productsPage.content)) {
                        handleError('Invalid response format');
                        return;
                    }

                    displayProducts(productsPage);
                    updateProductCount(productsPage);
                    updatePaginationState(productsPage);
                } else {
                    handleError(response?.message || 'Unknown error occurred');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', {
                    status: status,
                    error: error,
                    responseText: xhr.responseText,
                    statusCode: xhr.status
                });

                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    console.log('Parsed error:', errorResponse);
                    handleError(errorResponse.message || `Server error (${xhr.status})`);
                } catch (e) {
                    if (xhr.status === 403) {
                        // Handle authentication errors
                        if (!localStorage.getItem('token')) {
                            handleError('Authentication required. Please log in to view products.');
                        } else {
                            handleError('Your session has expired. Please log in again.');
                        }
                    } else if (xhr.status === 500) {
                        handleError('The server encountered an error. This might be due to invalid query parameters.');
                    } else {
                        handleError(`${status}: ${error}`);
                    }
                }
            }
        });

        function displayProducts(productsPage) {
            productsGrid.empty();

            if (productsPage.content.length === 0) {
                showNoResults();
                return;
            }

            productsPage.content.forEach(product => {
                const productCard = createProductCard(product);
                productsGrid.append(productCard);
            });

            $('#pagination').show();
            updatePagination();
        }

        function updateProductCount(productsPage) {
            productsCount.text(
                `Showing ${productsPage.numberOfElements} of ${productsPage.totalElements} products`
            );
        }

        function updatePaginationState(productsPage) {
            state.totalPages = productsPage.totalPages;
        }

        function showNoResults() {
            productsGrid.html(`
        <div class="no-results">
            <h3>No products found</h3>
            <p>Try adjusting your filters or search criteria.</p>
            <button class="btn" id="resetAllFiltersBtn">Reset All Filters</button>
        </div>
    `);

            $('#resetAllFiltersBtn').on('click', function() {
                resetFilters();
                loadProducts();
                updateUrl();
            });

            $('#pagination').hide();
        }

        function handleError(message) {
            console.error('Error:', message);
            productsGrid.html(`
        <div class="no-results">
            <h3>Error loading products</h3>
            <p>${message}</p>
            <p>Please try again later or contact support.</p>
        </div>
    `);
            $('#pagination').hide();
        }
    }

    /**
     * Load brands for filter sidebar
     */
    function loadBrandsForFilter() {
        const brandFilters = $('#brandFilters');

        // Show loading spinner
        brandFilters.html('<div class="spinner-container"><div class="spinner"></div></div>');

        $.ajax({
            url: `${API_BASE_URL}/brands`,
            method: 'GET',
            headers: getAuthHeaders(),
            success: function(response) {
                if (response.code === 200) {
                    const brands = response.data;

                    // Clear container
                    brandFilters.empty();

                    // Add brand filters
                    brands.forEach(function(brand) {
                        const isChecked = state.filters.brandId == brand.id;

                        const brandOption = $(`
                            <div class="filter-option">
                                <label>
                                    <input type="checkbox" name="brand" value="${brand.id}" ${isChecked ? 'checked' : ''}>
                                    ${brand.name}
                                </label>
                            </div>
                        `);

                        brandFilters.append(brandOption);
                    });
                } else {
                    brandFilters.html('<p>Failed to load brands.</p>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading brands:', error);
                if (xhr.status === 403) {
                    brandFilters.html('<p>Authentication required to load brands.</p>');
                } else {
                    brandFilters.html('<p>Failed to load brands.</p>');
                }
            }
        });
    }

    /**
     * Load categories for filter sidebar
     */
    function loadCategoriesForFilter() {
        const categoryFilters = $('#categoryFilters');

        // Check if category filter container exists
        if (categoryFilters.length === 0) {
            return;
        }

        // Show loading spinner
        categoryFilters.html('<div class="spinner-container"><div class="spinner"></div></div>');

        $.ajax({
            url: `${API_BASE_URL}/categories`,
            method: 'GET',
            headers: getAuthHeaders(),
            success: function(response) {
                if (response.code === 200) {
                    const categories = response.data;

                    // Clear container
                    categoryFilters.empty();

                    // Add category filters
                    categories.forEach(function(category) {
                        const isChecked = state.filters.categoryId == category.id;

                        const categoryOption = $(`
                            <div class="filter-option">
                                <label>
                                    <input type="checkbox" name="category" value="${category.id}" ${isChecked ? 'checked' : ''}>
                                    ${category.name}
                                </label>
                            </div>
                        `);

                        categoryFilters.append(categoryOption);
                    });
                } else {
                    categoryFilters.html('<p>Failed to load categories.</p>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading categories:', error);
                if (xhr.status === 403) {
                    categoryFilters.html('<p>Authentication required to load categories.</p>');
                } else {
                    categoryFilters.html('<p>Failed to load categories.</p>');
                }
            }
        });
    }

    /**
     * Create product card HTML element
     */
    function createProductCard(product) {
        // Generate rating stars
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

        // Create product card HTML
        const productCard = $('<div class="product-card"></div>');
        productCard.html(`
            <div class="product-image">
                <img src="${product.imageUrl || 'https://via.placeholder.com/300x300?text=Product'}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-meta">
                    <span>${product.categoryName || ''}</span>
                    <span>${productType}</span>
                </div>
                <div class="product-rating">
                    ${starsHtml}
                    <span>(${product.reviewCount || 0})</span>
                </div>
                <div class="product-price">$${(product.price || 0).toFixed(2)}</div>
                <a href="product-detail.html?id=${product.id}" class="btn">View Details</a>
            </div>
        `);

        return productCard;
    }

    /**
     * Update pagination controls
     */
    function updatePagination() {
        const pagination = $('#pagination');

        // Clear pagination
        pagination.empty();

        if (state.totalPages <= 1) {
            pagination.hide();
            return;
        }

        pagination.show();

        // Previous button
        const prevBtn = $(`<a href="#" class="pagination-btn ${state.currentPage === 0 ? 'disabled' : ''}">«</a>`);
        if (state.currentPage > 0) {
            prevBtn.on('click', function(e) {
                e.preventDefault();
                state.currentPage--;
                loadProducts();
                updateUrl();
            });
        }
        pagination.append(prevBtn);

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(0, state.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(startPage + maxVisiblePages - 1, state.totalPages - 1);

        // Adjust startPage if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = $(`<a href="#" class="pagination-btn ${i === state.currentPage ? 'active' : ''}">${i + 1}</a>`);

            if (i !== state.currentPage) {
                pageBtn.on('click', function(e) {
                    e.preventDefault();
                    state.currentPage = i;
                    loadProducts();
                    updateUrl();
                });
            }

            pagination.append(pageBtn);
        }

        // Next button
        const nextBtn = $(`<a href="#" class="pagination-btn ${state.currentPage === state.totalPages - 1 ? 'disabled' : ''}">»</a>`);
        if (state.currentPage < state.totalPages - 1) {
            nextBtn.on('click', function(e) {
                e.preventDefault();
                state.currentPage++;
                loadProducts();
                updateUrl();
            });
        }
        pagination.append(nextBtn);
    }

    /**
     * Update filters from user input
     */
    function updateFiltersFromInputs() {
        // Reset filters
        state.filters = {
            categoryId: null,
            brandId: null,
            type: null,
            size: null,
            minPrice: null,
            maxPrice: null,
            query: state.filters.query // Preserve search query
        };

        // Get selected brands
        const brandCheckboxes = $('input[name="brand"]:checked');
        if (brandCheckboxes.length > 0) {
            // Use the last selected brand (can be updated to support multiple)
            state.filters.brandId = brandCheckboxes.last().val();
        }

        // Get selected categories
        const categoryCheckboxes = $('input[name="category"]:checked');
        if (categoryCheckboxes.length > 0) {
            // Use the last selected category (can be updated to support multiple)
            state.filters.categoryId = categoryCheckboxes.last().val();
        }

        // Get selected types
        const typeCheckboxes = $('input[name="type"]:checked');
        if (typeCheckboxes.length > 0) {
            // Use the last selected type (can be updated to support multiple)
            state.filters.type = typeCheckboxes.last().val();
        }

        // Get selected sizes
        const sizeCheckboxes = $('input[name="size"]:checked');
        if (sizeCheckboxes.length > 0) {
            // Use the last selected size (can be updated to support multiple)
            state.filters.size = sizeCheckboxes.last().val();
        }

        // Get price range
        const minPrice = $('#minPrice').val();
        if (minPrice) {
            state.filters.minPrice = parseFloat(minPrice);
        }

        const maxPrice = $('#maxPrice').val();
        if (maxPrice) {
            state.filters.maxPrice = parseFloat(maxPrice);
        }
    }

    /**
     * Reset all filters
     */
    function resetFilters() {
        // Clear checkboxes
        $('input[type="checkbox"]').prop('checked', false);

        // Clear price inputs
        $('#minPrice').val('');
        $('#maxPrice').val('');

        // Reset state filters
        state.filters = {
            categoryId: null,
            brandId: null,
            type: null,
            size: null,
            minPrice: null,
            maxPrice: null,
            query: null
        };

        // Reset sort
        $('#sortOptions').val('featured');
        state.sort = 'id,desc';

        // Reset page
        state.currentPage = 0;
    }

    /**
     * Update URL with current state
     */
    function updateUrl() {
        const url = new URL(window.location.href);
        const params = new URLSearchParams();

        // Add page number (1-based for URL)
        params.append('page', state.currentPage + 1);

        // Add sort
        params.append('sort', state.sort);

        // Add filters
        if (state.filters.categoryId) {
            params.append('categoryId', state.filters.categoryId);
        }

        if (state.filters.brandId) {
            params.append('brandId', state.filters.brandId);
        }

        if (state.filters.type) {
            params.append('type', state.filters.type);
        }

        if (state.filters.size) {
            params.append('size', state.filters.size);
        }

        if (state.filters.minPrice) {
            params.append('minPrice', state.filters.minPrice);
        }

        if (state.filters.maxPrice) {
            params.append('maxPrice', state.filters.maxPrice);
        }

        if (state.filters.query) {
            params.append('query', state.filters.query);
        }

        // Update URL without reloading page
        window.history.pushState({}, '', `${url.pathname}?${params.toString()}`);
    }
});