/**
 * Order-confirmation.js - Handles order confirmation page functionality
 */
$(document).ready(function() {
    // Check if user is logged in
    if (!isAuthenticated()) {
        redirectToLogin('order-history.html');
        return;
    }

    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    if (!orderId) {
        // Show error if no order ID provided
        showError();
        return;
    }

    // Update navigation UI
    updateAuthUI();

    // Load order details
    loadOrderDetails(orderId);

    /**
     * Load order details from API
     * @param {number} orderId - Order ID
     */
    function loadOrderDetails(orderId) {
        // Show loading spinner
        $('#loadingSpinner').show();
        $('#confirmationSection').hide();
        $('#errorSection').hide();

        apiRequest(`/api/v1/orders/${orderId}`)
            .then(order => {
                // Hide loading spinner
                $('#loadingSpinner').hide();

                // Display order confirmation
                $('#confirmationSection').show();

                // Populate order details
                populateOrderDetails(order);
            })
            .catch(error => {
                // Hide loading spinner
                $('#loadingSpinner').hide();

                // Show error section with more details
                showError(error.message || "Could not retrieve order details");
                console.error('Error loading order details:', error);
            });
    }

    /**
     * Populate order details on the page
     * @param {Object} order - Order data
     */
    function populateOrderDetails(order) {
        // Basic order details
        $('#orderNumber').text(order.orderNumber);

        // Format date
        const orderDate = new Date(order.createdAt);
        $('#orderDate').text(orderDate.toLocaleDateString());

        // Payment method
        $('#paymentMethod').text(formatPaymentMethod(order.paymentMethod));

        // Order status
        $('#orderStatus').text(formatStatus(order.status));

        // Estimated delivery (5-7 days from order date)
        const deliveryStart = new Date(orderDate);
        deliveryStart.setDate(deliveryStart.getDate() + 5);

        const deliveryEnd = new Date(orderDate);
        deliveryEnd.setDate(deliveryEnd.getDate() + 7);

        $('#estimatedDelivery').text(formatDateRange(deliveryStart, deliveryEnd));

        // Shipping address
        $('#shippingAddress').html(formatAddress(order.shippingAddress));

        // Billing address
        $('#billingAddress').html(formatAddress(order.billingAddress));

        // Order items
        renderOrderItems(order.orderItems);

        // Order summary
        $('#subtotal').text(`$${order.subtotal.toFixed(2)}`);
        $('#shipping').text(order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : 'Free');
        $('#tax').text(`$${order.tax.toFixed(2)}`);

        // Discount (if any)
        if (order.discountAmount > 0) {
            $('#discountRow').show();
            $('#discount').text(`-$${order.discountAmount.toFixed(2)}`);
        } else {
            $('#discountRow').hide();
        }

        // Total
        $('#total').text(`$${order.total.toFixed(2)}`);
    }

    /**
     * Render order items
     * @param {Array} items - Order items
     */
    function renderOrderItems(items) {
        const orderItemsContainer = $('#orderItems');

        if (!items || items.length === 0) {
            orderItemsContainer.html('<p>No items in this order.</p>');
            return;
        }

        const itemsHTML = items.map(item => `
            <div class="order-item">
                <div class="item-image">
                    <img src="${item.productImage || 'https://via.placeholder.com/80x80?text=Tire'}" alt="${item.productName}">
                </div>
                <div class="item-details">
                    <div class="item-name">${item.productName}</div>
                    <div class="item-meta">
                        ${item.productSize ? item.productSize : ''}
                        ${item.productType ? ` | ${item.productType}` : ''}
                        | Qty: ${item.quantity}
                    </div>
                    <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            </div>
        `).join('');

        orderItemsContainer.html(itemsHTML);
    }

    /**
     * Show error section with custom message
     * @param {string} message - Error message to display
     */
    function showError(message) {
        $('#loadingSpinner').hide();
        $('#confirmationSection').hide();
        $('#errorSection').show();

        // Update error message if provided
        if (message) {
            $('#errorMessage').text(message);
        }
    }

    /**
     * Format payment method for display
     * @param {string} paymentMethod - Payment method
     * @returns {string} Formatted payment method
     */
    function formatPaymentMethod(paymentMethod) {
        if (!paymentMethod) return 'Unknown';

        if (paymentMethod === 'CREDIT_CARD') {
            return 'Credit Card';
        } else if (paymentMethod === 'PAYHERE') {
            return 'PayHere';
        } else {
            return paymentMethod;
        }
    }

    /**
     * Format order status for display
     * @param {string} status - Order status
     * @returns {string} Formatted status
     */
    function formatStatus(status) {
        if (!status) return 'Unknown';

        // Convert PENDING to Pending, etc.
        return status.charAt(0) + status.slice(1).toLowerCase();
    }

    /**
     * Format date range for display
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {string} Formatted date range
     */
    function formatDateRange(startDate, endDate) {
        const options = { month: 'long', day: 'numeric' };

        // If same year, don't repeat the year
        if (startDate.getFullYear() === endDate.getFullYear()) {
            return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${endDate.getFullYear()}`;
        } else {
            return `${startDate.toLocaleDateString('en-US')} - ${endDate.toLocaleDateString('en-US')}`;
        }
    }

    /**
     * Format address for display
     * @param {Object} address - Address object
     * @returns {string} Formatted address HTML
     */
    function formatAddress(address) {
        if (!address) return 'No address provided';

        let html = '';

        if (address.firstName && address.lastName) {
            html += `${address.firstName} ${address.lastName}<br>`;
        }

        if (address.address) {
            html += `${address.address}<br>`;
        }

        if (address.address2) {
            html += `${address.address2}<br>`;
        }

        if (address.city && address.state && address.zipCode) {
            html += `${address.city}, ${address.state} ${address.zipCode}<br>`;
        }

        if (address.country) {
            const countryName = address.country === 'US' ? 'United States' : address.country;
            html += `${countryName}<br>`;
        }

        if (address.phone) {
            html += `${address.phone}`;
        }

        return html;
    }
});