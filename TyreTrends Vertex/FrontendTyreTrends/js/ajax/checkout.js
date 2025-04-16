/**
 * checkout.js - Handles checkout functionality for TyreTrends
 */
$(document).ready(function() {
    // First check if user is authenticated, redirect if not
    if (!isAuthenticated()) {
        showAlert('error', 'Please sign in to continue with checkout');
        setTimeout(function() {
            redirectToLogin(window.location.pathname);
        }, 2000);
        return;
    }

    // Track current checkout step
    let currentStep = 1;

    // Store order data
    let orderData = {
        shippingAddress: {},
        billingAddress: {},
        paymentMethod: 'CREDIT_CARD',
        cardDetails: {}
    };

    // Initialize checkout
    initCheckout();

    /**
     * Initialize checkout page
     */
    function initCheckout() {
        // Load cart data
        loadCart();

        // Load saved addresses
        loadSavedAddresses();

        // Load saved payment methods
        loadSavedCards();

        // Setup event listeners
        setupEventListeners();

        // Update navigation UI
        updateAuthUI();
    }

    /**
     * Load cart data
     */
    function loadCart() {
        // Show loading spinner
        $('#spinnerOverlay').addClass('show');

        apiRequest('/api/v1/cart')
            .then(cartData => {
                // Hide spinner
                $('#spinnerOverlay').removeClass('show');

                // Update order summary
                updateOrderSummary(cartData);

                // Check if cart is empty
                if (!cartData.cartItems || cartData.cartItems.length === 0) {
                    // Redirect to cart page if cart is empty
                    showAlert('error', 'Your cart is empty');
                    setTimeout(function() {
                        window.location.href = 'cart.html';
                    }, 2000);
                }
            })
            .catch(error => {
                // Hide spinner
                $('#spinnerOverlay').removeClass('show');
                showAlert('error', error.message || 'Failed to load cart');
            });
    }

    /**
     * Update order summary section
     * @param {Object} cart - Cart data
     */
    function updateOrderSummary(cart) {
        // Calculate totals
        const subtotal = cart.totalPrice || 0;
        const shipping = subtotal >= 100 ? 0 : 9.99;
        const tax = subtotal * 0.07;
        const discount = cart.discountAmount || 0;
        const total = subtotal + shipping + tax - discount;

        // Update summary values
        $('#subtotalValue').text('$' + subtotal.toFixed(2));
        $('#shippingValue').text(shipping === 0 ? 'Free' : '$' + shipping.toFixed(2));
        $('#taxValue').text('$' + tax.toFixed(2));

        if (discount > 0) {
            $('#discountRow').show();
            $('#discountValue').text('-$' + discount.toFixed(2));
        } else {
            $('#discountRow').hide();
        }

        $('#totalValue').text('$' + total.toFixed(2));

        // Render cart items
        renderCartItems(cart.cartItems);
    }

    /**
     * Render cart items in the summary
     * @param {Array} cartItems - Array of cart items
     */
    function renderCartItems(cartItems) {
        const cartItemsContainer = $('#cartItemsContainer');
        cartItemsContainer.empty();

        if (!cartItems || cartItems.length === 0) {
            cartItemsContainer.html('<p>Your cart is empty.</p>');
            return;
        }

        cartItems.forEach(item => {
            const unitPrice = item.unitPrice || item.price || 0;
            const subtotal = unitPrice * item.quantity;

            const cartItemHTML = `
                <div class="cart-item">
                    <div class="item-image">
                        <img src="${item.productImage || 'https://via.placeholder.com/60x60?text=Product'}" alt="${item.productName}">
                    </div>
                    <div class="item-details">
                        <div class="item-title">${item.productName}</div>
                        <div class="item-meta">
                            ${item.productSize ? item.productSize : ''}
                            ${item.productType ? ` | ${item.productType}` : ''}
                            ${item.quantity > 1 ? ` | Qty: ${item.quantity}` : ''}
                        </div>
                        <div class="item-price">$${subtotal.toFixed(2)}</div>
                    </div>
                </div>
            `;

            cartItemsContainer.append(cartItemHTML);
        });
    }

    /**
     * Load user's saved addresses
     */
    /**
     * Load user's saved addresses from the API
     */
    function loadSavedAddresses() {
        // Show loading spinner
        $('#spinnerOverlay').addClass('show');

        apiRequest('/api/v1/addresses')
            .then(addresses => {
                // Hide spinner
                $('#spinnerOverlay').removeClass('show');
                renderSavedAddresses(addresses);
            })
            .catch(error => {
                // Hide spinner
                $('#spinnerOverlay').removeClass('show');

                // If error loading addresses, just hide the container
                $('#savedAddressesContainer').hide();
                console.log('Error loading addresses:', error.message);
            });
    }
    /**
     * Render saved addresses
     * @param {Array} addresses - User's saved addresses
     */
    function renderSavedAddresses(addresses) {
        const savedAddressesContainer = $('#savedAddressesContainer');

        if (!addresses || addresses.length === 0) {
            savedAddressesContainer.hide();
            return;
        }

        let addressesHTML = '';

        addresses.forEach(address => {
            const isSelected = address.isDefault ? 'selected' : '';
            addressesHTML += `
            <div class="address-card ${isSelected}" data-id="${address.id}">
                <div class="address-card-header">
                    <div class="address-name">${address.firstName} ${address.lastName}</div>
                    ${address.isDefault ? '<div class="address-default">Default</div>' : ''}
                </div>
                <div class="address-details">
                    ${address.address}${address.address2 ? ', ' + address.address2 : ''}<br>
                    ${address.city}, ${address.state} ${address.zipCode}<br>
                    ${address.country === 'US' ? 'United States' : address.country}<br>
                    ${address.phone}
                </div>
            </div>
        `;

            // Pre-fill form with default address and store address ID
            if (address.isDefault) {
                prefillShippingForm(address);
                orderData.shippingAddress = address;
                orderData.shippingAddressId = address.id; // Store the ID
            }
        });

        savedAddressesContainer.html(addressesHTML);
        savedAddressesContainer.show();

        // Add click event to select address
        $('.address-card').on('click', function() {
            // Remove selected class from all addresses
            $('.address-card').removeClass('selected');

            // Add selected class to clicked address
            $(this).addClass('selected');

            // Get address data
            const addressId = $(this).data('id');
            const selectedAddress = addresses.find(address => address.id == addressId);

            if (selectedAddress) {
                // Pre-fill shipping form
                prefillShippingForm(selectedAddress);

                // Store both the address object and ID
                orderData.shippingAddress = selectedAddress;
                orderData.shippingAddressId = selectedAddress.id;

                // If using the same address for billing, also update billing address
                if (orderData.sameAsBilling) {
                    orderData.billingAddress = selectedAddress;
                    orderData.billingAddressId = selectedAddress.id;
                }
            }
        });
    }
    /**
     * Load saved payment methods
     */
    function loadSavedCards() {
        // For now, we'll use mock data
        // In a production system, you'd make an API call to get saved payment methods
        const mockCards = [
            {
                id: 1,
                cardType: 'Visa',
                cardName: 'John Doe',
                cardNumber: '************4242',
                expiryDate: '12/25',
                isDefault: true
            },
            {
                id: 2,
                cardType: 'Mastercard',
                cardName: 'John Doe',
                cardNumber: '************5555',
                expiryDate: '09/26',
                isDefault: false
            }
        ];
        renderSavedCards(mockCards);
    }

    /**
     * Render saved cards
     * @param {Array} cards - Saved payment methods
     */
    function renderSavedCards(cards) {
        const savedCardsContainer = $('#savedCardsContainer');

        if (!cards || cards.length === 0) {
            savedCardsContainer.hide();
            return;
        }

        let cardsHTML = '';

        cards.forEach(card => {
            const isSelected = card.isDefault ? 'selected' : '';
            cardsHTML += `
                <div class="card-item ${isSelected}" data-id="${card.id}">
                    <div class="card-logo">${getCardLogo(card.cardType)}</div>
                    <div class="card-info">
                        <div class="card-number">${card.cardNumber}</div>
                        <div class="card-expiry">Expires ${card.expiryDate}</div>
                    </div>
                </div>
            `;

            // Store default card in order data
            if (card.isDefault) {
                orderData.cardDetails = card;
                orderData.useSavedCard = true;
            }
        });

        savedCardsContainer.html(cardsHTML);
        savedCardsContainer.show();

        // Add click event to select card
        $('.card-item').on('click', function() {
            // Remove selected class from all cards
            $('.card-item').removeClass('selected');

            // Add selected class to clicked card
            $(this).addClass('selected');

            // Get card data
            const cardId = $(this).data('id');
            const selectedCard = cards.find(card => card.id == cardId);

            if (selectedCard) {
                // Store in order data
                orderData.cardDetails = selectedCard;
                orderData.useSavedCard = true;
            }
        });
    }

    /**
     * Get card logo based on card type
     * @param {string} cardType - Type of card (Visa, Mastercard, etc.)
     * @returns {string} Card logo representation
     */
    function getCardLogo(cardType) {
        switch(cardType.toLowerCase()) {
            case 'visa': return 'V';
            case 'mastercard': return 'M';
            case 'amex':
            case 'american express': return 'A';
            case 'discover': return 'D';
            default: return 'C';
        }
    }

    /**
     * Pre-fill shipping form with address data
     * @param {Object} address - Address data
     */
    function prefillShippingForm(address) {
        $('#firstName').val(address.firstName);
        $('#lastName').val(address.lastName);
        $('#address').val(address.address);
        $('#address2').val(address.address2 || '');
        $('#city').val(address.city);
        $('#state').val(address.state);
        $('#zipCode').val(address.zipCode);
        $('#country').val(address.country);
        $('#phone').val(address.phone);
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Shipping form events
        setupShippingFormEvents();

        // Payment form events
        setupPaymentFormEvents();

        // Review step events
        setupReviewStepEvents();
    }

    /**
     * Setup shipping form events
     */
    function setupShippingFormEvents() {
        // Add new address button
        $('#addAddressBtn').on('click', function(e) {
            e.preventDefault();

            // Clear form
            $('#shippingForm')[0].reset();

            // Remove selected class from all addresses
            $('.address-card').removeClass('selected');
        });

        // Continue to payment button
        $('#continueToPaymentBtn').on('click', function() {
            if (validateShippingForm()) {
                // Save shipping data
                saveShippingData();

                // Go to next step
                goToStep(2);
            }
        });

        // Same as billing checkbox
        $('#sameAsBilling').on('change', function() {
            // Update order data
            orderData.sameAsBilling = this.checked;

            // Show/hide billing address section
            if (this.checked) {
                $('#billingAddressSection').hide();
                // Copy shipping address to billing address
                orderData.billingAddress = { ...orderData.shippingAddress };
            } else {
                $('#billingAddressSection').show();
            }
        });
    }

    /**
     * Setup payment form events
     */
    function setupPaymentFormEvents() {
        // Payment method selection
        $('.payment-method').on('click', function() {
            // Remove selected class from all methods
            $('.payment-method').removeClass('selected');

            // Add selected class to clicked method
            $(this).addClass('selected');

            // Select radio button
            $(this).find('input[type="radio"]').prop('checked', true);

            // Get payment method
            const paymentMethod = $(this).data('method');

            // Show/hide card form
            if (paymentMethod === 'credit-card') {
                $('#creditCardForm').addClass('active');
                orderData.paymentMethod = 'CREDIT_CARD';
            } else {
                $('#creditCardForm').removeClass('active');
                orderData.paymentMethod = 'PAYHERE';
            }
        });

        // Back to shipping button
        $('#backToShippingBtn').on('click', function() {
            goToStep(1);
        });

        // Continue to review button
        $('#continueToReviewBtn').on('click', function() {
            if (validatePaymentForm()) {
                // Save payment data
                savePaymentData();

                // Go to next step
                goToStep(3);

                // Update review step
                updateReviewStep();
            }
        });
    }

    /**
     * Setup review step events
     */
    function setupReviewStepEvents() {
        // Edit shipping button
        $('#editShippingBtn').on('click', function(e) {
            e.preventDefault();
            goToStep(1);
        });

        // Edit payment button
        $('#editPaymentBtn').on('click', function(e) {
            e.preventDefault();
            goToStep(2);
        });

        // Back to payment button
        $('#backToPaymentBtn').on('click', function() {
            goToStep(2);
        });

        // Place order button
        $('#placeOrderBtn').on('click', function() {
            placeOrder();
        });
    }

    /**
     * Validate shipping form
     * @returns {boolean} Form validity
     */
    function validateShippingForm() {
        // Clear previous errors
        clearErrors();

        let isValid = true;

        // Validate required fields
        if (!$('#firstName').val().trim()) {
            showFieldError('firstName', 'First name is required');
            isValid = false;
        }

        if (!$('#lastName').val().trim()) {
            showFieldError('lastName', 'Last name is required');
            isValid = false;
        }

        if (!$('#address').val().trim()) {
            showFieldError('address', 'Address is required');
            isValid = false;
        }

        if (!$('#city').val().trim()) {
            showFieldError('city', 'City is required');
            isValid = false;
        }

        if (!$('#state').val().trim()) {
            showFieldError('state', 'State is required');
            isValid = false;
        }

        if (!$('#zipCode').val().trim()) {
            showFieldError('zipCode', 'ZIP code is required');
            isValid = false;
        }

        if (!$('#phone').val().trim()) {
            showFieldError('phone', 'Phone number is required');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Validate payment form
     * @returns {boolean} Form validity
     */
    function validatePaymentForm() {
        // Clear previous errors
        clearErrors();

        // If using PayHere, no validation needed
        if (orderData.paymentMethod === 'PAYHERE') {
            return true;
        }

        // If using saved card, no validation needed
        if (orderData.useSavedCard) {
            return true;
        }

        let isValid = true;

        // Validate credit card details
        if (!$('#cardName').val().trim()) {
            showFieldError('cardName', 'Name on card is required');
            isValid = false;
        }

        if (!$('#cardNumber').val().trim()) {
            showFieldError('cardNumber', 'Card number is required');
            isValid = false;
        } else if (!isValidCreditCard($('#cardNumber').val().trim())) {
            showFieldError('cardNumber', 'Invalid card number');
            isValid = false;
        }

        if (!$('#expiryDate').val().trim()) {
            showFieldError('expiryDate', 'Expiry date is required');
            isValid = false;
        } else if (!isValidExpiryDate($('#expiryDate').val().trim())) {
            showFieldError('expiryDate', 'Invalid expiry date (MM/YY)');
            isValid = false;
        }

        if (!$('#cvc').val().trim()) {
            showFieldError('cvc', 'CVC is required');
            isValid = false;
        } else if (!isValidCVC($('#cvc').val().trim())) {
            showFieldError('cvc', 'Invalid CVC (3-4 digits)');
            isValid = false;
        }

        // Validate billing address if different from shipping
        if (!orderData.sameAsBilling) {
            if (!$('#billingFirstName').val().trim()) {
                showFieldError('billingFirstName', 'First name is required');
                isValid = false;
            }

            if (!$('#billingLastName').val().trim()) {
                showFieldError('billingLastName', 'Last name is required');
                isValid = false;
            }

            if (!$('#billingAddress').val().trim()) {
                showFieldError('billingAddress', 'Address is required');
                isValid = false;
            }

            if (!$('#billingCity').val().trim()) {
                showFieldError('billingCity', 'City is required');
                isValid = false;
            }

            if (!$('#billingState').val().trim()) {
                showFieldError('billingState', 'State is required');
                isValid = false;
            }

            if (!$('#billingZipCode').val().trim()) {
                showFieldError('billingZipCode', 'ZIP code is required');
                isValid = false;
            }
        }

        return isValid;
    }

    /**
     * Save shipping data to order data object
     */
    function saveShippingData() {
        // If user selected an existing address, keep track of the ID
        const usingExistingAddress = orderData.shippingAddressId !== undefined;

        // If not using an existing address, create new address object from form
        if (!usingExistingAddress) {
            orderData.shippingAddress = {
                firstName: $('#firstName').val().trim(),
                lastName: $('#lastName').val().trim(),
                address: $('#address').val().trim(),
                address2: $('#address2').val().trim(),
                city: $('#city').val().trim(),
                state: $('#state').val().trim(),
                zipCode: $('#zipCode').val().trim(),
                country: $('#country').val().trim(),
                phone: $('#phone').val().trim()
            };

            // If user wants to save this address, mark it
            if ($('#saveAddress').is(':checked')) {
                orderData.saveShippingAddress = true;
            }
        }

        orderData.sameAsBilling = $('#sameAsBilling').is(':checked');

        // If billing is same as shipping, copy shipping address to billing address
        if (orderData.sameAsBilling) {
            orderData.billingAddress = orderData.shippingAddress;
            if (usingExistingAddress) {
                orderData.billingAddressId = orderData.shippingAddressId;
            }
        }
    }
    /**
     * Save payment data to order data object
     */
    function savePaymentData() {
        // If not using a saved card and using credit card payment
        if (!orderData.useSavedCard && orderData.paymentMethod === 'CREDIT_CARD') {
            // Get card details
            orderData.cardDetails = {
                cardName: $('#cardName').val().trim(),
                cardNumber: $('#cardNumber').val().trim(),
                expiryDate: $('#expiryDate').val().trim(),
                cvc: $('#cvc').val().trim(),
                cardType: getCardType($('#cardNumber').val().trim())
            };

            orderData.saveCard = $('#saveCard').is(':checked');
        }

        // If billing address is different from shipping
        if (!orderData.sameAsBilling) {
            const billingAddressId = orderData.billingAddressId;
            const useExistingBillingAddress = billingAddressId !== undefined;

            if (!useExistingBillingAddress) {
                orderData.billingAddress = {
                    firstName: $('#billingFirstName').val().trim(),
                    lastName: $('#billingLastName').val().trim(),
                    address: $('#billingAddress').val().trim(),
                    address2: $('#billingAddress2').val().trim(),
                    city: $('#billingCity').val().trim(),
                    state: $('#billingState').val().trim(),
                    zipCode: $('#billingZipCode').val().trim(),
                    country: $('#billingCountry').val().trim(),
                    phone: orderData.shippingAddress.phone // Use shipping phone
                };

                // If user wants to save this address, mark it
                if ($('#saveBillingAddress').is(':checked')) {
                    orderData.saveBillingAddress = true;
                }
            }
        }
    }
    /**
     * Update review step with order data
     */
    function updateReviewStep() {
        // Update shipping address
        const shipping = orderData.shippingAddress;
        $('#reviewShippingAddress').html(`
            ${shipping.firstName} ${shipping.lastName}<br>
            ${shipping.address}${shipping.address2 ? ', ' + shipping.address2 : ''}<br>
            ${shipping.city}, ${shipping.state} ${shipping.zipCode}<br>
            ${shipping.country === 'US' ? 'United States' : shipping.country}<br>
            ${shipping.phone}
        `);

        // Update payment method
        let paymentMethodHTML = '';
        if (orderData.paymentMethod === 'CREDIT_CARD') {
            // Show masked card number
            const cardDetails = orderData.cardDetails || {};
            const cardNumber = cardDetails.cardNumber || '';
            const lastFour = cardDetails.cardNumber ? cardDetails.cardNumber.slice(-4) : 'XXXX';
            const cardType = cardDetails.cardType || getCardType(cardNumber);
            const expiryDate = cardDetails.expiryDate || 'XX/XX';

            paymentMethodHTML = `
                ${cardType} ending in ${lastFour}<br>
                Expires: ${expiryDate}
            `;
        } else if (orderData.paymentMethod === 'PAYHERE') {
            paymentMethodHTML = 'PayHere';
        }

        $('#reviewPaymentMethod').html(paymentMethodHTML);

        // Load cart items for review
        apiRequest('/api/v1/cart')
            .then(cartData => {
                renderReviewOrderItems(cartData.cartItems);
            })
            .catch(error => {
                // If error, just display a generic message
                $('#reviewOrderItems').html('<p>Unable to load order items. Please try again.</p>');
            });
    }

    /**
     * Render order items in review step
     * @param {Array} items - Cart items
     */
    function renderReviewOrderItems(items) {
        const reviewOrderItems = $('#reviewOrderItems');

        if (!items || items.length === 0) {
            reviewOrderItems.html('<p>No items in your order.</p>');
            return;
        }

        let itemsHTML = `
            <ul style="list-style: none; padding: 0;">
        `;

        items.forEach(item => {
            const unitPrice = item.unitPrice || item.price || 0;
            const subtotal = unitPrice * item.quantity;

            itemsHTML += `
                <li style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <strong>${item.productName}</strong> x ${item.quantity}
                            ${item.productSize ? ` (${item.productSize})` : ''}
                        </div>
                        <div>$${subtotal.toFixed(2)}</div>
                    </div>
                </li>
            `;
        });

        itemsHTML += '</ul>';

        reviewOrderItems.html(itemsHTML);
    }

    /**
     * Place order
     */
    function placeOrder() {
        // Show spinner overlay
        $('#spinnerOverlay').addClass('show');

        // Disable place order button
        $('#placeOrderBtn').prop('disabled', true);

        // Prepare order request data - create the DTO structure backend expects
        const orderRequest = {
            shippingAddress: orderData.shippingAddress,
            billingAddress: orderData.billingAddress,
            paymentMethod: orderData.paymentMethod
        };

        // If using existing addresses, include their IDs
        if (orderData.shippingAddressId) {
            orderRequest.shippingAddressId = orderData.shippingAddressId;
        }

        if (orderData.billingAddressId) {
            orderRequest.billingAddressId = orderData.billingAddressId;
        }

        // Add flags for saving addresses
        if (orderData.saveShippingAddress) {
            orderRequest.saveShippingAddress = true;
        }

        if (orderData.saveBillingAddress) {
            orderRequest.saveBillingAddress = true;
        }

        // Send order request to API
        apiRequest('/api/v1/orders', 'POST', orderRequest)
            .then(order => {
                // Hide spinner
                $('#spinnerOverlay').removeClass('show');

                // Show success message
                showAlert('success', 'Order placed successfully!');

                // Redirect to order confirmation page
                setTimeout(function() {
                    window.location.href = `order-confirmation.html?orderId=${order.id}`;
                }, 1000);
            })
            .catch(error => {
                // Hide spinner
                $('#spinnerOverlay').removeClass('show');

                // Enable place order button
                $('#placeOrderBtn').prop('disabled', false);

                // Show error message
                showAlert('error', error.message || 'Failed to place order. Please try again.');
            });
    }
    /**
     * Go to a specific checkout step
     * @param {number} step - Step number (1-3)
     */
    function goToStep(step) {
        // Update progress steps
        $('.progress-step').each(function(index) {
            if (index < step) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });

        // Hide all steps
        $('.checkout-step').removeClass('active');

        // Show the selected step
        if (step === 1) {
            $('#shippingStep').addClass('active');
        } else if (step === 2) {
            $('#paymentStep').addClass('active');
        } else if (step === 3) {
            $('#reviewStep').addClass('active');
        }

        // Update current step
        currentStep = step;
    }

    /**
     * Clear all error messages
     */
    function clearErrors() {
        $('.form-control').removeClass('error');
        $('.error-message').removeClass('visible').text('');
    }

    /**
     * Show error message for a field
     * @param {string} fieldId - Field ID
     * @param {string} message - Error message
     */
    function showFieldError(fieldId, message) {
        $(`#${fieldId}`).addClass('error');
        $(`#${fieldId}Error`).addClass('visible').text(message);
    }

    /**
     * Show alert message
     * @param {string} type - Alert type ('success' or 'error')
     * @param {string} message - Alert message
     */
    function showAlert(type, message) {
        const alertId = type === 'success' ? '#alertSuccess' : '#alertError';
        $(alertId).text(message).addClass('show');

        setTimeout(() => {
            $(alertId).removeClass('show');
        }, 5000);
    }

    /**
     * Validate credit card number (using Luhn algorithm)
     * @param {string} cardNumber - Credit card number
     * @returns {boolean} Validity
     */
    function isValidCreditCard(cardNumber) {
        // Remove spaces and dashes
        cardNumber = cardNumber.replace(/[\s-]/g, '');

        // Check if contains only digits
        if (!/^\d+$/.test(cardNumber)) return false;

        // Check length (13-19 digits)
        if (cardNumber.length < 13 || cardNumber.length > 19) return false;

        // Luhn algorithm
        let sum = 0;
        let alternate = false;

        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i), 10);

            if (alternate) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            alternate = !alternate;
        }

        return sum % 10 === 0;
    }

    /**
     * Get credit card type based on number
     * @param {string} cardNumber - Credit card number
     * @returns {string} Card type
     */
    function getCardType(cardNumber) {
        // Remove spaces and dashes
        cardNumber = cardNumber.replace(/[\s-]/g, '');

        // Check card patterns
        if (/^4/.test(cardNumber)) return 'Visa';
        if (/^5[1-5]/.test(cardNumber)) return 'Mastercard';
        if (/^3[47]/.test(cardNumber)) return 'American Express';
        if (/^6(?:011|5)/.test(cardNumber)) return 'Discover';

        return 'Credit Card';
    }

    /**
     * Validate expiry date format (MM/YY)
     * @param {string} expiryDate - Expiry date string
     * @returns {boolean} Validity
     */
    function isValidExpiryDate(expiryDate) {
        // Check format
        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) return false;

        const [month, year] = expiryDate.split('/');
        const expMonth = parseInt(month, 10);
        const expYear = parseInt('20' + year, 10);

        // Check if month is valid
        if (expMonth < 1 || expMonth > 12) return false;

        // Get current date
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Check if expired
        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
            return false;
        }

        return true;
    }

    /**
     * Validate CVC code
     * @param {string} cvc - CVC code
     * @returns {boolean} Validity
     */
    function isValidCVC(cvc) {
        // Check if contains only digits
        if (!/^\d+$/.test(cvc)) return false;

        // Check length (3-4 digits)
        return cvc.length >= 3 && cvc.length <= 4;
    }
});