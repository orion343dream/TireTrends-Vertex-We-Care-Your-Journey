// js/vehicle-management.js

// Base API URL
const API_BASE_URL = "http://localhost:8080/api/v1";

$(document).ready(function() {
    // Initialize the page
    initializePage();

    /**
     * Initialize the vehicle management page
     */
    function initializePage() {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login page
            window.location.href = 'authentication.html?redirect=user-vehicles.html';
            return;
        }

        // Load user vehicles
        loadVehicles();

        // Setup event listeners
        setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Add vehicle button
        $('#addVehicleBtn').on('click', function() {
            // Reset form
            $('#vehicleForm')[0].reset();
            $('#vehicleId').val('');
            $('#vehicleModalTitle').text('Add New Vehicle');
            clearErrors();

            // Show modal
            $('#vehicleModalOverlay').addClass('show');
        });

        // Close modal buttons
        $('.modal-close, #vehicleModalCancel').on('click', function() {
            $('#vehicleModalOverlay').removeClass('show');
        });

        // Close delete modal buttons
        $('.modal-close, #deleteModalCancel').on('click', function() {
            $('#deleteModalOverlay').removeClass('show');
        });

        // Close modal when clicking outside
        $('#vehicleModalOverlay').on('click', function(e) {
            if (e.target === this) {
                $(this).removeClass('show');
            }
        });

        // Close delete modal when clicking outside
        $('#deleteModalOverlay').on('click', function(e) {
            if (e.target === this) {
                $(this).removeClass('show');
            }
        });

        // Save vehicle button
        $('#vehicleModalSave').on('click', saveVehicle);

        // Delete vehicle confirmation
        $('#deleteModalConfirm').on('click', confirmDeleteVehicle);
    }

    /**
     * Load user vehicles
     */
    function loadVehicles() {
        const vehiclesContainer = $('#vehiclesContainer');

        // Show loading spinner
        vehiclesContainer.html('<div class="spinner-container"><div class="spinner"></div></div>');

        // Call API to get user vehicles
        $.ajax({
            url: `${API_BASE_URL}/vehicles`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function(response) {
                if (response.code === 200) {
                    // Update vehicles count
                    updateVehiclesCount(response.data.length);

                    // Render vehicles grid
                    renderVehiclesGrid(response.data);

                    // Load recommended tires for default vehicle
                    loadRecommendedTires(response.data);
                } else {
                    showAlert('error', response.message || 'Failed to load vehicles');
                    vehiclesContainer.html('<p>Error loading vehicles. Please try again later.</p>');
                }
            },
            error: function(xhr) {
                console.error('Error loading vehicles:', xhr);
                let errorMsg = 'Failed to load vehicles. Please try again later.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showAlert('error', errorMsg);
                vehiclesContainer.html(`<p>${errorMsg}</p>`);
            }
        });
    }

    /**
     * Update vehicles count
     * @param {number} count Number of vehicles
     */
    function updateVehiclesCount(count) {
        const vehiclesCount = $('#vehiclesCount');
        vehiclesCount.text(`You have ${count} saved vehicle${count !== 1 ? 's' : ''}`);
    }

    /**
     * Render vehicles grid
     * @param {Array} vehicles Array of vehicle data
     */
    function renderVehiclesGrid(vehicles) {
        const vehiclesContainer = $('#vehiclesContainer');

        // If no vehicles, show empty state
        if (!vehicles || vehicles.length === 0) {
            vehiclesContainer.html(`
                <div class="empty-state">
                    <div class="empty-icon">🚗</div>
                    <h3 class="empty-title">No Vehicles Found</h3>
                    <p class="empty-message">You haven't added any vehicles yet. Add your first vehicle to get personalized tire recommendations.</p>
                    <button class="btn" id="emptyStateAddBtn">Add Your First Vehicle</button>
                </div>
            `);

            // Add event listener for empty state add button
            $('#emptyStateAddBtn').on('click', function() {
                // Reset form
                $('#vehicleForm')[0].reset();
                $('#vehicleId').val('');
                $('#vehicleModalTitle').text('Add New Vehicle');
                clearErrors();

                // Show modal
                $('#vehicleModalOverlay').addClass('show');
            });

            return;
        }

        // Create grid container
        const vehiclesGrid = $('<div>', { class: 'vehicles-grid' });

        // Add each vehicle to grid
        vehicles.forEach(vehicle => {
            const vehicleCard = createVehicleCard(vehicle);
            vehiclesGrid.append(vehicleCard);
        });

        // Add "Add New Vehicle" card
        const addVehicleCard = $('<div>', { class: 'add-vehicle-card' });
        addVehicleCard.html(`
            <span class="add-icon">+</span>
            <h3>Add New Vehicle</h3>
            <p>Add another vehicle to your account</p>
        `);

        // Add click event to open modal
        addVehicleCard.on('click', function() {
            // Reset form
            $('#vehicleForm')[0].reset();
            $('#vehicleId').val('');
            $('#vehicleModalTitle').text('Add New Vehicle');
            clearErrors();

            // Show modal
            $('#vehicleModalOverlay').addClass('show');
        });

        vehiclesGrid.append(addVehicleCard);

        // Clear container and add grid
        vehiclesContainer.empty().append(vehiclesGrid);
    }

    /**
     * Create vehicle card
     * @param {Object} vehicle Vehicle data
     * @returns {jQuery} Vehicle card element
     */
    function createVehicleCard(vehicle) {
        const vehicleCard = $('<div>', {
            class: 'vehicle-card' + (vehicle.isPrimary ? ' default' : '')
        });

        const vehicleDisplayName = vehicle.vehicleType || `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`;

        vehicleCard.html(`
            <h3 class="vehicle-title">${vehicleDisplayName}</h3>
            <div class="vehicle-details">
                <div class="detail-row">
                    <div class="detail-label">Make:</div>
                    <div class="detail-value">${vehicle.make}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Model:</div>
                    <div class="detail-value">${vehicle.model}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Year:</div>
                    <div class="detail-value">${vehicle.year}</div>
                </div>
                ${vehicle.trim ? `
                <div class="detail-row">
                    <div class="detail-label">Trim:</div>
                    <div class="detail-value">${vehicle.trim}</div>
                </div>
                ` : ''}
                <div class="detail-row">
                    <div class="detail-label">Tire Size:</div>
                    <div class="detail-value">${vehicle.tireSizesFront || 'Not specified'}</div>
                </div>
                ${vehicle.licensePlate ? `
                <div class="detail-row">
                    <div class="detail-label">Plate:</div>
                    <div class="detail-value">${vehicle.licensePlate}</div>
                </div>
                ` : ''}
            </div>
            <div class="vehicle-actions">
                <a href="tyre-finder.html?vehicle=${vehicle.id}" class="btn btn-sm">Find Tires</a>
                <button class="btn btn-sm btn-outline edit-vehicle-btn" data-id="${vehicle.id}">Edit</button>
                ${!vehicle.isPrimary ? `<button class="btn btn-sm btn-outline set-default-btn" data-id="${vehicle.id}">Set as Default</button>` : ''}
                <button class="btn btn-sm btn-outline delete-vehicle-btn" data-id="${vehicle.id}" data-name="${vehicleDisplayName}">Delete</button>
            </div>
        `);

        // Add event listeners
        vehicleCard.find('.edit-vehicle-btn').on('click', function() {
            const vehicleId = $(this).data('id');
            editVehicle(vehicleId);
        });

        const setDefaultBtn = vehicleCard.find('.set-default-btn');
        if (setDefaultBtn.length) {
            setDefaultBtn.on('click', function() {
                const vehicleId = $(this).data('id');
                setDefaultVehicle(vehicleId);
            });
        }

        vehicleCard.find('.delete-vehicle-btn').on('click', function() {
            const vehicleId = $(this).data('id');
            const vehicleName = $(this).data('name');
            openDeleteModal(vehicleId, vehicleName);
        });

        return vehicleCard;
    }

    /**
     * Load recommended tires
     * @param {Array} vehicles Array of vehicle data
     */
    function loadRecommendedTires(vehicles) {
        // Find default vehicle
        const defaultVehicle = vehicles.find(vehicle => vehicle.isPrimary);

        // If no default vehicle, hide recommendations section
        if (!defaultVehicle) {
            $('#recommendationsSection').hide();
            return;
        }

        // Show recommendations section
        $('#recommendationsSection').show();

        // Update default vehicle name
        $('#defaultVehicleName').text(defaultVehicle.vehicleType ||
            `${defaultVehicle.year} ${defaultVehicle.make} ${defaultVehicle.model} ${defaultVehicle.trim || ''}`);

        // Show loading spinner
        $('#recommendationsContainer').html('<div class="spinner-container"><div class="spinner"></div></div>');

        // Call API to get recommended tires
        $.ajax({
            url: `${API_BASE_URL}/products?categoryId=1&size=${defaultVehicle.tireSizesFront}`,
            method: 'GET',
            success: function(response) {
                if (response.code === 200) {
                    renderRecommendedTires(response.data.content || []);
                } else {
                    $('#recommendationsContainer').html(`
                        <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                            <p>Failed to load tire recommendations. Please try again later.</p>
                        </div>
                    `);
                }
            },
            error: function(xhr) {
                console.error('Error loading recommended tires:', xhr);
                $('#recommendationsContainer').html(`
                    <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                        <p>Failed to load tire recommendations. Please try again later.</p>
                    </div>
                `);
            }
        });
    }

    /**
     * Render recommended tires
     * @param {Array} tires Array of tire products
     */
    function renderRecommendedTires(tires) {
        const recommendationsContainer = $('#recommendationsContainer');

        // If no tires, show message
        if (!tires || tires.length === 0) {
            recommendationsContainer.html(`
                <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                    <p>No tire recommendations found for your vehicle.</p>
                </div>
            `);
            return;
        }

        // Clear container
        recommendationsContainer.empty();

        // Show only first 4 tires
        const displayTires = tires.slice(0, 4);

        // Add each tire to grid
        displayTires.forEach(tire => {
            const tireCard = createTireCard(tire);
            recommendationsContainer.append(tireCard);
        });
    }

    /**
     * Create tire card
     * @param {Object} tire Tire product data
     * @returns {jQuery} Tire card element
     */
    function createTireCard(tire) {
        const tireCard = $('<div>', { class: 'tyre-card' });

        // Generate stars based on rating
        const rating = tire.rating || 0;
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
        const productType = tire.type
            ? tire.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            : '';

        tireCard.html(`
            <div class="tyre-image">
                <img src="${tire.imageUrl || 'https://via.placeholder.com/300x300?text=Tire'}" alt="${tire.name}">
            </div>
            <div class="tyre-info">
                <h3 class="tyre-title">${tire.name}</h3>
                <div class="tyre-meta">
                    <span>${tire.size || ''}</span>
                    <span>${productType}</span>
                </div>
                <div class="tyre-rating">
                    ${starsHtml}
                    <span>(${tire.reviewCount || 0})</span>
                </div>
                <div class="tyre-price">$${(tire.price || 0).toFixed(2)}</div>
                <a href="product-detail.html?id=${tire.id}" class="btn">View Details</a>
            </div>
        `);

        return tireCard;
    }

    /**
     * Edit vehicle
     * @param {string} vehicleId Vehicle ID
     */
    function editVehicle(vehicleId) {
        // Clear previous errors
        clearErrors();

        // Show loading in modal title
        $('#vehicleModalTitle').text('Loading Vehicle...');

        // Show modal
        $('#vehicleModalOverlay').addClass('show');

        // Fetch vehicle details
        $.ajax({
            url: `${API_BASE_URL}/vehicles/${vehicleId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function(response) {
                if (response.code === 200) {
                    const vehicle = response.data;

                    // Update modal title
                    $('#vehicleModalTitle').text('Edit Vehicle');

                    // Store vehicle ID for update
                    $('#vehicleId').val(vehicle.id);

                    // Populate form with vehicle data
                    $('#vehicleMake').val(vehicle.make);
                    $('#vehicleModel').val(vehicle.model);
                    $('#vehicleYear').val(vehicle.year);
                    $('#vehicleTrim').val(vehicle.trim || '');
                    $('#vehicleTireSize').val(vehicle.tireSizesFront || '');
                    $('#vehicleTireSizeRear').val(vehicle.tireSizesRear || '');
                    $('#vehicleLicensePlate').val(vehicle.licensePlate || '');
                    $('#vehicleNickname').val(vehicle.vehicleType || '');
                    $('#vehicleDefault').prop('checked', vehicle.isPrimary || false);
                } else {
                    // Close modal
                    $('#vehicleModalOverlay').removeClass('show');

                    // Show error message
                    showAlert('error', response.message || 'Failed to load vehicle details');
                }
            },
            error: function(xhr) {
                console.error('Error loading vehicle details:', xhr);

                // Close modal
                $('#vehicleModalOverlay').removeClass('show');

                // Show error message
                let errorMsg = 'Failed to load vehicle details. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showAlert('error', errorMsg);
            }
        });
    }

    /**
     * Save vehicle (create or update)
     */
    function saveVehicle() {
        // Get form values
        const vehicleId = $('#vehicleId').val();
        const make = $('#vehicleMake').val().trim();
        const model = $('#vehicleModel').val().trim();
        const year = $('#vehicleYear').val().trim();
        const trim = $('#vehicleTrim').val().trim();
        const tireSizesFront = $('#vehicleTireSize').val().trim();
        const tireSizesRear = $('#vehicleTireSizeRear').val().trim() || tireSizesFront;
        const licensePlate = $('#vehicleLicensePlate').val().trim();
        const vehicleType = $('#vehicleNickname').val().trim();
        const isPrimary = $('#vehicleDefault').prop('checked');

        // Validate required fields
        let isValid = true;

        // Clear previous errors
        clearErrors();

        if (!make) {
            showError('vehicleMake', 'Make is required');
            isValid = false;
        }

        if (!model) {
            showError('vehicleModel', 'Model is required');
            isValid = false;
        }

        if (!year) {
            showError('vehicleYear', 'Year is required');
            isValid = false;
        } else if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
            showError('vehicleYear', `Please enter a valid year (1900-${new Date().getFullYear() + 1})`);
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        // Prepare vehicle data
        const vehicleData = {
            make,
            model,
            year: parseInt(year),
            trim: trim || null,
            tireSizesFront: tireSizesFront || null,
            tireSizesRear: tireSizesRear || null,
            licensePlate: licensePlate || null,
            vehicleType: vehicleType || null,
            isPrimary: isPrimary
        };

        // Disable save button
        const saveBtn = $('#vehicleModalSave');
        saveBtn.prop('disabled', true);
        saveBtn.text('Saving...');

        // Determine if creating or updating
        const isUpdating = vehicleId && vehicleId.trim() !== '';

        // API URL and method
        const url = isUpdating ? `${API_BASE_URL}/vehicles/${vehicleId}` : `${API_BASE_URL}/vehicles`;
        const method = isUpdating ? 'PUT' : 'POST';

        // Call API to save vehicle
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            data: JSON.stringify(vehicleData),
            success: function(response) {
                if (response.code === 200 || response.code === 201) {
                    // Show success message
                    showAlert('success', isUpdating ? 'Vehicle updated successfully!' : 'Vehicle added successfully!');

                    // Close modal
                    $('#vehicleModalOverlay').removeClass('show');

                    // Reload vehicles
                    loadVehicles();
                } else {
                    // Show error message
                    showAlert('error', response.message || 'Failed to save vehicle. Please try again.');
                }

                // Re-enable save button
                saveBtn.prop('disabled', false);
                saveBtn.text('Save Vehicle');
            },
            error: function(xhr) {
                console.error('Error saving vehicle:', xhr);

                // Show error message
                let errorMsg = 'Failed to save vehicle. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showAlert('error', errorMsg);

                // Re-enable save button
                saveBtn.prop('disabled', false);
                saveBtn.text('Save Vehicle');
            }
        });
    }

    /**
     * Open delete confirmation modal
     * @param {string} vehicleId Vehicle ID
     * @param {string} vehicleName Vehicle name
     */
    function openDeleteModal(vehicleId, vehicleName) {
        // Set vehicle name in modal
        $('#deleteVehicleName').text(vehicleName);

        // Store vehicle ID for deletion
        $('#deleteModalConfirm').data('id', vehicleId);

        // Show modal
        $('#deleteModalOverlay').addClass('show');
    }

    /**
     * Confirm and process vehicle deletion
     */
    function confirmDeleteVehicle() {
        const vehicleId = $('#deleteModalConfirm').data('id');

        if (!vehicleId) {
            return;
        }

        // Disable delete button
        const deleteBtn = $('#deleteModalConfirm');
        deleteBtn.prop('disabled', true);
        deleteBtn.text('Deleting...');

        // Call API to delete vehicle
        $.ajax({
            url: `${API_BASE_URL}/vehicles/${vehicleId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function(response) {
                if (response.code === 200) {
                    // Show success message
                    showAlert('success', 'Vehicle deleted successfully!');

                    // Close modal
                    $('#deleteModalOverlay').removeClass('show');

                    // Reload vehicles
                    loadVehicles();
                } else {
                    // Show error message
                    showAlert('error', response.message || 'Failed to delete vehicle. Please try again.');
                }

                // Re-enable delete button
                deleteBtn.prop('disabled', false);
                deleteBtn.text('Delete');
            },
            error: function(xhr) {
                console.error('Error deleting vehicle:', xhr);

                // Show error message
                let errorMsg = 'Failed to delete vehicle. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showAlert('error', errorMsg);

                // Re-enable delete button
                deleteBtn.prop('disabled', false);
                deleteBtn.text('Delete');
            }
        });
    }

    /**
     * Set default vehicle
     * @param {string} vehicleId Vehicle ID
     */
    function setDefaultVehicle(vehicleId) {
        // Call API to set default vehicle
        $.ajax({
            url: `${API_BASE_URL}/vehicles/${vehicleId}/default`,
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function(response) {
                if (response.code === 200) {
                    // Show success message
                    showAlert('success', 'Default vehicle updated successfully!');

                    // Reload vehicles
                    loadVehicles();
                } else {
                    // Show error message
                    showAlert('error', response.message || 'Failed to set default vehicle. Please try again.');
                }
            },
            error: function(xhr) {
                console.error('Error setting default vehicle:', xhr);

                // Show error message
                let errorMsg = 'Failed to set default vehicle. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showAlert('error', errorMsg);
            }
        });
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
     * @param {string} type Alert type ('success' or 'error')
     * @param {string} message Alert message
     */
    function showAlert(type, message) {
        const alertId = type === 'success' ? 'alertSuccess' : 'alertError';
        const alertElement = $(`#${alertId}`);

        if (alertElement.length) {
            alertElement.text(message);
            alertElement.addClass('show');

            // Scroll to top to show alert
            $('html, body').animate({ scrollTop: 0 }, 'smooth');

            // Auto-hide after 5 seconds
            setTimeout(() => {
                alertElement.removeClass('show');
            }, 5000);
        }
    }
});