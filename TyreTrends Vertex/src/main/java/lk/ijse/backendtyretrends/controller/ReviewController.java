package lk.ijse.backendtyretrends.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.dto.ReviewDTO;
import lk.ijse.backendtyretrends.service.ReviewService;
import lk.ijse.backendtyretrends.util.VarList;

@RestController
@RequestMapping("/api/v1/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PreAuthorize("permitAll()")
    @GetMapping("/product/{productId}")
    public ResponseEntity<ResponseDTO> getReviewsByProduct(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {

        ResponseDTO responseDTO = new ResponseDTO();

        try {
            // Build pageable
            Pageable pageable = buildPageable(page, size, sort, direction);

            // Get reviews
            Page<ReviewDTO> reviewsPage = reviewService.getReviewsByProduct(productId, pageable);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Reviews retrieved successfully");
            responseDTO.setData(reviewsPage);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error retrieving reviews: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> getPendingReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        ResponseDTO responseDTO = new ResponseDTO();

        try {
            // Build pageable
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

            // Get pending reviews
            Page<ReviewDTO> reviewsPage = reviewService.getPendingReviews(pageable);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Pending reviews retrieved successfully");
            responseDTO.setData(reviewsPage);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error retrieving pending reviews: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO> getReviewById(@PathVariable Long id) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            ReviewDTO review = reviewService.getReviewById(id);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Review retrieved successfully");
            responseDTO.setData(review);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Not_Found);
            responseDTO.setMessage("Review not found: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseDTO);
        }
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<ResponseDTO> createReview(@RequestBody ReviewDTO reviewDTO) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            ReviewDTO createdReview = reviewService.createReview(reviewDTO);

            responseDTO.setCode(VarList.Created);
            responseDTO.setMessage("Review submitted successfully and pending approval");
            responseDTO.setData(createdReview);

            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error submitting review: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> approveReview(@PathVariable Long id) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            boolean approved = reviewService.approveReview(id);

            if (approved) {
                responseDTO.setCode(VarList.OK);
                responseDTO.setMessage("Review approved successfully");
                responseDTO.setData(null);

                return ResponseEntity.ok(responseDTO);
            } else {
                responseDTO.setCode(VarList.Not_Found);
                responseDTO.setMessage("Review not found");
                responseDTO.setData(null);

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseDTO);
            }
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error approving review: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> deleteReview(@PathVariable Long id) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            reviewService.deleteReview(id);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Review deleted successfully");
            responseDTO.setData(null);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error deleting review: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    // Helper method to build pageable for sorting and pagination
    private Pageable buildPageable(int page, int size, String sort, String direction) {
        Sort.Direction sortDirection = Sort.Direction.ASC;
        if (direction.equalsIgnoreCase("desc")) {
            sortDirection = Sort.Direction.DESC;
        }

        return PageRequest.of(page, size, Sort.by(sortDirection, sort));
    }
}