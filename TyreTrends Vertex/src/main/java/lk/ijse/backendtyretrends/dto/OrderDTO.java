package lk.ijse.backendtyretrends.dto;

import lk.ijse.backendtyretrends.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private Long id;
    private String orderNumber;
    private String userEmail;
    private String firstName;
    private String lastName;
    private OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal shippingCost;
    private BigDecimal discountAmount;
    private BigDecimal total;

    // Use AddressDTO instead of embedded fields
    private AddressDTO shippingAddress;
    private AddressDTO billingAddress;

    private String paymentMethod;
    private List<OrderItemDTO> orderItems = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}