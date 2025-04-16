const API_BASE_URL = 'http://localhost:8080';

$(document).ready(function() {
    // Initialize sidebar (fix sidebar visibility issue)
    initializeSidebar();

    // Load initial data
    loadProducts();
    loadCategories();
    loadBrands();

    // Set up event listeners
    setupEventListeners();
});

/**
 * Initialize sidebar functionality
 */
function initializeSidebar() {
    $('#menuToggle').on('click', function() {
        $('body').toggleClass('sidebar-collapsed');
    });

    // Ensure sidebar is visible by default
    $('body').removeClass('sidebar-collapsed');
}

/**
 * Load products table
 */
function loadProducts() {
    const tableBody = $('#productsTableBody');

    // Show loading spinner
    tableBody.html('<tr><td colspan="10"><div class="spinner-container"><div class="spinner"></div></div></td></tr>');

    // Get filter values
    const categoryId = $('#categoryFilter').val();
    const brandId = $('#brandFilter').val();
    const status = $('#statusFilter').val();
    const query = $('#productSearch').val();

    // Try the basic products endpoint if no filters are active
    const hasFilters = categoryId || brandId || status !== '' || query;

    // Build API URL
    let apiUrl;
    if (hasFilters) {
        apiUrl = `${API_BASE_URL}/api/v1/products/search?`;
        const params = new URLSearchParams();
        params.append('page', 0);
        params.append('size', 10);

        if (categoryId) params.append('categoryId', categoryId);
        if (brandId) params.append('brandId', brandId);
        if (status !== '') {
            // Convert string to boolean properly
            params.append('active', status === 'true');
        }
        if (query) params.append('query', query);

        apiUrl += params.toString();
    } else {
        // Use the basic products endpoint when no filters are applied
        apiUrl = `${API_BASE_URL}/api/v1/products?page=0&size=10`;
    }

    console.log('Loading products from:', apiUrl);

    // Fetch products
    $.ajax({
        url: apiUrl,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            console.log('Products API response:', response);
            if (response.code === 200) {
                const productsPage = response.data;

                // Clear table
                tableBody.empty();

                if (productsPage.content && productsPage.content.length === 0) {
                    tableBody.html('<tr><td colspan="10" class="text-center">No products found</td></tr>');
                    return;
                } else if (!productsPage.content) {
                    tableBody.html('<tr><td colspan="10" class="text-center">Invalid response format from API</td></tr>');
                    console.error('Invalid response format - missing content array:', productsPage);
                    return;
                }

                // Render products
                productsPage.content.forEach(function(product) {
                    renderProductRow(product, tableBody);
                });

                // Update pagination
                updatePagination(productsPage);
            } else {
                tableBody.html(`<tr><td colspan="10" class="text-center">Error loading products: ${response.message || 'Unknown error'}</td></tr>`);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading products:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            console.error('Status code:', xhr.status);

            let errorMessage = 'Error loading products. Please try again later.';

            if (xhr.status === 401 || xhr.status === 403) {
                errorMessage = 'Authentication error. Please log in again.';
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 2000);
            }

            tableBody.html(`<tr><td colspan="10" class="text-center">${errorMessage}</td></tr>`);
        }
    });
}

/**
 * Load categories for dropdown
 */
function loadCategories() {
    const categoryFilter = $('#categoryFilter');
    const productCategory = $('#productCategory');

    // Show loading indicator
    categoryFilter.html('<option value="">Loading categories...</option>');
    productCategory.html('<option value="">Loading categories...</option>');

    $.ajax({
        url: `${API_BASE_URL}/api/v1/categories`,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            // Reset dropdowns with default option
            categoryFilter.html('<option value="">All Categories</option>');
            productCategory.html('<option value="">Select Category</option>');

            if (response.code === 200) {
                const categories = response.data;

                // Add options to dropdowns
                categories.forEach(function(category) {
                    if (category.active !== false) { // Only show active categories
                        categoryFilter.append(`<option value="${category.id}">${category.name}</option>`);
                        productCategory.append(`<option value="${category.id}">${category.name}</option>`);
                    }
                });

                console.log('Categories loaded successfully:', categories.length);
            } else {
                console.error('Error loading categories - API returned:', response);
                showAlert('danger', 'Failed to load categories. Please refresh the page.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading categories:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);

            // Reset dropdowns with error message
            categoryFilter.html('<option value="">Error loading categories</option>');
            productCategory.html('<option value="">Error loading categories</option>');

            showAlert('danger', 'Failed to load categories. Please check the console for details.');
        }
    });
}

/**
 * Load brands for dropdown
 */
function loadBrands() {
    const brandFilter = $('#brandFilter');
    const productBrand = $('#productBrand');

    // Show loading indicator
    brandFilter.html('<option value="">Loading brands...</option>');
    productBrand.html('<option value="">Loading brands...</option>');

    $.ajax({
        url: `${API_BASE_URL}/api/v1/brands`,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            // Reset dropdowns with default option
            brandFilter.html('<option value="">All Brands</option>');
            productBrand.html('<option value="">Select Brand</option>');

            if (response.code === 200) {
                const brands = response.data;

                // Add options to dropdowns
                brands.forEach(function(brand) {
                    if (brand.active !== false) { // Only show active brands
                        brandFilter.append(`<option value="${brand.id}">${brand.name}</option>`);
                        productBrand.append(`<option value="${brand.id}">${brand.name}</option>`);
                    }
                });

                console.log('Brands loaded successfully:', brands.length);
            } else {
                console.error('Error loading brands - API returned:', response);
                showAlert('danger', 'Failed to load brands. Please refresh the page.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading brands:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);

            // Reset dropdowns with error message
            brandFilter.html('<option value="">Error loading brands</option>');
            productBrand.html('<option value="">Error loading brands</option>');

            showAlert('danger', 'Failed to load brands. Please check the console for details.');
        }
    });
}
/**
 * Load low stock products
 */
function loadLowStockProducts() {
    const tableBody = $('#inventoryTableBody');
    const threshold = $('#thresholdFilter').val() || 10;

    // Show loading spinner
    tableBody.html('<tr><td colspan="6"><div class="spinner-container"><div class="spinner"></div></div></td></tr>');

    $.ajax({
        url: `${API_BASE_URL}/api/v1/products/low-stock?threshold=${threshold}`,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            console.log('Low stock API response:', response);
            if (response.code === 200) {
                const products = response.data;

                // Clear table
                tableBody.empty();

                if (products.length === 0) {
                    tableBody.html('<tr><td colspan="6" class="text-center">No products below threshold</td></tr>');
                    return;
                }

                // Render products
                products.forEach(function(product) {
                    renderLowStockRow(product, tableBody);
                });
            } else {
                tableBody.html('<tr><td colspan="6" class="text-center">Error loading inventory: ' + response.message + '</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading low stock products:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            tableBody.html('<tr><td colspan="6" class="text-center">Error loading inventory. Please try again later.</td></tr>');
        }
    });
}

/**
 * Load pending reviews
 */
function loadPendingReviews() {
    const tableBody = $('#reviewsTableBody');

    // Show loading spinner
    tableBody.html('<tr><td colspan="8"><div class="spinner-container"><div class="spinner"></div></div></td></tr>');

    $.ajax({
        url: `${API_BASE_URL}/api/v1/reviews/pending?page=0&size=10`,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.code === 200) {
                const reviewsPage = response.data;

                // Clear table
                tableBody.empty();

                if (reviewsPage.content.length === 0) {
                    tableBody.html('<tr><td colspan="8" class="text-center">No pending reviews</td></tr>');
                    return;
                }

                // Render reviews
                reviewsPage.content.forEach(function(review) {
                    renderReviewRow(review, tableBody);
                });
            } else {
                tableBody.html('<tr><td colspan="8" class="text-center">Error loading reviews: ' + response.message + '</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading pending reviews:', error);
            tableBody.html('<tr><td colspan="8" class="text-center">Error loading reviews. Please try again later.</td></tr>');
        }
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Tab switching
    const tabItems = $('.tab-item');
    tabItems.on('click', function() {
        const tabId = $(this).data('tab');

        // Toggle active class on tabs
        tabItems.removeClass('active');
        $(this).addClass('active');

        // Toggle active class on content
        $('.tab-content').removeClass('active');
        $('#' + tabId).addClass('active');

        // Load content based on tab
        if (tabId === 'products-tab') {
            loadProducts();
        } else if (tabId === 'reviews-tab') {
            loadPendingReviews();
        } else if (tabId === 'inventory-tab') {
            loadLowStockProducts();
        }
    });

    // Search button
    $('#searchBtn').on('click', function() {
        loadProducts();
    });

    // Filter dropdowns
    $('#categoryFilter, #brandFilter, #statusFilter').on('change', function() {
        loadProducts();
    });

    // Apply threshold button
    $('#applyThresholdBtn').on('click', function() {
        loadLowStockProducts();
    });

    // Product search enter key
    $('#productSearch').on('keypress', function(e) {
        if (e.which === 13) {
            loadProducts();
        }
    });

    // Add product button
    $('#addProductBtn').on('click', function() {
        resetProductForm();
        $('#productModalTitle').text('Add New Product');
        $('#saveProductBtn').text('Save Product');
        $('#productModalOverlay').addClass('active');
    });

    // Close product modal
    $('#productModalClose, #cancelProductBtn').on('click', function() {
        $('#productModalOverlay').removeClass('active');
    });

    // Close stock modal
    $('#stockModalClose, #cancelStockBtn').on('click', function() {
        $('#stockModalOverlay').removeClass('active');
    });

    // Close delete modal
    $('#deleteModalClose, #cancelDeleteBtn').on('click', function() {
        $('#deleteModalOverlay').removeClass('active');
    });

    // Close review modal
    $('#reviewModalClose, #cancelReviewBtn').on('click', function() {
        $('#reviewModalOverlay').removeClass('active');
    });

    // Save product button
    $('#saveProductBtn').on('click', function() {
        saveProduct();
    });

    // Save stock button
    $('#saveStockBtn').on('click', function() {
        updateStock();
    });

    // Confirm delete button
    $('#confirmDeleteBtn').on('click', function() {
        deleteProduct();
    });

    // Approve review button
    $('#approveReviewBtn').on('click', function() {
        approveReview();
    });

    // Reject review button
    $('#rejectReviewBtn').on('click', function() {
        rejectReview();
    });

    // User dropdown toggle
    $('#userDropdownToggle').on('click', function() {
        $('#userDropdownMenu').toggleClass('active');
    });

    // Close dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$('#userDropdownToggle').is(e.target) &&
            !$('#userDropdownMenu').is(e.target) &&
            $('#userDropdownMenu').has(e.target).length === 0) {
            $('#userDropdownMenu').removeClass('active');
        }
    });


    // Search functionality with debounce
    $('#productSearch').on('input', _.debounce(function() {
        loadProducts();
    }, 500));

    // Filter change events
    $('#categoryFilter, #brandFilter, #statusFilter').on('change', function() {
        loadProducts();
    });

    // Search button click
    $('#searchBtn').on('click', function(e) {
        e.preventDefault();
        loadProducts();
    });
}

/**
 * Render product row in table
 */
function renderProductRow(product, tableBody) {
    // Create status badge
    const statusBadge = product.active
        ? '<span class="badge badge-success">Active</span>'
        : '<span class="badge badge-danger">Inactive</span>';

    // Create table row
    const row = $('<tr></tr>');
    row.html(`
        <td>${product.id}</td>
        <td>
            <div class="product-image">
                <img src="${product.imageUrl || 'https://via.placeholder.com/60x60?text=No+Image'}" alt="${product.name}">
            </div>
        </td>
        <td>${product.name}</td>
        <td>${product.brandName || 'N/A'}</td>
        <td>${product.categoryName || 'N/A'}</td>
        <td>${product.size || 'N/A'}</td>
        <td>$${product.price.toFixed(2)}</td>
        <td>${product.stock}</td>
        <td>${statusBadge}</td>
        <td>
            <div class="table-actions">
                <button class="btn btn-sm edit-product-btn" data-id="${product.id}">Edit</button>
                <button class="btn btn-sm update-stock-btn" data-id="${product.id}" data-stock="${product.stock}">Stock</button>
                <button class="btn btn-sm btn-danger delete-product-btn" data-id="${product.id}">Delete</button>
            </div>
        </td>
    `);

    // Add event listeners to buttons
    row.find('.edit-product-btn').on('click', function() {
        editProduct($(this).data('id'));
    });

    row.find('.update-stock-btn').on('click', function() {
        openStockModal($(this).data('id'), $(this).data('stock'));
    });

    row.find('.delete-product-btn').on('click', function() {
        openDeleteModal($(this).data('id'));
    });

    tableBody.append(row);
}

/**
 * Render low stock row in table
 */
function renderLowStockRow(product, tableBody) {
    const row = $('<tr></tr>');
    row.html(`
        <td>${product.id}</td>
        <td>
            <div class="product-image">
                <img src="${product.imageUrl || 'https://via.placeholder.com/60x60?text=No+Image'}" alt="${product.name}">
            </div>
        </td>
        <td>${product.name}</td>
        <td>${product.size || 'N/A'}</td>
        <td><span class="badge badge-warning">${product.stock}</span></td>
        <td>
            <div class="table-actions">
                <button class="btn btn-sm update-stock-btn" data-id="${product.id}" data-stock="${product.stock}">Update Stock</button>
            </div>
        </td>
    `);

    // Add event listener to update stock button
    row.find('.update-stock-btn').on('click', function() {
        openStockModal($(this).data('id'), $(this).data('stock'));
    });

    tableBody.append(row);
}

/**
 * Render review row in table
 */
function renderReviewRow(review, tableBody) {
    // Format date
    const date = new Date(review.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

    // Truncate comment
    const truncatedComment = review.comment.length > 50
        ? review.comment.substring(0, 50) + '...'
        : review.comment;

    const row = $('<tr></tr>');
    row.html(`
        <td>${review.id}</td>
        <td>${review.productName || 'Unknown'}</td>
        <td>${review.userFullName || 'Anonymous'}</td>
        <td>${review.rating} / 5</td>
        <td>${review.title}</td>
        <td>${truncatedComment}</td>
        <td>${formattedDate}</td>
        <td>
            <div class="table-actions">
                <button class="btn btn-sm view-review-btn" data-id="${review.id}">View</button>
                <button class="btn btn-sm btn-success approve-review-btn" data-id="${review.id}">Approve</button>
                <button class="btn btn-sm btn-danger reject-review-btn" data-id="${review.id}">Reject</button>
            </div>
        </td>
    `);

    // Add event listeners to review buttons
    row.find('.view-review-btn').on('click', function() {
        viewReview($(this).data('id'));
    });

    row.find('.approve-review-btn').on('click', function() {
        approveReview($(this).data('id'));
    });

    row.find('.reject-review-btn').on('click', function() {
        rejectReview($(this).data('id'));
    });

    tableBody.append(row);
}

/**
 * Update pagination controls
 */
function updatePagination(productsPage) {
    const pagination = $('#productsPagination');
    pagination.empty();

    const totalPages = productsPage.totalPages;
    const currentPage = productsPage.number;

    if (totalPages <= 1) {
        pagination.hide();
        return;
    }

    pagination.show();

    // Previous button
    const prevBtn = $(`<div class="pagination-item ${currentPage === 0 ? 'disabled' : ''}">«</div>`);
    if (currentPage > 0) {
        prevBtn.on('click', function() {
            changePage(currentPage - 1);
        });
    }
    pagination.append(prevBtn);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = $(`<div class="pagination-item ${i === currentPage ? 'active' : ''}">${i + 1}</div>`);

        if (i !== currentPage) {
            pageBtn.on('click', function() {
                changePage(i);
            });
        }

        pagination.append(pageBtn);
    }

    // Next button
    const nextBtn = $(`<div class="pagination-item ${currentPage === totalPages - 1 ? 'disabled' : ''}">»</div>`);
    if (currentPage < totalPages - 1) {
        nextBtn.on('click', function() {
            changePage(currentPage + 1);
        });
    }
    pagination.append(nextBtn);
}

/**
 * Change page
 */
function changePage(page) {
    // Build API URL with filters
    let apiUrl = `${API_BASE_URL}/api/v1/products/search?`;
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', 10);

    // Add current filters
    const categoryId = $('#categoryFilter').val();
    const brandId = $('#brandFilter').val();
    const status = $('#statusFilter').val();
    const query = $('#productSearch').val().trim();

    if (categoryId) params.append('categoryId', categoryId);
    if (brandId) params.append('brandId', brandId);
    if (status !== '') {
        // Convert string 'true'/'false' to actual boolean
        params.append('active', status === 'true');
    }
    if (query) params.append('query', query);

    apiUrl += params.toString();

    console.log('Loading page', page, 'from:', apiUrl);

    // Show loading spinner
    const tableBody = $('#productsTableBody');
    tableBody.html('<tr><td colspan="10"><div class="spinner-container"><div class="spinner"></div></div></td></tr>');

    // Fetch products
    $.ajax({
        url: apiUrl,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.code === 200) {
                const productsPage = response.data;

                // Clear table
                tableBody.empty();

                if (productsPage.content.length === 0) {
                    tableBody.html('<tr><td colspan="10" class="text-center">No products found</td></tr>');
                    return;
                }

                // Render products
                productsPage.content.forEach(function(product) {
                    renderProductRow(product, tableBody);
                });

                // Update pagination
                updatePagination(productsPage);
            } else {
                tableBody.html('<tr><td colspan="10" class="text-center">Error loading products: ' + response.message + '</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading products:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            tableBody.html('<tr><td colspan="10" class="text-center">Error loading products. Please try again later.</td></tr>');
        }
    });
}

/**
 * Edit product
 */
function editProduct(productId) {
    // Reset form
    resetProductForm();

    // Show loading state
    $('#productModalTitle').text('Loading...');
    $('#productModalOverlay').addClass('active');

    // Fetch product details
    $.ajax({
        url: `${API_BASE_URL}/api/v1/products/${productId}`,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            console.log('Edit product response:', response);
            if (response.code === 200) {
                const product = response.data;

                // Fill form with product data
                $('#productId').val(product.id);
                $('#productName').val(product.name);
                $('#productDescription').val(product.description);
                $('#productPrice').val(product.price);
                $('#productStock').val(product.stock);
                $('#productBrand').val(product.brandId);
                $('#productCategory').val(product.categoryId);
                $('#productSize').val(product.size);
                $('#productType').val(product.type);
                $('#productStatus').val(product.active.toString());
                $('#productImageUrl').val(product.imageUrl);

                // Update modal title
                $('#productModalTitle').text('Edit Product');
                $('#saveProductBtn').text('Update Product');
            } else {
                $('#productModalOverlay').removeClass('active');
                showAlert('danger', 'Error loading product: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading product:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            $('#productModalOverlay').removeClass('active');
            showAlert('danger', 'Error loading product. Please try again later.');
        }
    });
}

/**
 * Reset product form
 */
function resetProductForm() {
    $('#productForm')[0].reset();
    $('#productId').val('');
}

/**
 * Save product (create or update)
 */
function saveProduct() {
    // Get form values
    const productId = $('#productId').val();
    const productData = {
        name: $('#productName').val(),
        description: $('#productDescription').val(),
        price: parseFloat($('#productPrice').val()),
        stock: parseInt($('#productStock').val()),
        brandId: $('#productBrand').val(),
        categoryId: $('#productCategory').val(),
        size: $('#productSize').val(),
        type: $('#productType').val(),
        active: $('#productStatus').val() === 'true',
        imageUrl: $('#productImageUrl').val()
    };

    // Validate form
    if (!productData.name || !productData.description || !productData.price ||
        !productData.brandId || !productData.categoryId || !productData.size ||
        !productData.type || !productData.imageUrl) {
        showAlert('danger', 'Please fill in all required fields.');
        return;
    }

    // Determine if create or update
    const method = productId ? 'PUT' : 'POST';
    const url = productId ?
        `${API_BASE_URL}/api/v1/products/${productId}` :
        `${API_BASE_URL}/api/v1/products`;

    console.log('Saving product:', productData);
    console.log('URL:', url);
    console.log('Method:', method);

    // Send request
    $.ajax({
        url: url,
        method: method,
        headers: getAuthHeaders(),
        data: JSON.stringify(productData),
        contentType: 'application/json',
        success: function(response) {
            console.log('Save product response:', response);
            if (response.code === 200 || response.code === 201) {
                // Close modal
                $('#productModalOverlay').removeClass('active');

                // Show success message
                showAlert('success', productId ? 'Product updated successfully.' : 'Product created successfully.');

                // Reload products
                loadProducts();
            } else {
                showAlert('danger', 'Error saving product: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error saving product:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            showAlert('danger', 'Error saving product: ' + error);
        }
    });
}

/**
 * Open stock update modal
 */
function openStockModal(productId, currentStock) {
    $('#stockProductId').val(productId);
    $('#productCurrentStock').val(currentStock);
    $('#stockQuantity').val(currentStock);
    $('#stockModalOverlay').addClass('active');
}

/**
 * Update product stock
 */
function updateStock() {
    const productId = $('#stockProductId').val();
    const quantity = $('#stockQuantity').val();

    if (!quantity || isNaN(parseInt(quantity))) {
        showAlert('danger', 'Please enter a valid quantity.');
        return;
    }

    console.log('Updating stock for product ID:', productId, 'with quantity:', quantity);

    $.ajax({
        url: `${API_BASE_URL}/api/v1/products/${productId}/stock?quantity=${quantity}`,
        method: 'PUT',
        headers: getAuthHeaders(),
        success: function(response) {
            console.log('Update stock response:', response);
            if (response.code === 200) {
                // Close modal
                $('#stockModalOverlay').removeClass('active');

                // Show success message
                showAlert('success', 'Stock updated successfully.');

                // Reload content based on active tab
                const activeTab = $('.tab-item.active').data('tab');
                if (activeTab === 'products-tab') {
                    loadProducts();
                } else if (activeTab === 'inventory-tab') {
                    loadLowStockProducts();
                }
            } else {
                showAlert('danger', 'Error updating stock: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error updating stock:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            showAlert('danger', 'Error updating stock. Please try again later.');
        }
    });
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(productId) {
    $('#deleteProductId').val(productId);
    $('#deleteModalOverlay').addClass('active');
}

/**
 * Delete product
 */
function deleteProduct() {
    const productId = $('#deleteProductId').val();

    $.ajax({
        url: `${API_BASE_URL}/api/v1/products/${productId}`,
        method: 'DELETE',
        headers: getAuthHeaders(),
        success: function(response) {
            // Close modal
            $('#deleteModalOverlay').removeClass('active');

            if (response.code === 200) {
                // Show success message
                showAlert('success', 'Product deleted successfully.');

                // Reload products
                loadProducts();
            } else {
                showAlert('danger', 'Error deleting product: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error deleting product:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            $('#deleteModalOverlay').removeClass('active');
            showAlert('danger', 'Error deleting product. Please try again later.');
        }
    });
}

/**
 * View review details
 */
function viewReview(reviewId) {
    // Show modal with loading indicator
    $('#reviewModalBody').html('<div class="spinner-container"><div class="spinner"></div></div>');
    $('#reviewModalOverlay').addClass('active');

    $.ajax({
        url: `${API_BASE_URL}/api/v1/reviews/${reviewId}`,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.code === 200) {
                const review = response.data;

                // Format date
                const date = new Date(review.createdAt);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

                // Generate stars for rating
                let stars = '';
                for (let i = 0; i < review.rating; i++) {
                    stars += '★';
                }
                for (let i = review.rating; i < 5; i++) {
                    stars += '☆';
                }

                // Populate modal content
                $('#reviewModalBody').html(`
                    <input type="hidden" id="reviewId" value="${review.id}">
                    <div style="margin-bottom: 20px;">
                        <h4>${review.title}</h4>
                        <div style="color: gold; font-size: 1.2rem;">${stars} ${review.rating}/5</div>
                        <div style="margin-top: 10px; color: var(--dark-gray);">
                            By ${review.userFullName || 'Anonymous'} on ${formattedDate}
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <strong>Product:</strong> ${review.productName || 'Unknown'}
                    </div>
                    <div style="margin-bottom: 20px;">
                        <strong>Comment:</strong>
                        <p style="margin-top: 5px;">${review.comment}</p>
                    </div>
                `);
            } else {
                $('#reviewModalBody').html('<p>Error loading review: ' + response.message + '</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading review:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            $('#reviewModalBody').html('<p>Error loading review. Please try again later.</p>');
        }
    });
}

/**
 * Approve review
 */
function approveReview(reviewId) {
    // If reviewId is not provided, get it from the modal
    if (!reviewId) {
        reviewId = $('#reviewId').val();
    }

    $.ajax({
        url: `${API_BASE_URL}/api/v1/reviews/${reviewId}/approve`,
        method: 'PUT',
        headers: getAuthHeaders(),
        success: function(response) {
            // Close modal if open
            $('#reviewModalOverlay').removeClass('active');

            if (response.code === 200) {
                showAlert('success', 'Review approved successfully.');
                loadPendingReviews();
            } else {
                showAlert('danger', 'Error approving review: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error approving review:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            $('#reviewModalOverlay').removeClass('active');
            showAlert('danger', 'Error approving review. Please try again later.');
        }
    });
}

/**
 * Reject review
 */
function rejectReview(reviewId) {
    // If reviewId is not provided, get it from the modal
    if (!reviewId) {
        reviewId = $('#reviewId').val();
    }

    $.ajax({
        url: `${API_BASE_URL}/api/v1/reviews/${reviewId}`,
        method: 'DELETE',
        headers: getAuthHeaders(),
        success: function(response) {
            // Close modal if open
            $('#reviewModalOverlay').removeClass('active');

            if (response.code === 200) {
                showAlert('success', 'Review rejected successfully.');
                loadPendingReviews();
            } else {
                showAlert('danger', 'Error rejecting review: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error rejecting review:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            $('#reviewModalOverlay').removeClass('active');
            showAlert('danger', 'Error rejecting review. Please try again later.');
        }
    });
}

/**
 * Show alert message
 */
function showAlert(type, message) {
    const alertElement = $('#alert' + type.charAt(0).toUpperCase() + type.slice(1));

    alertElement.text(message).addClass('show');

    setTimeout(function() {
        alertElement.removeClass('show');
    }, 5000);
}

/**
 * Get authentication headers
 */
function getAuthHeaders() {
    const token = localStorage.getItem('token');

    if (!token) {
        console.warn('No authentication token found in localStorage');
        // Redirect to login if no token exists
        window.location.href = 'authentication.html';
        return {};
    }

    return {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
}