// admin-users.js - User Management for Admin Panel

// Base API URL
const API_BASE_URL = "http://localhost:8080/api/v1";

// Global state
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let users = [];
let currentUser = null;
let filterParams = {
    status: '',
    role: '',
    search: ''
};

// DOM Ready
$(document).ready(function() {
    // Initialize UI components
    initUI();

    // Setup event listeners
    setupEventListeners();

    // Verify authentication and load data
    checkAuthAndLoadData();
});

/**
 * Initialize UI components
 */
function initUI() {
    // Initialize user dropdown
    $("#userDropdownBtn").on("click", function(e) {
        e.preventDefault();
        $("#userDropdownMenu").toggleClass("show");
    });

    // Close dropdown when clicking outside
    $(document).on("click", function(e) {
        if (!$("#userDropdownBtn").is(e.target) && !$("#userDropdownMenu").is(e.target) &&
            $("#userDropdownMenu").has(e.target).length === 0) {
            $("#userDropdownMenu").removeClass("show");
        }
    });

    // Logout button
    $("#logoutBtn").on("click", function(e) {
        e.preventDefault();
        logout();
    });

    // Set user info in header
    setUserInfo();
}

/**
 * Set user info in header based on token
 */
function setUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Extract user info from token if available
    try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (tokenData.sub) {
            // Get user profile
            $.ajax({
                url: `${API_BASE_URL}/user/profile`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                success: function(response) {
                    if (response.code === 200 && response.data) {
                        const user = response.data;
                        $("#adminName").text(`${user.firstName} ${user.lastName}`);
                        $("#userAvatar").text(getInitials(user.firstName, user.lastName));
                    }
                },
                error: function() {
                    // If error, just use email from token
                    $("#adminName").text(tokenData.sub);
                    $("#userAvatar").text(getInitials(tokenData.sub, ""));
                }
            });
        }
    } catch (error) {
        console.error("Error parsing token:", error);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Status filter
    $("#statusFilter").on("change", function() {
        filterParams.status = $(this).val();
        currentPage = 0;
        loadUsers();
    });

    // Role filter
    $("#roleFilter").on("change", function() {
        filterParams.role = $(this).val();
        currentPage = 0;
        loadUsers();
    });

    // Search form
    $("#searchForm").on("submit", function(e) {
        e.preventDefault();
        filterParams.search = $("#searchInput").val().trim();
        currentPage = 0;
        loadUsers();
    });

    // Add user button
    $("#addUserBtn").on("click", function() {
        resetUserForm('add');
        $("#editUserModal").addClass("show");
    });

    // Close modals
    $(".modal-close, .btn-outline").on("click", function() {
        closeAllModals();
    });

    // Save user button
    $("#saveUserBtn").on("click", function() {
        const mode = $("#userForm").attr("data-mode");
        if (validateUserForm()) {
            if (mode === "add") {
                addUser();
            } else {
                updateUser();
            }
        }
    });

    // Close user detail buttons
    $("#closeUserDetailModal, #closeUserDetailBtn").on("click", function() {
        $("#userDetailModal").removeClass("show");
    });

    // Edit user from detail view
    $("#editUserDetailBtn").on("click", function() {
        if (currentUser) {
            $("#userDetailModal").removeClass("show");
            resetUserForm('edit');
            populateUserForm(currentUser);
            $("#editUserModal").addClass("show");
        }
    });
}

/**
 * Check authentication and load data
 */
function checkAuthAndLoadData() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = "authentication.html?redirect=admin-users.html";
        return;
    }

    // Verify token with a test API call
    $.ajax({
        url: `${API_BASE_URL}/admin/getAll`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function() {
            // Admin access confirmed, load data
            loadUsers();
        },
        error: function(xhr) {
            if (xhr.status === 401 || xhr.status === 403) {
                // Invalid token or not an admin, redirect to login
                showAlert("alertDanger", "Admin access required. Please log in again.");
                setTimeout(function() {
                    localStorage.removeItem('token');
                    window.location.href = "authentication.html?redirect=admin-users.html";
                }, 2000);
            } else {
                // Other error, still try to load data
                showAlert("alertWarning", "Warning: Could not verify admin privileges. Some functionality may be limited.");
                loadUsers();
            }
        }
    });
}

/**
 * Load users based on current filters and pagination
 */
function loadUsers() {
    showSpinner();

    const token = localStorage.getItem('token');
    if (!token) {
        hideSpinner();
        window.location.href = "authentication.html?redirect=admin-users.html";
        return;
    }

    // Build query URL
    let url = `${API_BASE_URL}/admin/users?page=${currentPage}&size=${pageSize}`;

    if (filterParams.status) {
        url += `&status=${filterParams.status}`;
    }

    if (filterParams.role) {
        url += `&role=${filterParams.role}`;
    }

    if (filterParams.search) {
        url += `&search=${encodeURIComponent(filterParams.search)}`;
    }

    // Since the backend APIs might not align exactly with our frontend needs,
    // we'll adapt this to work with the existing endpoints

    // For this implementation, we'll use getAllUsers or getAllAdmins based on role filter
    let apiEndpoint = `${API_BASE_URL}/admin/getAll`;

    $.ajax({
        url: apiEndpoint,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            hideSpinner();

            if (response.code === 200 && response.data) {
                // Mock pagination for now since the API doesn't support it
                let filteredUsers = filterUsers(response.data);

                // Calculate pagination
                totalPages = Math.ceil(filteredUsers.length / pageSize);
                const startIndex = currentPage * pageSize;
                const endIndex = Math.min(startIndex + pageSize, filteredUsers.length);

                // Slice for current page
                users = filteredUsers.slice(startIndex, endIndex);

                // Render users
                renderUsersTable(users, filteredUsers.length);
                renderPagination();
            } else {
                showAlert("alertDanger", "Failed to load users data.");
                $("#userTableContainer").html(`
                    <div class="alert alert-danger show">
                        Failed to load users data. Please try again later.
                    </div>
                `);
            }
        },
        error: function(xhr) {
            hideSpinner();

            if (xhr.status === 401 || xhr.status === 403) {
                showAlert("alertDanger", "Session expired. Please log in again.");
                setTimeout(function() {
                    localStorage.removeItem('token');
                    window.location.href = "authentication.html?redirect=admin-users.html";
                }, 2000);
            } else {
                showAlert("alertDanger", "Error loading users data. Please try again later.");
                $("#userTableContainer").html(`
                    <div class="alert alert-danger show">
                        Error: ${xhr.status} ${xhr.statusText}
                    </div>
                `);
            }
        }
    });
}

/**
 * Filter users based on current filter parameters
 * @param {Array} allUsers All users from API
 * @returns {Array} Filtered users
 */
function filterUsers(allUsers) {
    return allUsers.filter(user => {
        // Filter by status
        if (filterParams.status) {
            const userStatus = user.enabled ? "true" : "false";
            if (userStatus !== filterParams.status) {
                return false;
            }
        }

        // Filter by role
        if (filterParams.role && user.role !== filterParams.role) {
            return false;
        }

        // Filter by search term
        if (filterParams.search) {
            const searchTerm = filterParams.search.toLowerCase();
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
            const email = (user.email || '').toLowerCase();
            const phone = (user.phoneNumber || '').toLowerCase();

            return fullName.includes(searchTerm) ||
                email.includes(searchTerm) ||
                phone.includes(searchTerm);
        }

        return true;
    });
}

/**
 * Render users table
 * @param {Array} users Users to display
 * @param {number} totalCount Total count of filtered users
 */
function renderUsersTable(users, totalCount) {
    const container = $("#userTableContainer");

    if (!users || users.length === 0) {
        container.html(`
            <div class="alert alert-warning show">
                No users found. Try adjusting your filters or add a new user.
            </div>
        `);
        return;
    }

    // Create table HTML
    let tableHtml = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Add rows for each user
    users.forEach(user => {
        // Determine role badge
        const roleBadge = user.role === 'ADMIN' ? 'Admin' : 'User';

        // Determine status
        const userEnabled = user.enabled !== false; // Default to true if not specified
        const statusClass = userEnabled ? 'status-active' : 'status-inactive';
        const statusText = userEnabled ? 'Active' : 'Inactive';

        tableHtml += `
            <tr>
                <td data-label="ID">${user.userId || 'N/A'}</td>
                <td data-label="Name">${user.firstName || ''} ${user.lastName || ''}</td>
                <td data-label="Email">${user.email || 'N/A'}</td>
                <td data-label="Phone">${user.phoneNumber || 'N/A'}</td>
                <td data-label="Role">${roleBadge}</td>
                <td data-label="Status"><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td data-label="Actions">
                    <div class="table-actions">
                        <button class="btn btn-sm btn-info view-user-btn" data-id="${user.email}">View</button>
                        <button class="btn btn-sm btn-primary edit-user-btn" data-id="${user.email}">Edit</button>
                        ${userEnabled
            ? `<button class="btn btn-sm btn-warning disable-user-btn" data-id="${user.email}">Disable</button>`
            : `<button class="btn btn-sm btn-success enable-user-btn" data-id="${user.email}">Enable</button>`
        }
                    </div>
                </td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    // Update count text
    $("#bookingsCount").text(`Showing ${users.length} of ${totalCount} users`);

    // Set table HTML
    container.html(tableHtml);

    // Add event listeners to action buttons
    setupActionButtons();
}

/**
 * Setup action buttons in the users table
 */
function setupActionButtons() {
    // View user
    $(".view-user-btn").on("click", function() {
        const userEmail = $(this).data("id");
        viewUser(userEmail);
    });

    // Edit user
    $(".edit-user-btn").on("click", function() {
        const userEmail = $(this).data("id");
        editUser(userEmail);
    });

    // Disable user
    $(".disable-user-btn").on("click", function() {
        const userEmail = $(this).data("id");
        disableUser(userEmail);
    });

    // Enable user
    $(".enable-user-btn").on("click", function() {
        const userEmail = $(this).data("id");
        enableUser(userEmail);
    });
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const pagination = $("#userPagination");
    pagination.empty();

    // If only one page, don't show pagination
    if (totalPages <= 1) {
        return;
    }

    // Previous button
    const prevBtn = $('<a>', {
        href: '#',
        class: `page-link ${currentPage === 0 ? 'disabled' : ''}`,
        html: '&laquo;'
    });

    if (currentPage > 0) {
        prevBtn.on('click', function(e) {
            e.preventDefault();
            currentPage--;
            loadUsers();
        });
    }

    pagination.append(prevBtn);

    // Page numbers
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(0, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = $('<a>', {
            href: '#',
            class: `page-link ${i === currentPage ? 'active' : ''}`,
            text: i + 1
        });

        if (i !== currentPage) {
            pageBtn.on('click', function(e) {
                e.preventDefault();
                currentPage = i;
                loadUsers();
            });
        }

        pagination.append(pageBtn);
    }

    // Next button
    const nextBtn = $('<a>', {
        href: '#',
        class: `page-link ${currentPage === totalPages - 1 ? 'disabled' : ''}`,
        html: '&raquo;'
    });

    if (currentPage < totalPages - 1) {
        nextBtn.on('click', function(e) {
            e.preventDefault();
            currentPage++;
            loadUsers();
        });
    }

    pagination.append(nextBtn);
}

/**
 * View user details
 * @param {string} userEmail User email
 */
function viewUser(userEmail) {
    showSpinner();

    const token = localStorage.getItem('token');
    if (!token) {
        hideSpinner();
        window.location.href = "authentication.html?redirect=admin-users.html";
        return;
    }

    // First check if it's an admin
    $.ajax({
        url: `${API_BASE_URL}/admin/getAll`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            if (response.code === 200 && response.data) {
                // Find the user in the admin list
                const user = response.data.find(admin => admin.email === userEmail);

                if (user) {
                    hideSpinner();
                    currentUser = user;
                    showUserDetails(user);
                    return;
                }
            }

            // If not found in admin list, check regular users
            // Assuming there's an endpoint to get a specific user by email
            $.ajax({
                url: `${API_BASE_URL}/user/profile`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                data: { email: userEmail },
                success: function(response) {
                    hideSpinner();
                    if (response.code === 200 && response.data) {
                        currentUser = response.data;
                        showUserDetails(response.data);
                    } else {
                        showAlert("alertDanger", "User not found.");
                    }
                },
                error: function(xhr) {
                    hideSpinner();
                    handleApiError(xhr);
                }
            });
        },
        error: function(xhr) {
            hideSpinner();
            handleApiError(xhr);
        }
    });
}

/**
 * Show user details in modal
 * @param {Object} user User data
 */
function showUserDetails(user) {
    // Determine role
    const roleBadge = user.role === 'ADMIN' ? 'Admin' : 'User';

    // Determine status
    const userEnabled = user.enabled !== false;
    const statusClass = userEnabled ? 'status-active' : 'status-inactive';
    const statusText = userEnabled ? 'Active' : 'Inactive';

    // Format created date
    const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

    // Build HTML for modal
    const detailsHtml = `
        <div class="user-details">
            <div>
                <div class="detail-group">
                    <div class="detail-label">ID</div>
                    <div class="detail-value">${user.userId || 'N/A'}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Name</div>
                    <div class="detail-value">${user.firstName || ''} ${user.lastName || ''}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${user.email || 'N/A'}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${user.phoneNumber || 'Not provided'}</div>
                </div>
            </div>
            <div>
                <div class="detail-group">
                    <div class="detail-label">Role</div>
                    <div class="detail-value">${roleBadge}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Created At</div>
                    <div class="detail-value">${createdDate}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Address</div>
                    <div class="detail-value">${user.address || 'Not provided'}</div>
                </div>
            </div>
        </div>

        <div class="user-stats">
            <h4>User Statistics</h4>
            <div class="stats-grid" id="userStatsGrid">
                <div class="spinner-container">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>
    `;

    // Set HTML and show modal
    $("#userDetailContent").html(detailsHtml);
    $("#userDetailModal").addClass("show");

    // Load user stats
    loadUserStats(user.email);
}

/**
 * Load user statistics
 * @param {string} userEmail User email
 */
function loadUserStats(userEmail) {
    // For demonstration, we'll show mock stats
    // In a real application, you would fetch these from appropriate endpoints

    const statsHtml = `
        <div class="stat-card">
            <div class="stat-value">12</div>
            <div class="stat-label">Total Orders</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">$1,245.00</div>
            <div class="stat-label">Total Spent</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">3</div>
            <div class="stat-label">Saved Vehicles</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">5</div>
            <div class="stat-label">Service Bookings</div>
        </div>
    `;

    $("#userStatsGrid").html(statsHtml);
}

/**
 * Edit user
 * @param {string} userEmail User email
 */
function editUser(userEmail) {
    // Find the user in our already loaded data
    const user = users.find(u => u.email === userEmail);

    if (user) {
        resetUserForm('edit');
        populateUserForm(user);
        $("#editUserModal").addClass("show");
    } else {
        // If not in current page, fetch the user
        viewUser(userEmail);

        // Set a timeout to allow the user to be loaded
        setTimeout(function() {
            if (currentUser) {
                $("#userDetailModal").removeClass("show");
                resetUserForm('edit');
                populateUserForm(currentUser);
                $("#editUserModal").addClass("show");
            } else {
                showAlert("alertDanger", "Could not load user for editing.");
            }
        }, 1000);
    }
}

/**
 * Reset user form for add or edit
 * @param {string} mode Form mode ('add' or 'edit')
 */
function resetUserForm(mode) {
    // Clear form
    $("#userForm")[0].reset();

    // Set form mode
    $("#userForm").attr("data-mode", mode);

    // Set modal title
    $("#editUserTitle").text(mode === 'add' ? 'Add New User' : 'Edit User');

    // Show/hide password field based on mode
    if (mode === 'add') {
        $("#passwordSection").show();
    } else {
        $("#passwordSection").hide();
    }

    // Clear any previous errors
    $(".error-feedback").removeClass("show").text("");
    $(".form-control").removeClass("is-invalid");
}

/**
 * Populate user form with user data
 * @param {Object} user User data
 */
function populateUserForm(user) {
    $("#firstName").val(user.firstName || '');
    $("#lastName").val(user.lastName || '');
    $("#email").val(user.email || '');
    $("#phone").val(user.phoneNumber || '');
    $("#userRole").val(user.role === 'ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER');
    $("#userEnabled").prop("checked", user.enabled !== false);

    // Set user ID for updates
    $("#userForm").attr("data-id", user.email);
}

/**
 * Validate user form
 * @returns {boolean} Whether form is valid
 */
function validateUserForm() {
    let isValid = true;

    // Clear previous errors
    $(".error-feedback").removeClass("show").text("");
    $(".form-control").removeClass("is-invalid");

    // Required fields
    const firstName = $("#firstName").val().trim();
    const lastName = $("#lastName").val().trim();
    const email = $("#email").val().trim();
    const password = $("#password").val().trim();
    const phone = $("#phone").val().trim();

    // Validate first name
    if (!firstName) {
        showFormError("firstName", "First name is required");
        isValid = false;
    }

    // Validate last name
    if (!lastName) {
        showFormError("lastName", "Last name is required");
        isValid = false;
    }

    // Validate email
    if (!email) {
        showFormError("email", "Email is required");
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFormError("email", "Please enter a valid email address");
        isValid = false;
    }

    // Validate password for new users
    if ($("#userForm").attr("data-mode") === "add" && !password) {
        showFormError("password", "Password is required for new users");
        isValid = false;
    }

    // Validate phone if provided
    if (phone && !isValidPhone(phone)) {
        showFormError("phone", "Please enter a valid phone number");
        isValid = false;
    }

    return isValid;
}

/**
 * Show form error
 * @param {string} fieldId Field ID
 * @param {string} message Error message
 */
function showFormError(fieldId, message) {
    $(`#${fieldId}Error`).addClass("show").text(message);
    $(`#${fieldId}`).addClass("is-invalid");
}

/**
 * Add new user
 */
function addUser() {
    showSpinner();

    const token = localStorage.getItem('token');
    if (!token) {
        hideSpinner();
        window.location.href = "authentication.html?redirect=admin-users.html";
        return;
    }

    // Get form data
    const userData = {
        firstName: $("#firstName").val().trim(),
        lastName: $("#lastName").val().trim(),
        email: $("#email").val().trim(),
        password: $("#password").val().trim(),
        phoneNumber: $("#phone").val().trim(),
        role: $("#userRole").val() === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER',
        enabled: $("#userEnabled").is(":checked")
    };

    // API endpoint based on role
    const endpoint = userData.role === 'ADMIN'
        ? `${API_BASE_URL}/admin/saveAdmin`
        : `${API_BASE_URL}/user/register`;

    $.ajax({
        url: endpoint,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(userData),
        success: function(response) {
            hideSpinner();

            if (response.code === 201 || response.code === 200) {
                showAlert("alertSuccess", "User created successfully");
                closeAllModals();
                loadUsers();
            } else {
                showAlert("alertDanger", response.message || "Failed to create user");
            }
        },
        error: function(xhr) {
            hideSpinner();
            handleApiError(xhr, "Failed to create user");
        }
    });
}

/**
 * Update existing user
 */
function updateUser() {
    showSpinner();

    const token = localStorage.getItem('token');
    if (!token) {
        hideSpinner();
        window.location.href = "authentication.html?redirect=admin-users.html";
        return;
    }

    const userEmail = $("#userForm").attr("data-id");

    // Get form data
    const userData = {
        firstName: $("#firstName").val().trim(),
        lastName: $("#lastName").val().trim(),
        email: $("#email").val().trim(),
        phoneNumber: $("#phone").val().trim(),
        role: $("#userRole").val() === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER',
        enabled: $("#userEnabled").is(":checked")
    };

    // Add password if provided
    const password = $("#password").val().trim();
    if (password) {
        userData.password = password;
    }

    // API endpoint based on role
    const endpoint = userData.role === 'ADMIN'
        ? `${API_BASE_URL}/admin/updateAdminProfile`
        : `${API_BASE_URL}/user/updateUserProfile`;

    $.ajax({
        url: endpoint,
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(userData),
        success: function(response) {
            hideSpinner();

            if (response.code === 200) {
                showAlert("alertSuccess", "User updated successfully");
                closeAllModals();
                loadUsers();
            } else {
                showAlert("alertDanger", response.message || "Failed to update user");
            }
        },
        error: function(xhr) {
            hideSpinner();
            handleApiError(xhr, "Failed to update user");
        }
    });
}

/**
 * Disable user
 * @param {string} userEmail User email
 */
function disableUser(userEmail) {
    if (!confirm("Are you sure you want to disable this user?")) {
        return;
    }

    showSpinner();

    const token = localStorage.getItem('token');
    if (!token) {
        hideSpinner();
        window.location.href = "authentication.html?redirect=admin-users.html";
        return;
    }

    // Since there's no specific endpoint for enabling/disabling,
    // we'll update the user with enabled=false

    // First get the user details
    $.ajax({
        url: `${API_BASE_URL}/user/profile`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        data: { email: userEmail },
        success: function(response) {
            if (response.code === 200 && response.data) {
                const user = response.data;
                user.enabled = false;

                // Update the user
                $.ajax({
                    url: `${API_BASE_URL}/admin/updateUserProfile`,
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(user),
                    success: function(updateResponse) {
                        hideSpinner();

                        if (updateResponse.code === 200) {
                            showAlert("alertSuccess", "User disabled successfully");
                            loadUsers();
                        } else {
                            showAlert("alertDanger", updateResponse.message || "Failed to disable user");
                        }
                    },
                    error: function(xhr) {
                        hideSpinner();
                        handleApiError(xhr, "Failed to disable user");
                    }
                });
            } else {
                hideSpinner();
                showAlert("alertDanger", "User not found");
            }
        },
        error: function(xhr) {
            hideSpinner();
            handleApiError(xhr);
        }
    });
}

/**
 * Enable user
 * @param {string} userEmail User email
 */
function enableUser(userEmail) {
    showSpinner();

    const token = localStorage.getItem('token');
    if (!token) {
        hideSpinner();
        window.location.href = "authentication.html?redirect=admin-users.html";
        return;
    }

    // Since there's no specific endpoint for enabling/disabling,
    // we'll update the user with enabled=true

    // First get the user details
    $.ajax({
        url: `${API_BASE_URL}/user/profile`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        data: { email: userEmail },
        success: function(response) {
            if (response.code === 200 && response.data) {
                const user = response.data;
                user.enabled = true;

                // Update the user
                $.ajax({
                    url: `${API_BASE_URL}/admin/updateUserProfile`,
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(user),
                    success: function(updateResponse) {
                        hideSpinner();

                        if (updateResponse.code === 200) {
                            showAlert("alertSuccess", "User enabled successfully");
                            loadUsers();
                        } else {
                            showAlert("alertDanger", updateResponse.message || "Failed to enable user");
                        }
                    },
                    error: function(xhr) {
                        hideSpinner();
                        handleApiError(xhr, "Failed to enable user");
                    }
                });
            } else {
                hideSpinner();
                showAlert("alertDanger", "User not found");
            }
        },
        error: function(xhr) {
            hideSpinner();
            handleApiError(xhr);
        }
    });
}

/**
 * Logout user
 */
function logout() {
    const token = localStorage.getItem('token');

    if (token) {
        // Call logout API
        $.ajax({
            url: `${API_BASE_URL}/auth/logout`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            complete: function() {
                // Clear local storage
                localStorage.removeItem('token');

                // Redirect to login
                window.location.href = "authentication.html";
            }
        });
    } else {
        // No token, just redirect
        window.location.href = "authentication.html";
    }
}

/**
 * Close all modals
 */
function closeAllModals() {
    $(".modal-backdrop").removeClass("show");
}

/**
 * Show spinner
 */
function showSpinner() {
    $(".spinner-container").show();
}

/**
 * Hide spinner
 */
function hideSpinner() {
    $(".spinner-container").hide();
}

/**
 * Show alert message
 * @param {string} alertId Alert element ID
 * @param {string} message Message to display
 */
function showAlert(alertId, message) {
    const alert = $(`#${alertId}`);
    alert.text(message).addClass("show");

    // Auto-hide after 5 seconds
    setTimeout(function() {
        alert.removeClass("show");
    }, 5000);
}

/**
 * Handle API errors
 * @param {Object} xhr XHR object
 * @param {string} defaultMessage Default error message
 */
function handleApiError(xhr, defaultMessage = "An error occurred") {
    if (xhr.status === 401 || xhr.status === 403) {
        showAlert("alertDanger", "Session expired. Please log in again.");
        setTimeout(function() {
            localStorage.removeItem('token');
            window.location.href = "authentication.html?redirect=admin-users.html";
        }, 2000);
    } else {
        let errorMessage = defaultMessage;
        if (xhr.responseJSON && xhr.responseJSON.message) {
            errorMessage = xhr.responseJSON.message;
        }
        showAlert("alertDanger", errorMessage);
    }
}

/**
 * Validate email format
 * @param {string} email Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Validate phone number format
 * @param {string} phone Phone number to validate
 * @returns {boolean} Whether phone number is valid
 */
function isValidPhone(phone) {
    // Basic validation - can be enhanced based on requirements
    return /^[\d\s\-\(\)]+$/.test(phone);
}

/**
 * Get initials from name
 * @param {string} firstName First name
 * @param {string} lastName Last name
 * @returns {string} Initials
 */
function getInitials(firstName, lastName) {
    let initials = '';

    if (firstName) {
        initials += firstName.charAt(0).toUpperCase();
    }

    if (lastName) {
        initials += lastName.charAt(0).toUpperCase();
    }

    return initials || '?';
}