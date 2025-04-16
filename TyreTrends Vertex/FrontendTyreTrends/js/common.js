// common.js - Handles common functionality across all pages

$(document).ready(function() {
    // Initialize the UI
    initializeUI();

    // Setup event listeners
    setupEventListeners();
});

/**
 * Initialize the UI based on authentication status
 */
function initializeUI() {
    // Update header links based on auth status
    updateAuthUI();

    // Load header and footer if necessary
    if ($('header').length && $('header').html().trim() === '') {
        loadHeader();
    }

    if ($('footer').length && $('footer').html().trim() === '') {
        loadFooter();
    }
}

/**
 * Update authentication UI elements
 */
function updateAuthUI() {
    const isLoggedIn = authService.isLoggedIn();
    const isAdmin = authService.isAdmin();
    const userProfile = authService.getUserProfile();

    // Update navigation based on login status
    $('.nav-guest').toggle(!isLoggedIn);
    $('.nav-user').toggle(isLoggedIn && !isAdmin);
    $('.nav-admin').toggle(isAdmin);

    // Update user information if logged in
    if (isLoggedIn && userProfile) {
        // Set user name display
        $('.user-name').text(userProfile.firstName);

        // Set user avatar if profile picture exists
        if (userProfile.profilePicture) {
            $('.user-avatar').html(
                `<img src="uploads/profile-pictures/${userProfile.profilePicture}" 
                alt="${userProfile.firstName}" class="avatar-img">`
            );
        } else {
            // Set initials as avatar
            const initials = (userProfile.firstName?.charAt(0) || '') +
                (userProfile.lastName?.charAt(0) || '');
            $('.user-avatar-text').text(initials);
        }
    }
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    // Mobile menu toggle
    $(document).on('click', '.mobile-menu-btn', function() {
        $('.nav-links').toggleClass('active');
    });

    // User dropdown toggle
    $(document).on('click', '.user-dropdown .user-btn', function(e) {
        e.stopPropagation();
        $('.dropdown-menu').toggleClass('active');
    });

    // Close dropdown when clicking outside
    $(document).on('click', function() {
        $('.dropdown-menu').removeClass('active');
    });

    // Logout handler
    $(document).on('click', '.logout-btn', function(e) {
        e.preventDefault();
        authService.logout()
            .then(() => {
                window.location.href = 'index.html';
            });
    });
}

/**
 * Load header content
 */
function loadHeader() {
    const isLoggedIn = authService.isLoggedIn();
    const isAdmin = authService.isAdmin();
    const userProfile = authService.getUserProfile();

    let authLinks = '';

    if (isLoggedIn) {
        // Create user dropdown for logged in users
        const userName = userProfile ? userProfile.firstName : 'User';
        const userInitials = userProfile
            ? (userProfile.firstName?.charAt(0) || '') + (userProfile.lastName?.charAt(0) || '')
            : 'U';

        authLinks = `
            <li class="nav-item user-dropdown">
                <button class="user-btn">
                    <div class="user-avatar">
                        <span class="user-avatar-text">${userInitials}</span>
                    </div>
                    <span class="user-name">${userName}</span>
                    <span>▼</span>
                </button>
                <div class="dropdown-menu">
                    <a href="user-dashboard.html" class="dropdown-item">My Account</a>
                    <a href="orders.html" class="dropdown-item">My Orders</a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout-btn">Logout</a>
                </div>
            </li>
        `;

        // Add admin dashboard link for admin users
        if (isAdmin) {
            authLinks += `
                <li class="nav-item nav-admin">
                    <a href="admin-dashboard.html" class="nav-link">Admin Dashboard</a>
                </li>
            `;
        }
    } else {
        // Links for guests
        authLinks = `
            <li class="nav-item nav-guest">
                <a href="pages/authentication.html" class="nav-link">Sign In</a>
            </li>
        `;
    }

    // Construct header HTML
    const headerHtml = `
        <div class="container header-container">
            <a href="index.html" class="logo">Tool<span>nest</span></a>
            <div class="search-bar">
                <input type="text" placeholder="Search for tools..." id="searchInput">
                <button type="submit" id="searchBtn"><i class="fas fa-search"></i>🔍</button>
            </div>
            <button class="mobile-menu-btn">☰</button>
            <ul class="nav-links">
                <li><a href="products.html">Shop</a></li>
                <li><a href="tyre-finder.html">Tyre Finder</a></li>
                <li><a href="deals.html">Deals</a></li>
                <li><a href="cart.html">Cart (<span id="cartCount">0</span>)</a></li>
                ${authLinks}
            </ul>
        </div>
    `;

    // Set header content
    $('header').html(headerHtml);

    // Initialize cart count
    updateCartCount();

    // Setup search form
    $('#searchBtn').on('click', function() {
        const searchQuery = $('#searchInput').val().trim();
        if (searchQuery) {
            window.location.href = `products.html?search=${encodeURIComponent(searchQuery)}`;
        }
    });

    // Handle search on Enter key
    $('#searchInput').on('keypress', function(e) {
        if (e.which === 13) {
            $('#searchBtn').click();
        }
    });
}

/**
 * Injects the footer into the page
 */
function loadFooter() {
    const footerElement = document.querySelector('footer');
    if (!footerElement) return;

    const footer = `
    <div class="container">
        <div class="footer-container">
            <div class="footer-section">
                <h3>Shop</h3>
                <ul class="footer-links">
                    <li><a href="products.html">All Tires</a></li>
                    <li><a href="tire-finder.html">By Vehicle</a></li>
                    <li><a href="products.html?filter=size">By Size</a></li>
                    <li><a href="products.html?filter=brand">By Brand</a></li>
                    <li><a href="products.html?filter=offers">Special Offers</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h3>Services</h3>
                <ul class="footer-links">
                    <li><a href="service-booking.html?service=installation">Tire Installation</a></li>
                    <li><a href="service-booking.html?service=alignment">Wheel Alignment</a></li>
                    <li><a href="service-booking.html?service=rotation">Tire Rotation</a></li>
                    <li><a href="service-booking.html?service=repair">Flat Repair</a></li>
                    <li><a href="service-booking.html">Service Packages</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h3>Support</h3>
                <ul class="footer-links">
                    <li><a href="contact.html">Contact Us</a></li>
                    <li><a href="faq.html">FAQ</a></li>
                    <li><a href="shipping.html">Shipping Information</a></li>
                    <li><a href="warranty.html">Returns & Warranty</a></li>
                    <li><a href="tire-guide.html">Tire Care Guide</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h3>Company</h3>
                <ul class="footer-links">
                    <li><a href="about.html">About Us</a></li>
                    <li><a href="locations.html">Store Locations</a></li>
                    <li><a href="careers.html">Careers</a></li>
                    <li><a href="blog.html">Blog</a></li>
                    <li><a href="privacy.html">Privacy Policy</a></li>
                </ul>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} TireTrends. All Rights Reserved.</p>
        </div>
    </div>
    `;

    footerElement.innerHTML = footer;
}


/**
 * Update cart count in header
 */
function updateCartCount() {
    // Get cart from local storage
    const cart = JSON.parse(localStorage.getItem('cart') || '{"cartItems":[], "totalItems": 0}');
    const count = cart.totalItems || 0;

    // Update cart count display
    $('#cartCount').text(count);
}

/**
 * Show alert message
 * @param {string} type Alert type ('success' or 'error')
 * @param {string} message Alert message
 */
function showAlert(type, message) {
    const alertElement = type === 'success' ? $('#alertSuccess') : $('#alertError');

    if (alertElement.length) {
        alertElement.text(message).addClass('show');

        setTimeout(() => {
            alertElement.removeClass('show');
        }, 5000);
    }
}

$(document).ready(function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    // Update navigation based on login status
    updateNavigation(token, userEmail);

    // Other common functionalities...
});

function updateNavigation(token, userEmail) {
    const authSection = $('#authSection');

    if (token) {
        // User is logged in
        authSection.html(`
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-toggle="dropdown">
                    <i class="fas fa-user"></i> ${userEmail}
                </a>
                <div class="dropdown-menu">
                    <a class="dropdown-item" href="user-profile.html">My Profile</a>
                    <a class="dropdown-item" href="orders.html">My Orders</a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="#" id="logoutBtn">Logout</a>
                </div>
            </li>
        `);

        // Add logout functionality
        $('#logoutBtn').on('click', function(e) {
            e.preventDefault();
            logout();
        });
    } else {
        // User is not logged in
        authSection.html(`
            <li class="nav-item">
                <a class="nav-link" href="pages/authentication.html">Sign In</a>
            </li>
        `);
    }
}

function logout() {
    const token = localStorage.getItem('token');

    $.ajax({
        url: 'http://localhost:8080/api/v1/auth/logout',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function() {
            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userEmail');

            // Redirect to home page
            window.location.href = 'index.html';
        },
        error: function() {
            // Even if logout fails on server, clear local storage and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userEmail');
            window.location.href = 'index.html';
        }
    });
}

// Update cart count in navigation
function updateCartCount() {
    const token = localStorage.getItem('token');
    const cartCountElement = $('#cartCount');

    if (token) {
        // Get cart from API if user is logged in
        $.ajax({
            url: 'http://localhost:8080/api/v1/cart',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function(data) {
                const count = data.totalItems || 0;
                cartCountElement.text(count);
            },
            error: function() {
                cartCountElement.text('0');
            }
        });
    } else {
        // Get cart from localStorage if user is not logged in
        const cart = JSON.parse(localStorage.getItem('cart') || '{"totalItems": 0}');
        cartCountElement.text(cart.totalItems || 0);
    }
}


/**
 * Authentication helper functions
 * These can be added to a common.js file or included in each page
 */

// Check if user is authenticated
function isAuthenticated() {
    return !!(localStorage.getItem('token') || localStorage.getItem('authToken'));
}

// Get authentication token (handles both token formats)
function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
}

// Get authorization header for API requests
function getAuthHeader() {
    return {
        'Authorization': `Bearer ${getToken()}`
    };
}

// Redirect to login page if not authenticated
function redirectToLogin(returnUrl) {
    const currentPage = returnUrl || window.location.pathname;
    window.location.href = 'authentication.html?redirect=' + encodeURIComponent(currentPage);
}

// Update UI based on authentication status
function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    if (authLink) {
        if (isAuthenticated()) {
            authLink.textContent = 'My Account';
            authLink.href = 'account.html';
        } else {
            authLink.textContent = 'Sign In';
            authLink.href = 'authentication.html';
        }
    }
}

// Standard API request handler with authentication
function apiRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            url: url,
            method: method || 'GET',
            headers: getAuthHeader(),
            success: function(response) {
                if (response.code >= 200 && response.code < 300) {
                    resolve(response.data);
                } else {
                    reject({message: response.message || 'Error processing request'});
                }
            },
            error: function(xhr) {
                // Handle authentication errors
                if (xhr.status === 401 || xhr.status === 403) {
                    // Clear potentially invalid tokens
                    localStorage.removeItem('token');
                    localStorage.removeItem('authToken');
                    redirectToLogin();
                    return;
                }

                let errorMsg = 'An error occurred. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                reject({message: errorMsg, status: xhr.status});
            }
        };

        // Add data if provided
        if (data) {
            options.contentType = 'application/json';
            options.data = JSON.stringify(data);
        }

        $.ajax(options);
    });
}

