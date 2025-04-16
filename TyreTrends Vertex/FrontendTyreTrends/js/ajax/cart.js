// /**
//  * Cart.js - Handles all cart-related functionality
//  */
// $(document).ready(function() {
//     // Load cart on page load if user is logged in
//     loadCart();
//     loadRecommendedProducts();
//
//     /**
//      * Load cart data from API
//      */
//     function loadCart() {
//         // Show loading spinner
//         $('#cartContent').html('<div class="spinner-container"><div class="spinner"></div></div>');
//
//         if (isAuthenticated()) {
//             // Load cart from server for authenticated users
//             $.ajax({
//                 url: 'http://localhost:8080/api/v1/cart',
//                 method: 'GET',
//                 headers: getAuthHeader(),
//                 success: function(response) {
//                     if (response.code === 200) {
//                         renderCart(response.data);
//                     } else {
//                         showAlert('error', response.message || 'Failed to load cart');
//                         renderEmptyCart();
//                     }
//                 },
//                 error: function(xhr) {
//                     console.error('Error loading cart:', xhr);
//                     // Check if authentication error
//                     if (xhr.status === 401 || xhr.status === 403) {
//                         // Token might be expired, clear it
//                         clearAuthData();
//                         // Try loading from local storage
//                         loadLocalCart();
//                     } else {
//                         showAlert('error', 'Failed to load cart data. Please try again.');
//                         renderEmptyCart();
//                     }
//                 }
//             });
//         } else {
//             // Load cart from local storage for guest users
//             loadLocalCart();
//         }
//     }
//
//     /**
//      * Load cart from local storage for non-authenticated users
//      */
//     function loadLocalCart() {
//         try {
//             const cartData = localStorage.getItem('cart');
//             if (cartData) {
//                 const cart = JSON.parse(cartData);
//                 renderCart(cart);
//             } else {
//                 renderEmptyCart();
//             }
//         } catch (e) {
//             console.error('Error parsing local cart:', e);
//             renderEmptyCart();
//         }
//     }
//
//     /**
//      * Render cart content
//      * @param {Object} cart - Cart data from API or local storage
//      */
//     function renderCart(cart) {
//         // Check if cart is empty
//         if (!cart.cartItems || cart.cartItems.length === 0) {
//             renderEmptyCart();
//             return;
//         }
//
//         // Calculate total
//         const shipping = cart.totalPrice >= 100 ? 0 : 9.99;
//         const tax = (cart.totalPrice || 0) * 0.07;
//         const discount = cart.discountAmount || 0;
//         const total = cart.totalPrice + shipping + tax - discount;
//
//         // Create cart layout HTML
//         const cartHTML = `
//             <div class="cart-layout">
//                 <div class="cart-items">
//                     <div class="cart-header">
//                         <h2 class="cart-title">Your Cart</h2>
//                         <span class="cart-count">${cart.totalItems} items</span>
//                     </div>
//                     <table class="cart-table">
//                         <thead>
//                             <tr>
//                                 <th>Product</th>
//                                 <th>Quantity</th>
//                                 <th>Price</th>
//                                 <th>Subtotal</th>
//                                 <th></th>
//                             </tr>
//                         </thead>
//                         <tbody id="cartItemsContainer">
//                             <!-- Cart items will be rendered here -->
//                         </tbody>
//                     </table>
//                     <div class="cart-actions">
//                         <a href="products.html" class="continue-shopping">
//                             <span class="continue-icon">←</span> Continue Shopping
//                         </a>
//                         <button class="btn btn-outline" id="clearCartBtn">Clear Cart</button>
//                     </div>
//                 </div>
//                 <div class="cart-summary">
//                     <h3 class="summary-title">Order Summary</h3>
//                     <div class="summary-row">
//                         <span class="summary-label">Subtotal</span>
//                         <span class="summary-value">$${(cart.totalPrice || 0).toFixed(2)}</span>
//                     </div>
//                     <div class="summary-row">
//                         <span class="summary-label">Shipping</span>
//                         <span class="summary-value">${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span>
//                     </div>
//                     <div class="summary-row">
//                         <span class="summary-label">Tax</span>
//                         <span class="summary-value">$${tax.toFixed(2)}</span>
//                     </div>
//                     ${cart.discountAmount > 0 ? `
//                     <div class="summary-row">
//                         <span class="summary-label">Discount</span>
//                         <span class="summary-value">-$${cart.discountAmount.toFixed(2)}</span>
//                     </div>
//                     ` : ''}
//                     <div class="summary-row summary-total">
//                         <span class="summary-label">Total</span>
//                         <span class="summary-value">$${total.toFixed(2)}</span>
//                     </div>
//                     <a href="checkout.html" class="btn checkout-btn">Proceed to Checkout</a>
//                     <div class="promo-code">
//                         <h4 class="promo-title">Promo Code</h4>
//                         <div class="promo-form">
//                             <input type="text" class="promo-input" id="promoInput" placeholder="Enter code">
//                             <button class="promo-btn" id="applyPromoBtn">Apply</button>
//                         </div>
//                         ${cart.appliedPromoCode ? `
//                         <div class="applied-promo">
//                             <span class="promo-code-text">${cart.appliedPromoCode}</span>
//                             <button class="remove-promo" id="removePromoBtn">✕</button>
//                         </div>
//                         ` : ''}
//                     </div>
//                 </div>
//             </div>
//         `;
//
//         $('#cartContent').html(cartHTML);
//
//         // Render cart items
//         renderCartItems(cart.cartItems);
//
//         // Setup event listeners
//         setupCartEventListeners();
//     }
//
//     /**
//      * Render individual cart items
//      * @param {Array} cartItems - Array of cart items
//      */
//     function renderCartItems(cartItems) {
//         const cartItemsHTML = cartItems.map(item => {
//             const subtotal = item.unitPrice * item.quantity;
//             return `
//                 <tr>
//                     <td class="product-col">
//                         <div class="product-image">
//                             <img src="${item.productImage || 'https://via.placeholder.com/80x80?text=Tire'}" alt="${item.productName}">
//                         </div>
//                         <div class="product-info">
//                             <h3 class="product-title">${item.productName}</h3>
//                             <div class="product-meta">
//                                 ${item.productSize ? item.productSize : ''}
//                                 ${item.productType ? ` | ${item.productType}` : ''}
//                             </div>
//                         </div>
//                     </td>
//                     <td class="quantity-col">
//                         <div class="quantity-selector">
//                             <button class="quantity-btn decrease-btn" data-id="${item.id}">-</button>
//                             <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
//                             <button class="quantity-btn increase-btn" data-id="${item.id}">+</button>
//                         </div>
//                     </td>
//                     <td class="price-col">$${item.unitPrice.toFixed(2)}</td>
//                     <td class="subtotal-col">$${subtotal.toFixed(2)}</td>
//                     <td class="remove-col">
//                         <button class="remove-btn" data-id="${item.id}">✕</button>
//                     </td>
//                 </tr>
//             `;
//         }).join('');
//
//         $('#cartItemsContainer').html(cartItemsHTML);
//     }
//
//     /**
//      * Render empty cart message
//      */
//     function renderEmptyCart() {
//         const emptyCartHTML = `
//             <div class="empty-cart">
//                 <div class="empty-cart-icon">🛒</div>
//                 <h2>Your Cart is Empty</h2>
//                 <p>Looks like you haven't added any items to your cart yet.</p>
//                 <a href="products.html" class="btn">Start Shopping</a>
//             </div>
//         `;
//
//         $('#cartContent').html(emptyCartHTML);
//     }
//
//     /**
//      * Setup event listeners for cart actions
//      */
//     function setupCartEventListeners() {
//         // Quantity decrease buttons
//         $(document).on('click', '.decrease-btn', function() {
//             const itemId = $(this).data('id');
//             const quantityInput = $(`.quantity-input[data-id="${itemId}"]`);
//             let currentQuantity = parseInt(quantityInput.val());
//             if (currentQuantity > 1) {
//                 updateCartItemQuantity(itemId, currentQuantity - 1);
//             }
//         });
//
//         // Quantity increase buttons
//         $(document).on('click', '.increase-btn', function() {
//             const itemId = $(this).data('id');
//             const quantityInput = $(`.quantity-input[data-id="${itemId}"]`);
//             let currentQuantity = parseInt(quantityInput.val());
//             updateCartItemQuantity(itemId, currentQuantity + 1);
//         });
//
//         // Quantity input change
//         $(document).on('change', '.quantity-input', function() {
//             const itemId = $(this).data('id');
//             let newQuantity = parseInt($(this).val());
//             if (newQuantity < 1) {
//                 newQuantity = 1;
//                 $(this).val(1);
//             }
//             updateCartItemQuantity(itemId, newQuantity);
//         });
//
//         // Remove item buttons
//         $(document).on('click', '.remove-btn', function() {
//             const itemId = $(this).data('id');
//             removeCartItem(itemId);
//         });
//
//         // Clear cart button
//         $('#clearCartBtn').on('click', function() {
//             if (confirm('Are you sure you want to clear your cart?')) {
//                 clearCart();
//             }
//         });
//
//         // Apply promo code button
//         $('#applyPromoBtn').on('click', function() {
//             const promoCode = $('#promoInput').val().trim();
//             if (promoCode) {
//                 applyPromoCode(promoCode);
//             } else {
//                 showAlert('error', 'Please enter a promo code.');
//             }
//         });
//
//         // Remove promo code button
//         $(document).on('click', '#removePromoBtn', function() {
//             removePromoCode();
//         });
//     }
//
//     /**
//      * Update cart item quantity
//      * @param {number} itemId - Cart item ID
//      * @param {number} quantity - New quantity
//      */
//     function updateCartItemQuantity(itemId, quantity) {
//         if (isAuthenticated()) {
//             // Update server cart for authenticated users
//             $.ajax({
//                 url: `http://localhost:8080/api/v1/cart/update?cartItemId=${itemId}&quantity=${quantity}`,
//                 method: 'PUT',
//                 headers: getAuthHeader(),
//                 success: function(response) {
//                     if (response.code === 200) {
//                         renderCart(response.data);
//                         updateCartCount(response.data.totalItems);
//                         showAlert('success', 'Cart updated successfully.');
//                     } else {
//                         showAlert('error', response.message || 'Failed to update cart.');
//                     }
//                 },
//                 error: function(xhr) {
//                     // Check if authentication error
//                     if (xhr.status === 401 || xhr.status === 403) {
//                         clearAuthData();
//                         // Update local cart instead
//                         updateLocalCartItemQuantity(itemId, quantity);
//                     } else {
//                         let errorMsg = 'An error occurred. Please try again.';
//                         if (xhr.responseJSON && xhr.responseJSON.message) {
//                             errorMsg = xhr.responseJSON.message;
//                         }
//                         showAlert('error', errorMsg);
//                     }
//                 }
//             });
//         } else {
//             // Update local cart for guest users
//             updateLocalCartItemQuantity(itemId, quantity);
//         }
//     }
//
//     /**
//      * Update cart item quantity in local storage
//      * @param {number} itemId - Cart item ID
//      * @param {number} quantity - New quantity
//      */
//     function updateLocalCartItemQuantity(itemId, quantity) {
//         try {
//             const cartData = localStorage.getItem('cart');
//             if (cartData) {
//                 const cart = JSON.parse(cartData);
//                 const itemIndex = cart.cartItems.findIndex(item => item.id == itemId);
//
//                 if (itemIndex !== -1) {
//                     cart.cartItems[itemIndex].quantity = quantity;
//                     // Recalculate cart totals
//                     recalculateCartTotals(cart);
//                     // Save updated cart
//                     localStorage.setItem('cart', JSON.stringify(cart));
//                     // Render updated cart
//                     renderCart(cart);
//                     updateCartCount(cart.totalItems);
//                     showAlert('success', 'Cart updated successfully.');
//                 }
//             }
//         } catch (e) {
//             console.error('Error updating local cart:', e);
//             showAlert('error', 'Failed to update cart.');
//         }
//     }
//
//     /**
//      * Remove item from cart
//      * @param {number} itemId - Cart item ID
//      */
//     function removeCartItem(itemId) {
//         if (isAuthenticated()) {
//             // Remove from server cart for authenticated users
//             $.ajax({
//                 url: `http://localhost:8080/api/v1/cart/remove?cartItemId=${itemId}`,
//                 method: 'DELETE',
//                 headers: getAuthHeader(),
//                 success: function(response) {
//                     if (response.code === 200) {
//                         renderCart(response.data);
//                         updateCartCount(response.data.totalItems);
//                         showAlert('success', 'Item removed from cart.');
//                     } else {
//                         showAlert('error', response.message || 'Failed to remove item.');
//                     }
//                 },
//                 error: function(xhr) {
//                     // Check if authentication error
//                     if (xhr.status === 401 || xhr.status === 403) {
//                         clearAuthData();
//                         // Remove from local cart instead
//                         removeLocalCartItem(itemId);
//                     } else {
//                         let errorMsg = 'An error occurred. Please try again.';
//                         if (xhr.responseJSON && xhr.responseJSON.message) {
//                             errorMsg = xhr.responseJSON.message;
//                         }
//                         showAlert('error', errorMsg);
//                     }
//                 }
//             });
//         } else {
//             // Remove from local cart for guest users
//             removeLocalCartItem(itemId);
//         }
//     }
//
//     /**
//      * Remove item from local cart
//      * @param {number} itemId - Cart item ID
//      */
//     function removeLocalCartItem(itemId) {
//         try {
//             const cartData = localStorage.getItem('cart');
//             if (cartData) {
//                 const cart = JSON.parse(cartData);
//                 cart.cartItems = cart.cartItems.filter(item => item.id != itemId);
//                 // Recalculate cart totals
//                 recalculateCartTotals(cart);
//                 // Save updated cart
//                 localStorage.setItem('cart', JSON.stringify(cart));
//                 // Render updated cart
//                 renderCart(cart);
//                 updateCartCount(cart.totalItems);
//                 showAlert('success', 'Item removed from cart.');
//             }
//         } catch (e) {
//             console.error('Error removing item from local cart:', e);
//             showAlert('error', 'Failed to remove item from cart.');
//         }
//     }
//
//     /**
//      * Clear entire cart
//      */
//     function clearCart() {
//         if (isAuthenticated()) {
//             // Clear server cart for authenticated users
//             $.ajax({
//                 url: 'http://localhost:8080/api/v1/cart/clear',
//                 method: 'DELETE',
//                 headers: getAuthHeader(),
//                 success: function(response) {
//                     if (response.code === 200) {
//                         renderEmptyCart();
//                         updateCartCount(0);
//                         showAlert('success', 'Cart cleared successfully.');
//                     } else {
//                         showAlert('error', response.message || 'Failed to clear cart.');
//                     }
//                 },
//                 error: function(xhr) {
//                     // Check if authentication error
//                     if (xhr.status === 401 || xhr.status === 403) {
//                         clearAuthData();
//                         // Clear local cart instead
//                         clearLocalCart();
//                     } else {
//                         let errorMsg = 'An error occurred. Please try again.';
//                         if (xhr.responseJSON && xhr.responseJSON.message) {
//                             errorMsg = xhr.responseJSON.message;
//                         }
//                         showAlert('error', errorMsg);
//                     }
//                 }
//             });
//         } else {
//             // Clear local cart for guest users
//             clearLocalCart();
//         }
//     }
//
//     /**
//      * Clear local cart
//      */
//     function clearLocalCart() {
//         try {
//             // Create empty cart
//             const emptyCart = {
//                 cartItems: [],
//                 totalItems: 0,
//                 totalPrice: 0,
//                 discountAmount: 0,
//                 appliedPromoCode: null
//             };
//             // Save empty cart
//             localStorage.setItem('cart', JSON.stringify(emptyCart));
//             // Render empty cart
//             renderEmptyCart();
//             updateCartCount(0);
//             showAlert('success', 'Cart cleared successfully.');
//         } catch (e) {
//             console.error('Error clearing local cart:', e);
//             showAlert('error', 'Failed to clear cart.');
//         }
//     }
//
//     /**
//      * Apply promo code to cart
//      * @param {string} promoCode - Promo code to apply
//      */
//     function applyPromoCode(promoCode) {
//         if (isAuthenticated()) {
//             // Apply promo code to server cart for authenticated users
//             $.ajax({
//                 url: `http://localhost:8080/api/v1/cart/apply-promo?promoCode=${promoCode}`,
//                 method: 'POST',
//                 headers: getAuthHeader(),
//                 success: function(response) {
//                     if (response.code === 200) {
//                         renderCart(response.data);
//                         showAlert('success', 'Promo code applied successfully.');
//                     } else {
//                         showAlert('error', response.message || 'Failed to apply promo code.');
//                     }
//                 },
//                 error: function(xhr) {
//                     // Check if authentication error
//                     if (xhr.status === 401 || xhr.status === 403) {
//                         clearAuthData();
//                         // Apply to local cart instead
//                         applyLocalPromoCode(promoCode);
//                     } else {
//                         let errorMsg = 'Invalid promo code. Please try again.';
//                         if (xhr.responseJSON && xhr.responseJSON.message) {
//                             errorMsg = xhr.responseJSON.message;
//                         }
//                         showAlert('error', errorMsg);
//                     }
//                 }
//             });
//         } else {
//             // Apply promo code to local cart for guest users
//             applyLocalPromoCode(promoCode);
//         }
//     }
//
//     /**
//      * Apply promo code to local cart
//      * @param {string} promoCode - Promo code to apply
//      */
//     function applyLocalPromoCode(promoCode) {
//         try {
//             const cartData = localStorage.getItem('cart');
//             if (cartData) {
//                 const cart = JSON.parse(cartData);
//
//                 // Validate promo code (simulate backend validation)
//                 if (promoCode.toUpperCase() === 'WELCOME10') {
//                     cart.discountAmount = cart.totalPrice * 0.1; // 10% discount
//                     cart.appliedPromoCode = promoCode;
//                 } else if (promoCode.toUpperCase() === 'SUMMER20') {
//                     cart.discountAmount = cart.totalPrice * 0.2; // 20% discount
//                     cart.appliedPromoCode = promoCode;
//                 } else {
//                     showAlert('error', 'Invalid promo code. Please try again.');
//                     return;
//                 }
//
//                 // Save updated cart
//                 localStorage.setItem('cart', JSON.stringify(cart));
//                 // Render updated cart
//                 renderCart(cart);
//                 showAlert('success', 'Promo code applied successfully.');
//             }
//         } catch (e) {
//             console.error('Error applying promo code to local cart:', e);
//             showAlert('error', 'Failed to apply promo code.');
//         }
//     }
//
//     /**
//      * Remove promo code from cart
//      */
//     function removePromoCode() {
//         if (isAuthenticated()) {
//             // Remove promo code from server cart for authenticated users
//             $.ajax({
//                 url: 'http://localhost:8080/api/v1/cart/remove-promo',
//                 method: 'DELETE',
//                 headers: getAuthHeader(),
//                 success: function(response) {
//                     if (response.code === 200) {
//                         renderCart(response.data);
//                         showAlert('success', 'Promo code removed.');
//                     } else {
//                         showAlert('error', response.message || 'Failed to remove promo code.');
//                     }
//                 },
//                 error: function(xhr) {
//                     // Check if authentication error
//                     if (xhr.status === 401 || xhr.status === 403) {
//                         clearAuthData();
//                         // Remove from local cart instead
//                         removeLocalPromoCode();
//                     } else {
//                         let errorMsg = 'An error occurred. Please try again.';
//                         if (xhr.responseJSON && xhr.responseJSON.message) {
//                             errorMsg = xhr.responseJSON.message;
//                         }
//                         showAlert('error', errorMsg);
//                     }
//                 }
//             });
//         } else {
//             // Remove promo code from local cart for guest users
//             removeLocalPromoCode();
//         }
//     }
//
//     /**
//      * Remove promo code from local cart
//      */
//     function removeLocalPromoCode() {
//         try {
//             const cartData = localStorage.getItem('cart');
//             if (cartData) {
//                 const cart = JSON.parse(cartData);
//                 cart.discountAmount = 0;
//                 cart.appliedPromoCode = null;
//                 // Save updated cart
//                 localStorage.setItem('cart', JSON.stringify(cart));
//                 // Render updated cart
//                 renderCart(cart);
//                 showAlert('success', 'Promo code removed.');
//             }
//         } catch (e) {
//             console.error('Error removing promo code from local cart:', e);
//             showAlert('error', 'Failed to remove promo code.');
//         }
//     }
//
//     /**
//      * Load recommended products
//      */
//     function loadRecommendedProducts() {
//         $.ajax({
//             url: 'http://localhost:8080/api/v1/products/featured',
//             method: 'GET',
//             success: function(response) {
//                 if (response.code === 200) {
//                     renderRecommendedProducts(response.data.slice(0, 4));
//                 }
//             },
//             error: function() {
//                 $('#recommendedProducts').html('<p>Failed to load recommended products.</p>');
//             }
//         });
//     }
//
//     /**
//      * Render recommended products
//      * @param {Array} products - Array of product data
//      */
//     function renderRecommendedProducts(products) {
//         if (!products || products.length === 0) {
//             $('#recommendedProducts').html('<p>No recommended products available.</p>');
//             return;
//         }
//
//         const productsHTML = products.map(product => `
//             <div class="product-card">
//                 <div class="product-card-image">
//                     <img src="${product.imageUrl || 'https://via.placeholder.com/300x300?text=Tire'}" alt="${product.name}">
//                 </div>
//                 <div class="product-card-info">
//                     <h3 class="product-card-title">${product.name}</h3>
//                     <div class="product-card-price">$${(product.price || 0).toFixed(2)}</div>
//                     <a href="product-detail.html?id=${product.id}" class="btn">View Details</a>
//                 </div>
//             </div>
//         `).join('');
//
//         $('#recommendedProducts').html(productsHTML);
//     }
//
//     /**
//      * Recalculate cart totals
//      * @param {Object} cart - Cart object to recalculate
//      */
//     function recalculateCartTotals(cart) {
//         cart.totalItems = 0;
//         cart.totalPrice = 0;
//
//         // Calculate totals from cart items
//         cart.cartItems.forEach(item => {
//             cart.totalItems += item.quantity;
//             cart.totalPrice += item.unitPrice * item.quantity;
//         });
//
//         // Recalculate discount if promo code is applied
//         if (cart.appliedPromoCode) {
//             if (cart.appliedPromoCode.toUpperCase() === 'WELCOME10') {
//                 cart.discountAmount = cart.totalPrice * 0.1; // 10% discount
//             } else if (cart.appliedPromoCode.toUpperCase() === 'SUMMER20') {
//                 cart.discountAmount = cart.totalPrice * 0.2; // 20% discount
//             }
//         }
//     }
//
//     /**
//      * Show alert message
//      * @param {string} type - Alert type ('success' or 'error')
//      * @param {string} message - Alert message
//      */
//     function showAlert(type, message) {
//         const alertId = type === 'success' ? '#alertSuccess' : '#alertError';
//         $(alertId).text(message).addClass('show');
//
//         setTimeout(() => {
//             $(alertId).removeClass('show');
//         }, 5000);
//     }
//
//     /**
//      * Update cart count in header
//      * @param {number} count - New cart count
//      */
//     function updateCartCount(count) {
//         $('.cart-count').text(count || 0);
//     }
//
//     /**
//      * Check if user is authenticated
//      * @returns {boolean} True if user is authenticated
//      */
//     function isAuthenticated() {
//         return !!localStorage.getItem('token');
//     }
//
//     /**
//      * Get authentication header for API requests
//      * @returns {Object} Headers object with authorization token
//      */
//     function getAuthHeader() {
//         const token = localStorage.getItem('token');
//         return {
//             'Authorization': `Bearer ${token}`
//         };
//     }
//
//     /**
//      * Clear authentication data
//      */
//     function clearAuthData() {
//         localStorage.removeItem('token');
//         localStorage.removeItem('userEmail');
//     }
// });