// js/service-booking.js

// Base API URL
const API_BASE_URL = "http://localhost:8080/api/v1";

$(document).ready(function() {
    // Global state
    let vehicles = [];
    let serviceTypes = {
        'TIRE_INSTALLATION': { name: 'Tire Installation', price: 25.00, pricePerTire: true },
        'WHEEL_ALIGNMENT': { name: 'Wheel Alignment', price: 89.99 },
        'TIRE_ROTATION': { name: 'Tire Rotation', price: 39.99 },
        'TIRE_BALANCING': { name: 'Tire Balancing', price: 49.99 },
        'FLAT_REPAIR': { name: 'Flat Repair', price: 29.99, pricePerTire: true },
        'TIRE_INSPECTION': { name: 'Tire Inspection', price: 19.99 },
        'TPMS_SERVICE': { name: 'TPMS Service', price: 15.99 }
    };

    // Booking data
    let bookingData = {
        serviceType: 'TIRE_INSTALLATION',
        vehicleId: null,
        date: null,
        time: null,
        notes: ''
    };

    // Initialize page components
    initializeServiceBookingPage();

    /**
     * Initialize the service booking page
     */
    function initializeServiceBookingPage() {
        // Check for URL parameters - if there's a service selection
        const urlParams = new URLSearchParams(window.location.search);
        const serviceParam = urlParams.get('service');
        if (serviceParam) {
            // Convert parameter to service type format
            let serviceType = null;
            switch(serviceParam.toLowerCase()) {
                case 'installation': serviceType = 'TIRE_INSTALLATION'; break;
                case 'alignment': serviceType = 'WHEEL_ALIGNMENT'; break;
                case 'rotation': serviceType = 'TIRE_ROTATION'; break;
                case 'balancing': serviceType = 'TIRE_BALANCING'; break;
                case 'repair': serviceType = 'FLAT_REPAIR'; break;
                case 'inspection': serviceType = 'TIRE_INSPECTION'; break;
                case 'tpms': serviceType = 'TPMS_SERVICE'; break;
            }

            if (serviceType && serviceTypes[serviceType]) {
                bookingData.serviceType = serviceType;
                setTimeout(() => selectService(serviceType), 500);
            }
        }

        // Load user vehicles
        loadVehicles();

        // Generate date grid
        generateDateGrid();

        // Setup service type selection
        setupServiceTypeSelection();

        // Setup book service button
        $('#bookServiceBtn').on('click', bookService);

        // Setup vehicle modal
        setupVehicleModal();

        // Service card buttons
        $('.service-card button').on('click', function() {
            const serviceType = $(this).data('service');
            selectService(serviceType);
        });
    }

    /**
     * Load user vehicles from API
     */
    function loadVehicles() {
        const vehiclesContainer = $('#vehiclesContainer');
        const token = localStorage.getItem('token');

        if (!token) {
            // Show guest vehicle form
            vehiclesContainer.html(`
                <div class="no-vehicles-alert">
                    <p>Please sign in to access your saved vehicles or add a new vehicle below.</p>
                </div>

                <div class="vehicle-option selected" data-vehicle="guest">
                    <input type="radio" name="vehicleId" id="guestVehicle" value="guest" checked>
                    <div class="vehicle-details">
                        <div class="vehicle-name">Guest Vehicle</div>
                        <div class="vehicle-info">
                            Please provide vehicle details when booking
                        </div>
                    </div>
                </div>
            `);

            // Update summary
            updateSummary();

            // Show login prompt
            $('#loginPrompt').show();
            return;
        }

        // Show loading spinner
        vehiclesContainer.html('<div class="spinner-container"><div class="spinner"></div></div>');

        // Call API to get user vehicles
        $.ajax({
            url: `${API_BASE_URL}/vehicles`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(response) {
                if (response.code === 200) {
                    // Store vehicles
                    vehicles = response.data;

                    // Clear container
                    vehiclesContainer.empty();

                    // Check if user has any vehicles
                    if (!vehicles || vehicles.length === 0) {
                        // Show no vehicles message
                        vehiclesContainer.html(`
                            <div class="no-vehicles-alert">
                                <p>You don't have any saved vehicles. Please add a vehicle to continue.</p>
                            </div>
                        `);
                        return;
                    }

                    // Create vehicle options
                    vehicles.forEach((vehicle, index) => {
                        const vehicleOption = $('<div>', {
                            class: 'vehicle-option' + (index === 0 || vehicle.isPrimary ? ' selected' : ''),
                            'data-vehicle': vehicle.id
                        });

                        // Select first vehicle or default vehicle
                        if (index === 0 || vehicle.isPrimary) {
                            bookingData.vehicleId = vehicle.id;

                            // Update summary
                            $('#summaryVehicle').text(`${vehicle.year} ${vehicle.make} ${vehicle.model}`);
                        }

                        vehicleOption.html(`
                            <input type="radio" name="vehicleId" id="vehicle${vehicle.id}" value="${vehicle.id}" ${(index === 0 || vehicle.isPrimary) ? 'checked' : ''}>
                            <div class="vehicle-details">
                                <div class="vehicle-name">${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}</div>
                                <div class="vehicle-info">
                                    ${vehicle.tireSizesFront ? `Tire Size: ${vehicle.tireSizesFront}` : ''}
                                    ${vehicle.licensePlate ? ` | License: ${vehicle.licensePlate}` : ''}
                                </div>
                            </div>
                        `);

                        vehiclesContainer.append(vehicleOption);
                    });

                    // Add click event to vehicle options
                    $('.vehicle-option').on('click', function() {
                        // Remove selected class from all options
                        $('.vehicle-option').removeClass('selected');

                        // Add selected class to clicked option
                        $(this).addClass('selected');

                        // Update radio button
                        const radio = $(this).find('input[type="radio"]');
                        radio.prop('checked', true);

                        // Update booking data
                        bookingData.vehicleId = radio.val();

                        // Find selected vehicle
                        const selectedVehicle = vehicles.find(v => v.id == radio.val());

                        // Update summary
                        if (selectedVehicle) {
                            $('#summaryVehicle').text(`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`);
                        }
                    });

                    // Update summary
                    updateSummary();
                } else {
                    showAlert('error', response.message || 'Failed to load vehicles');
                }
            },
            error: function(xhr) {
                console.error('Error loading vehicles:', xhr);

                // Show error message
                vehiclesContainer.html(`
                    <div class="no-vehicles-alert">
                        <p>Failed to load your vehicles. Please try again later or add a new vehicle.</p>
                    </div>

                    <div class="vehicle-option selected" data-vehicle="guest">
                        <input type="radio" name="vehicleId" id="guestVehicle" value="guest" checked>
                        <div class="vehicle-details">
                            <div class="vehicle-name">Guest Vehicle</div>
                            <div class="vehicle-info">
                                Please provide vehicle details when booking
                            </div>
                        </div>
                    </div>
                `);

                // Update summary
                updateSummary();
            }
        });
    }

    /**
     * Setup service type selection
     */
    function setupServiceTypeSelection() {
        $('.service-type').on('click', function() {
            // Remove selected class from all options
            $('.service-type').removeClass('selected');

            // Add selected class to clicked option
            $(this).addClass('selected');

            // Update radio button
            const radio = $(this).find('input[type="radio"]');
            radio.prop('checked', true);

            // Update booking data
            bookingData.serviceType = radio.val();

            // Update summary
            updateSummary();
        });
    }

    /**
     * Generate date grid for next 14 days
     */
    function generateDateGrid() {
        const dateGrid = $('#dateGrid');
        const today = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Clear date grid
        dateGrid.empty();

        // Generate date cells for next 14 days
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            const dateCell = $('<div>', {
                class: 'date-cell' + (date.getDay() === 0 ? ' unavailable' : ''),
                'data-date': date.toISOString().split('T')[0]
            });

            dateCell.html(`
                <div class="date-day">${days[date.getDay()]}</div>
                <div class="date-date">${date.getDate()}</div>
                <div class="date-month">${date.toLocaleDateString('en-US', { month: 'short' })}</div>
            `);

            dateGrid.append(dateCell);
        }

        // Add click event for available dates
        $('.date-cell:not(.unavailable)').on('click', function() {
            // Remove selected class from all date cells
            $('.date-cell').removeClass('selected');

            // Add selected class to clicked cell
            $(this).addClass('selected');

            // Update booking data
            bookingData.date = $(this).data('date');

            // Update summary
            $('#summaryDate').text(new Date(bookingData.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            }));

            // Load time slots for selected date
            loadTimeSlots(bookingData.date, bookingData.serviceType);
        });

        // Select first available date (Monday if today is Sunday, otherwise today)
        const firstAvailableDate = today.getDay() === 0 ? 1 : 0;
        const firstAvailableDateCell = dateGrid.children().eq(firstAvailableDate);

        if (firstAvailableDateCell.length) {
            firstAvailableDateCell.addClass('selected');
            bookingData.date = firstAvailableDateCell.data('date');

            // Update summary
            $('#summaryDate').text(new Date(bookingData.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            }));

            // Load time slots for selected date
            loadTimeSlots(bookingData.date, bookingData.serviceType);
        }
    }

    /**
     * Load available time slots for selected date and service type
     * @param {string} date Selected date (YYYY-MM-DD)
     * @param {string} serviceType Selected service type
     */
    function loadTimeSlots(date, serviceType) {
        const timeGrid = $('#timeGrid');
        const token = localStorage.getItem('token');

        // Show loading spinner
        timeGrid.html('<div class="spinner-container"><div class="spinner"></div></div>');

        // Call API to get available time slots
        $.ajax({
            url: `${API_BASE_URL}/services/time-slots?date=${date}&serviceType=${serviceType}`,
            method: 'GET',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            success: function(response) {
                if (response.code === 200) {
                    // Clear time grid
                    timeGrid.empty();

                    const timeSlots = response.data;

                    // Render time slots
                    timeSlots.forEach(slot => {
                        const timeCell = $('<div>', {
                            class: 'time-cell' + (!slot.available ? ' unavailable' : ''),
                            text: formatTime(slot.time),
                            'data-time': slot.time
                        });

                        if (slot.available) {
                            // Add click event for available time slots
                            timeCell.on('click', function() {
                                // Remove selected class from all time cells
                                $('.time-cell').removeClass('selected');

                                // Add selected class to clicked cell
                                $(this).addClass('selected');

                                // Update booking data
                                bookingData.time = $(this).data('time');

                                // Update summary
                                $('#summaryTime').text(formatTime(bookingData.time));
                            });
                        }

                        timeGrid.append(timeCell);
                    });

                    // Select first available time slot
                    const firstAvailableSlot = timeGrid.find('.time-cell:not(.unavailable)').first();

                    if (firstAvailableSlot.length) {
                        firstAvailableSlot.addClass('selected');
                        bookingData.time = firstAvailableSlot.data('time');

                        // Update summary
                        $('#summaryTime').text(formatTime(bookingData.time));
                    }
                } else {
                    showAlert('error', response.message || 'Failed to load time slots');
                    timeGrid.html('<p>Unable to load available time slots. Please try again later.</p>');
                }
            },
            error: function(xhr) {
                console.error('Error loading time slots:', xhr);

                // If API not available, generate mock data for demo
                generateMockTimeSlots(timeGrid);
            }
        });
    }

    /**
     * Generate mock time slots for demo when API fails
     * @param {jQuery} timeGrid Time grid element
     */
    function generateMockTimeSlots(timeGrid) {
        const startHour = 9; // 9:00 AM
        const endHour = 17; // 5:00 PM
        const interval = 30; // 30-minute intervals

        timeGrid.empty();

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const isAvailable = Math.random() > 0.3;

                const timeCell = $('<div>', {
                    class: 'time-cell' + (!isAvailable ? ' unavailable' : ''),
                    text: formatTime(time),
                    'data-time': time
                });

                if (isAvailable) {
                    timeCell.on('click', function() {
                        $('.time-cell').removeClass('selected');
                        $(this).addClass('selected');
                        bookingData.time = $(this).data('time');
                        $('#summaryTime').text(formatTime(bookingData.time));
                    });
                }

                timeGrid.append(timeCell);
            }
        }

        // Select first available time slot
        const firstAvailableSlot = timeGrid.find('.time-cell:not(.unavailable)').first();
        if (firstAvailableSlot.length) {
            firstAvailableSlot.addClass('selected');
            bookingData.time = firstAvailableSlot.data('time');
            $('#summaryTime').text(formatTime(bookingData.time));
        }
    }

    /**
     * Format time string (HH:MM) to 12-hour format with AM/PM
     * @param {string} timeStr Time string in HH:MM format
     * @returns {string} Formatted time
     */
    function formatTime(timeStr) {
        if (!timeStr) return '';

        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;

        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    /**
     * Update booking summary
     */
    function updateSummary() {
        // Update service type
        const serviceTypeInfo = serviceTypes[bookingData.serviceType];
        $('#summaryService').text(serviceTypeInfo.name);

        // Update total price
        let totalPrice = serviceTypeInfo.price;

        // If price is per tire, assume 4 tires for now
        if (serviceTypeInfo.pricePerTire) {
            totalPrice *= 4;
        }

        $('#summaryTotal').text(`$${totalPrice.toFixed(2)}`);
    }

    /**
     * Book service
     */
    function bookService() {
        // Validate booking data
        if (!validateBooking()) {
            return;
        }

        // Get additional notes
        bookingData.notes = $('#notes').val().trim();

        // Disable book button
        const bookBtn = $('#bookServiceBtn');
        bookBtn.prop('disabled', true);
        bookBtn.text('Processing...');

        // Convert time string to LocalTime format if needed
        if (bookingData.time && typeof bookingData.time === 'string' && !bookingData.time.includes(':')) {
            const [hours, minutes] = bookingData.time.split(' ')[0].split(':').map(Number);
            const period = bookingData.time.split(' ')[1];

            let hour24 = hours;
            if (period === 'PM' && hours !== 12) hour24 += 12;
            if (period === 'AM' && hours === 12) hour24 = 0;

            bookingData.time = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }

        // Prepare booking data for API
        const apiBookingData = {
            serviceType: bookingData.serviceType,
            vehicleId: bookingData.vehicleId,
            date: bookingData.date,
            time: bookingData.time,
            notes: bookingData.notes
        };

        // Call API to create booking
        $.ajax({
            url: `${API_BASE_URL}/services`,
            method: 'POST',
            contentType: 'application/json',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            data: JSON.stringify(apiBookingData),
            success: function(response) {
                if (response.code === 201) {
                    // Show success message
                    showAlert('success', 'Service booked successfully! You will receive a confirmation email shortly.');

                    // Redirect to booking confirmation page
                    setTimeout(() => {
                        if (response.data && response.data.id) {
                            window.location.href = `service-confirmation.html?id=${response.data.id}`;
                        } else {
                            window.location.href = 'user-account.html#services';
                        }
                    }, 2000);
                } else {
                    // Show error message
                    showAlert('error', response.message || 'Failed to book service. Please try again later.');

                    // Enable book button
                    bookBtn.prop('disabled', false);
                    bookBtn.text('Book Service');
                }
            },
            error: function(xhr) {
                console.error('Error booking service:', xhr);

                // Show error message
                let errorMsg = 'Failed to book service. Please try again later.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showAlert('error', errorMsg);

                // Enable book button
                bookBtn.prop('disabled', false);
                bookBtn.text('Book Service');
            }
        });
    }

    /**
     * Validate booking data
     * @returns {boolean} Whether booking data is valid
     */
    function validateBooking() {
        // Check if user is logged in
        if (!localStorage.getItem('token')) {
            showAlert('error', 'Please sign in to book a service.');
            setTimeout(() => {
                window.location.href = 'authentication.html?redirect=' + encodeURIComponent(window.location.href);
            }, 2000);
            return false;
        }

        // Check if vehicle is selected
        if (!bookingData.vehicleId) {
            showAlert('error', 'Please select a vehicle or add a new one.');
            return false;
        }

        // Check if date is selected
        if (!bookingData.date) {
            showAlert('error', 'Please select a service date.');
            return false;
        }

        // Check if time is selected
        if (!bookingData.time) {
            showAlert('error', 'Please select a service time.');
            return false;
        }

        return true;
    }

    /**
     * Setup vehicle modal functionality
     */
    function setupVehicleModal() {
        const addVehicleBtn = $('#addVehicleBtn');
        const vehicleModalOverlay = $('#vehicleModalOverlay');
        const vehicleModalClose = $('#vehicleModalClose');
        const vehicleModalCancel = $('#vehicleModalCancel');
        const vehicleModalSave = $('#vehicleModalSave');

        // Open modal when add vehicle button is clicked
        addVehicleBtn.on('click', function(e) {
            e.preventDefault();

            // Check if user is logged in
            const token = localStorage.getItem('token');

            if (!token) {
                // Redirect to login page
                window.location.href = 'authentication.html?redirect=service-booking.html';
                return;
            }

            // Open modal
            vehicleModalOverlay.addClass('show');

            // Reset form
            $('#vehicleForm')[0].reset();
        });

        // Close modal when close button is clicked
        vehicleModalClose.on('click', function() {
            vehicleModalOverlay.removeClass('show');
        });

        // Close modal when cancel button is clicked
        vehicleModalCancel.on('click', function() {
            vehicleModalOverlay.removeClass('show');
        });

        // Close modal when clicked outside
        vehicleModalOverlay.on('click', function(e) {
            if (e.target === this) {
                vehicleModalOverlay.removeClass('show');
            }
        });

        // Save vehicle when save button is clicked
        vehicleModalSave.on('click', saveVehicle);
    }

    /**
     * Save vehicle
     */
    function saveVehicle() {
        // Get form values
        const make = $('#vehicleMake').val().trim();
        const model = $('#vehicleModel').val().trim();
        const year = $('#vehicleYear').val().trim();
        const trim = $('#vehicleTrim').val().trim();
        const tireSize = $('#vehicleTireSize').val().trim();
        const licensePlate = $('#vehicleLicensePlate').val().trim();
        const nickname = $('#vehicleNickname').val().trim();
        const isDefault = $('#vehicleDefault').prop('checked');

        // Validate required fields
        if (!make) {
            showError('vehicleMake', 'Please enter the vehicle make');
            return;
        }

        if (!model) {
            showError('vehicleModel', 'Please enter the vehicle model');
            return;
        }

        if (!year) {
            showError('vehicleYear', 'Please enter the vehicle year');
            return;
        }

        // Create vehicle data
        const vehicleData = {
            make,
            model,
            year,
            trim: trim || null,
            tireSizesFront: tireSize || null,
            licensePlate: licensePlate || null,
            vehicleType: nickname || null,
            isPrimary: isDefault
        };

        // Disable save button
        const saveBtn = $('#vehicleModalSave');
        saveBtn.prop('disabled', true);
        saveBtn.text('Saving...');

        // Call API to add vehicle
        $.ajax({
            url: `${API_BASE_URL}/vehicles`,
            method: 'POST',
            contentType: 'application/json',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            data: JSON.stringify(vehicleData),
            success: function(response) {
                if (response.code === 201) {
                    // Show success message
                    showAlert('success', 'Vehicle added successfully!');

                    // Close modal
                    $('#vehicleModalOverlay').removeClass('show');

                    // Reload vehicles
                    loadVehicles();

                    // Enable save button
                    saveBtn.prop('disabled', false);
                    saveBtn.text('Save Vehicle');
                } else {
                    // Show error message
                    showAlert('error', response.message || 'Failed to add vehicle. Please try again.');

                    // Enable save button
                    saveBtn.prop('disabled', false);
                    saveBtn.text('Save Vehicle');
                }
            },
            error: function(xhr) {
                console.error('Error adding vehicle:', xhr);

                // Show error message
                let errorMsg = 'Failed to add vehicle. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                showAlert('error', errorMsg);

                // Enable save button
                saveBtn.prop('disabled', false);
                saveBtn.text('Save Vehicle');
            }
        });
    }

    /**
     * Show error message for a field
     * @param {string} fieldId Field ID
     * @param {string} message Error message
     */
    function showError(fieldId, message) {
        const errorElement = $(`#${fieldId}Error`);

        if (errorElement.length) {
            errorElement.text(message);
            errorElement.addClass('visible');

            // Add error class to input
            $(`#${fieldId}`).addClass('error');
        }
    }

    /**
     * Show alert message
     * @param {string} type Alert type ('success' or 'error')
     * @param {string} message Alert message
     */
    function showAlert(type, message) {
        const alertElement = $(`#alert${type.charAt(0).toUpperCase() + type.slice(1)}`);

        if (alertElement.length) {
            alertElement.text(message);
            alertElement.addClass('show');

            // Scroll to top to show alert
            $('html, body').animate({ scrollTop: 0 }, 'smooth');

            // Hide alert after 5 seconds
            setTimeout(() => {
                alertElement.removeClass('show');
            }, 5000);
        }
    }

    /**
     * Select service from the services list
     * @param {string} serviceType Service type code
     */
    function selectService(serviceType) {
        // Find service type option
        const serviceTypeOption = $(`.service-type[data-service="${serviceType}"]`);

        if (serviceTypeOption.length) {
            // Scroll to service form
            $('.service-form')[0].scrollIntoView({ behavior: 'smooth' });

            // Trigger click on service type option
            setTimeout(() => {
                serviceTypeOption.trigger('click');
            }, 500);
        }
    }
});