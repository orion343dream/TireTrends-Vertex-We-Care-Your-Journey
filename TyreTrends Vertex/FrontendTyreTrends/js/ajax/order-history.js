/**
 * Order-history.js - Handles order history functionality
 */
$(document).ready(function() {
    console.log("Order history page loaded");

    // Check if user is logged in
    if (!isAuthenticated()) {
        console.log("User not authenticated, redirecting to login");
        redirectToLogin('order-history.html');
        return;
    } else {
        console.log("User is authenticated, token:", getToken());
    }

    // Pagination state
    const pagination = {
        currentPage: 0,
        totalPages: 0,
        pageSize: 5
    };

    // Current filter
    let currentFilter = 'all';

    // Update navigation UI
    updateAuthUI();

    // Initialize page
    initOrderHistory();

    /**
     * Initialize order history page
     */
    function initOrderHistory() {
        // Setup filter tabs
        setupFilterTabs();

        // Load orders
        loadOrders();
    }

    /**
     * Set up filter tabs functionality
     */
    function setupFilterTabs() {
        $('.filter-item').on('click', function() {
            // Remove active class from all tabs
            $('.filter-item').removeClass('active');

            // Add active class to clicked tab
            $(this).addClass('active');

            // Update current filter
            currentFilter = $(this).data('status');
            console.log("Filter changed to:", currentFilter);

            // Reset to first page
            pagination.currentPage = 0;

            // Load orders with new filter
            loadOrders();
        });
    }

    /**
     * Load orders from API
     */
    function loadOrders() {
        console.log("Loading orders with filter:", currentFilter);

        // Show loading spinner
        $('#ordersList').html('<div class="spinner-container"><div class="spinner"></div></div>');

        // Prepare API URL
        let url = `http://localhost:8080/api/v1/orders?page=${pagination.currentPage}&size=${pagination.pageSize}`;

        // Add status filter if not 'all'
        if (currentFilter !== 'all') {
            url += `&status=${currentFilter}`;
        }

        console.log("API request URL:", url);
        console.log("Authorization header:", getAuthHeader());

        // Fetch orders
        $.ajax({
            url: url,
            method: 'GET',
            headers: getAuthHeader(),
            success: function(response) {
                console.log("Raw API response:", response);

                // Check for successful response but null data
                if (response.code === 200 && response.data === null) {
                    console.log("API returned success but no orders");
                    $('#ordersCount').text('0 orders');
                    showEmptyState('No orders found. Start shopping to create your first order!');
                    pagination.totalPages = 1;
                    updatePagination();
                    return;
                }

                // Process valid data
                if (response.data) {
                    handleOrdersResponse(response.data);
                } else {
                    console.error("Unexpected response format:", response);
                    showEmptyState('Failed to load orders. Please try again later.');
                }
            },
            error: function(xhr, status, error) {
                console.error("API error:", xhr.status, xhr.statusText, xhr.responseText);

                // Handle authentication errors
                if (xhr.status === 401 || xhr.status === 403) {
                    console.log("Authentication failure, redirecting to login");
                    localStorage.removeItem('token');
                    localStorage.removeItem('authToken');
                    redirectToLogin();
                    return;
                }

                showEmptyState('Failed to load orders. Please try again later.');
            }
        });
    }

    /**
     * Handle the orders API response
     * @param {Object} response - API response
     */
    function handleOrdersResponse(response) {
        console.log("Handling orders response:", response);

        // Default empty response
        let orders = [];
        let totalElements = 0;

        // Check response format and extract orders
        if (response && response.content) {
            // Spring Page format
            orders = response.content;
            totalElements = response.totalElements || orders.length;
            pagination.totalPages = response.totalPages || 1;
            pagination.currentPage = response.number || 0;
        } else if (Array.isArray(response)) {
            // Direct array of orders
            orders = response;
            totalElements = orders.length;
            pagination.totalPages = 1;
        } else if (response && response.id) {
            // Single order object
            orders = [response];
            totalElements = 1;
            pagination.totalPages = 1;
        }

        console.log("Processed orders:", orders.length);

        // Update order count display
        $('#ordersCount').text(`${totalElements} ${totalElements === 1 ? 'order' : 'orders'}`);

        // Render orders or show empty state
        if (orders.length > 0) {
            renderOrders(orders);
        } else {
            showEmptyState('No orders found with the selected filter.');
        }

        // Update pagination UI
        updatePagination();
    }

    // The rest of your functions remain the same...
    // renderOrders, createOrderCard, etc.

    /**
     * Show empty state message
     * @param {string} message - Message to display
     */
    function showEmptyState(message) {
        console.log("Showing empty state:", message);
        const emptyHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p class="empty-text">${message}</p>
                <a href="products.html" class="btn btn-outline">Shop Now</a>
            </div>
        `;

        $('#ordersList').html(emptyHTML);
        $('#pagination').hide();
    }


    /**
     * Render orders list
     * @param {Array} orders - Orders to display
     */
    function renderOrders(orders) {
        // Check if no orders
        if (!orders || orders.length === 0) {
            showEmptyState('No orders found with the selected filter.');
            return;
        }

        // Generate orders HTML
        const ordersHTML = `
            <div class="orders-list">
                ${orders.map(order => createOrderCard(order)).join('')}
            </div>
        `;

        // Update DOM
        $('#ordersList').html(ordersHTML);

        // Setup event listeners for order actions
        setupOrderActions();
    }

    /**
     * Create HTML for an order card
     * @param {Object} order - Order data
     * @returns {string} Order card HTML
     */
    function createOrderCard(order) {
        console.log("Creating order card for:", order);

        // Format date
        const orderDate = new Date(order.createdAt);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Determine status class
        const statusClass = getStatusClass(order.status);

        // Handle case where orderItems might be missing
        const orderItems = order.orderItems || [];

        // Generate order items HTML (show up to 2 items)
        const itemsHtml = orderItems.slice(0, 2).map(item => `
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

        // Show "more items" message if needed
        const moreItemsHtml = orderItems.length > 2 ?
            `<div class="more-items">+${orderItems.length - 2} more items</div>` : '';

        // Generate shipping address section
        const shippingAddressHtml = createAddressDisplay('Shipping Address', order.shippingAddress);

        // Generate tracking info for shipped orders
        const trackingHtml = order.status === 'SHIPPED' ? renderTrackingInfo(order) : '';

        // Generate order card HTML
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-number">Order #${order.orderNumber || 'Unknown'}</div>
                    <div class="order-date">Placed on ${formattedDate}</div>
                </div>
                <div class="order-body">
                    <div class="order-status-row">
                        <div class="order-status ${statusClass}">${formatStatus(order.status)}</div>
                        <div class="order-total">Total: $${order.total ? order.total.toFixed(2) : '0.00'}</div>
                    </div>
                    
                    <div class="order-items">
                        ${itemsHtml}
                        ${moreItemsHtml}
                    </div>
                    
                    <div class="order-address-details">
                        ${shippingAddressHtml}
                    </div>
                    
                    ${trackingHtml}
                    
                    <div class="order-actions">
                        <div class="action-buttons">
                            <a href="order-confirmation.html?orderId=${order.id}" class="btn btn-sm">View Details</a>
                            ${order.status === 'PENDING' || order.status === 'PAID' ?
            `<button class="btn btn-sm btn-outline cancel-order-btn" data-id="${order.id}">Cancel Order</button>` : ''}
                        </div>
                        ${order.status === 'DELIVERED' || order.status === 'COMPLETED' ?
            `<button class="btn btn-sm btn-outline reorder-btn" data-id="${order.id}">Buy Again</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create HTML for displaying an address
     * @param {string} title - Address title (e.g., "Shipping Address")
     * @param {Object} address - Address object
     * @returns {string} Address display HTML
     */
    function createAddressDisplay(title, address) {
        if (!address) {
            return '';
        }

        return `
            <div class="address-display">
                <h4>${title}</h4>
                <p>
                    ${address.firstName || ''} ${address.lastName || ''}<br>
                    ${address.address || ''}${address.address2 ? ', ' + address.address2 : ''}<br>
                    ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}<br>
                    ${address.country === 'US' ? 'United States' : (address.country || '')}<br>
                    ${address.phone || ''}
                </p>
            </div>
        `;
    }

    /**
     * Render tracking information for shipped orders
     * @param {Object} order - Order data
     * @returns {string} Tracking section HTML
     */
    function renderTrackingInfo(order) {
        // Generate a tracking number based on order number
        const trackingNumber = `TT${order.orderNumber}${Math.floor(Math.random() * 1000000)}`;

        return `
            <div class="tracking-section">
                <div><strong>Tracking Number:</strong><span class="tracking-number">${trackingNumber}</span></div>
                
                <div class="tracking-progress">
                    <div class="tracking-line"></div>
                    
                    <div class="tracking-step">
                        <div class="step-icon active">1</div>
                        <div class="step-details">
                            <div class="step-title">Order Placed</div>
                            <div class="step-time">${new Date(order.createdAt).toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div class="tracking-step">
                        <div class="step-icon active">2</div>
                        <div class="step-details">
                            <div class="step-title">Processing</div>
                            <div class="step-time">${order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="tracking-step">
                        <div class="step-icon active">3</div>
                        <div class="step-details">
                            <div class="step-title">Shipped</div>
                            <div class="step-time">${new Date().toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div class="tracking-step">
                        <div class="step-icon">4</div>
                        <div class="step-details">
                            <div class="step-title">Delivered</div>
                            <div class="step-time">Pending</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for order action buttons
     */
    function setupOrderActions() {
        // Cancel order buttons
        $('.cancel-order-btn').on('click', function() {
            const orderId = $(this).data('id');
            cancelOrder(orderId);
        });

        // Reorder buttons
        $('.reorder-btn').on('click', function() {
            const orderId = $(this).data('id');
            reorder(orderId);
        });
    }

    /**
     * Cancel an order
     * @param {number} orderId - Order ID
     */
    function cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        apiRequest(`http://localhost:8080/api/v1/orders/${orderId}/cancel`, 'PUT')
            .then(response => {
                // Show success message
                alert('Order cancelled successfully.');

                // Reload orders
                loadOrders();
            })
            .catch(error => {
                alert(error.message || 'Failed to cancel order. Please try again.');
            });
    }

    /**
     * Reorder items from a previous order
     * @param {number} orderId - Order ID
     */
    function reorder(orderId) {
        apiRequest(`http://localhost:8080/api/v1/orders/${orderId}`)
            .then(response => {
                // Extract order from response if needed
                const order = response;
                const items = order.orderItems;

                if (!items || items.length === 0) {
                    alert('No items found in this order.');
                    return;
                }

                // Show loading message
                alert('Adding items to cart...');

                // Process items sequentially using promises
                const promises = items.map(item => {
                    return apiRequest(`http://localhost:8080/api/v1/cart/add?productId=${item.productId}&quantity=${item.quantity}`, 'POST');
                });

                Promise.all(promises)
                    .then(() => {
                        // Update cart count
                        updateCartCount();

                        // Show success message
                        alert('Items added to cart successfully.');

                        // Navigate to cart
                        window.location.href = 'cart.html';
                    })
                    .catch(error => {
                        console.error('Error adding items to cart:', error);
                        alert('Failed to add items to cart. Please try again later.');
                    });
            })
            .catch(error => {
                alert(error.message || 'Failed to load order details. Please try again.');
            });
    }

    /**
     * Update cart count in header
     */
    function updateCartCount() {
        apiRequest('http://localhost:8080/api/v1/cart')
            .then(cart => {
                const totalItems = cart.totalItems || 0;
                $('.cart-count').text(totalItems);
            })
            .catch(error => {
                console.error('Error updating cart count:', error);
            });
    }

    /**
     * Update pagination UI
     */
    function updatePagination() {
        const paginationContainer = $('#pagination');

        // Clear previous pagination
        paginationContainer.empty();

        // If only one page, hide pagination
        if (pagination.totalPages <= 1) {
            paginationContainer.hide();
            return;
        }

        // Show pagination
        paginationContainer.show();

        // Previous button
        const prevBtn = $(`<a href="#" class="pagination-btn ${pagination.currentPage === 0 ? 'disabled' : ''}">&laquo;</a>`);

        if (pagination.currentPage > 0) {
            prevBtn.on('click', function(e) {
                e.preventDefault();
                pagination.currentPage--;
                loadOrders();
            });
        }

        paginationContainer.append(prevBtn);

        // Page numbers
        const maxPages = 5;
        let startPage = Math.max(0, pagination.currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(pagination.totalPages - 1, startPage + maxPages - 1);

        // Adjust start page if necessary
        if (endPage - startPage + 1 < maxPages) {
            startPage = Math.max(0, endPage - maxPages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = $(`<a href="#" class="pagination-btn ${i === pagination.currentPage ? 'active' : ''}">${i + 1}</a>`);

            if (i !== pagination.currentPage) {
                pageBtn.on('click', function(e) {
                    e.preventDefault();
                    pagination.currentPage = i;
                    loadOrders();
                });
            }

            paginationContainer.append(pageBtn);
        }

        // Next button
        const nextBtn = $(`<a href="#" class="pagination-btn ${pagination.currentPage === pagination.totalPages - 1 ? 'disabled' : ''}">&raquo;</a>`);

        if (pagination.currentPage < pagination.totalPages - 1) {
            nextBtn.on('click', function(e) {
                e.preventDefault();
                pagination.currentPage++;
                loadOrders();
            });
        }

        paginationContainer.append(nextBtn);
    }



    /**
     * Get status class based on order status
     * @param {string} status - Order status
     * @returns {string} CSS class for status
     */
    function getStatusClass(status) {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'PAID': return 'status-pending';
            case 'PROCESSING': return 'status-processing';
            case 'SHIPPED': return 'status-shipped';
            case 'DELIVERED': return 'status-delivered';
            case 'COMPLETED': return 'status-completed';
            case 'CANCELLED': return 'status-cancelled';
            default: return '';
        }
    }

    /**
     * Format order status for display
     * @param {string} status - Order status
     * @returns {string} Formatted status text
     */
    function formatStatus(status) {
        if (!status) return 'Unknown';

        // Convert PENDING to Pending, etc.
        return status.charAt(0) + status.slice(1).toLowerCase();
    }
});