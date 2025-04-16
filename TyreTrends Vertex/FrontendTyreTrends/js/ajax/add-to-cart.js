/**
 * Add-to-cart.js - Handles adding products to cart functionality
 * This script is meant to be included on product detail pages
 */
$(document).ready(function() {
    // Check if product ID is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        console.error('No product ID found in URL');
        return;
    }

    // Initialize quantity input
    const quantityInput = $('#quantity');

    // Setup quantity controls
    $('.quantity-decrease').on('click', function() {
        const currentValue = parseInt(quantityInput.val());
        if (currentValue > 1) {
            quantityInput.val(currentValue - 1);
        }
    });

    $('.quantity-increase').on('click', function() {
        const currentValue = parseInt(quantityInput.val());
        const maxStock = parseInt(quantityInput.data('max-stock') || 999);
        if (currentValue < maxStock) {
            quantityInput.val(currentValue + 1);
        } else {
            showMessage('error', 'Maximum stock limit reached');
        }
    });

    quantityInput.on('change', function() {
        let value = parseInt($(this).val());
        const maxStock = parseInt($(this).data('max-stock') || 999);

        // Ensure value is at least 1
        if (isNaN(value) || value < 1) {
            value = 1;
        }

        // Ensure value doesn't exceed stock
        if (value > maxStock) {
            value = maxStock;
            showMessage('error', 'Maximum stock limit reached');
        }

        $(this).val(value);
    });

    // Add to cart button
    $('#addToCartBtn').on('click', function() {
        if ($(this).prop('disabled')) return;
        addToCart();
    });

    /**
     * Add current product to cart
     */
    function addToCart() {
        // Get quantity
        const quantity = parseInt(quantityInput.val()) || 1;

        // Check if user is logged in
        if (isAuthenticated()) {
            // Add to server cart for authenticated users
            $.ajax({
                url: `http://localhost:8080/api/v1/cart/add?productId=${productId}&quantity=${quantity}`,
                method: 'POST',
                headers: getAuthHeader(),
                success: function(response) {
                    if (response.code === 200) {
                        // Update cart count
                        updateCartCount(response.data.totalItems);
                        // Show success message
                        showMessage('success', 'Product added to cart successfully');
                    } else {
                        showMessage('error', response.message || 'Failed to add product to cart');
                    }
                },
                error: function(xhr) {
                    // Check if authentication error
                    if (xhr.status === 401 || xhr.status === 403) {
                        clearAuthData();
                        // Add to local cart instead
                        addToLocalCart(quantity);
                    } else {
                        let errorMsg = 'An error occurred. Please try again.';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            errorMsg = xhr.responseJSON.message;
                        }
                        showMessage('error', errorMsg);
                    }
                }
            });
        } else {
            // Add to local cart for guest users
            addToLocalCart(quantity);
        }
    }

    /**
     * Add product to local cart
     * @param {number} quantity - Product quantity
     */
    function addToLocalCart(quantity) {
        // Get product details from page
        const productName = $('.product-title').text();
        const productPrice = parseFloat($('.product-price').text().replace('$', ''));
        const productImage = $('#mainProductImage').attr('src');
        const productSize = $('.spec-value:eq(0)').text();
        const productType = $('.spec-value:eq(1)').text();

        // Get current cart from localStorage
        let cart;
        try {
            const cartData = localStorage.getItem('cart');
            if (cartData) {
                cart = JSON.parse(cartData);
            } else {
                cart = {
                    cartItems: [],
                    totalItems: 0,
                    totalPrice: 0,
                    discountAmount: 0,
                    appliedPromoCode: null
                };
            }
        } catch (e) {
            console.error('Error parsing cart from localStorage', e);
            cart = {
                cartItems: [],
                totalItems: 0,
                totalPrice: 0,
                discountAmount: 0,
                appliedPromoCode: null
            };
        }

        // Check if product already exists in cart
        const existingItemIndex = cart.cartItems.findIndex(item =>
            item.productId == productId ||
            (item.id ? item.id == productId : false)
        );

        if (existingItemIndex !== -1) {
            // Update existing item
            cart.cartItems[existingItemIndex].quantity += quantity;
        } else {
            // Generate a unique ID for the new cart item (for local cart only)
            const newItemId = Date.now();

            // Add new item
            cart.cartItems.push({
                id: newItemId,
                productId: productId,
                productName: productName,
                productImage: productImage || 'https://via.placeholder.com/300x300?text=Product',
                productSize: productSize || '',
                productType: productType || '',
                quantity: quantity,
                unitPrice: productPrice || 0
            });
        }

        // Recalculate cart totals
        recalculateCartTotals(cart);

        // Save cart to localStorage
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
            // Update cart count
            updateCartCount(cart.totalItems);
            // Show success message
            showMessage('success', 'Product added to cart successfully');
        } catch (e) {
            console.error('Error saving cart to localStorage', e);
            showMessage('error', 'Failed to add to cart. Your browser storage may be full or restricted.');
        }
    }

    /**
     * Recalculate cart totals
     * @param {Object} cart - Cart object to recalculate
     */
    function recalculateCartTotals(cart) {
        cart.totalItems = 0;
        cart.totalPrice = 0;

        // Calculate totals from cart items
        cart.cartItems.forEach(item => {
            cart.totalItems += item.quantity;
            cart.totalPrice += item.unitPrice * item.quantity;
        });

        // Recalculate discount if promo code is applied
        if (cart.appliedPromoCode) {
            if (cart.appliedPromoCode.toUpperCase() === 'WELCOME10') {
                cart.discountAmount = cart.totalPrice * 0.1; // 10% discount
            } else if (cart.appliedPromoCode.toUpperCase() === 'SUMMER20') {
                cart.discountAmount = cart.totalPrice * 0.2; // 20% discount
            }
        }
    }

    /**
     * Update cart count in header
     * @param {number} count - New cart count
     */
    function updateCartCount(count) {
        $('.cart-count').text(count || 0);
    }

    /**
     * Show message to user
     * @param {string} type - Message type ('success' or 'error')
     * @param {string} message - Message text
     */
    function showMessage(type, message) {
        // Use global alert if available
        const alertId = type === 'success' ? '#alertSuccess' : '#alertError';
        const alertElement = $(alertId);

        if (alertElement.length > 0) {
            alertElement.text(message).addClass('show');

            setTimeout(() => {
                alertElement.removeClass('show');
            }, 5000);
            return;
        }

        // Fallback to product-specific message
        let messageContainer = $('.product-message');

        // Create message container if it doesn't exist
        if (messageContainer.length === 0) {
            messageContainer = $('<div class="product-message"></div>');
            $('.product-detail').append(messageContainer);
        }

        // Set message style based on type
        const className = type === 'success' ? 'success-message' : 'error-message';

        // Set message content
        messageContainer.html(`<div class="${className}">${message}</div>`);

        // Show message
        messageContainer.show();

        // Auto-hide message after 3 seconds
        setTimeout(() => {
            messageContainer.fadeOut();
        }, 3000);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    function isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    /**
     * Get authentication header for API requests
     * @returns {Object} Headers object with authorization token
     */
    function getAuthHeader() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Clear authentication data
     */
    function clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
    }
});