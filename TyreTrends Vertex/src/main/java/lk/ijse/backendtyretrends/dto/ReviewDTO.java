package lk.ijse.backendtyretrends.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String userEmail;
    private String userFullName;
    private Integer rating;
    private String title;
    private String comment;
    private Boolean approved;
    private LocalDateTime createdAt;
}