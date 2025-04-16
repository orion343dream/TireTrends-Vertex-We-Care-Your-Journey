/**
 * Product Detail Page JavaScript
 *
 * Handles loading and displaying product details, reviews,
 * and cart functionality for the ToolNest e-commerce platform.
 */

// Configure API base URL - adjust this for your environment
const API_BASE_URL = 'http://localhost:8080';

// Global state for product
let currentProduct = null;
let productImages = [];
let selectedImageIndex = 0;

$(document).ready(function() {

    loadRecommendedProducts();

    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showError('Product not found. Please try another product.');
        return;
    }

    // Load product details
    loadProduct(productId);

    // Initialize event listeners
    initEventListeners();

    // Update cart count on page load
    updateCartCount();

    // Check authentication status
    checkAuthStatus();
});

/**
 * Initialize event listeners for the page
 */
function initEventListeners() {
    // Add to cart button
    $(document).on('click', '#addToCartBtn', function() {
        if ($(this).prop('disabled')) return;
        addToCart();
    });

    // Write review button
    $(document).on('click', '#writeReviewBtn', function() {
        toggleReviewForm();
    });

    // Cancel review button
    $(document).on('click', '#cancelReviewBtn', function() {
        $('#reviewForm').removeClass('active');
    });

    // Submit review button
    $(document).on('click', '#submitReviewBtn', function() {
        if ($(this).prop('disabled')) return;
        submitReview();
    });

    // Wishlist button
    $(document).on('click', '#wishlistBtn', function() {
        if ($(this).prop('disabled')) return;
        addToWishlist();
    });

    // Compare button
    $(document).on('click', '#compareBtn', function() {
        addToCompare();
    });

    // Product tabs navigation
    $(document).on('click', '.tab-btn', function() {
        const tabName = $(this).data('tab');
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').removeClass('active');
        $('#' + tabName + 'Tab').addClass('active');
    });

    // Product thumbnails
    $(document).on('click', '.product-thumbnail', function() {
        const index = $(this).data('index');
        selectedImageIndex = index;
        $('#mainProductImage').attr('src', productImages[index]);
        $('.product-thumbnail').removeClass('active');
        $(this).addClass('active');
    });

    // Search form submission
    $('#searchForm').on('submit', function(e) {
        e.preventDefault();
        const query = $('#searchInput').val().trim();
        if (query) {
            window.location.href = `products.html?query=${encodeURIComponent(query)}`;
        }
    });
}

/**
 * Load product details from the API
 */
function loadProduct(productId) {
    const productDetailContainer = $('#productDetail');

    // Reset currentProduct to ensure we don't have stale data
    currentProduct = null;

    // Show loading indicator
    productDetailContainer.html('<div class="spinner-container"><div class="spinner"></div></div>');

    console.log('Loading product details for ID:', productId);

    $.ajax({
        url: `${API_BASE_URL}/api/v1/products/${productId}`,
        method: 'GET',
        success: function(response) {
            console.log('Product API response:', response);

            if (response.code === 200) {
                const product = response.data;

                // Store product data
                currentProduct = product;
                console.log('Current product set:', currentProduct);

                // Update page title
                document.title = `${product.name} | ToolNest`;

                // Update breadcrumb
                $('#productCategory').text(product.categoryName || 'Products');
                $('#productName').text(product.name);

                // Setup product images
                setupProductImages(product);

                // Render product details
                renderProductDetails(product);

                // Load product reviews
                loadProductReviews(productId);

                // Load related products
                loadRelatedProducts(product.categoryId);
            } else {
                showError('Product not found. Please try another product.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading product:', error);
            console.log('Status code:', xhr.status);
            console.log('Response:', xhr.responseText);
            showError('Failed to load product. Please try again later.');
        }
    });
}

/**
 * Setup product images for gallery
 */
function setupProductImages(product) {
    // Reset images array
    productImages = [];

    // Add main product image
    if (product.imageUrl) {
        productImages.push(product.imageUrl);
    } else {
        productImages.push('https://via.placeholder.com/500x500?text=Product');
    }

    // Add additional images if available
    if (product.additionalImages && product.additionalImages.length > 0) {
        productImages = productImages.concat(product.additionalImages);
    } else {
        // Add placeholder images if no additional images
        productImages.push('https://via.placeholder.com/500x500?text=Side+View');
        productImages.push('https://via.placeholder.com/500x500?text=Detail');
    }

    // Reset selected image index
    selectedImageIndex = 0;
}

/**
 * Render product details
 */
function renderProductDetails(product) {
    const productDetailContainer = $('#productDetail');

    // Generate stars for rating
    const rating = product.rating || 0;
    const starsHtml = generateStarRating(rating);

    // Generate thumbnails HTML
    let thumbnailsHtml = '';
    productImages.forEach((image, index) => {
        thumbnailsHtml += `
            <div class="product-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${image}" alt="${product.name} - Image ${index + 1}">
            </div>
        `;
    });

    // Determine stock status
    let stockStatus = '';
    if (product.stock <= 0) {
        stockStatus = '<div class="product-stock out-of-stock">Out of Stock</div>';
    } else if (product.stock <= 10) {
        stockStatus = `<div class="product-stock low-stock">Low Stock (${product.stock} remaining)</div>`;
    } else {
        stockStatus = `<div class="product-stock in-stock">In Stock (${product.stock} available)</div>`;
    }

    // Format product type for display
    const productType = product.type
        ? product.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : 'N/A';

    // Create product detail HTML
    productDetailContainer.html(`
        <div class="product-detail-grid">
            <div class="product-gallery">
                <div class="product-main-image">
                    <img src="${productImages[selectedImageIndex]}" alt="${product.name}" id="mainProductImage">
                </div>
                <div class="product-thumbnails" id="productThumbnails">
                    ${thumbnailsHtml}
                </div>
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brandName || 'Brand'}</div>
                <h1 class="product-title">${product.name}</h1>
                <div class="product-rating">
                    ${starsHtml}
                    <span class="rating-count">(${product.reviewCount || 0} reviews)</span>
                </div>
                <div class="product-price">$${(product.price || 0).toFixed(2)}</div>
                <div class="product-specs">
                    <div class="spec-item">
                        <div class="spec-label">Size:</div>
                        <div class="spec-value">${product.size || 'N/A'}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Type:</div>
                        <div class="spec-value">${productType}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Category:</div>
                        <div class="spec-value">${product.categoryName || 'N/A'}</div>
                    </div>
                </div>
                ${stockStatus}
                <div class="quantity-selector">
                    <label for="quantity">Quantity:</label>
                    <input type="number" id="quantity" class="quantity-input" value="1" min="1" max="${product.stock || 1}" data-max-stock="${product.stock || 1}">
                </div>
                <button id="addToCartBtn" class="btn add-to-cart-btn" ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <div class="product-actions">
                    <button class="action-btn" id="wishlistBtn">
                        <span class="action-icon">❤️</span> Add to Wishlist
                    </button>
                    <button class="action-btn" id="compareBtn">
                        <span class="action-icon">🔄</span> Compare
                    </button>
                </div>
            </div>
        </div>
        <div class="product-tabs">
            <div class="tabs-nav">
                <button class="tab-btn active" data-tab="description">Description</button>
                <button class="tab-btn" data-tab="specifications">Specifications</button>
                <button class="tab-btn" data-tab="reviews">Reviews</button>
            </div>
            <div class="tab-content description-content active" id="descriptionTab">
                <h3>Product Description</h3>
                <p>${product.description || 'No description available.'}</p>
            </div>
            <div class="tab-content specs-content" id="specificationsTab">
                <table class="specs-table">
                    <tbody>
                        <tr>
                            <th>Brand</th>
                            <td>${product.brandName || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Product Name</th>
                            <td>${product.name || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Size</th>
                            <td>${product.size || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Type</th>
                            <td>${productType}</td>
                        </tr>
                        <tr>
                            <th>Category</th>
                            <td>${product.categoryName || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Price</th>
                            <td>$${(product.price || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <th>Stock</th>
                            <td>${product.stock || 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="tab-content reviews-content" id="reviewsTab">
                <div class="review-summary">
                    <div class="overall-rating">
                        <div class="big-rating">${rating.toFixed(1)}</div>
                        <div>
                            ${starsHtml}
                        </div>
                        <div>${product.reviewCount || 0} reviews</div>
                    </div>
                    <div class="rating-distribution" id="ratingDistribution">
                        <!-- Rating distribution will be loaded here -->
                        <div class="rating-bar">
                            <div class="rating-level">5 stars</div>
                            <div class="rating-progress">
                                <div class="rating-progress-bar" style="width: 0%"></div>
                            </div>
                            <div class="rating-count">0%</div>
                        </div>
                        <div class="rating-bar">
                            <div class="rating-level">4 stars</div>
                            <div class="rating-progress">
                                <div class="rating-progress-bar" style="width: 0%"></div>
                            </div>
                            <div class="rating-count">0%</div>
                        </div>
                        <div class="rating-bar">
                            <div class="rating-level">3 stars</div>
                            <div class="rating-progress">
                                <div class="rating-progress-bar" style="width: 0%"></div>
                            </div>
                            <div class="rating-count">0%</div>
                        </div>
                        <div class="rating-bar">
                            <div class="rating-level">2 stars</div>
                            <div class="rating-progress">
                                <div class="rating-progress-bar" style="width: 0%"></div>
                            </div>
                            <div class="rating-count">0%</div>
                        </div>
                        <div class="rating-bar">
                            <div class="rating-level">1 star</div>
                            <div class="rating-progress">
                                <div class="rating-progress-bar" style="width: 0%"></div>
                            </div>
                            <div class="rating-count">0%</div>
                        </div>
                    </div>
                </div>
                <button id="writeReviewBtn" class="btn write-review-btn">Write a Review</button>
                <div class="review-form" id="reviewForm">
                    <h3>Write Your Review</h3>
                    <div class="form-group">
                        <label class="form-label">Rating</label>
                        <div class="rating-input">
                            <input type="radio" id="star5" name="rating" value="5">
                            <label for="star5">★</label>
                            <input type="radio" id="star4" name="rating" value="4">
                            <label for="star4">★</label>
                            <input type="radio" id="star3" name="rating" value="3">
                            <label for="star3">★</label>
                            <input type="radio" id="star2" name="rating" value="2">
                            <label for="star2">★</label>
                            <input type="radio" id="star1" name="rating" value="1">
                            <label for="star1">★</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="reviewTitle" class="form-label">Title</label>
                        <input type="text" id="reviewTitle" class="form-control" placeholder="Summarize your experience">
                    </div>
                    <div class="form-group">
                        <label for="reviewComment" class="form-label">Review</label>
                        <textarea id="reviewComment" class="form-control" placeholder="Share your thoughts"></textarea>
                    </div>
                    <div class="form-actions">
                        <button id="cancelReviewBtn" class="btn btn-outline">Cancel</button>
                        <button id="submitReviewBtn" class="btn">Submit Review</button>
                    </div>
                </div>
                <div class="review-list" id="reviewList">
                    <!-- Reviews will be loaded here -->
                    <div class="spinner-container">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        </div>
    `);
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating) {
    const wholeStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - wholeStars - (hasHalfStar ? 1 : 0);

    let starsHtml = '';
    for (let i = 0; i < wholeStars; i++) {
        starsHtml += '<span class="star">★</span>';
    }
    if (hasHalfStar) {
        starsHtml += '<span class="star">★</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<span class="star">☆</span>';
    }

    return starsHtml;
}

/**
 * Load product reviews
 */
function loadProductReviews(productId) {
    const reviewList = $('#reviewList');

    $.ajax({
        url: `${API_BASE_URL}/api/v1/reviews/product/${productId}?page=0&size=10&sort=createdAt&direction=desc`,
        method: 'GET',
        success: function(response) {
            if (response.code === 200) {
                const reviewsPage = response.data;

                // Clear review list
                reviewList.empty();

                if (!reviewsPage.content || reviewsPage.content.length === 0) {
                    reviewList.html('<p class="no-reviews">No reviews yet. Be the first to review this product!</p>');
                    return;
                }

                // Filter to only show approved reviews
                const approvedReviews = reviewsPage.content.filter(review => review.approved === true);

                if (approvedReviews.length === 0) {
                    reviewList.html('<p class="no-reviews">No reviews yet. Be the first to review this product!</p>');
                    return;
                }

                // Render approved reviews
                approvedReviews.forEach(function(review) {
                    renderReview(review, reviewList);
                });

                // Populate rating distribution
                updateRatingDistribution(approvedReviews);
            } else {
                reviewList.html('<p class="error-message">Failed to load reviews.</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading reviews:', error);
            reviewList.html('<p class="error-message">Failed to load reviews. Please try again later.</p>');
        }
    });
}

/**
 * Render a review
 */
function renderReview(review, container) {
    // Generate stars for rating
    const starsHtml = generateStarRating(review.rating || 0);

    // Format date
    const reviewDate = review.createdAt
        ? new Date(review.createdAt).toLocaleDateString()
        : 'Unknown date';

    // Create review HTML
    const reviewItem = $('<div class="review-item"></div>');
    reviewItem.html(`
        <div class="review-header">
            <div class="reviewer-info">
                <div class="reviewer-name">${review.userFullName || 'Anonymous'}</div>
                <div class="product-rating">
                    ${starsHtml}
                </div>
            </div>
            <div class="review-date">${reviewDate}</div>
        </div>
        <h4 class="review-title">${review.title || ''}</h4>
        <p>${review.comment || ''}</p>
    `);

    container.append(reviewItem);
}

/**
 * Update rating distribution
 */
function updateRatingDistribution(reviews) {
    const distributionContainer = $('#ratingDistribution');

    // Count ratings
    const ratingCounts = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars

    reviews.forEach(function(review) {
        const rating = Math.round(review.rating || 0);
        if (rating >= 1 && rating <= 5) {
            ratingCounts[5 - rating]++;
        }
    });

    // Calculate percentages
    const totalReviews = reviews.length;
    const ratingPercentages = ratingCounts.map(count => (count / totalReviews) * 100 || 0);

    // Create distribution HTML
    let distributionHtml = '';

    for (let i = 0; i < 5; i++) {
        const stars = 5 - i;
        const percentage = ratingPercentages[i];

        distributionHtml += `
            <div class="rating-bar">
                <div class="rating-level">${stars} stars</div>
                <div class="rating-progress">
                    <div class="rating-progress-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="rating-count">${percentage.toFixed(0)}%</div>
            </div>
        `;
    }

    distributionContainer.html(distributionHtml);
}

/**
 * Load recommended products
 */
function loadRecommendedProducts() {
    $.ajax({
        url: 'http://localhost:8080/api/v1/products/featured',
        method: 'GET',
        success: function(response) {
            if (response.code === 200) {
                renderRecommendedProducts(response.data.slice(0, 4));
            }
        },
        error: function() {
            $('#recommendedProducts').html('<p>Failed to load recommended products.</p>');
        }
    });
}
/**
 * Render recommended products
 * @param {Array} products - Array of product data
 */
function renderRecommendedProducts(products) {
    if (!products || products.length === 0) {
        $('#recommendedProducts').html('<p>No recommended products available.</p>');
        return;
    }

    const productsHTML = products.map(product => `
            <div class="product-card">
                <div class="product-card-image">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/300x300?text=Tire'}" alt="${product.name}">
                </div>
                <div class="product-card-info">
                    <h3 class="product-card-title">${product.name}</h3>
                    <div class="product-card-price">$${(product.price || 0).toFixed(2)}</div>
                    <a href="product-detail.html?id=${product.id}" class="btn">View Details</a>
                </div>
            </div>
        `).join('');

    $('#recommendedProducts').html(productsHTML);
}

/**
 * Toggle review form visibility
 */
function toggleReviewForm() {
    // Check if user is logged in
    if (!isAuthenticated()) {
        handleUnauthenticated('Please sign in to write a review.');
        return;
    }

    $('#reviewForm').toggleClass('active');

    // Scroll to form if opened
    if ($('#reviewForm').hasClass('active')) {
        $('#reviewForm')[0].scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Submit a review
 */
function submitReview() {
    // Check if user is logged in
    if (!isAuthenticated()) {
        handleUnauthenticated('Please sign in to write a review.');
        return;
    }

    const userEmail = localStorage.getItem('userEmail');
    const token = localStorage.getItem('token');

    // Check if currentProduct is defined
    if (!currentProduct) {
        showError('Product information is not available. Please refresh the page and try again.');
        return;
    }

    // Get form values
    const rating = $('input[name="rating"]:checked').val();
    const title = $('#reviewTitle').val().trim();
    const comment = $('#reviewComment').val().trim();

    // Validate form
    if (!rating) {
        showError('Please select a rating.');
        return;
    }

    if (!title) {
        showError('Please enter a review title.');
        return;
    }

    if (!comment) {
        showError('Please enter your review comment.');
        return;
    }

    // Create review object
    const reviewData = {
        productId: currentProduct.id,
        userEmail: userEmail,
        rating: parseInt(rating),
        title: title,
        comment: comment
    };

    // Disable submit button and show loading state
    const submitBtn = $('#submitReviewBtn');
    const originalBtnText = submitBtn.text();
    submitBtn.prop('disabled', true).text('Submitting...');

    // Submit review
    $.ajax({
        url: `${API_BASE_URL}/api/v1/reviews`,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(reviewData),
        success: function(response) {
            if (response.code === 201) {
                showSuccess('Your review has been submitted successfully and is pending approval.');

                // Reset form
                $('input[name="rating"]').prop('checked', false);
                $('#reviewTitle').val('');
                $('#reviewComment').val('');

                // Hide form
                $('#reviewForm').removeClass('active');

                // Reset button
                submitBtn.prop('disabled', false).text(originalBtnText);
            } else {
                showError(response.message || 'Failed to submit review.');
                submitBtn.prop('disabled', false).text(originalBtnText);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error submitting review:', error);
            console.log('Status code:', xhr.status);
            console.log('Response:', xhr.responseText);

            let errorMessage = 'Failed to submit review. Please try again later.';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }

            showError(errorMessage);

            // Reset button
            submitBtn.prop('disabled', false).text(originalBtnText);

            // Check for authentication error
            if (xhr.status === 401 || xhr.status === 403) {
                clearAuthData();
                handleUnauthenticated('Your session has expired. Please sign in again.');
            }
        }
    });
}

/**
 * Add product to cart
 */
function addToCart() {
    // Check if currentProduct is defined
    if (!currentProduct) {
        console.error('Error: Cannot add to cart because product details are not loaded');
        showError('Cannot add to cart. Please refresh the page and try again.');
        return;
    }

    const quantity = parseInt($('#quantity').val());

    // Validate quantity
    if (isNaN(quantity) || quantity <= 0) {
        showError('Please enter a valid quantity.');
        return;
    }

    if (quantity > currentProduct.stock) {
        showError(`Sorry, only ${currentProduct.stock} items are available.`);
        return;
    }

    // Disable button during processing
    const addToCartBtn = $('#addToCartBtn');
    const originalBtnText = addToCartBtn.text();
    addToCartBtn.prop('disabled', true).text('Adding...');

    // Check if user is logged in
    if (isAuthenticated()) {
        const token = localStorage.getItem('token');

        console.log('Adding to cart via API:', {
            productId: currentProduct.id,
            quantity: quantity
        });

        // Add to cart via API
        $.ajax({
            url: `${API_BASE_URL}/api/v1/cart/add`,
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            data: {}, // Empty body - using query parameters instead
            // Use query parameters as per backend expectation
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            },
            url: `${API_BASE_URL}/api/v1/cart/add?productId=${currentProduct.id}&quantity=${quantity}`,
            success: function(response) {
                addToCartBtn.prop('disabled', false).text(originalBtnText);
                console.log('Cart API response:', response);

                if (response.code === 200) {
                    showSuccess(`${currentProduct.name} has been added to your cart.`);
                    updateCartCount();
                } else {
                    showError(response.message || 'Failed to add to cart.');
                }
            },
            error: function(xhr, status, error) {
                addToCartBtn.prop('disabled', false).text(originalBtnText);
                console.error('Error adding to cart:', error);
                console.log('Status code:', xhr.status);
                console.log('Response:', xhr.responseText);

                // If authentication fails, add to local cart instead
                if (xhr.status === 403 || xhr.status === 401) {
                    console.log('Authentication failed, adding to local cart');
                    // Clear token and treat as logged out
                    clearAuthData();

                    // Add to local cart
                    addToLocalCart(quantity);
                    showSuccess(`${currentProduct.name} has been added to your cart.`);
                    updateCartCount();
                } else {
                    let errorMessage = 'Failed to add to cart. Please try again later.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    }
                    showError(errorMessage);
                }
            }
        });
    } else {
        console.log('User not logged in, adding to local cart');
        // Add to local cart for non-logged in users
        addToLocalCart(quantity);
        addToCartBtn.prop('disabled', false).text(originalBtnText);
        showSuccess(`${currentProduct.name} has been added to your cart.`);
        updateCartCount();
    }
}

/**
 * Add product to local cart (for non-logged in users)
 */
function addToLocalCart(quantity) {
    // Debug log
    console.log('Adding to local cart:', currentProduct, quantity);

    // Ensure currentProduct is defined
    if (!currentProduct) {
        console.error('Error: Cannot add to local cart because product details are not loaded');
        return;
    }

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

    // Debug log
    console.log('Current cart before update:', cart);

    // Check if product already exists in cart
    const existingItemIndex = cart.cartItems.findIndex(item =>
        item.productId == currentProduct.id ||
        (item.id ? item.id == currentProduct.id : false)
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
            productId: currentProduct.id,
            productName: currentProduct.name,
            productImage: currentProduct.imageUrl || 'https://via.placeholder.com/300x300?text=Product',
            productSize: currentProduct.size || '',
            productType: currentProduct.type || '',
            quantity: quantity,
            unitPrice: currentProduct.price || 0
        });
    }

    // Recalculate cart totals
    recalculateCartTotals(cart);

    // Debug log
    console.log('Updated cart:', cart);

    // Save cart to localStorage
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('Cart saved to localStorage');
    } catch (e) {
        console.error('Error saving cart to localStorage', e);
        showError('Failed to add to cart. Your browser storage may be full or restricted.');
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
 * Add product to wishlist
 */
function addToWishlist() {
    // Check if currentProduct is defined
    if (!currentProduct) {
        console.error('Error: Cannot add to wishlist because product details are not loaded');
        showError('Cannot add to wishlist. Please refresh the page and try again.');
        return;
    }

    // Check if user is logged in
    if (!isAuthenticated()) {
        handleUnauthenticated('Please sign in to add items to your wishlist.');
        return;
    }

    const token = localStorage.getItem('token');

    console.log('Authentication check:', {
        token: token ? 'Present' : 'Missing',
        userEmail: localStorage.getItem('userEmail') ? 'Present' : 'Missing'
    });

    // Disable button during processing
    const wishlistBtn = $('#wishlistBtn');
    const originalBtnText = wishlistBtn.html();
    wishlistBtn.prop('disabled', true).text('Adding...');

    console.log('Adding to wishlist:', currentProduct.id);

    // Add to wishlist API call
    $.ajax({
        url: `${API_BASE_URL}/api/v1/wishlist/add?productId=${currentProduct.id}`,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(response) {
            wishlistBtn.prop('disabled', false).html(originalBtnText);
            console.log('Wishlist API response:', response);

            if (response.code === 200) {
                showSuccess(`${currentProduct.name} has been added to your wishlist.`);
            } else {
                showError(response.message || 'Failed to add to wishlist.');
            }
        },
        error: function(xhr, status, error) {
            wishlistBtn.prop('disabled', false).html(originalBtnText);
            console.error('Error adding to wishlist:', error);
            console.log('Status code:', xhr.status);
            console.log('Response:', xhr.responseText);

            // If authentication fails, prompt for login
            if (xhr.status === 403 || xhr.status === 401) {
                console.log('Authentication failed, clearing tokens');
                clearAuthData();
                handleUnauthenticated('Your session has expired. Please sign in again.');
            } else {
                let errorMessage = 'Failed to add to wishlist. Please try again later.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                showError(errorMessage);
            }
        }
    });
}

/**
 * Add product to compare list
 */
function addToCompare() {
    // Check if currentProduct is defined
    if (!currentProduct) {
        showError('Product information is not available. Please refresh the page and try again.');
        return;
    }

    // Get current compare list from localStorage
    let compareList;
    try {
        compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    } catch (e) {
        console.error('Error parsing compareList from localStorage', e);
        compareList = [];
    }

    // Check if product already in compare list
    if (compareList.some(item => item.id === currentProduct.id)) {
        showError('This product is already in your compare list.');
        return;
    }

    // Check if compare list is full (max 4 items)
    if (compareList.length >= 4) {
        showError('Compare list is full. Please remove an item before adding a new one.');
        return;
    }

    // Add product to compare list
    compareList.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price || 0,
        image: currentProduct.imageUrl || 'https://via.placeholder.com/300x300?text=Product',
        brand: currentProduct.brandName || 'Brand',
        category: currentProduct.categoryName || 'Category',
        size: currentProduct.size || '',
        type: currentProduct.type || ''
    });

    // Save to localStorage
    try {
        localStorage.setItem('compareList', JSON.stringify(compareList));
        showSuccess(`${currentProduct.name} has been added to your compare list.`);
    } catch (e) {
        console.error('Error saving compareList to localStorage', e);
        showError('Failed to add to compare list. Your browser storage may be full or restricted.');
    }
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
            url: `${API_BASE_URL}/api/v1/cart`,
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
            error: function(xhr, status, error) {
                console.error('Error retrieving cart:', error);

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
 */
function updateCartBadge(count) {
    const cartLink = $('a[href="cart.html"]');
    cartLink.text(`Cart (${count})`);
}

/**
 * Check authentication status and update UI accordingly
 */
function checkAuthStatus() {
    console.log('Checking authentication status...');
    const status = isAuthenticated();
    console.log('User is authenticated:', status);

    if (status) {
        // Update navigation for logged-in user
        $('a[href="authentication.html"]').text('My Account').attr('href', 'account.html');
    } else {
        // Ensure navigation shows Sign In for logged-out users
        $('a[href="account.html"]').text('Sign In').attr('href', 'authentication.html');
    }
}

/**
 * Handle case when authentication is required
 * @param {string} message - Message to show to user
 * @param {boolean} redirect - Whether to redirect to login page
 */
function handleUnauthenticated(message = 'Please sign in to continue.', redirect = true) {
    showError(message);
    if (redirect) {
        setTimeout(() => {
            window.location.href = 'authentication.html?redirect=' + encodeURIComponent(window.location.href);
        }, 2000);
    }
}

/**
 * Show success message
 */
function showSuccess(message) {
    const alertSuccess = $('#alertSuccess');
    alertSuccess.text(message).addClass('show');

    setTimeout(function() {
        alertSuccess.removeClass('show');
    }, 5000);
}

/**
 * Show error message
 */
function showError(message) {
    const alertError = $('#alertError');
    alertError.text(message).addClass('show');

    setTimeout(function() {
        alertError.removeClass('show');
    }, 5000);
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

/**
 * Clear authentication data
 */
function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
}

/**
 * Load recommended products
 */
function loadRecommendedProducts() {
    const recommendedProductsContainer = document.getElementById('recommendedProducts');

    // Call API to get featured or best-selling products
    fetch('http://localhost:8080/api/v1/products?page=0&size=4')
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                const products = data.data.content || [];

                // Clear loading spinner
                recommendedProductsContainer.innerHTML = '';

                if (products.length === 0) {
                    recommendedProductsContainer.innerHTML = '<p>No recommended products available.</p>';
                    return;
                }

                // Render each product
                products.forEach(product => {
                    const productCard = createProductCard(product);
                    recommendedProductsContainer.appendChild(productCard);
                });
            } else {
                throw new Error(data.message || 'Failed to load recommended products');
            }
        })
        .catch(error => {
            console.error('Error loading recommended products:', error);
            recommendedProductsContainer.innerHTML = '<p>Failed to load recommended products.</p>';
        });
}


function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';

    productCard.innerHTML = `
        <div class="product-card-image">
            <img src="${product.imageUrl || 'https://via.placeholder.com/300x300?text=Tyre'}" alt="${product.name}">
        </div>
        <div class="product-card-info">
            <h3 class="product-card-title">${product.name}</h3>
            <div class="product-card-price">$${(product.price || 0).toFixed(2)}</div>
            <a href="product-detail.html?id=${product.id}" class="btn">View Details</a>
        </div>
    `;

    return productCard;
}

// Load the header dynamically
document.addEventListener("DOMContentLoaded", function() {
    const headerPlaceholder = document.getElementById("headerPlaceholder");
    fetch("header.html")
        .then(response => response.text())
        .then(data => {
            headerPlaceholder.innerHTML = data;

            // Reinitialize any JavaScript functionality in the header
            initHeader();
            setupEventListeners();
        })
        .catch(error => console.error("Error loading header:", error));
});
