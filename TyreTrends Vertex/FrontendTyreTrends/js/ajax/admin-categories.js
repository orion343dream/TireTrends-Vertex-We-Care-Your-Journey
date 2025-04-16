$(document).ready(function() {
    // Check if user is authenticated
    if (!localStorage.getItem('token')) {
        window.location.href = 'admin-login.html';
        return;
    }

    // Load categories
    loadCategories();

    // Initialize event listeners
    initEventListeners();

    // Initialize user dropdown
    initUserDropdown();
});

/**
 * Global state for pagination
 */
const state = {
    currentPage: 0,
    totalPages: 0,
    size: 10,
    filters: {
        search: '',
        status: '',
        sort: 'name'
    }
};

/**
 * Initialize user dropdown
 */
function initUserDropdown() {
    $('#user-dropdown-toggle').on('click', function(e) {
        e.preventDefault();
        $('#user-dropdown-menu').toggleClass('active');
    });

    // Close dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$('#user-dropdown-toggle').is(e.target) &&
            $('#user-dropdown-toggle').has(e.target).length === 0 &&
            !$('#user-dropdown-menu').is(e.target) &&
            $('#user-dropdown-menu').has(e.target).length === 0) {
            $('#user-dropdown-menu').removeClass('active');
        }
    });
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Add category button
    $('#addCategoryBtn').on('click', function() {
        resetCategoryForm();
        $('#formTitle').text('Add New Category');
        $('#saveBtn').text('Save Category');
    });

    // Cancel button
    $('#cancelBtn').on('click', function() {
        resetCategoryForm();
    });

    // Save category button
    $('#categoryForm').on('submit', function(e) {
        e.preventDefault();
        saveCategory();
    });

    // Preview Image button
    $('#previewImageBtn').on('click', function() {
        previewImageFromUrl();
    });

    // Handle enter key on image URL field
    $('#categoryImageUrl').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            previewImageFromUrl();
        }
    });

    // Search and filters
    $('#searchCategory').on('input', function() {
        state.filters.search = $(this).val();
        renderCategories();
    });

    $('#statusFilter').on('change', function() {
        state.filters.status = $(this).val();
        renderCategories();
    });

    $('#sortFilter').on('change', function() {
        state.filters.sort = $(this).val();
        renderCategories();
    });

    // Delete modal buttons
    $('#closeDeleteModal, #cancelDeleteBtn').on('click', function() {
        $('#deleteModal').removeClass('active');
    });

    $('#confirmDeleteBtn').on('click', function() {
        deleteCategory();
    });

    // Menu toggle for mobile
    $('.menu-toggle').on('click', function() {
        $('#sidebar').toggleClass('active');
        $('body').toggleClass('sidebar-collapsed');
    });

    // Logout button
    $('.dropdown-item').filter(function() {
        return $(this).text() === 'Logout';
    }).on('click', function(e) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'admin-login.html';
    });
}

/**
 * Preview image from URL
 */
function previewImageFromUrl() {
    const imageUrl = $('#categoryImageUrl').val().trim();
    
    if (!imageUrl) {
        showAlert('error', 'Please enter an image URL');
        return;
    }
    
    // Test if URL is valid
    const isValidUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(imageUrl);
    
    if (!isValidUrl) {
        showAlert('error', 'Please enter a valid URL');
        return;
    }
    
    // Show a loading indicator in the preview
    $('#imagePreview').html('<div style="text-align: center; padding: 20px;">Loading image...</div>');
    
    // Create a test image to verify the URL works
    const testImage = new Image();
    testImage.onload = function() {
        // Image loaded successfully
        $('#imagePreview').html(`<img src="${imageUrl}" alt="Category Image">`);
        $('#imagePreview').addClass('has-image');
    };
    testImage.onerror = function() {
        // Image failed to load
        $('#imagePreview').html(`
    <div class="upload-prompt">
    <div class="upload-icon">❌</div>
<div>Invalid image URL</div>
</div>
`);
        $('#imagePreview').removeClass('has-image');
        showAlert('error', 'Failed to load image from URL. Please check the URL and try again.');
    };
    testImage.src = imageUrl;
}

/**
 * Load categories from API
 */
function loadCategories() {
    showLoading();

    $.ajax({
        url: 'http://localhost:8080/api/v1/categories',
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.code === 200) {
                // Update global state
                window.categories = response.data;
                state.totalPages = Math.ceil(response.data.length / state.size);

                // Render categories
                renderCategories();

                // Update pagination
                renderPagination();

                hideLoading();
            } else {
                showAlert('error', 'Failed to load categories: ' + response.message);
                hideLoading();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading categories:', error);

            if (xhr.status === 403) {
                showAlert('error', 'Authentication error. Please log in again.');
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 2000);
            } else {
                showAlert('error', 'Failed to load categories. Please try again later.');
            }

            hideLoading();
        }
    });
}

/**
 * Render categories table
 */
function renderCategories() {
    const tableBody = $('#categoriesTableBody');
    tableBody.empty();

    if (!window.categories || window.categories.length === 0) {
        tableBody.html(`
<tr>
<td colspan="6">
    <div class="empty-state">
    <div class="empty-icon">📦</div>
<div class="empty-message">No categories found</div>
</div>
</td>
</tr>
`);
        return;
    }

    // Apply filters
    let filteredCategories = window.categories.filter(category => {
        // Apply search filter
        if (state.filters.search && !category.name.toLowerCase().includes(state.filters.search.toLowerCase())) {
            return false;
        }

        // Apply status filter
        if (state.filters.status === 'active' && !category.active) {
            return false;
        }

        if (state.filters.status === 'inactive' && category.active) {
            return false;
        }

        return true;
    });

    // Apply sorting
    filteredCategories.sort((a, b) => {
        switch (state.filters.sort) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'products':
                return (b.productCount || 0) - (a.productCount || 0);
            case 'date':
                // In a real app, you'd sort by date
                // For this demo, we'll sort by ID as a proxy for date
                return b.id - a.id;
            default:
                return a.name.localeCompare(b.name);
        }
    });

    // Check if no categories found after filtering
    if (filteredCategories.length === 0) {
        tableBody.html(`
<tr>
<td colspan="6">
    <div class="empty-state">
    <div class="empty-icon">📦</div>
<div class="empty-message">No categories found</div>
<button class="btn" id="resetFiltersBtn">Reset Filters</button>
</div>
</td>
</tr>
`);

        // Add event listener to reset filters button
        $('#resetFiltersBtn').on('click', function() {
            $('#searchCategory').val('');
            $('#statusFilter').val('');
            $('#sortFilter').val('name');

            state.filters = {
                search: '',
                status: '',
                sort: 'name'
            };

            renderCategories();
        });

        return;
    }

    // Pagination
    const startIndex = state.currentPage * state.size;
    const paginatedCategories = filteredCategories.slice(startIndex, startIndex + state.size);

    // Render each category
    paginatedCategories.forEach(category => {
        const row = $('<tr></tr>');
        row.html(`
<td>${category.id}</td>
<td>
    <div class="category-image">
        <img src="${category.imageUrl || 'https://via.placeholder.com/50x50?text=Category'}" alt="${category.name}">
    </div>
</td>
<td>
    ${category.name}
    ${category.featured ? '<span class="featured-badge">Featured</span>' : ''}
</td>
<td><span class="product-counter">${category.productCount || 0}</span></td>
<td>${category.active ? '<span style="color: var(--success);">Active</span>' : '<span style="color: var(--danger);">Inactive</span>'}</td>
<td>
    <div class="category-actions">
        <button class="btn btn-sm btn-outline edit-btn" data-id="${category.id}">Edit</button>
        <button class="btn btn-sm btn-danger delete-btn" data-id="${category.id}">Delete</button>
    </div>
</td>
`);

tableBody.append(row);
});

// Setup edit and delete buttons
setupActionButtons();
}

/**
* Setup edit and delete buttons
*/
function setupActionButtons() {
// Edit buttons
$('.edit-btn').on('click', function() {
    const categoryId = $(this).data('id');
    editCategory(categoryId);
});

// Delete buttons
$('.delete-btn').on('click', function() {
    const categoryId = $(this).data('id');
    showDeleteModal(categoryId);
});
}

/**
* Render pagination controls
*/
function renderPagination() {
const pagination = $('#categoriesPagination');
pagination.empty();

if (state.totalPages <= 1) {
    pagination.hide();
    return;
}

pagination.show();

// Previous button
const prevBtn = $(`<a href="#" class="pagination-item ${state.currentPage === 0 ? 'disabled' : ''}">«</a>`);
if (state.currentPage > 0) {
    prevBtn.on('click', function(e) {
        e.preventDefault();
        state.currentPage--;
        renderCategories();
        renderPagination();
    });
}
pagination.append(prevBtn);

// Page numbers
for (let i = 0; i < state.totalPages; i++) {
    const pageBtn = $(`<a href="#" class="pagination-item ${i === state.currentPage ? 'active' : ''}">${i + 1}</a>`);

    if (i !== state.currentPage) {
        pageBtn.on('click', function(e) {
            e.preventDefault();
            state.currentPage = i;
            renderCategories();
            renderPagination();
        });
    }

    pagination.append(pageBtn);
}

// Next button
const nextBtn = $(`<a href="#" class="pagination-item ${state.currentPage === state.totalPages - 1 ? 'disabled' : ''}">»</a>`);
if (state.currentPage < state.totalPages - 1) {
    nextBtn.on('click', function(e) {
        e.preventDefault();
        state.currentPage++;
        renderCategories();
        renderPagination();
    });
}
pagination.append(nextBtn);
}

/**
* Edit category
*/
function editCategory(categoryId) {
// Find category
const category = window.categories.find(c => c.id == categoryId);

if (!category) {
    showAlert('error', 'Category not found.');
    return;
}

// Update form title
$('#formTitle').text('Edit Category');
$('#saveBtn').text('Update Category');

// Fill form with category data
$('#categoryName').val(category.name);
$('#categoryDescription').val(category.description || '');
$('#categoryFeatured').prop('checked', category.featured);
$('#categoryActive').prop('checked', category.active);
$('#categoryImageUrl').val(category.imageUrl || '');

// Update image preview
if (category.imageUrl) {
    $('#imagePreview').html(`<img src="${category.imageUrl}" alt="${category.name}">`);
    $('#imagePreview').addClass('has-image');
} else {
    $('#imagePreview').html(`
            <div class="upload-prompt">
                <div class="upload-icon">🖼️</div>
                <div>Enter image URL below</div>
            </div>
        `);
    $('#imagePreview').removeClass('has-image');
}

// Store category ID for updating
$('#categoryForm').data('id', category.id);

// Scroll to form
$('#categoryFormCard').get(0).scrollIntoView({ behavior: 'smooth' });
}

/**
* Reset category form
*/
function resetCategoryForm() {
$('#categoryForm').trigger('reset');
$('#categoryForm').removeData('id');
$('#imagePreview').html(`
        <div class="upload-prompt">
            <div class="upload-icon">🖼️</div>
            <div>Enter image URL below</div>
        </div>
    `);
$('#imagePreview').removeClass('has-image');
$('#formTitle').text('Add New Category');
$('#saveBtn').text('Save Category');
}

/**
* Save category (create or update)
*/
function saveCategory() {
showLoading();

// Get form values
const name = $('#categoryName').val().trim();
const description = $('#categoryDescription').val().trim();
const featured = $('#categoryFeatured').is(':checked');
const active = $('#categoryActive').is(':checked');
const imageUrl = $('#categoryImageUrl').val().trim();

// Validate form
if (!name) {
    hideLoading();
    showAlert('error', 'Please enter a category name.');
    return;
}

// Prepare category data as JSON
const categoryData = {
    name: name,
    description: description,
    featured: featured,
    active: active,
    imageUrl: imageUrl
};

// Get category ID if editing
const categoryId = $('#categoryForm').data('id');

// Determine if create or update
const method = categoryId ? 'PUT' : 'POST';
const url = categoryId ?
    `http://localhost:8080/api/v1/categories/${categoryId}` :
    'http://localhost:8080/api/v1/categories';

$.ajax({
    url: url,
    method: method,
    data: JSON.stringify(categoryData),
    contentType: 'application/json',
    headers: getAuthHeaders(),
    success: function(response) {
        hideLoading();
        if (response.code === 200 || response.code === 201) {
            loadCategories();
            resetCategoryForm();
            showAlert('success', categoryId ?
                'Category updated successfully!' :
                'Category created successfully!'
            );
        } else {
            showAlert('error', 'Error saving category: ' + response.message);
        }
    },
    error: function(xhr, status, error) {
        hideLoading();
        console.error('Error saving category:', error);
        if (xhr.status === 403) {
            showAlert('error', 'Authentication error. Please log in again.');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 2000);
        } else {
            showAlert('error', 'Error saving category. Please try again later.');
        }
    }
});
}

/**
* Show delete confirmation modal
*/
function showDeleteModal(categoryId) {
const category = window.categories.find(c => c.id == categoryId);

if (!category) {
    showAlert('error', 'Category not found.');
    return;
}

// Update modal content
$('#deleteCategoryName').text(`Category: ${category.name}`);
$('#confirmDeleteBtn').data('id', categoryId);

// Show warning if category has products
$('#categoryWarning').toggle(category.productCount > 0);

// Show modal
$('#deleteModal').addClass('active');
}

/**
* Delete category
*/
function deleteCategory() {
showLoading();

const categoryId = $('#confirmDeleteBtn').data('id');

$.ajax({
    url: `http://localhost:8080/api/v1/categories/${categoryId}`,
    method: 'DELETE',
    headers: getAuthHeaders(),
    success: function(response) {
        // Hide modal
        $('#deleteModal').removeClass('active');

        if (response.code === 200) {
            // Show success message
            showAlert('success', 'Category deleted successfully!');

            // Reload categories
            loadCategories();
        } else {
            showAlert('error', 'Error deleting category: ' + response.message);
            hideLoading();
        }
    },
    error: function(xhr, status, error) {
        console.error('Error deleting category:', error);
        $('#deleteModal').removeClass('active');

        if (xhr.status === 403) {
            showAlert('error', 'Authentication error. Please log in again.');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 2000);
        } else {
            showAlert('error', 'Error deleting category. Please try again later.');
        }

        hideLoading();
    }
});
}

/**
* Show loading spinner
*/
function showLoading() {
$('#loadingSpinner').addClass('active');
}

/**
* Hide loading spinner
*/
function hideLoading() {
$('#loadingSpinner').removeClass('active');
}

/**
* Show alert message
*/
function showAlert(type, message) {
const alertId = type === 'success' ? 'successAlert' :
    type === 'warning' ? 'warningAlert' : 'errorAlert';

const alert = $('#' + alertId);
alert.text(message).addClass('show');

// Hide after 5 seconds
setTimeout(() => {
    alert.removeClass('show');
}, 5000);
}

/**
* Get authentication headers
*/
function getAuthHeaders() {
const token = localStorage.getItem('token');

return {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
};
}
