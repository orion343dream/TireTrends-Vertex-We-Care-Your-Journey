// Global state
let user = null;
let orders = [];
let vehicles = [];
let serviceBookings = [];

// Pagination state
const pagination = {
    orders: {
        currentPage: 0,
        totalPages: 0
    },
    services: {
        currentPage: 0,
        totalPages: 0
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');

    if (!token) {
        // Redirect to login page
        window.location.href = 'authentication.html?redirect=' + encodeURIComponent('user-account.html');
        return;
    }

    // Load user data
    loadUserData();

    // Setup navigation
    setupNavigation();

    // Setup logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Setup profile form submission
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);

    // Setup password form submission
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordChange);

    // Setup vehicle modal
    setupVehicleModal();
});

/**
 * Load user data from API
 */
function loadUserData() {
    // Show loading spinners
    showLoadingSpinners();

    // Get user data
    ApiClient.getCurrentUser()
        .then(userData => {
            // Store user data
            user = userData;

            // Update UI with user data
            updateUserInfo(userData);

            // Load orders
            loadOrders();

            // Load vehicles
            loadVehicles();

            // Load service bookings
            loadServiceBookings();
        })
        .catch(error => {
            console.error('Error loading user data:', error);
            showAlert('error', 'Failed to load user data. Please try again later.');

            // Handle unauthorized error
            if (error.status === 401) {
                // Redirect to login page
                handleLogout();
            }
        });
}

/**
 * Update UI with user information
 * @param {Object} userData User data object
 */
function updateUserInfo(userData) {
    // Update avatar
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        // Get initials from name
        const initials = `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`;
        userAvatar.textContent = initials;
    }

    // Update name and email
    document.getElementById('userName').textContent = `${userData.firstName} ${userData.lastName}`;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('welcomeName').textContent = userData.firstName;

    // Update profile form
    document.getElementById('firstName').value = userData.firstName;
    document.getElementById('lastName').value = userData.lastName;
    document.getElementById('email').value = userData.email;
    document.getElementById('phone').value = userData.phone || '';
}

/**
 * Load user orders from API
 */
function loadOrders() {
    ApiClient.getUserOrders(pagination.orders.currentPage)
        .then(response => {
            // Store orders data
            orders = response.content;

            // Update pagination
            pagination.orders.totalPages = response.totalPages;

            // Update dashboard stats
            document.getElementById('totalOrdersValue').textContent = response.totalElements || '0';

            // Render orders
            renderRecentOrders();
            renderOrders();

            // Update pagination UI
            updatePagination('orders');
        })
        .catch(error => {
            console.error('Error loading orders:', error);

            // Render empty state
            renderEmptyState('recentOrdersList', 'No orders found.');
            renderEmptyState('ordersList', 'No orders found.');
        });
}

/**
 * Load user vehicles from API
 */
function loadVehicles() {
    ApiClient.getUserVehicles()
        .then(vehiclesData => {
            // Store vehicles data
            vehicles = vehiclesData;

            // Update dashboard stats
            document.getElementById('savedVehiclesValue').textContent = vehicles.length || '0';

            // Render vehicles
            renderRecentVehicles();
            renderVehicles();
        })
        .catch(error => {
            console.error('Error loading vehicles:', error);

            // Render empty state
            renderEmptyState('recentVehiclesList', 'No vehicles found.');
            renderEmptyState('vehiclesGrid', 'No vehicles found. Add your first vehicle to get started!');
        });
}

/**
 * Load service bookings from API
 */
function loadServiceBookings() {
    ApiClient.getUserServiceBookings()
        .then(bookingsData => {
            // Store service bookings data
            serviceBookings = bookingsData;

            // Count upcoming services (pending or confirmed)
            const upcomingServices = serviceBookings.filter(booking =>
                booking.status === 'PENDING' || booking.status === 'CONFIRMED');

            // Update dashboard stats
            document.getElementById('upcomingServicesValue').textContent = upcomingServices.length || '0';

            // Render service bookings
            renderServiceBookings();

            // Update pagination UI
            updatePagination('services');
        })
        .catch(error => {
            console.error('Error loading service bookings:', error);

            // Render empty state
            renderEmptyState('serviceBookingsList', 'No service bookings found.');
        });
}

/**
 * Setup navigation between account sections
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Get section to show
            const sectionId = this.getAttribute('data-section');

            // Update active nav link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');

            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show selected section
            document.getElementById(`${sectionId}Section`).classList.add('active');

            // Update URL hash
            window.location.hash = sectionId;
        });
    });

    // Check URL hash on load
    if (window.location.hash) {
        const sectionId = window.location.hash.slice(1);
        const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);

        if (navLink) {
            navLink.click();
        }
    }
}

/**
 * Render recent orders in dashboard
 */
function renderRecentOrders() {
    const recentOrdersList = document.getElementById('recentOrdersList');

    // Clear list
    recentOrdersList.innerHTML = '';

    // If no orders, show empty state
    if (!orders || orders.length === 0) {
        renderEmptyState('recentOrdersList', 'No orders found.');
        return;
    }

    // Get most recent 3 orders
    const recentOrders = orders.slice(0, 3);

    // Render each order
    recentOrders.forEach(order => {
        const listItem = document.createElement('li');
        listItem.className = 'list-item';

        // Format date
        const orderDate = new Date(order.createdAt);
        const formattedDate = orderDate.toLocaleDateString();

        // Get status class
        const statusClass = getStatusClass(order.status);

        listItem.innerHTML = `
                <div class="item-details">
                    <h4>${order.orderNumber}</h4>
                    <div class="item-meta">${formattedDate} | ${order.orderItems.length} items</div>
                </div>
                <div class="item-status ${statusClass}">${formatStatus(order.status)}</div>
            `;

        // Add click event to view order details
        listItem.addEventListener('click', function() {
            // Navigate to orders section
            document.querySelector('.nav-link[data-section="orders"]').click();

            // Highlight the selected order (to be implemented)
        });

        recentOrdersList.appendChild(listItem);
    });
}

/**
 * Render all orders in orders section
 */
function renderOrders() {
    const ordersList = document.getElementById('ordersList');

    // Clear list
    ordersList.innerHTML = '';

    // If no orders, show empty state
    if (!orders || orders.length === 0) {
        renderEmptyState('ordersList', 'No orders found.');
        return;
    }

    // Render each order
    orders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';

        // Format date
        const orderDate = new Date(order.createdAt);
        const formattedDate = orderDate.toLocaleDateString();

        // Get status class
        const statusClass = getStatusClass(order.status);

        orderItem.innerHTML = `
                <div class="order-header">
                    <div class="order-id">${order.orderNumber}</div>
                    <div class="order-date">${formattedDate}</div>
                    <div class="order-status ${statusClass}">${formatStatus(order.status)}</div>
                </div>
                <div class="order-details">
                    <div class="order-products" id="order-products-${order.id}">
                        ${renderOrderProducts(order.orderItems)}
                    </div>
                    <div class="order-total">Total: $${order.total.toFixed(2)}</div>
                </div>
                <div class="order-actions">
                    <a href="order-details.html?id=${order.id}" class="btn btn-sm">View Details</a>
                    ${order.status === 'PENDING' ? `<button class="btn btn-sm btn-outline cancel-order-btn" data-id="${order.id}">Cancel Order</button>` : ''}
                </div>
            `;

        // Add event listener for cancel button
        const cancelBtn = orderItem.querySelector('.cancel-order-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                const orderId = this.getAttribute('data-id');
                cancelOrder(orderId);
            });
        }

        ordersList.appendChild(orderItem);
    });
}

/**
 * Render order products
 * @param {Array} orderItems List of order items
 * @returns {string} HTML for order products
 */
function renderOrderProducts(orderItems) {
    if (!orderItems || orderItems.length === 0) {
        return '<p>No items in this order.</p>';
    }

    let html = '';

    // Show up to 2 items
    const displayItems = orderItems.slice(0, 2);

    displayItems.forEach(item => {
        html += `
                <div class="product-item">
                    <div class="product-image">
                        <img src="https://via.placeholder.com/60x60?text=Tyre" alt="${item.productName}">
                    </div>
                    <div class="product-details">
                        <div class="product-name">${item.productName}</div>
                        <div class="product-meta">
                            ${item.productSize ? item.productSize : ''}
                            ${item.productType ? `| ${item.productType}` : ''}
                            | Qty: ${item.quantity}
                        </div>
                    </div>
                </div>
            `;
    });

    // If there are more items, show a message
    if (orderItems.length > 2) {
        html += `<div class="more-items">+${orderItems.length - 2} more items</div>`;
    }

    return html;
}

/**
 * Render recent vehicles in dashboard
 */
function renderRecentVehicles() {
    const recentVehiclesList = document.getElementById('recentVehiclesList');

    // Clear list
    recentVehiclesList.innerHTML = '';

    // If no vehicles, show empty state
    if (!vehicles || vehicles.length === 0) {
        renderEmptyState('recentVehiclesList', 'No vehicles found.');
        return;
    }

    // Get most recent 3 vehicles
    const recentVehicles = vehicles.slice(0, 3);

    // Render each vehicle
    recentVehicles.forEach(vehicle => {
        const listItem = document.createElement('li');
        listItem.className = 'list-item';

        listItem.innerHTML = `
                <div class="item-details">
                    <h4>${vehicle.year} ${vehicle.make} ${vehicle.model}</h4>
                    <div class="item-meta">${vehicle.TyreSizesFront || 'No Tyre size specified'}</div>
                </div>
                ${vehicle.isPrimary ? '<div class="item-status status-completed">Default</div>' : ''}
            `;

        // Add click event to view vehicle details
        listItem.addEventListener('click', function() {
            // Navigate to vehicles section
            document.querySelector('.nav-link[data-section="vehicles"]').click();

            // Highlight the selected vehicle (to be implemented)
        });

        recentVehiclesList.appendChild(listItem);
    });
}

/**
 * Render all vehicles in vehicles section
 */
function renderVehicles() {
    const vehiclesGrid = document.getElementById('vehiclesGrid');

    // Clear grid
    vehiclesGrid.innerHTML = '';

    // Add "Add Vehicle" card
    const addVehicleCard = document.createElement('div');
    addVehicleCard.className = 'add-vehicle-btn';
    addVehicleCard.innerHTML = `
            <span class="add-icon">+</span>
            <span>Add New Vehicle</span>
        `;

    // Add click event to open modal
    addVehicleCard.addEventListener('click', function() {
        openVehicleModal();
    });

    vehiclesGrid.appendChild(addVehicleCard);

    // If no vehicles, return
    if (!vehicles || vehicles.length === 0) {
        return;
    }

    // Render each vehicle
    vehicles.forEach(vehicle => {
        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'vehicle-card';

        if (vehicle.isPrimary) {
            vehicleCard.classList.add('default');
        }

        vehicleCard.innerHTML = `
                <h3 class="vehicle-title">${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}</h3>
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
                        <div class="detail-label">Tyre Size:</div>
                        <div class="detail-value">${vehicle.TyreSizesFront || 'Not specified'}</div>
                    </div>
                </div>
                <div class="vehicle-actions">
                    <button class="btn btn-sm edit-vehicle-btn" data-id="${vehicle.id}">Edit</button>
                    ${!vehicle.isPrimary ? `<button class="btn btn-sm btn-outline set-default-btn" data-id="${vehicle.id}">Set as Default</button>` : ''}
                    <button class="btn btn-sm btn-outline delete-vehicle-btn" data-id="${vehicle.id}">Delete</button>
                </div>
            `;

        // Add event listeners for vehicle actions
        const editBtn = vehicleCard.querySelector('.edit-vehicle-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                const vehicleId = this.getAttribute('data-id');
                editVehicle(vehicleId);
            });
        }

        const setDefaultBtn = vehicleCard.querySelector('.set-default-btn');
        if (setDefaultBtn) {
            setDefaultBtn.addEventListener('click', function() {
                const vehicleId = this.getAttribute('data-id');
                setDefaultVehicle(vehicleId);
            });
        }

        const deleteBtn = vehicleCard.querySelector('.delete-vehicle-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                const vehicleId = this.getAttribute('data-id');
                deleteVehicle(vehicleId);
            });
        }

        vehiclesGrid.appendChild(vehicleCard);
    });
}

/**
 * Render service bookings
 */
function renderServiceBookings() {
    const serviceBookingsList = document.getElementById('serviceBookingsList');

    // Clear list
    serviceBookingsList.innerHTML = '';

    // If no service bookings, show empty state
    if (!serviceBookings || serviceBookings.length === 0) {
        renderEmptyState('serviceBookingsList', 'No service bookings found.');
        return;
    }

    // Render each service booking
    serviceBookings.forEach(booking => {
        const serviceItem = document.createElement('div');
        serviceItem.className = 'service-item';

        // Format date and time
        const serviceDate = new Date(booking.date + 'T' + booking.time);
        const formattedDate = serviceDate.toLocaleDateString();
        const formattedTime = serviceDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Get status class
        const statusClass = getStatusClass(booking.status);

        serviceItem.innerHTML = `
                <div class="service-header">
                    <div class="service-id">${booking.bookingNumber}</div>
                    <div class="service-date">${formattedDate} ${formattedTime}</div>
                    <div class="service-status ${statusClass}">${formatStatus(booking.status)}</div>
                </div>
                <div class="service-details">
                    <div class="service-vehicle">${booking.vehicleName || 'Unknown Vehicle'}</div>
                    <div class="service-type">Service: ${booking.serviceTypeName}</div>
                    <div class="service-time">Time: ${formattedDate} at ${formattedTime}</div>
                    <div class="service-price">Price: ${booking.formattedPrice || '$' + booking.price.toFixed(2)}</div>
                </div>
                <div class="service-actions">
                    <a href="service-details.html?id=${booking.id}" class="btn btn-sm">View Details</a>
                    ${booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? `<button class="btn btn-sm btn-outline cancel-service-btn" data-id="${booking.id}">Cancel Booking</button>` : ''}
                </div>
            `;

        // Add event listener for cancel button
        const cancelBtn = serviceItem.querySelector('.cancel-service-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                const bookingId = this.getAttribute('data-id');
                cancelServiceBooking(bookingId);
            });
        }

        serviceBookingsList.appendChild(serviceItem);
    });
}

/**
 * Render empty state message
 * @param {string} containerId ID of container element
 * @param {string} message Message to display
 */
function renderEmptyState(containerId, message) {
    const container = document.getElementById(containerId);

    if (container) {
        container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">${message}</div>
                </div>
            `;
    }
}

/**
 * Update pagination UI
 * @param {string} type Type of pagination ('orders' or 'services')
 */
function updatePagination(type) {
    const paginationContainer = document.getElementById(`${type}Pagination`);

    if (!paginationContainer) return;

    // Clear container
    paginationContainer.innerHTML = '';

    // Get pagination data
    const totalPages = pagination[type].totalPages;
    const currentPage = pagination[type].currentPage;

    // If no pages or only one page, hide pagination
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    // Show pagination
    paginationContainer.style.display = 'flex';

    // Previous button
    const prevBtn = document.createElement('a');
    prevBtn.href = '#';
    prevBtn.className = `pagination-btn ${currentPage === 0 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '&laquo;';

    if (currentPage > 0) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Update current page
            pagination[type].currentPage = currentPage - 1;

            // Reload data
            if (type === 'orders') {
                loadOrders();
            } else if (type === 'services') {
                loadServiceBookings();
            }
        });
    }

    paginationContainer.appendChild(prevBtn);

    // Page numbers
    const maxPages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPages - 1);

    // Adjust start page if necessary
    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(0, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('a');
        pageBtn.href = '#';
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i + 1;

        // Add click event
        if (i !== currentPage) {
            pageBtn.addEventListener('click', function(e) {
                e.preventDefault();

                // Update current page
                pagination[type].currentPage = i;

                // Reload data
                if (type === 'orders') {
                    loadOrders();
                } else if (type === 'services') {
                    loadServiceBookings();
                }
            });
        }

        paginationContainer.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('a');
    nextBtn.href = '#';
    nextBtn.className = `pagination-btn ${currentPage === totalPages - 1 ? 'disabled' : ''}`;
    nextBtn.innerHTML = '&raquo;';

    if (currentPage < totalPages - 1) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Update current page
            pagination[type].currentPage = currentPage + 1;

            // Reload data
            if (type === 'orders') {
                loadOrders();
            } else if (type === 'services') {
                loadServiceBookings();
            }
        });
    }

    paginationContainer.appendChild(nextBtn);
}

/**
 * Handle profile form submission
 * @param {Event} e Form submit event
 */
function handleProfileUpdate(e) {
    e.preventDefault();

    // Get form values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // Validate form
    let isValid = true;

    // Clear previous errors
    clearErrors();

    if (!firstName) {
        showError('firstName', 'First name is required');
        isValid = false;
    }

    if (!lastName) {
        showError('lastName', 'Last name is required');
        isValid = false;
    }

    if (!email) {
        showError('email', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }

    if (phone && !isValidPhone(phone)) {
        showError('phone', 'Please enter a valid phone number');
        isValid = false;
    }

    if (isValid) {
        // Disable submit button
        const updateProfileBtn = document.getElementById('updateProfileBtn');
        updateProfileBtn.disabled = true;

        // Prepare update data
        const updateData = {
            firstName,
            lastName,
            email,
            phone
        };

        // Call API to update profile
        ApiClient.updateUserProfile(updateData)
            .then(updatedUser => {
                // Update user data
                user = updatedUser;

                // Update UI
                updateUserInfo(updatedUser);

                // Show success message
                showAlert('success', 'Profile updated successfully!');

                // Enable submit button
                updateProfileBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error updating profile:', error);

                // Show error message
                showAlert('error', error.message || 'Failed to update profile. Please try again.');

                // Enable submit button
                updateProfileBtn.disabled = false;
            });
    }
}

/**
 * Handle password form submission
 * @param {Event} e Form submit event
 */
function handlePasswordChange(e) {
    e.preventDefault();

    // Get form values
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate form
    let isValid = true;

    // Clear previous errors
    clearErrors();

    if (!currentPassword) {
        showError('currentPassword', 'Current password is required');
        isValid = false;
    }

    if (!newPassword) {
        showError('newPassword', 'New password is required');
        isValid = false;
    } else if (newPassword.length < 8) {
        showError('newPassword', 'Password must be at least 8 characters long');
        isValid = false;
    }

    if (!confirmPassword) {
        showError('confirmPassword', 'Please confirm your new password');
        isValid = false;
    } else if (newPassword !== confirmPassword) {
        showError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }

    if (isValid) {
        // Disable submit button
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        changePasswordBtn.disabled = true;

        // Prepare password data
        const passwordData = {
            currentPassword,
            newPassword,
            confirmPassword
        };

        // Call API to change password
        ApiClient.changePassword(passwordData)
            .then(response => {
                // Show success message
                showAlert('success', 'Password changed successfully!');

                // Reset form
                document.getElementById('passwordForm').reset();

                // Enable submit button
                changePasswordBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error changing password:', error);

                // Show error message
                showAlert('error', error.message || 'Failed to change password. Please try again.');

                // Enable submit button
                changePasswordBtn.disabled = false;
            });
    }
}

/**
 * Setup vehicle modal functionality
 */
function setupVehicleModal() {
    const vehicleModalOverlay = document.getElementById('vehicleModalOverlay');
    const vehicleModalClose = document.getElementById('vehicleModalClose');
    const vehicleModalCancel = document.getElementById('vehicleModalCancel');
    const vehicleModalSave = document.getElementById('vehicleModalSave');

    // Add event listeners for closing the modal
    vehicleModalClose.addEventListener('click', closeVehicleModal);
    vehicleModalCancel.addEventListener('click', closeVehicleModal);

    // Add event listener for clicking outside the modal
    vehicleModalOverlay.addEventListener('click', function(e) {
        if (e.target === vehicleModalOverlay) {
            closeVehicleModal();
        }
    });

    // Add event listener for saving the vehicle
    vehicleModalSave.addEventListener('click', saveVehicle);
}

/**
 * Open vehicle modal
 * @param {Object} vehicle Vehicle data for editing (optional)
 */
function openVehicleModal(vehicle = null) {
    const vehicleModalOverlay = document.getElementById('vehicleModalOverlay');
    const vehicleModalTitle = document.getElementById('vehicleModalTitle');
    const vehicleForm = document.getElementById('vehicleForm');

    // Set modal title
    vehicleModalTitle.textContent = vehicle ? 'Edit Vehicle' : 'Add New Vehicle';

    // Reset form
    vehicleForm.reset();

    // If editing, populate form with vehicle data
    if (vehicle) {
        document.getElementById('vehicleMake').value = vehicle.make;
        document.getElementById('vehicleModel').value = vehicle.model;
        document.getElementById('vehicleYear').value = vehicle.year;
        document.getElementById('vehicleTrim').value = vehicle.trim || '';
        document.getElementById('vehicleTyreSize').value = vehicle.TyreSizesFront || '';
        document.getElementById('vehicleLicensePlate').value = vehicle.licensePlate || '';
        document.getElementById('vehicleNickname').value = vehicle.vehicleType || '';
        document.getElementById('vehicleDefault').checked = vehicle.isPrimary || false;

        // Store vehicle ID for updating
        vehicleForm.setAttribute('data-id', vehicle.id);
    } else {
        // Remove vehicle ID attribute
        vehicleForm.removeAttribute('data-id');
    }

    // Show modal
    vehicleModalOverlay.classList.add('show');
}

/**
 * Close vehicle modal
 */
function closeVehicleModal() {
    const vehicleModalOverlay = document.getElementById('vehicleModalOverlay');

    // Hide modal
    vehicleModalOverlay.classList.remove('show');
}

/**
 * Save vehicle (create or update)
 */
function saveVehicle() {
    // Get form values
    const vehicleForm = document.getElementById('vehicleForm');
    const make = document.getElementById('vehicleMake').value.trim();
    const model = document.getElementById('vehicleModel').value.trim();
    const year = document.getElementById('vehicleYear').value.trim();
    const trim = document.getElementById('vehicleTrim').value.trim();
    const TyreSize = document.getElementById('vehicleTyreSize').value.trim();
    const licensePlate = document.getElementById('vehicleLicensePlate').value.trim();
    const nickname = document.getElementById('vehicleNickname').value.trim();
    const isDefault = document.getElementById('vehicleDefault').checked;

    // Validate form
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
    } else if (isNaN(year) || year < 1900 || year > 2025) {
        showError('vehicleYear', 'Please enter a valid year');
        isValid = false;
    }

    if (isValid) {
        // Disable save button
        const saveButton = document.getElementById('vehicleModalSave');
        saveButton.disabled = true;

        // Prepare vehicle data
        const vehicleData = {
            make,
            model,
            year: parseInt(year),
            trim: trim || null,
            TyreSizesFront: TyreSize || null,
            licensePlate: licensePlate || null,
            vehicleType: nickname || null,
            isPrimary: isDefault
        };

        // Check if creating or updating
        const vehicleId = vehicleForm.getAttribute('data-id');

        if (vehicleId) {
            // Update existing vehicle
            vehicleData.id = parseInt(vehicleId);

            ApiClient.updateVehicle(vehicleId, vehicleData)
                .then(updatedVehicle => {
                    // Show success message
                    showAlert('success', 'Vehicle updated successfully!');

                    // Close modal
                    closeVehicleModal();

                    // Reload vehicles
                    loadVehicles();

                    // Enable save button
                    saveButton.disabled = false;
                })
                .catch(error => {
                    console.error('Error updating vehicle:', error);

                    // Show error message
                    showAlert('error', error.message || 'Failed to update vehicle. Please try again.');

                    // Enable save button
                    saveButton.disabled = false;
                });
        } else {
            // Create new vehicle
            ApiClient.addVehicle(vehicleData)
                .then(newVehicle => {
                    // Show success message
                    showAlert('success', 'Vehicle added successfully!');

                    // Close modal
                    closeVehicleModal();

                    // Reload vehicles
                    loadVehicles();

                    // Enable save button
                    saveButton.disabled = false;
                })
                .catch(error => {
                    console.error('Error adding vehicle:', error);

                    // Show error message
                    showAlert('error', error.message || 'Failed to add vehicle. Please try again.');

                    // Enable save button
                    saveButton.disabled = false;
                });
        }
    }
}

/**
 * Edit a vehicle
 * @param {string} vehicleId Vehicle ID
 */
function editVehicle(vehicleId) {
    // Find vehicle in array
    const vehicle = vehicles.find(v => v.id == vehicleId);

    if (vehicle) {
        // Open modal with vehicle data
        openVehicleModal(vehicle);
    }
}

/**
 * Set a vehicle as default
 * @param {string} vehicleId Vehicle ID
 */
function setDefaultVehicle(vehicleId) {
    // Call API to set default vehicle
    ApiClient.setDefaultVehicle(vehicleId)
        .then(response => {
            // Show success message
            showAlert('success', 'Default vehicle updated successfully!');

            // Reload vehicles
            loadVehicles();
        })
        .catch(error => {
            console.error('Error setting default vehicle:', error);

            // Show error message
            showAlert('error', error.message || 'Failed to set default vehicle. Please try again.');
        });
}

/**
 * Delete a vehicle
 * @param {string} vehicleId Vehicle ID
 */
function deleteVehicle(vehicleId) {
    // Confirm deletion
    if (confirm('Are you sure you want to delete this vehicle?')) {
        // Call API to delete vehicle
        ApiClient.deleteVehicle(vehicleId)
            .then(response => {
                // Show success message
                showAlert('success', 'Vehicle deleted successfully!');

                // Reload vehicles
                loadVehicles();
            })
            .catch(error => {
                console.error('Error deleting vehicle:', error);

                // Show error message
                showAlert('error', error.message || 'Failed to delete vehicle. Please try again.');
            });
    }
}

/**
 * Cancel an order
 * @param {string} orderId Order ID
 */
function cancelOrder(orderId) {
    // Confirm cancellation
    if (confirm('Are you sure you want to cancel this order?')) {
        // Call API to cancel order
        ApiClient.cancelOrder(orderId)
            .then(response => {
                // Show success message
                showAlert('success', 'Order cancelled successfully!');

                // Reload orders
                loadOrders();
            })
            .catch(error => {
                console.error('Error cancelling order:', error);

                // Show error message
                showAlert('error', error.message || 'Failed to cancel order. Please try again.');
            });
    }
}

/**
 * Cancel a service booking
 * @param {string} bookingId Booking ID
 */
function cancelServiceBooking(bookingId) {
    // Confirm cancellation
    if (confirm('Are you sure you want to cancel this service booking?')) {
        // Call API to cancel booking
        ApiClient.cancelServiceBooking(bookingId)
            .then(response => {
                // Show success message
                showAlert('success', 'Service booking cancelled successfully!');

                // Reload service bookings
                loadServiceBookings();
            })
            .catch(error => {
                console.error('Error cancelling service booking:', error);

                // Show error message
                showAlert('error', error.message || 'Failed to cancel service booking. Please try again.');
            });
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    // Call API to logout
    ApiClient.logout()
        .then(() => {
            // Clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');

            // Redirect to home page
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Error during logout:', error);

            // Clear local storage anyway
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');

            // Redirect to home page
            window.location.href = 'index.html';
        });
}

/**
 * Show loading spinners in all sections
 */
function showLoadingSpinners() {
    // Dashboard spinners
    document.getElementById('recentOrdersList').innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    document.getElementById('recentVehiclesList').innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

    // Orders spinner
    document.getElementById('ordersList').innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

    // Vehicles spinner
    document.getElementById('vehiclesGrid').innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

    // Service bookings spinner
    document.getElementById('serviceBookingsList').innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
}

/**
 * Show alert message
 * @param {string} type Alert type ('success' or 'error')
 * @param {string} message Alert message
 */
function showAlert(type, message) {
    const alertId = `alert${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const alertElement = document.getElementById(alertId);

    if (alertElement) {
        alertElement.textContent = message;
        alertElement.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertElement.classList.remove('show');
        }, 5000);
    }
}

/**
 * Show error message for a specific field
 * @param {string} fieldId Field ID
 * @param {string} message Error message
 */
function showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    const field = document.getElementById(fieldId);

    if (errorElement && field) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');
        field.classList.add('error');
    }
}

/**
 * Clear all error messages
 */
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const errorFields = document.querySelectorAll('.form-control.error');

    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.remove('visible');
    });

    errorFields.forEach(field => {
        field.classList.remove('error');
    });
}

/**
 * Format order/service status
 * @param {string} status Status string
 * @returns {string} Formatted status string
 */
function formatStatus(status) {
    if (!status) return 'Unknown';

    // Convert PENDING to Pending, etc.
    return status.charAt(0) + status.slice(1).toLowerCase();
}

/**
 * Get status class for styling
 * @param {string} status Status string
 * @returns {string} Status class name
 */
function getStatusClass(status) {
    if (!status) return '';

    switch (status.toUpperCase()) {
        case 'PENDING':
        case 'CONFIRMED':
            return 'status-pending';
        case 'PROCESSING':
        case 'IN_PROGRESS':
            return 'status-processing';
        case 'COMPLETED':
        case 'DELIVERED':
            return 'status-completed';
        case 'CANCELLED':
            return 'status-cancelled';
        default:
            return '';
    }
}

/**
 * Validate email format
 * @param {string} email Email address
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Validate phone number format
 * @param {string} phone Phone number
 * @returns {boolean} Whether phone is valid
 */
function isValidPhone(phone) {
    // Basic validation - can be improved
    const re = /^[\d\s\-\(\)]+$/;
    return re.test(String(phone));
}