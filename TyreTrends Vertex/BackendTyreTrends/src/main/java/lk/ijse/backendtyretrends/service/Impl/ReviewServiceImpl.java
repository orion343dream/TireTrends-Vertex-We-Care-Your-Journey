package lk.ijse.backendtyretrends.service.Impl;

import java.util.List;
import java.util.stream.Collectors;

import lk.ijse.backendtyretrends.service.ProductService;
import lk.ijse.backendtyretrends.service.ReviewService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lk.ijse.backendtyretrends.dto.ReviewDTO;
import lk.ijse.backendtyretrends.entity.Product;
import lk.ijse.backendtyretrends.entity.Review;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.repo.ProductRepository;
import lk.ijse.backendtyretrends.repo.ReviewRepository;
import lk.ijse.backendtyretrends.repo.UserRepository;

@Service
@Transactional
public class ReviewServiceImpl implements ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public ReviewDTO createReview(ReviewDTO reviewDTO) {
        // Get product and user
        Product product = productRepository.findById(reviewDTO.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        User user = userRepository.findByEmail(reviewDTO.getUserEmail());
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        // Create review entity
        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(reviewDTO.getRating());
        review.setTitle(reviewDTO.getTitle());
        review.setComment(reviewDTO.getComment());
        review.setApproved(false); // Reviews require approval by default

        // Save review
        Review savedReview = reviewRepository.save(review);

        // Add review to product
        product.addReview(review);

        // Update product rating - here we pass the product itself since service may expect that
        updateProductRating(product);

        // Map to DTO
        ReviewDTO savedDTO = mapToDTO(savedReview);

        return savedDTO;
    }

    @Override
    public ReviewDTO updateReview(Long id, ReviewDTO reviewDTO) {
        Review existingReview = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (reviewDTO.getRating() != null) existingReview.setRating(reviewDTO.getRating());
        if (reviewDTO.getTitle() != null) existingReview.setTitle(reviewDTO.getTitle());
        if (reviewDTO.getComment() != null) existingReview.setComment(reviewDTO.getComment());
        if (reviewDTO.getApproved() != null) existingReview.setApproved(reviewDTO.getApproved());

        Review updatedReview = reviewRepository.save(existingReview);

        // Update product rating
        Product product = updatedReview.getProduct();
        updateProductRating(product);

        // Map to DTO
        ReviewDTO updatedDTO = mapToDTO(updatedReview);

        return updatedDTO;
    }

    @Override
    public boolean approveReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        review.setApproved(true);
        reviewRepository.save(review);

        // Update product rating after approval
        updateProductRating(review.getProduct());

        return true;
    }

    @Override
    public void deleteReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        Product product = review.getProduct();

        // Remove review from product
        product.removeReview(review);

        // Remove the review
        reviewRepository.deleteById(id);

        // Update product rating
        updateProductRating(product);
    }

    @Override
    public ReviewDTO getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        return mapToDTO(review);
    }

    @Override
    public Page<ReviewDTO> getReviewsByProduct(Long productId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByProductId(productId, pageable);

        return reviews.map(this::mapToDTO);
    }

    @Override
    public Page<ReviewDTO> getPendingReviews(Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByApproved(false, pageable);

        return reviews.map(this::mapToDTO);
    }

    @Override
    public List<ReviewDTO> getReviewsByUser(String userEmail) {
        List<Review> reviews = reviewRepository.findByUserEmail(userEmail);

        return reviews.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Helper method to update product rating
    private void updateProductRating(Product product) {
        if (product == null) return;

        // Calculate rating
        double sum = 0.0;
        int approvedCount = 0;

        for (Review review : product.getReviews()) {
            if (review != null && review.getApproved() != null &&
                    review.getApproved() && review.getRating() != null) {
                sum += review.getRating();
                approvedCount++;
            }
        }

        // Update product rating and review count
        if (approvedCount > 0) {
            product.setRating(sum / approvedCount);
            product.setReviewCount(approvedCount);
        } else {
            product.setRating(0.0);
            product.setReviewCount(0);
        }

        // Save updated product
        productRepository.save(product);
    }

    // Helper method to map Review entity to ReviewDTO
    private ReviewDTO mapToDTO(Review review) {
        ReviewDTO dto = modelMapper.map(review, ReviewDTO.class);
        dto.setProductId(review.getProduct().getId());
        dto.setProductName(review.getProduct().getName());
        dto.setUserEmail(review.getUser().getEmail());
        dto.setUserFullName(review.getUser().getFirstName() + " " + review.getUser().getLastName());
        return dto;
    }

    // Helper method to map ReviewDTO to Review entity
    private Review mapToEntity(ReviewDTO reviewDTO) {
        Review review = modelMapper.map(reviewDTO, Review.class);

        // Set product
        Product product = productRepository.findById(reviewDTO.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        review.setProduct(product);

        // Set user
        User user = userRepository.findByEmail(reviewDTO.getUserEmail());
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        review.setUser(user);

        return review;
    }
}