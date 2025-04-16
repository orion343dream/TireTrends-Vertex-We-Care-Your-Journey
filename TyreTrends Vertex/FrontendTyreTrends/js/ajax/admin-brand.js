$(document).ready(function () {
    // Global variables for pagination
    let currentPage = 0;
    let itemsPerPage = 10;
    let totalItems = 0;
    let totalPages = 0;

    // Load brands on page load
    loadBrands();

    // Setup event listeners
    setupEventListeners();

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Toggle User Dropdown
        const userDropdownToggle = $('#user-dropdown-toggle');
        const userDropdownMenu = $('#user-dropdown-menu');

        userDropdownToggle.on('click', function() {
            userDropdownMenu.toggleClass('active');
        });

        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!userDropdownToggle.is(e.target) && !userDropdownMenu.has(e.target).length) {
                userDropdownMenu.removeClass('active');
            }
        });

        // Toggle Mobile Sidebar
        const menuToggle = $('.menu-toggle');
        const sidebar = $('#sidebar');

        menuToggle.on('click', function() {
            sidebar.toggleClass('active');
        });

        // Modal Controls
        const addBrandBtn = $('#addBrandBtn');
        const brandModal = $('#brandModal');
        const closeModal = $('#closeModal');
        const cancelBtn = $('#cancelBtn');
        const saveBrandBtn = $('#saveBrandBtn');

        // Open add brand modal
        addBrandBtn.on('click', function() {
            $('#modalTitle').text('Add New Brand');
            $('#brandForm').trigger('reset');
            $('#brandId').val('');
            brandModal.addClass('active');
        });

        // Close modal
        function closeModalFunc() {
            brandModal.removeClass('active');
        }

        closeModal.on('click', closeModalFunc);
        cancelBtn.on('click', closeModalFunc);

        // Delete Modal Controls
        const deleteModal = $('#deleteModal');
        const closeDeleteModal = $('#closeDeleteModal');
        const cancelDeleteBtn = $('#cancelDeleteBtn');
        const confirmDeleteBtn = $('#confirmDeleteBtn');

        function closeDeleteModalFunc() {
            deleteModal.removeClass('active');
        }

        closeDeleteModal.on('click', closeDeleteModalFunc);
        cancelDeleteBtn.on('click', closeDeleteModalFunc);

        // Save brand
        saveBrandBtn.on('click', function() {
            if (validateBrandForm()) {
                saveOrUpdateBrand();
            }
        });

        // Search functionality
        const searchInput = $('#searchBrands');
        searchInput.on('input', function() {
            currentPage = 0;
            loadBrands();
        });

        // Filter functionality
        const statusFilter = $('#statusFilter');
        const sortFilter = $('#sortFilter');

        statusFilter.on('change', function() {
            currentPage = 0;
            loadBrands();
        });
        
        sortFilter.on('change', function() {
            currentPage = 0;
            loadBrands();
        });

        // Pagination controls
        const prevPageBtn = $('#prevPage');
        const nextPageBtn = $('#nextPage');

        prevPageBtn.on('click', function() {
            if (currentPage > 0) {
                currentPage--;
                loadBrands();
            }
        });

        nextPageBtn.on('click', function() {
            if (currentPage < totalPages - 1) {
                currentPage++;
                loadBrands();
            }
        });
    }

    /**
     * Validate brand form
     * @returns {boolean} True if valid, false otherwise
     */
    function validateBrandForm() {
        const brandName = $('#brandName').val().trim();
        let isValid = true;

        // Reset errors
        $('.error-message').text('').removeClass('visible');

        // Validate brand name
        if (!brandName) {
            $('#brandNameError').text('Brand name is required').addClass('visible');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Load brands data
     */
    function loadBrands() {
        // Show loading
        $('#loadingOverlay').addClass('active');

        // Get filter values
        const searchQuery = $('#searchBrands').val().trim();
        const statusFilter = $('#statusFilter').val();
        const sortFilter = $('#sortFilter').val();

        // Build request URL
        let url = 'http://localhost:8080/api/v1/brands';
        
        // In a real implementation, we would handle filtering and sorting on the server
        // For now, we'll just fetch all brands and do client-side filtering/sorting since
        // the backend doesn't support these parameters directly

        // Call API to get brands
        $.ajax({
            url: url,
            method: 'GET',
            headers: getAuthHeaders(),
            success: function(response) {
                if (response.code === 200) {
                    // Apply client-side filtering and sorting
                    let brands = response.data;
                    
                    // Filter by search query
                    if (searchQuery) {
                        brands = brands.filter(brand => 
                            brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (brand.description && brand.description.toLowerCase().includes(searchQuery.toLowerCase()))
                        );
                    }
                    
                    // Filter by status
                    if (statusFilter) {
                        if (statusFilter === 'active') {
                            brands = brands.filter(brand => brand.active);
                        } else if (statusFilter === 'inactive') {
                            brands = brands.filter(brand => !brand.active);
                        } else if (statusFilter === 'featured') {
                            brands = brands.filter(brand => brand.featured);
                        }
                    }
                    
                    // Sort results
                    if (sortFilter) {
                        if (sortFilter === 'name') {
                            brands.sort((a, b) => a.name.localeCompare(b.name));
                        } else if (sortFilter === 'products') {
                            brands.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
                        } else if (sortFilter === 'newest') {
                            brands.sort((a, b) => (b.yearEstablished || 0) - (a.yearEstablished || 0));
                        } else if (sortFilter === 'oldest') {
                            brands.sort((a, b) => (a.yearEstablished || 0) - (b.yearEstablished || 0));
                        }
                    }
                    
                    // Calculate pagination
                    totalItems = brands.length;
                    totalPages = Math.ceil(totalItems / itemsPerPage);
                    
                    // Paginate the results
                    const startIndex = currentPage * itemsPerPage;
                    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
                    const paginatedBrands = brands.slice(startIndex, endIndex);
                    
                    // Render brands table
                    renderBrandsTable(paginatedBrands);
                    
                    // Update pagination UI
                    updatePagination();
                } else {
                    showAlert('error', 'Failed to load brands: ' + response.message);
                }
            },
            error: function(xhr) {
                console.error('Error loading brands:', xhr);
                
                let errorMsg = 'Failed to load brands. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showAlert('error', errorMsg);
            },
            complete: function() {
                // Hide loading overlay
                $('#loadingOverlay').removeClass('active');
            }
        });
    }

    /**
     * Render brands table
     * @param {Array} brands Array of brand objects
     */
    function renderBrandsTable(brands) {
        const tableBody = $('#brandsTableBody');

        // Clear existing rows
        tableBody.empty();

        if (brands.length === 0) {
            tableBody.html('<tr><td colspan="7" class="text-center">No brands found</td></tr>');
            return;
        }

        // Add rows for each brand
        brands.forEach(brand => {
            // Determine status class
            let statusClass = brand.active ? 'status-active' : 'status-inactive';
            let statusText = brand.active ? 'Active' : 'Inactive';

            if (brand.featured) {
                statusClass = 'status-featured';
                statusText = 'Featured';
            }

            const row = $('<tr>');
            row.html(`
                <td>
                    <img src="${brand.logoUrl || 'https://via.placeholder.com/150x50?text=No+Logo'}" alt="${brand.name}" class="brand-logo">
                </td>
                <td><strong>${brand.name}</strong></td>
                <td>${brand.description || 'No description available'}</td>
                <td>${brand.productCount || 0}</td>
                <td>${brand.countryOfOrigin || 'Unknown'}</td>
                <td><span class="brand-status ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm edit-brand" data-id="${brand.id}">Edit</button>
                        <button class="btn btn-sm btn-outline delete-brand" data-id="${brand.id}" data-name="${brand.name}">Delete</button>
                    </div>
                </td>
            `);

            tableBody.append(row);
        });

        // Add event listeners for edit and delete buttons
        $('.edit-brand').on('click', function() {
            const brandId = $(this).data('id');
            editBrand(brandId);
        });

        $('.delete-brand').on('click', function() {
            const brandId = $(this).data('id');
            const brandName = $(this).data('name');
            showDeleteConfirmation(brandId, brandName);
        });
    }

    /**
     * Update pagination controls
     */
    function updatePagination() {
        const pageStart = currentPage * itemsPerPage + 1;
        const pageEnd = Math.min((currentPage + 1) * itemsPerPage, totalItems);

        $('#pageStart').text(pageStart);
        $('#pageEnd').text(pageEnd);
        $('#totalItems').text(totalItems);

        // Update previous/next buttons
        $('#prevPage').prop('disabled', currentPage === 0);
        $('#nextPage').prop('disabled', currentPage === totalPages - 1);

        // Generate page buttons
        const pageControls = $('.page-controls');

        // Keep the first and last buttons
        const prevButton = pageControls.children().first().clone(true);
        const nextButton = pageControls.children().last().clone(true);

        pageControls.empty();
        pageControls.append(prevButton);

        // Add page buttons
        const maxButtons = 5;
        let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
        const endPage = Math.min(startPage + maxButtons - 1, totalPages - 1);

        // Adjust startPage if we can't show enough pages
        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(0, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = $('<button>').addClass('page-btn' + (i === currentPage ? ' active' : ''))
                .text(i + 1);

            // Add click handler
            pageBtn.on('click', function() {
                if (i !== currentPage) {
                    currentPage = i;
                    loadBrands();
                }
            });

            pageControls.append(pageBtn);
        }

        // Add ellipsis if needed
        if (endPage < totalPages - 1) {
            const ellipsis = $('<button>').addClass('page-btn').text('...').prop('disabled', true);
            pageControls.append(ellipsis);

            // Add the last page
            const lastPage = $('<button>').addClass('page-btn').text(totalPages);
            lastPage.on('click', function() {
                currentPage = totalPages - 1;
                loadBrands();
            });
            pageControls.append(lastPage);
        }

        pageControls.append(nextButton);

        // Re-attach event listeners
        $('#prevPage').on('click', function() {
            if (currentPage > 0) {
                currentPage--;
                loadBrands();
            }
        });

        $('#nextPage').on('click', function() {
            if (currentPage < totalPages - 1) {
                currentPage++;
                loadBrands();
            }
        });
    }

    /**
     * Edit brand
     * @param {number} brandId Brand ID
     */
    function editBrand(brandId) {
        // Show loading
        $('#loadingOverlay').addClass('active');

        // Call API to get brand details
        $.ajax({
            url: `http://localhost:8080/api/v1/brands/${brandId}`,
            method: 'GET',
            headers: getAuthHeaders(),
            success: function(response) {
                if (response.code === 200) {
                    const brand = response.data;
                    
                    // Update modal title
                    $('#modalTitle').text('Edit Brand');

                    // Fill form with brand data
                    $('#brandId').val(brand.id);
                    $('#brandName').val(brand.name);
                    $('#description').val(brand.description || '');
                    $('#logoUrl').val(brand.logoUrl || '');
                    $('#website').val(brand.website || '');
                    $('#country').val(brand.countryOfOrigin || '');
                    $('#yearEstablished').val(brand.yearEstablished || '');
                    $('#active').prop('checked', brand.active);
                    $('#featured').prop('checked', brand.featured);

                    // Show modal
                    $('#brandModal').addClass('active');
                } else {
                    showAlert('error', 'Failed to load brand: ' + response.message);
                }
            },
            error: function(xhr) {
                console.error('Error loading brand:', xhr);
                
                let errorMsg = 'Failed to load brand details. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showAlert('error', errorMsg);
            },
            complete: function() {
                // Hide loading overlay
                $('#loadingOverlay').removeClass('active');
            }
        });
    }

    /**
     * Save or update brand
     */
    function saveOrUpdateBrand() {
        // Show loading
        $('#loadingOverlay').addClass('active');

        // Get form data
        const brandId = $('#brandId').val();
        const brandData = {
            id: brandId ? parseInt(brandId) : null,
            name: $('#brandName').val(),
            description: $('#description').val(),
            logoUrl: $('#logoUrl').val(),
            website: $('#website').val(),
            countryOfOrigin: $('#country').val(),
            yearEstablished: $('#yearEstablished').val() ? parseInt($('#yearEstablished').val()) : null,
            active: $('#active').is(':checked'),
            featured: $('#featured').is(':checked')
        };

        // Determine if creating new or updating existing
        const isUpdate = brandId ? true : false;
        const url = isUpdate 
            ? `http://localhost:8080/api/v1/brands/${brandId}`
            : 'http://localhost:8080/api/v1/brands';
        const method = isUpdate ? 'PUT' : 'POST';

        // Call API to save/update brand
        $.ajax({
            url: url,
            method: method,
            headers: getAuthHeaders(),
            contentType: 'application/json',
            data: JSON.stringify(brandData),
            success: function(response) {
                if (response.code === 200 || response.code === 201) {
                    // Close modal
                    $('#brandModal').removeClass('active');

                    // Show success message
                    showAlert('success', `Brand ${isUpdate ? 'updated' : 'created'} successfully!`);

                    // Reload brands table
                    loadBrands();
                } else {
                    showAlert('error', 'Failed to save brand: ' + response.message);
                }
            },
            error: function(xhr) {
                console.error('Error saving brand:', xhr);
                
                let errorMsg = 'Failed to save brand. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showAlert('error', errorMsg);
            },
            complete: function() {
                // Hide loading overlay
                $('#loadingOverlay').removeClass('active');
            }
        });
    }

    /**
     * Show delete confirmation
     * @param {number} brandId Brand ID
     * @param {string} brandName Brand name
     */
    function showDeleteConfirmation(brandId, brandName) {
        $('#deleteBrandName').text(brandName);

        // Store brand ID for deletion
        $('#confirmDeleteBtn').data('id', brandId);

        // Show modal
        $('#deleteModal').addClass('active');

        // Setup confirm button
        $('#confirmDeleteBtn').off('click').on('click', function() {
            const brandIdToDelete = $(this).data('id');
            deleteBrand(brandIdToDelete);
        });
    }

    /**
     * Delete brand
     * @param {number} brandId Brand ID
     */
    function deleteBrand(brandId) {
        // Show loading
        $('#loadingOverlay').addClass('active');

        // Call API to delete brand
        $.ajax({
            url: `http://localhost:8080/api/v1/brands/${brandId}`,
            method: 'DELETE',
            headers: getAuthHeaders(),
            success: function(response) {
                if (response.code === 200) {
                    // Close modal
                    $('#deleteModal').removeClass('active');

                    // Show success message
                    showAlert('success', 'Brand deleted successfully!');

                    // Reload brands table
                    loadBrands();
                } else {
                    showAlert('error', 'Failed to delete brand: ' + response.message);
                }
            },
            error: function(xhr) {
                console.error('Error deleting brand:', xhr);
                
                let errorMsg = 'Failed to delete brand. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showAlert('error', errorMsg);
            },
            complete: function() {
                // Hide loading overlay
                $('#loadingOverlay').removeClass('active');
            }
        });
    }

    /**
     * Show alert
     * @param {string} type 'success' or 'error'
     * @param {string} message Alert message
     */
    function showAlert(type, message) {
        const alertElement = type === 'success' 
            ? $('#successAlert')
            : $('#errorAlert');

        alertElement.text(message).addClass('visible');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertElement.removeClass('visible');
        }, 5000);
    }

    /**
     * Get authentication headers
     * @returns {Object} Headers object with Authorization
     */
    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': 'Bearer ' + token
        };
    }
});
