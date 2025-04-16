package lk.ijse.backendtyretrends.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import lk.ijse.backendtyretrends.dto.ReviewDTO;

public interface ReviewService {
    ReviewDTO createReview(ReviewDTO reviewDTO);
    ReviewDTO updateReview(Long id, ReviewDTO reviewDTO);
    void deleteReview(Long id);
    ReviewDTO getReviewById(Long id);
    Page<ReviewDTO> getReviewsByProduct(Long productId, Pageable pageable);
    Page<ReviewDTO> getPendingReviews(Pageable pageable);
    boolean approveReview(Long id);
    List<ReviewDTO> getReviewsByUser(String userEmail);
}