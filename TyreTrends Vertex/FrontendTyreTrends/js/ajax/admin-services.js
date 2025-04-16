// admin-services.js - Service Booking Admin Management

// Base API URL
const API_BASE_URL = "http://localhost:8080/api/v1";

// Page state
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let currentStatus = null;
let currentSearch = "";
let bookings = [];
let statusCounts = {
    PENDING: 0,
    CONFIRMED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0
};

$(document).ready(function() {
    // Initialize UI components
    initUI();

    // Setup event listeners
    setupEventListeners();

    // Load data - this will perform auth check
    loadInitialData();
});

/**
 * Initialize UI components
 */
function initUI() {
    // Initialize user dropdown
    $("#user-dropdown-toggle").on("click", function(e) {
        e.preventDefault();
        $("#user-dropdown-menu").toggleClass("active");
    });

    // Close dropdown when clicking outside
    $(document).on("click", function(e) {
        if (!$(e.target).closest(".user-dropdown").length) {
            $("#user-dropdown-menu").removeClass("active");
        }
    });

    // Initialize sidebar toggle
    $(".menu-toggle").on("click", function() {
        $("#sidebar").toggleClass("active");
        $("body").toggleClass("sidebar-collapsed");
    });

    // Set user avatar and name
    const userName = localStorage.getItem('userName') || 'Admin';
    $(".user-name").text(userName);
    $(".user-avatar").text(userName.charAt(0));
}

/**
 * Load initial data and perform auth check
 */
function loadInitialData() {
    const token = localStorage.getItem('token');

    if (!token) {
        // No token, redirect to login
        window.location.href = "authentication.html?redirect=admin-services.html";
        return;
    }

    showLoading();

    // Try to load dashboard stats - if this fails with 401/403, redirect to login
    $.ajax({
        url: `${API_BASE_URL}/services/admin/all?page=0&size=1`,
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        success: function(response) {
            // Successfully loaded - user has admin access
            loadDashboardStats();
            loadBookings();
            hideLoading();
        },
        error: function(xhr) {
            hideLoading();

            if (xhr.status === 401 || xhr.status === 403) {
                // Unauthorized - redirect to login
                showAlert("danger", "Admin access required. Redirecting to login...");
                setTimeout(function() {
                    window.location.href = "authentication.html?redirect=admin-services.html";
                }, 2000);
            } else {
                // Other error
                showAlert("danger", "Error connecting to server. Please try again later.");
            }
        }
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Status filter change
    $("#statusFilter").on("change", function() {
        currentStatus = $(this).val() || null;
        currentPage = 0;
        loadBookings();
    });

    // Search input
    $("#searchInput").on("keyup", function(e) {
        if (e.key === "Enter") {
            currentSearch = $(this).val().trim();
            currentPage = 0;
            loadBookings();
        }
    });

    // Search button
    $("#searchBtn").on("click", function() {
        currentSearch = $("#searchInput").val().trim();
        currentPage = 0;
        loadBookings();
    });

    // Reset filters
    $("#resetFiltersBtn").on("click", function() {
        $("#statusFilter").val("");
        $("#searchInput").val("");
        currentStatus = null;
        currentSearch = "";
        currentPage = 0;
        loadBookings();
    });

    // Pagination
    $(document).on("click", ".pagination-item:not(.disabled)", function() {
        const action = $(this).data("action");

        if (action === "prev") {
            if (currentPage > 0) currentPage--;
        } else if (action === "next") {
            if (currentPage < totalPages - 1) currentPage++;
        } else {
            currentPage = parseInt($(this).text()) - 1;
        }

        loadBookings();
    });

    // View booking details
    $(document).on("click", ".view-booking-btn", function() {
        const bookingId = $(this).data("id");
        viewBookingDetails(bookingId);
    });

    // Update booking status
    $(document).on("click", ".update-status-btn", function() {
        const bookingId = $(this).data("id");
        openUpdateStatusModal(bookingId);
    });

    // Delete booking
    $(document).on("click", ".delete-booking-btn", function() {
        const bookingId = $(this).data("id");
        confirmDeleteBooking(bookingId);
    });

    // Save status update
    $("#saveStatusBtn").on("click", function() {
        const bookingId = $("#bookingIdInput").val();
        const status = $("#statusInput").val();
        updateBookingStatus(bookingId, status);
    });

    // Confirm delete booking
    $("#confirmDeleteBtn").on("click", function() {
        const bookingId = $("#deleteBookingId").val();
        deleteBooking(bookingId);
    });

    // Close modals
    $(".modal-close, .modal-cancel").on("click", function() {
        closeAllModals();
    });

    // Close modals when clicking outside
    $(".modal-overlay").on("click", function(e) {
        if ($(e.target).hasClass("modal-overlay")) {
            closeAllModals();
        }
    });
}

/**
 * Load dashboard statistics
 */
function loadDashboardStats() {
    showLoading();

    const token = localStorage.getItem('token');
    if (!token) {
        hideLoading();
        showAlert("danger", "Session expired. Please log in again.");
        setTimeout(function() {
            window.location.href = "authentication.html?redirect=admin-services.html";
        }, 2000);
        return;
    }

    $.ajax({
        url: `${API_BASE_URL}/services/admin/all?page=0&size=1`,
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        success: function(response) {
            if (response.code === 200) {
                totalPages = response.data.totalPages;
                updateStatusCounts();
            } else {
                showAlert("danger", "Failed to load bookings data");
            }
            hideLoading();
        },
        error: function(xhr) {
            console.error("Error loading bookings data:", xhr);

            if (xhr.status === 401 || xhr.status === 403) {
                // Unauthorized - redirect to login
                showAlert("danger", "Session expired. Redirecting to login...");
                setTimeout(function() {
                    window.location.href = "authentication.html?redirect=admin-services.html";
                }, 2000);
            } else {
                showAlert("danger", "An error occurred while loading bookings data");
            }

            hideLoading();
        }
    });
}

/**
 * Update status counts for dashboard stats
 */
function updateStatusCounts() {
    const statuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];
    const token = localStorage.getItem('token');

    if (!token) {
        showAlert("danger", "Session expired. Please log in again.");
        setTimeout(function() {
            window.location.href = "authentication.html?redirect=admin-services.html";
        }, 2000);
        return;
    }

    let completedRequests = 0;
    const totalRequests = statuses.length;

    statuses.forEach(status => {
        $.ajax({
            url: `${API_BASE_URL}/services/admin/all?page=0&size=1&status=${status}`,
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function(response) {
                if (response.code === 200) {
                    statusCounts[status] = response.data.totalElements;
                }

                completedRequests++;
                if (completedRequests === totalRequests) {
                    updateStatCards();
                }
            },
            error: function(xhr) {
                completedRequests++;
                if (completedRequests === totalRequests) {
                    updateStatCards();
                }

                if (xhr.status === 401 || xhr.status === 403) {
                    // Don't redirect here to avoid multiple redirects
                    console.error("Authentication error in status count");
                }
            }
        });
    });
}

/**
 * Update stat cards with the latest status counts
 */
function updateStatCards() {
    $("#pendingCount").text(statusCounts.PENDING);
    $("#confirmedCount").text(statusCounts.CONFIRMED);
    $("#inProgressCount").text(statusCounts.IN_PROGRESS);
    $("#completedCount").text(statusCounts.COMPLETED);
}

/**
 * Load service bookings
 */
function loadBookings() {
    showLoading();

    const token = localStorage.getItem('token');
    if (!token) {
        hideLoading();
        showAlert("danger", "Session expired. Please log in again.");
        setTimeout(function() {
            window.location.href = "authentication.html?redirect=admin-services.html";
        }, 2000);
        return;
    }

    let url = `${API_BASE_URL}/services/admin/all?page=${currentPage}&size=${pageSize}`;

    if (currentStatus) {
        url += `&status=${currentStatus}`;
    }

    if (currentSearch) {
        url += `&search=${encodeURIComponent(currentSearch)}`;
    }

    $.ajax({
        url: url,
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        success: function(response) {
            if (response.code === 200) {
                bookings = response.data.content;
                totalPages = response.data.totalPages;

                renderBookingsTable();
                renderPagination();

                // Update booking count
                $("#bookingsCount").text(`Showing ${bookings.length} of ${response.data.totalElements} bookings`);
            } else {
                showAlert("danger", "Failed to load bookings");
            }
            hideLoading();
        },
        error: function(xhr) {
            console.error("Error loading bookings:", xhr);

            if (xhr.status === 401 || xhr.status === 403) {
                // Unauthorized - redirect to login
                showAlert("danger", "Session expired. Redirecting to login...");
                setTimeout(function() {
                    window.location.href = "authentication.html?redirect=admin-services.html";
                }, 2000);
            } else {
                showAlert("danger", "An error occurred while loading bookings");
            }

            hideLoading();
        }
    });
}

/**
 * Render bookings table
 */
function renderBookingsTable() {
    const tableBody = $("#bookingsTableBody");
    tableBody.empty();

    if (bookings.length === 0) {
        tableBody.html(`
            <tr>
                <td colspan="7" class="text-center">No bookings found</td>
            </tr>
        `);
        return;
    }

    bookings.forEach(booking => {
        const row = $("<tr>");

        row.html(`
            <td>${booking.bookingNumber}</td>
            <td>
                <div class="customer-cell">
                    <div class="customer-avatar">${getInitials(booking.userName)}</div>
                    <div>
                        <div>${booking.userName}</div>
                        <div style="font-size: 12px; color: var(--dark-gray);">${booking.userEmail}</div>
                    </div>
                </div>
            </td>
            <td>${booking.serviceTypeName}</td>
            <td>${booking.vehicleInfo}</td>
            <td>${formatDate(booking.date)} ${formatTime(booking.time)}</td>
            <td>
                <span class="booking-status status-${booking.status.toLowerCase()}">${formatStatus(booking.status)}</span>
            </td>
            <td>
                <div class="booking-actions">
                    <button class="action-button view-booking-btn" data-id="${booking.id}" title="View Details">👁️</button>
                    <button class="action-button update-status-btn" data-id="${booking.id}" title="Update Status">📝</button>
                    <button class="action-button delete-booking-btn" data-id="${booking.id}" title="Delete">🗑️</button>
                </div>
            </td>
        `);

        tableBody.append(row);
    });
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const pagination = $("#pagination");
    pagination.empty();

    // Previous button
    pagination.append(`
        <div class="pagination-item ${currentPage === 0 ? 'disabled' : ''}" data-action="prev">
            &laquo;
        </div>
    `);

    // Page numbers
    const maxPages = Math.min(totalPages, 5);
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(0, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pagination.append(`
            <div class="pagination-item ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i + 1}
            </div>
        `);
    }

    // Next button
    pagination.append(`
        <div class="pagination-item ${currentPage === totalPages - 1 ? 'disabled' : ''}" data-action="next">
            &raquo;
        </div>
    `);
}

/**
 * View booking details
 * @param {number} bookingId Booking ID
 */
function viewBookingDetails(bookingId) {
    showLoading();

    const token = localStorage.getItem('token');
    if (!token) {
        hideLoading();
        showAlert("danger", "Session expired. Please log in again.");
        setTimeout(function() {
            window.location.href = "authentication.html?redirect=admin-services.html";
        }, 2000);
        return;
    }

    $.ajax({
        url: `${API_BASE_URL}/services/${bookingId}`,
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        success: function(response) {
            if (response.code === 200) {
                const booking = response.data;

                // Populate modal with booking details
                $("#viewModalTitle").text(`Booking #${booking.bookingNumber}`);

                const statusClass = `status-${booking.status.toLowerCase()}`;
                const formattedStatus = formatStatus(booking.status);

                let completedDate = '';
                if (booking.completedAt) {
                    completedDate = `<div><strong>Completed:</strong> ${formatDateTime(booking.completedAt)}</div>`;
                }

                let cancelledDate = '';
                if (booking.cancelledAt) {
                    cancelledDate = `<div><strong>Cancelled:</strong> ${formatDateTime(booking.cancelledAt)}</div>`;
                }

                $("#viewModalBody").html(`
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <div>
                            <div style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">${booking.serviceTypeName}</div>
                            <div><span class="booking-status ${statusClass}">${formattedStatus}</span></div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">$${booking.price.toFixed(2)}</div>
                            <div>${booking.isPaid ? '<span style="color: var(--success);">Paid</span>' : '<span style="color: var(--warning);">Unpaid</span>'}</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div>
                            <h4 style="font-size: 16px; margin-bottom: 10px;">Customer Information</h4>
                            <div><strong>Name:</strong> ${booking.userName}</div>
                            <div><strong>Email:</strong> ${booking.userEmail}</div>
                            <div><strong>Phone:</strong> ${booking.userPhone || 'N/A'}</div>
                        </div>
                        
                        <div>
                            <h4 style="font-size: 16px; margin-bottom: 10px;">Vehicle Information</h4>
                            <div><strong>Vehicle:</strong> ${booking.vehicleInfo}</div>
                            <div><strong>Vehicle ID:</strong> ${booking.vehicleId}</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="font-size: 16px; margin-bottom: 10px;">Appointment Details</h4>
                        <div><strong>Date:</strong> ${formatDate(booking.date)}</div>
                        <div><strong>Time:</strong> ${formatTime(booking.time)}</div>
                        <div><strong>Booking Created:</strong> ${formatDateTime(booking.createdAt)}</div>
                        <div><strong>Last Updated:</strong> ${formatDateTime(booking.updatedAt)}</div>
                        ${completedDate}
                        ${cancelledDate}
                    </div>
                    
                    <div>
                        <h4 style="font-size: 16px; margin-bottom: 10px;">Notes</h4>
                        <div style="background-color: var(--light-gray); padding: 10px; border-radius: 4px;">
                            ${booking.notes || 'No notes provided'}
                        </div>
                    </div>
                `);

                // Show the modal
                $("#viewBookingModal").addClass("active");
            } else {
                showAlert("danger", "Failed to load booking details");
            }
            hideLoading();
        },
        error: function(xhr) {
            console.error("Error loading booking details:", xhr);

            if (xhr.status === 401 || xhr.status === 403) {
                // Unauthorized - redirect to login
                showAlert("danger", "Session expired. Redirecting to login...");
                setTimeout(function() {
                    window.location.href = "authentication.html?redirect=admin-services.html";
                }, 2000);
            } else {
                showAlert("danger", "An error occurred while loading booking details");
            }

            hideLoading();
        }
    });
}

/**
 * Open update status modal
 * @param {number} bookingId Booking ID
 */
function openUpdateStatusModal(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
        showAlert("danger", "Booking not found");
        return;
    }

    $("#updateStatusModalTitle").text(`Update Status - Booking #${booking.bookingNumber}`);
    $("#bookingIdInput").val(booking.id);
    $("#statusInput").val(booking.status);

    // Show current booking info
    $("#currentBookingInfo").html(`
        <div><strong>Customer:</strong> ${booking.userName}</div>
        <div><strong>Service:</strong> ${booking.serviceTypeName}</div>
        <div><strong>Vehicle:</strong> ${booking.vehicleInfo}</div>
        <div><strong>Date:</strong> ${formatDate(booking.date)} ${formatTime(booking.time)}</div>
        <div><strong>Current Status:</strong> <span class="booking-status status-${booking.status.toLowerCase()}">${formatStatus(booking.status)}</span></div>
    `);

    // Show the modal
    $("#updateStatusModal").addClass("active");
}

/**
 * Update booking status
 * @param {number} bookingId Booking ID
 * @param {string} status New status
 */
function updateBookingStatus(bookingId, status) {
    showLoading();

    const token = localStorage.getItem('token');
    if (!token) {
        hideLoading();
        showAlert("danger", "Session expired. Please log in again.");
        setTimeout(function() {
            window.location.href = "authentication.html?redirect=admin-services.html";
        }, 2000);
        return;
    }

    $.ajax({
        url: `${API_BASE_URL}/services/admin/${bookingId}/status?status=${status}`,
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        success: function(response) {
            if (response.code === 200) {
                showAlert("success", "Booking status updated successfully");
                closeAllModals();
                loadDashboardStats();
                loadBookings();
            } else {
                showAlert("danger", "Failed to update booking status");
            }
            hideLoading();
        },
        error: function(xhr) {
            console.error("Error updating booking status:", xhr);

            if (xhr.status === 401 || xhr.status === 403) {
                // Unauthorized - redirect to login
                showAlert("danger", "Session expired. Redirecting to login...");
                setTimeout(function() {
                    window.location.href = "authentication.html?redirect=admin-services.html";
                }, 2000);
            } else {
                showAlert("danger", "An error occurred while updating booking status");
            }

            hideLoading();
        }
    });
}

/**
 * Confirm delete booking
 * @param {number} bookingId Booking ID
 */
function confirmDeleteBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
        showAlert("danger", "Booking not found");
        return;
    }

    $("#deleteModalTitle").text(`Delete Booking #${booking.bookingNumber}`);
    $("#deleteBookingId").val(booking.id);

    // Show booking info to confirm
    $("#deleteBookingInfo").html(`
        <p>Are you sure you want to delete this booking?</p>
        <div style="margin-top: 15px;">
            <div><strong>Booking Number:</strong> ${booking.bookingNumber}</div>
            <div><strong>Customer:</strong> ${booking.userName}</div>
            <div><strong>Service:</strong> ${booking.serviceTypeName}</div>
            <div><strong>Date:</strong> ${formatDate(booking.date)} ${formatTime(booking.time)}</div>
        </div>
        <div style="margin-top: 15px; color: var(--danger);">
            <strong>Warning:</strong> This action cannot be undone.
        </div>
    `);

    // Show the modal
    $("#deleteBookingModal").addClass("active");
}

/**
 * Delete booking
 * @param {number} bookingId Booking ID
 */
function deleteBooking(bookingId) {
    showLoading();

    const token = localStorage.getItem('token');
    if (!token) {
        hideLoading();
        showAlert("danger", "Session expired. Please log in again.");
        setTimeout(function() {
            window.location.href = "authentication.html?redirect=admin-services.html";
        }, 2000);
        return;
    }

    $.ajax({
        url: `${API_BASE_URL}/services/admin/${bookingId}`,
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        success: function(response) {
            if (response.code === 200) {
                showAlert("success", "Booking deleted successfully");
                closeAllModals();
                loadDashboardStats();
                loadBookings();
            } else {
                showAlert("danger", "Failed to delete booking");
            }
            hideLoading();
        },
        error: function(xhr) {
            console.error("Error deleting booking:", xhr);

            if (xhr.status === 401 || xhr.status === 403) {
                // Unauthorized - redirect to login
                showAlert("danger", "Session expired. Redirecting to login...");
                setTimeout(function() {
                    window.location.href = "authentication.html?redirect=admin-services.html";
                }, 2000);
            } else {
                showAlert("danger", "An error occurred while deleting booking");
            }

            hideLoading();
        }
    });
}

/**
 * Close all modals
 */
function closeAllModals() {
    $(".modal-overlay").removeClass("active");
}

/**
 * Show loading spinner
 */
function showLoading() {
    $("#loadingSpinner").addClass("active");
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    $("#loadingSpinner").removeClass("active");
}

/**
 * Show alert message
 * @param {string} type Alert type (success, danger, info)
 * @param {string} message Alert message
 */
function showAlert(type, message) {
    const alertElement = $(`#alert${type.charAt(0).toUpperCase() + type.slice(1)}`);

    alertElement.text(message);
    alertElement.addClass("active");

    // Hide alert after 5 seconds
    setTimeout(() => {
        alertElement.removeClass("active");
    }, 5000);
}

/**
 * Format date string (YYYY-MM-DD) to localized date
 * @param {string} dateStr Date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';

    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format time string (HH:MM) to 12-hour format
 * @param {string} timeStr Time string
 * @returns {string} Formatted time
 */
function formatTime(timeStr) {
    if (!timeStr) return 'N/A';

    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format date time string to localized date and time
 * @param {string} dateTimeStr Date time string
 * @returns {string} Formatted date and time
 */
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'N/A';

    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format status to display format
 * @param {string} status Status code
 * @returns {string} Formatted status
 */
function formatStatus(status) {
    if (!status) return 'Unknown';

    switch (status) {
        case 'PENDING': return 'Pending';
        case 'CONFIRMED': return 'Confirmed';
        case 'IN_PROGRESS': return 'In Progress';
        case 'COMPLETED': return 'Completed';
        case 'CANCELLED': return 'Cancelled';
        default: return status;
    }
}

/**
 * Get initials from name
 * @param {string} name Full name
 * @returns {string} Initials
 */
function getInitials(name) {
    if (!name) return '?';

    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}