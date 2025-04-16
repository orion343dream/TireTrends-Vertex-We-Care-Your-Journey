/**
 * header.js - JavaScript functionality for the TyreTrends header component
 * Handles authentication, user dropdown, cart count, and mobile navigation
 */

// Configure API base URL - ensure this matches your backend
const API_BASE_URL = "http://localhost:8080/api/v1";

// Run when document is ready
$(document).ready(function() {
    // Initialize header functionality
    initHeader();

    // Add event listeners
    setupEventListeners();
});

/**
 * Initialize the header component
 */
function initHeader() {
    // Check authentication status and update UI
    checkAuthStatus();

    // Update cart count
    updateCartCount();
}

/**
 * Setup all event listeners for header
 */
function setupEventListeners() {
    // User dropdown toggle
    $(document).on('click', '.user-account', function(e) {
        e.stopPropagation();
        $('#userDropdown').toggleClass('show');
        $('#backdrop').toggleClass('show');
    });

    // Close dropdown when clicking elsewhere
    $(document).on('click', function() {
        $('#userDropdown').removeClass('show');
        $('#backdrop').removeClass('show');
        $('.mobile-nav').removeClass('active');
    });

    // Prevent dropdown from closing when clicking inside it
    $('#userDropdown').on('click', function(e) {
        e.stopPropagation();
    });

    // Logout button click
    $(document).on('click', '#logoutBtn, #mobileLogoutBtn', function() {
        logout();
    });

    // Mobile menu toggle
    $('#mobileMenuBtn').on('click', function(e) {
        e.stopPropagation();
        $('.mobile-nav').addClass('active');
        $('#backdrop').addClass('show');
    });

    // Mobile menu close button
    $('#mobileNavClose').on('click', function() {
        $('.mobile-nav').removeClass('active');
        $('#backdrop').removeClass('show');
    });

    // Mobile dropdown toggles
    $('.mobile-dropdown-toggle').on('click', function() {
        $(this).parent().toggleClass('active');
    });

    // Prevent mobile nav from closing when clicking inside
    $('.mobile-nav').on('click', function(e) {
        e.stopPropagation();
    });
}

/**
 * Check if user is authenticated and update UI accordingly
 */
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    if (token && userEmail) {
        // User is logged in, fetch user details and update UI
        fetchUserProfile(token, userEmail);
    } else {
        // User is not logged in, show login/register buttons
        showAuthButtons();
    }
}

/**
 * Fetch user profile to display name and email
 * @param {string} token - Authentication token
 * @param {string} email - User email
 */
function fetchUserProfile(token, email) {
    $.ajax({
        url: `${API_BASE_URL}/user/profile`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            if (response.code === 200 && response.data) {
                // Update UI with user data
                updateUIForAuthenticatedUser(response.data);
            } else {
                // If API response is invalid, clear auth data
                clearAuthData();
                showAuthButtons();
            }
        },
        error: function(xhr) {
            // If request fails (token expired, etc.), clear auth data
            clearAuthData();
            showAuthButtons();
        }
    });
}

/**
 * Update UI elements to show authenticated user
 * @param {Object} userData - User profile data
 */
function updateUIForAuthenticatedUser(userData) {
    // Get first letter of first and last name for avatar
    const firstInitial = userData.firstName ? userData.firstName.charAt(0) : '';
    const lastInitial = userData.lastName ? userData.lastName.charAt(0) : '';
    const initials = (firstInitial + lastInitial).toUpperCase();

    // Create user account element
    const userAccountHtml = `
        <div class="user-account">
            <div class="user-avatar">
                <span>${initials}</span>
            </div>
            <span class="user-name">${userData.firstName || 'User'}</span>
            <i class="fas fa-chevron-down" style="margin-left: 5px; font-size: 10px;"></i>
        </div>
    `;

    // Update account container
    $('#accountContainer').html(userAccountHtml);

    // Update user dropdown
    $('#userInitials').text(initials);
    $('#userDisplayName').text(`${userData.firstName || ''} ${userData.lastName || ''}`);
    $('#userEmail').text(userData.email);

    // Update mobile view
    $('#mobileUserInitials').text(initials);
    $('#mobileUserDisplayName').text(`${userData.firstName || ''} ${userData.lastName || ''}`);
    $('#mobileUserEmail').text(userData.email);

    // Show mobile user info and hide mobile auth
    $('#mobileUserInfo').addClass('show');
    $('#mobileAuth').removeClass('show');
}

/**
 * Show login/register buttons for non-authenticated users
 */
function showAuthButtons() {
    // Create auth buttons
    const authButtonsHtml = `
        <div class="auth-buttons">
            <a href="authentication.html?action=login" class="btn btn-sm btn-outline">Login</a>
            <a href="authentication.html?action=register" class="btn btn-sm">Register</a>
        </div>
    `;

    // Update account container
    $('#accountContainer').html(authButtonsHtml);

    // Update mobile view - show auth buttons, hide user info
    $('#mobileAuth').addClass('show');
    $('#mobileUserInfo').removeClass('show');
}

/**
 * Update cart count in header
 */
function updateCartCount() {
    // Check if user is logged in
    if (isAuthenticated()) {
        const token = localStorage.getItem('token');
        // Get cart from API
        $.ajax({
            url: `${API_BASE_URL}/cart`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function(response) {
                if (response.code === 200) {
                    const totalItems = response.data.totalItems || 0;
                    updateCartBadge(totalItems);
                }
            },
            error: function(xhr) {
                console.error('Error retrieving cart:', xhr.status);

                // If authentication fails, clear token and treat as logged out
                if (xhr.status === 403 || xhr.status === 401) {
                    clearAuthData();
                    updateCartFromLocalStorage();
                }
            }
        });
    } else {
        // Update from localStorage for non-logged in users
        updateCartFromLocalStorage();
    }
}

/**
 * Update cart count from localStorage
 */
function updateCartFromLocalStorage() {
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            const cart = JSON.parse(cartData);
            updateCartBadge(cart.totalItems || 0);
        } else {
            updateCartBadge(0);
        }
    } catch (e) {
        console.error('Error parsing cart from localStorage', e);
        updateCartBadge(0);
    }
}

/**
 * Update cart badge in navigation
 * @param {number} count - Number of items in cart
 */
function updateCartBadge(count) {
    $('#cartCount').text(count);
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

/**
 * Handle user logout
 */
function logout() {
    const token = localStorage.getItem('token');

    if (token) {
        // Call logout API endpoint
        $.ajax({
            url: `${API_BASE_URL}/auth/logout`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            complete: function() {
                // Clear auth data and update UI regardless of response
                clearAuthData();
                showAuthButtons();

                // Redirect to homepage
                window.location.href = '../index.html';
            }
        });
    } else {
        // If no token found, just clear data and update UI
        clearAuthData();
        showAuthButtons();
    }
}

/**
 * Clear authentication data from localStorage
 */
function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
}

/**
 * Include the header in other pages
 * This function allows easy inclusion of the header in any page
 */
function includeHeader() {
    // For demonstration - in production, server-side includes or a framework would be better
    $.ajax({
        url: 'header.html',
        dataType: 'html',
        success: function(data) {
            $('#headerContainer').html(data);
            initHeader();
            setupEventListeners();
        }
    });









// Configure API base URL - ensure this matches your backend
    const API_BASE_URL = "http://localhost:8080/api/v1";

// Run when document is ready
    $(document).ready(function() {
        // Initialize header functionality
        initHeader();

        // Add event listeners
        setupEventListeners();
    });

    /**
     * Initialize the header component
     */
    function initHeader() {
        // Check authentication status and update UI
        checkAuthStatus();

        // Update cart count
        updateCartCount();
    }

    /**
     * Setup all event listeners for header
     */
    function setupEventListeners() {
        // User dropdown toggle
        $(document).on('click', '.user-account', function(e) {
            e.stopPropagation();
            $('#userDropdown').toggleClass('show');
            $('#backdrop').toggleClass('show');
        });

        // Close dropdown when clicking elsewhere
        $(document).on('click', function() {
            $('#userDropdown').removeClass('show');
            $('#backdrop').removeClass('show');
            $('.mobile-nav').removeClass('active');
        });

        // Prevent dropdown from closing when clicking inside it
        $('#userDropdown').on('click', function(e) {
            e.stopPropagation();
        });

        // Logout button click
        $(document).on('click', '#logoutBtn, #mobileLogoutBtn', function() {
            logout();
        });

        // Mobile menu toggle
        $('#mobileMenuBtn').on('click', function(e) {
            e.stopPropagation();
            $('.mobile-nav').addClass('active');
            $('#backdrop').addClass('show');
        });

        // Mobile menu close button
        $('#mobileNavClose').on('click', function() {
            $('.mobile-nav').removeClass('active');
            $('#backdrop').removeClass('show');
        });

        // Mobile dropdown toggles
        $('.mobile-dropdown-toggle').on('click', function() {
            $(this).parent().toggleClass('active');
        });

        // Prevent mobile nav from closing when clicking inside
        $('.mobile-nav').on('click', function(e) {
            e.stopPropagation();
        });
    }

    /**
     * Check if user is authenticated and update UI accordingly
     */
    function checkAuthStatus() {
        const token = localStorage.getItem('token');
        const userEmail = localStorage.getItem('userEmail');

        if (token && userEmail) {
            // User is logged in, fetch user details and update UI
            fetchUserProfile(token, userEmail);
        } else {
            // User is not logged in, show login/register buttons
            showAuthButtons();
        }
    }

    /**
     * Fetch user profile to display name and email
     * @param {string} token - Authentication token
     * @param {string} email - User email
     */
    function fetchUserProfile(token, email) {
        $.ajax({
            url: `${API_BASE_URL}/user/profile`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(response) {
                if (response.code === 200 && response.data) {
                    // Update UI with user data
                    updateUIForAuthenticatedUser(response.data);
                } else {
                    // If API response is invalid, clear auth data
                    clearAuthData();
                    showAuthButtons();
                }
            },
            error: function(xhr) {
                // If request fails (token expired, etc.), clear auth data
                clearAuthData();
                showAuthButtons();
            }
        });
    }

    /**
     * Update UI elements to show authenticated user
     * @param {Object} userData - User profile data
     */
    function updateUIForAuthenticatedUser(userData) {
        // Get first letter of first and last name for avatar
        const firstInitial = userData.firstName ? userData.firstName.charAt(0) : '';
        const lastInitial = userData.lastName ? userData.lastName.charAt(0) : '';
        const initials = (firstInitial + lastInitial).toUpperCase();

        // Create user account element
        const userAccountHtml = `
        <div class="user-account">
            <div class="user-avatar">
                <span>${initials}</span>
            </div>
            <span class="user-name">${userData.firstName || 'User'}</span>
            <i class="fas fa-chevron-down" style="margin-left: 5px; font-size: 10px;"></i>
        </div>
    `;

        // Update account container
        $('#accountContainer').html(userAccountHtml);

        // Update user dropdown
        $('#userInitials').text(initials);
        $('#userDisplayName').text(`${userData.firstName || ''} ${userData.lastName || ''}`);
        $('#userEmail').text(userData.email);

        // Update mobile view
        $('#mobileUserInitials').text(initials);
        $('#mobileUserDisplayName').text(`${userData.firstName || ''} ${userData.lastName || ''}`);
        $('#mobileUserEmail').text(userData.email);

        // Show mobile user info and hide mobile auth
        $('#mobileUserInfo').addClass('show');
        $('#mobileAuth').removeClass('show');
    }

    /**
     * Show login/register buttons for non-authenticated users
     */
    function showAuthButtons() {
        // Create auth buttons
        const authButtonsHtml = `
        <div class="auth-buttons">
            <a href="authentication.html?action=login" class="btn btn-sm btn-outline">Login</a>
            <a href="authentication.html?action=register" class="btn btn-sm">Register</a>
        </div>
    `;

        // Update account container
        $('#accountContainer').html(authButtonsHtml);

        // Update mobile view - show auth buttons, hide user info
        $('#mobileAuth').addClass('show');
        $('#mobileUserInfo').removeClass('show');
    }

    /**
     * Update cart count in header
     */
    function updateCartCount() {
        // Check if user is logged in
        if (isAuthenticated()) {
            const token = localStorage.getItem('token');
            // Get cart from API
            $.ajax({
                url: `${API_BASE_URL}/cart`,
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                success: function(response) {
                    if (response.code === 200) {
                        const totalItems = response.data.totalItems || 0;
                        updateCartBadge(totalItems);
                    }
                },
                error: function(xhr) {
                    console.error('Error retrieving cart:', xhr.status);

                    // If authentication fails, clear token and treat as logged out
                    if (xhr.status === 403 || xhr.status === 401) {
                        clearAuthData();
                        updateCartFromLocalStorage();
                    }
                }
            });
        } else {
            // Update from localStorage for non-logged in users
            updateCartFromLocalStorage();
        }
    }

    /**
     * Update cart count from localStorage
     */
    function updateCartFromLocalStorage() {
        try {
            const cartData = localStorage.getItem('cart');
            if (cartData) {
                const cart = JSON.parse(cartData);
                updateCartBadge(cart.totalItems || 0);
            } else {
                updateCartBadge(0);
            }
        } catch (e) {
            console.error('Error parsing cart from localStorage', e);
            updateCartBadge(0);
        }
    }

    /**
     * Update cart badge in navigation
     * @param {number} count - Number of items in cart
     */
    function updateCartBadge(count) {
        $('#cartCount').text(count);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    function isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    /**
     * Handle user logout
     */
    function logout() {
        const token = localStorage.getItem('token');

        if (token) {
            // Call logout API endpoint
            $.ajax({
                url: `${API_BASE_URL}/auth/logout`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                complete: function() {
                    // Clear auth data and update UI regardless of response
                    clearAuthData();
                    showAuthButtons();

                    // Redirect to homepage
                    window.location.href = '../index.html';
                }
            });
        } else {
            // If no token found, just clear data and update UI
            clearAuthData();
            showAuthButtons();
        }
    }

    /**
     * Clear authentication data from localStorage
     */
    function clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
    }

    /**
     * Include the header in other pages
     * This function allows easy inclusion of the header in any page
     */
    function includeHeader() {
        // For demonstration - in production, server-side includes or a framework would be better
        $.ajax({
            url: 'header.html',
            dataType: 'html',
            success: function(data) {
                $('#headerContainer').html(data);
                initHeader();
                setupEventListeners();
            }
        });
    }
}