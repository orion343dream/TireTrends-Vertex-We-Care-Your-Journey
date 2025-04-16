// CartItemDTO.java
package lk.ijse.backendtyretrends.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String productSize;
    private String productType;
    private String productImage;
    private Integer quantity;
    private BigDecimal unitPrice;
}