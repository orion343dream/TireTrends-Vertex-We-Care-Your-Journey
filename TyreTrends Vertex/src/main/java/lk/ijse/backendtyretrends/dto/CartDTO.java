// CartDTO.java
package lk.ijse.backendtyretrends.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDTO {
    private Long id;
    private String userEmail;
    private List<CartItemDTO> cartItems = new ArrayList<>();
    private BigDecimal totalPrice;
    private Integer totalItems;
    private BigDecimal discountAmount;
    private String appliedPromoCode;
}