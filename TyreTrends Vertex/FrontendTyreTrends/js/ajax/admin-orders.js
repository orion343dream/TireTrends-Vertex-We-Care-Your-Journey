/**
 * admin-orders.js - Order management functionality for TyreTrends Admin
 */
// Base URL for API requests
const API_BASE_URL = 'http://localhost:8080'; // Change this to your actual backend URL

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Current page and size for pagination
    let currentPage = 0;
    let pageSize = 10;

    // Current filters
    let statusFilter = '';
    let dateFilter = '';
    let searchQuery = '';

    // Authentication token - check both potential storage locations
    let authToken = localStorage.getItem('authToken') || localStorage.getItem('token');

    // Check if the user is authenticated and is an admin
    if (!checkAuth()) {
        return; // Stop execution if authentication fails
    }

    // Initialize UI components
    initUI();

    // Load initial orders
    loadOrders();

    /**
     * Check authentication
     * @returns {boolean} Whether authentication is successful
     */
    function checkAuth() {
        // Check both potential token storage keys
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');

        // Check both potential role storage keys, also check for case variations
        const role = localStorage.getItem('userRole') || localStorage.getItem('role');
        const userRole = role ? role.toUpperCase() : '';

        console.log("Auth check - Token exists:", !!token, "User role:", userRole);

        if (!token) {
            // No token found
            console.log("No authentication token found, redirecting to login");
            window.location.href = 'authentication.html?redirect=' + encodeURIComponent('admin-orders.html');
            return false;
        }

        // Allow ADMIN role variations
        if (userRole !== 'ADMIN' && userRole !== 'ADMIN') {
            console.log("User is not an admin, redirecting to login");
            window.location.href = 'authentication.html?redirect=' + encodeURIComponent('admin-orders.html');
            return false;
        }

        return true;
    }

    /**
     * Initialize UI components and event listeners
     */
    function initUI() {
        // Status filter change
        document.getElementById('statusFilter').addEventListener('change', function() {
            statusFilter = this.value;
            currentPage = 0;
            loadOrders();
        });

        // Date filter change
        document.getElementById('dateFilter').addEventListener('change', function() {
            dateFilter = this.value;
            currentPage = 0;
            loadOrders();
        });

        // Search button click
        document.getElementById('searchBtn').addEventListener('click', function() {
            searchQuery = document.getElementById('searchInput').value.trim();
            currentPage = 0;
            loadOrders();
        });

        // Search input enter key
        document.getElementById('searchInput').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                searchQuery = this.value.trim();
                currentPage = 0;
                loadOrders();
            }
        });

        // Refresh button click
        document.getElementById('refreshOrdersBtn').addEventListener('click', function() {
            loadOrders();
        });

        // Modal close buttons
        document.getElementById('closeOrderDetailModal').addEventListener('click', closeOrderDetailModal);
        document.getElementById('closeOrderDetailBtn').addEventListener('click', closeOrderDetailModal);

        // Update order button
        document.getElementById('updateOrderBtn').addEventListener('click', updateOrderStatus);

        // User dropdown toggle
        document.getElementById('user-dropdown-toggle').addEventListener('click', function() {
            document.getElementById('user-dropdown-menu').classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.user-dropdown')) {
                document.getElementById('user-dropdown-menu').classList.remove('active');
            }
        });

        // Menu toggle for mobile
        document.querySelector('.menu-toggle').addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('active');
            document.querySelector('.main-content').classList.toggle('sidebar-collapsed');
        });
    }

    /**
     * Load orders from the API
     */
    function loadOrders() {
        // Show loading spinner
        document.getElementById('loadingSpinner').style.display = 'flex';
        document.getElementById('ordersTableBody').innerHTML = '';

        // Build the API URL with filters and pagination
        // Use the direct path matching the OrderController
        let url = `${API_BASE_URL}/api/v1/orders/admin/all?page=${currentPage}&size=${pageSize}`;

        // Add status filter if selected
        if (statusFilter) {
            url += `&status=${statusFilter}`;
        }

        // Add search query if entered
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        // If date filter is selected
        if (dateFilter) {
            // Calculate date range based on selected filter
            const dateRange = getDateRange(dateFilter);
            if (dateRange) {
                url = `${API_BASE_URL}/api/v1/orders/admin/date-range?startDate=${encodeURIComponent(dateRange.startDate)}&endDate=${encodeURIComponent(dateRange.endDate)}&page=${currentPage}&size=${pageSize}`;
            }
        }

        console.log("Fetching orders from:", url);

        // Make API request
        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include' // Include cookies
        })
            .then(response => {
                console.log("Response status:", response.status);

                if (response.status === 401) {
                    // Handle unauthorized (token expired)
                    throw new Error('Unauthorized - Please login again');
                } else if (response.status === 403) {
                    // Handle forbidden
                    throw new Error('Forbidden - You do not have permission to access this resource');
                } else if (!response.ok) {
                    throw new Error(`Failed to load orders: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Hide loading spinner
                document.getElementById('loadingSpinner').style.display = 'none';

                console.log("Orders data:", data);

                // Check if response is successful
                if (data.code === 200) {
                    // Process and display orders
                    displayOrders(data.data);
                    // Update pagination
                    updatePagination(data.data);
                } else {
                    showAlert('danger', data.message || 'Failed to load orders');
                }
            })
            .catch(error => {
                // Hide loading spinner
                document.getElementById('loadingSpinner').style.display = 'none';
                console.error("Error loading orders:", error);
                showAlert('danger', error.message);

                // Display more detailed error message in dev console
                console.error("Detailed error:", error);

                // Temporary fallback - show mock data for development
                if (error.message.includes('Forbidden')) {
                    showAlert('warning', 'Using mock data for development. In production, ensure proper permissions are set.');

                    // Debugging help for the Forbidden error
                    console.log("Auth token being used:", authToken);
                    console.log("If you're getting a 403 Forbidden error, check:");
                    console.log("1. The backend security configuration - ensure /api/v1/orders/admin/** allows ADMIN role");
                    console.log("2. The token contains the correct role claim");
                    console.log("3. There's no CSRF token requirement");

                    // You could create mock data here for development purposes
                    // displayMockOrders();
                }

                // Check if token expired (401 error)
                if (error.message.includes('Unauthorized')) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('token');
                    setTimeout(() => {
                        window.location.href = 'authentication.html?redirect=' + encodeURIComponent('admin-orders.html');
                    }, 2000);
                }
            });
    }

    /**
     * Display orders in the table
     * @param {Object} pageData - Paginated order data from the API
     */
    function displayOrders(pageData) {
        const ordersTableBody = document.getElementById('ordersTableBody');
        ordersTableBody.innerHTML = '';

        // Check if content exists
        if (!pageData.content || pageData.content.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">No orders found.</td>
                </tr>
            `;
            return;
        }

        // Create rows for each order
        pageData.content.forEach(order => {
            const createdDate = new Date(order.createdAt).toLocaleString();

            let statusClass = '';
            switch(order.status) {
                case 'PENDING': statusClass = 'status-pending'; break;
                case 'PAID': statusClass = 'status-paid'; break;
                case 'PROCESSING': statusClass = 'status-processing'; break;
                case 'SHIPPED': statusClass = 'status-shipped'; break;
                case 'DELIVERED': statusClass = 'status-delivered'; break;
                case 'COMPLETED': statusClass = 'status-completed'; break;
                case 'CANCELLED': statusClass = 'status-cancelled'; break;
            }

            // Create the row HTML
            const rowHTML = `
                <tr>
                    <td><span class="order-id">${order.orderNumber}</span></td>
                    <td>
                        <div class="customer-cell">
                            <div class="customer-avatar">${getInitials(order.firstName, order.lastName)}</div>
                            <div>
                                ${order.firstName} ${order.lastName}<br>
                                <small>${order.userEmail}</small>
                            </div>
                        </div>
                    </td>
                    <td>${createdDate}</td>
                    <td><span class="order-status ${statusClass}">${order.status}</span></td>
                    <td>${order.orderItems ? order.orderItems.length : 0}</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td>
                        <div class="action-dropdown">
                            <button class="action-menu-btn" onclick="toggleActionMenu(this, event)">⋮</button>
                            <div class="action-menu-dropdown">
                                <div class="action-menu-item" onclick="viewOrderDetails(${order.id})">
                                    <span class="action-icon">👁️</span> View Details
                                </div>
                                ${order.status !== 'CANCELLED' ? `
                                <div class="action-menu-item" onclick="updateStatus(${order.id}, 'PROCESSING')">
                                    <span class="action-icon">🔄</span> Mark Processing
                                </div>
                                <div class="action-menu-item" onclick="updateStatus(${order.id}, 'SHIPPED')">
                                    <span class="action-icon">🚚</span> Mark Shipped
                                </div>
                                <div class="action-menu-item" onclick="updateStatus(${order.id}, 'DELIVERED')">
                                    <span class="action-icon">✅</span> Mark Delivered
                                </div>
                                <div class="action-menu-item" onclick="updateStatus(${order.id}, 'COMPLETED')">
                                    <span class="action-icon">✓</span> Mark Completed
                                </div>
                                <div class="action-menu-item" onclick="updateStatus(${order.id}, 'CANCELLED')">
                                    <span class="action-icon">❌</span> Cancel Order
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </td>
                </tr>
            `;

            ordersTableBody.innerHTML += rowHTML;
        });
    }

    /**
     * Update pagination controls
     * @param {Object} pageData - Paginated data from the API
     */
    function updatePagination(pageData) {
        const paginationDiv = document.getElementById('ordersPagination');
        paginationDiv.innerHTML = '';

        // Don't show pagination if there's only one page
        if (pageData.totalPages <= 1) {
            return;
        }

        // Previous button
        const prevBtn = document.createElement('a');
        prevBtn.href = '#';
        prevBtn.className = `pagination-btn ${pageData.first ? 'disabled' : ''}`;
        prevBtn.innerHTML = '&laquo;';
        if (!pageData.first) {
            prevBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (currentPage > 0) {
                    currentPage--;
                    loadOrders();
                }
            });
        }
        paginationDiv.appendChild(prevBtn);

        // Page numbers
        const startPage = Math.max(0, pageData.number - 2);
        const endPage = Math.min(pageData.totalPages - 1, pageData.number + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('a');
            pageBtn.href = '#';
            pageBtn.className = `pagination-btn ${i === pageData.number ? 'active' : ''}`;
            pageBtn.textContent = i + 1;
            pageBtn.addEventListener('click', function(e) {
                e.preventDefault();
                currentPage = i;
                loadOrders();
            });
            paginationDiv.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('a');
        nextBtn.href = '#';
        nextBtn.className = `pagination-btn ${pageData.last ? 'disabled' : ''}`;
        nextBtn.innerHTML = '&raquo;';
        if (!pageData.last) {
            nextBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (currentPage < pageData.totalPages - 1) {
                    currentPage++;
                    loadOrders();
                }
            });
        }
        paginationDiv.appendChild(nextBtn);
    }

    /**
     * Get date range from date filter
     * @param {string} filter - Date filter value
     * @returns {Object|null} Date range object with startDate and endDate strings
     */
    function getDateRange(filter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate, endDate;

        switch(filter) {
            case 'today':
                startDate = new Date(today);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;

            case 'yesterday':
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 1);
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                break;

            case 'last7days':
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 6);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;

            case 'last30days':
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 29);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;

            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;

            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                endDate.setHours(23, 59, 59, 999);
                break;

            default:
                return null;
        }

        // Format dates as ISO strings for the API
        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
    }

    /**
     * View order details
     * @param {number} orderId - The ID of the order to view
     */
    function viewOrderDetails(orderId) {
        // Show loading spinner
        document.getElementById('loadingSpinner').style.display = 'flex';

        // Make API request to get order details
        fetch(`${API_BASE_URL}/api/v1/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
            .then(response => {
                if (response.status === 401) {
                    // Handle unauthorized (token expired)
                    throw new Error('Unauthorized - Please login again');
                } else if (response.status === 403) {
                    throw new Error('Forbidden - You do not have permission to access this order');
                } else if (!response.ok) {
                    throw new Error(`Failed to load order details: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Hide loading spinner
                document.getElementById('loadingSpinner').style.display = 'none';

                // Check if response is successful
                if (data.code === 200) {
                    // Display order details in modal
                    displayOrderDetails(data.data);
                    // Show modal
                    document.getElementById('orderDetailModal').classList.add('show');
                } else {
                    showAlert('danger', data.message || 'Failed to load order details');
                }
            })
            .catch(error => {
                // Hide loading spinner
                document.getElementById('loadingSpinner').style.display = 'none';
                console.error("Error loading order details:", error);
                showAlert('danger', error.message);

                // Check if token expired (401 error)
                if (error.message.includes('Unauthorized')) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('token');
                    setTimeout(() => {
                        window.location.href = 'authentication.html?redirect=' + encodeURIComponent('admin-orders.html');
                    }, 2000);
                }
            });
    }

    /**
     * Display order details in modal
     * @param {Object} order - The order object
     */
    function displayOrderDetails(order) {
        const orderDetailContent = document.getElementById('orderDetailContent');

        // Format date
        const createdDate = new Date(order.createdAt).toLocaleString();
        const updatedDate = order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A';

        // Shipping address
        const shippingAddress = order.shippingAddress || {};
        const shippingAddressHTML = `
            ${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}<br>
            ${shippingAddress.address || ''} ${shippingAddress.address2 ? ', ' + shippingAddress.address2 : ''}<br>
            ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}<br>
            ${shippingAddress.country || ''}<br>
            ${shippingAddress.phone || ''}
        `;

        // Billing address
        const billingAddress = order.billingAddress || {};
        const billingAddressHTML = `
            ${billingAddress.firstName || ''} ${billingAddress.lastName || ''}<br>
            ${billingAddress.address || ''} ${billingAddress.address2 ? ', ' + billingAddress.address2 : ''}<br>
            ${billingAddress.city || ''}, ${billingAddress.state || ''} ${billingAddress.zipCode || ''}<br>
            ${billingAddress.country || ''}<br>
            ${billingAddress.phone || ''}
        `;

        // Status select options
        const statusOptions = [
            'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'
        ].map(status => `
            <option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>
        `).join('');

        // Order items
        const orderItemsHTML = order.orderItems.map(item => `
            <div class="item-row">
                <div class="item-image">
                    <img src="${item.productImage || 'placeholder.jpg'}" alt="${item.productName}">
                </div>
                <div>
                    <div class="item-name">${item.productName}</div>
                    <div class="item-meta">
                        ${item.productSize || ''} ${item.productType ? ' | ' + item.productType : ''}
                    </div>
                </div>
                <div class="item-price">$${item.price.toFixed(2)}</div>
                <div class="item-quantity">${item.quantity}</div>
                <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');

        // Build full modal content
        const modalHTML = `
            <div class="order-details">
                <div class="order-info">
                    <h3 class="detail-title">Order Information</h3>
                    <div class="detail-row">
                        <div class="detail-label">Order #:</div>
                        <div class="detail-value">${order.orderNumber}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Date:</div>
                        <div class="detail-value">${createdDate}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Status:</div>
                        <div class="detail-value">
                            <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Last Updated:</div>
                        <div class="detail-value">${updatedDate}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Payment:</div>
                        <div class="detail-value">${order.paymentMethod || 'N/A'}</div>
                    </div>
                </div>
                
                <div class="customer-info">
                    <h3 class="detail-title">Customer Information</h3>
                    <div class="detail-row">
                        <div class="detail-label">Name:</div>
                        <div class="detail-value">${order.firstName} ${order.lastName}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Email:</div>
                        <div class="detail-value">${order.userEmail}</div>
                    </div>
                </div>
                
                <div class="shipping-info">
                    <h3 class="detail-title">Shipping Address</h3>
                    <div class="detail-value">${shippingAddressHTML}</div>
                </div>
                
                <div class="payment-info">
                    <h3 class="detail-title">Billing Address</h3>
                    <div class="detail-value">${billingAddressHTML}</div>
                </div>
            </div>
            
            <div class="order-items">
                <h3 class="detail-title">Order Items</h3>
                <div class="item-row item-header">
                    <div>Image</div>
                    <div>Product</div>
                    <div>Price</div>
                    <div>Quantity</div>
                    <div>Total</div>
                </div>
                ${orderItemsHTML}
            </div>
            
            <div class="order-summary">
                <div class="summary-table">
                    <div class="summary-row">
                        <div class="summary-label">Subtotal:</div>
                        <div class="summary-value">$${order.subtotal.toFixed(2)}</div>
                    </div>
                    <div class="summary-row">
                        <div class="summary-label">Tax:</div>
                        <div class="summary-value">$${order.tax.toFixed(2)}</div>
                    </div>
                    <div class="summary-row">
                        <div class="summary-label">Shipping:</div>
                        <div class="summary-value">$${order.shippingCost.toFixed(2)}</div>
                    </div>
                    ${order.discountAmount > 0 ? `
                    <div class="summary-row">
                        <div class="summary-label">Discount:</div>
                        <div class="summary-value">-$${order.discountAmount.toFixed(2)}</div>
                    </div>
                    ` : ''}
                    <div class="summary-row summary-total">
                        <div class="summary-label">Total:</div>
                        <div class="summary-value">$${order.total.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            <div class="update-status">
                <div class="status-label">Update Status:</div>
                <select id="orderStatusSelect" class="status-select">
                    ${statusOptions}
                </select>
                <input type="hidden" id="editOrderId" value="${order.id}">
            </div>
        `;

        // Set the modal content
        orderDetailContent.innerHTML = modalHTML;
    }

    /**
     * Close order detail modal
     */
    function closeOrderDetailModal() {
        document.getElementById('orderDetailModal').classList.remove('show');
    }

    /**
     * Update order status from modal
     */
    function updateOrderStatus() {
        const orderId = document.getElementById('editOrderId').value;
        const newStatus = document.getElementById('orderStatusSelect').value;

        // Update the status
        updateOrderStatusRequest(orderId, newStatus);
    }

    /**
     * Update order status with API request
     * @param {number} orderId - The ID of the order to update
     * @param {string} status - The new status
     */
    function updateOrderStatusRequest(orderId, status) {
        // Show loading spinner
        document.getElementById('loadingSpinner').style.display = 'flex';

        // Make API request to update order status
        fetch(`${API_BASE_URL}/api/v1/orders/admin/${orderId}/status?status=${status}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
            .then(response => {
                if (response.status === 401) {
                    // Handle unauthorized (token expired)
                    throw new Error('Unauthorized - Please login again');
                } else if (response.status === 403) {
                    throw new Error('Forbidden - You do not have permission to update this order');
                } else if (!response.ok) {
                    throw new Error(`Failed to update order status: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Hide loading spinner
                document.getElementById('loadingSpinner').style.display = 'none';

                // Check if response is successful
                if (data.code === 200) {
                    // Close modal if open
                    document.getElementById('orderDetailModal').classList.remove('show');

                    // Show success message
                    showAlert('success', 'Order status updated successfully');

                    // Reload orders
                    loadOrders();
                } else {
                    showAlert('danger', data.message || 'Failed to update order status');
                }
            })
            .catch(error => {
                // Hide loading spinner
                document.getElementById('loadingSpinner').style.display = 'none';
                console.error("Error updating order status:", error);
                showAlert('danger', error.message);

                // Check if token expired (401 error)
                if (error.message.includes('Unauthorized')) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('token');
                    setTimeout(() => {
                        window.location.href = 'authentication.html?redirect=' + encodeURIComponent('admin-orders.html');
                    }, 2000);
                }
            });
    }

    /**
     * Show alert message
     * @param {string} type - Alert type (success, danger, warning)
     * @param {string} message - Alert message
     */
    function showAlert(type, message) {
        const alertId = `alert${type.charAt(0).toUpperCase() + type.slice(1)}`;
        const alertElement = document.getElementById(alertId);

        alertElement.textContent = message;
        alertElement.classList.add('show');

        // Hide alert after 5 seconds
        setTimeout(() => {
            alertElement.classList.remove('show');
        }, 5000);
    }

    /**
     * Get initials from name
     * @param {string} firstName - First name
     * @param {string} lastName - Last name
     * @returns {string} Initials
     */
    function getInitials(firstName, lastName) {
        const firstInitial = firstName ? firstName.charAt(0) : '';
        const lastInitial = lastName ? lastName.charAt(0) : '';
        return (firstInitial + lastInitial).toUpperCase();
    }
});

// Global functions for table row actions

/**
 * Toggle action menu dropdown
 * @param {HTMLElement} button - The button that was clicked
 * @param {Event} event - The click event
 */
function toggleActionMenu(button, event) {
    // Prevent event from bubbling up
    event.stopPropagation();

    // Close all other open dropdowns
    const dropdowns = document.querySelectorAll('.action-menu-dropdown.show');
    dropdowns.forEach(dropdown => {
        if (dropdown !== button.nextElementSibling) {
            dropdown.classList.remove('show');
        }
    });

    // Toggle current dropdown
    button.nextElementSibling.classList.toggle('show');

    // Add click outside listener to close dropdown
    document.addEventListener('click', function closeDropdown(e) {
        if (!e.target.closest('.action-dropdown')) {
            button.nextElementSibling.classList.remove('show');
            document.removeEventListener('click', closeDropdown);
        }
    });
}

/**
 * View order details (global function for table row buttons)
 * @param {number} orderId - The ID of the order to view
 */
function viewOrderDetails(orderId) {
    // Show loading spinner
    document.getElementById('loadingSpinner').style.display = 'flex';

    // Get authentication token
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');

    // Make API request to get order details
    fetch(`${API_BASE_URL}/api/v1/orders/${orderId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
        .then(response => {
            if (response.status === 401) {
                throw new Error('Unauthorized - Please login again');
            } else if (response.status === 403) {
                throw new Error('Forbidden - You do not have permission to access this order');
            } else if (!response.ok) {
                throw new Error(`Failed to load order details: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide loading spinner
            document.getElementById('loadingSpinner').style.display = 'none';

            // Check if response is successful
            if (data.code === 200) {
                // Display order details in modal
                displayOrderDetails(data.data);
                // Show modal
                document.getElementById('orderDetailModal').classList.add('show');
            } else {
                showAlert('danger', data.message || 'Failed to load order details');
            }
        })
        .catch(error => {
            // Hide loading spinner
            document.getElementById('loadingSpinner').style.display = 'none';
            console.error("Error viewing order details:", error);
            showAlert('danger', error.message);

            // Handle authentication errors
            if (error.message.includes('Unauthorized')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                setTimeout(() => {
                    window.location.href = 'authentication.html?redirect=' + encodeURIComponent('admin-orders.html');
                }, 2000);
            }
        });
}

/**
 * Display order details in modal (global function)
 * @param {Object} order - The order object
 */
function displayOrderDetails(order) {
    const orderDetailContent = document.getElementById('orderDetailContent');

    // Format date
    const createdDate = new Date(order.createdAt).toLocaleString();
    const updatedDate = order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A';

    // Shipping address
    const shippingAddress = order.shippingAddress || {};
    const shippingAddressHTML = `
        ${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}<br>
        ${shippingAddress.address || ''} ${shippingAddress.address2 ? ', ' + shippingAddress.address2 : ''}<br>
        ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}<br>
        ${shippingAddress.country || ''}<br>
        ${shippingAddress.phone || ''}
    `;

    // Billing address
    const billingAddress = order.billingAddress || {};
    const billingAddressHTML = `
        ${billingAddress.firstName || ''} ${billingAddress.lastName || ''}<br>
        ${billingAddress.address || ''} ${billingAddress.address2 ? ', ' + billingAddress.address2 : ''}<br>
        ${billingAddress.city || ''}, ${billingAddress.state || ''} ${billingAddress.zipCode || ''}<br>
        ${billingAddress.country || ''}<br>
        ${billingAddress.phone || ''}
    `;

    // Status select options
    const statusOptions = [
        'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'
    ].map(status => `
        <option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>
    `).join('');

    // Order items
    const orderItemsHTML = order.orderItems.map(item => `
        <div class="item-row">
            <div class="item-image">
                <img src="${item.productImage || 'placeholder.jpg'}" alt="${item.productName}">
            </div>
            <div>
                <div class="item-name">${item.productName}</div>
                <div class="item-meta">
                    ${item.productSize || ''} ${item.productType ? ' | ' + item.productType : ''}
                </div>
            </div>
            <div class="item-price">$${item.price.toFixed(2)}</div>
            <div class="item-quantity">${item.quantity}</div>
            <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    // Build full modal content
    const modalHTML = `
        <div class="order-details">
            <div class="order-info">
                <h3 class="detail-title">Order Information</h3>
                <div class="detail-row">
                    <div class="detail-label">Order #:</div>
                    <div class="detail-value">${order.orderNumber}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Date:</div>
                    <div class="detail-value">${createdDate}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status:</div>
                    <div class="detail-value">
                        <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Last Updated:</div>
                    <div class="detail-value">${updatedDate}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Payment:</div>
                    <div class="detail-value">${order.paymentMethod || 'N/A'}</div>
                </div>
            </div>
            
            <div class="customer-info">
                <h3 class="detail-title">Customer Information</h3>
                <div class="detail-row">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value">${order.firstName} ${order.lastName}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">${order.userEmail}</div>
                </div>
            </div>
            
            <div class="shipping-info">
                <h3 class="detail-title">Shipping Address</h3>
                <div class="detail-value">${shippingAddressHTML}</div>
            </div>
            
            <div class="payment-info">
                <h3 class="detail-title">Billing Address</h3>
                <div class="detail-value">${billingAddressHTML}</div>
            </div>
        </div>
        
        <div class="order-items">
            <h3 class="detail-title">Order Items</h3>
            <div class="item-row item-header">
                <div>Image</div>
                <div>Product</div>
                <div>Price</div>
                <div>Quantity</div>
                <div>Total</div>
            </div>
            ${orderItemsHTML}
        </div>
        
        <div class="order-summary">
            <div class="summary-table">
                <div class="summary-row">
                    <div class="summary-label">Subtotal:</div>
                    <div class="summary-value">$${order.subtotal.toFixed(2)}</div>
                </div>
                <div class="summary-row">
                    <div class="summary-label">Tax:</div>
                    <div class="summary-value">$${order.tax.toFixed(2)}</div>
                </div>
                <div class="summary-row">
                    <div class="summary-label">Shipping:</div>
                    <div class="summary-value">$${order.shippingCost.toFixed(2)}</div>
                </div>
                ${order.discountAmount > 0 ? `
                <div class="summary-row">
                    <div class="summary-label">Discount:</div>
                    <div class="summary-value">-$${order.discountAmount.toFixed(2)}</div>
                </div>
                ` : ''}
                <div class="summary-row summary-total">
                    <div class="summary-label">Total:</div>
                    <div class="summary-value">$${order.total.toFixed(2)}</div>
                </div>
            </div>
        </div>
        
        <div class="update-status">
            <div class="status-label">Update Status:</div>
            <select id="orderStatusSelect" class="status-select">
                ${statusOptions}
            </select>
            <input type="hidden" id="editOrderId" value="${order.id}">
        </div>
    `;

    // Set the modal content
    orderDetailContent.innerHTML = modalHTML;
}

/**
 * Update order status from table actions
 * @param {number} orderId - The ID of the order to update
 * @param {string} status - The new status
 */
function updateStatus(orderId, status) {
    // Close action menu dropdown if open
    const dropdowns = document.querySelectorAll('.action-menu-dropdown.show');
    dropdowns.forEach(dropdown => dropdown.classList.remove('show'));

    // Show loading spinner
    document.getElementById('loadingSpinner').style.display = 'flex';

    // Get authentication token
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');

    // Make API request to update order status
    fetch(`${API_BASE_URL}/api/v1/orders/admin/${orderId}/status?status=${status}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
        .then(response => {
            if (response.status === 401) {
                throw new Error('Unauthorized - Please login again');
            } else if (response.status === 403) {
                throw new Error('Forbidden - You do not have permission to update this order');
            } else if (!response.ok) {
                throw new Error(`Failed to update order status: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide loading spinner
            document.getElementById('loadingSpinner').style.display = 'none';

            // Check if response is successful
            if (data.code === 200) {
                // Close modal if open
                document.getElementById('orderDetailModal').classList.remove('show');

                // Show success message
                showAlert('success', 'Order status updated successfully');

                // Reload the page to refresh order list
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showAlert('danger', data.message || 'Failed to update order status');
            }
        })
        .catch(error => {
            // Hide loading spinner
            document.getElementById('loadingSpinner').style.display = 'none';
            console.error("Error updating order status:", error);
            showAlert('danger', error.message);

            // Handle authentication errors
            if (error.message.includes('Unauthorized')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                setTimeout(() => {
                    window.location.href = 'authentication.html?redirect=' + encodeURIComponent('admin-orders.html');
                }, 2000);
            }
        });
}

/**
 * Show alert message (global function)
 * @param {string} type - Alert type (success, danger, warning)
 * @param {string} message - Alert message
 */
function showAlert(type, message) {
    const alertId = `alert${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const alertElement = document.getElementById(alertId);

    if (!alertElement) {
        console.error(`Alert element with id ${alertId} not found`);
        return;
    }

    alertElement.textContent = message;
    alertElement.classList.add('show');

    // Hide alert after 5 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 5000);
}