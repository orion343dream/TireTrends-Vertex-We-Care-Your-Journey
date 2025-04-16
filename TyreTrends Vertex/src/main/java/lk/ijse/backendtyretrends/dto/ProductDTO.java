package lk.ijse.backendtyretrends.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private Long brandId;
    private String brandName;
    private Long categoryId;
    private String categoryName;
    private String size;
    private String type;
    private BigDecimal price;
    private Integer stock;
    private String imageUrl;
    private Boolean active;
    private Double rating;
    private Integer reviewCount;
}