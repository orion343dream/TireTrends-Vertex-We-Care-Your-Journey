package lk.ijse.backendtyretrends.dto;

import lombok.*;

// Order request DTO for capturing order creation parameters
@Setter
@Getter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDTO {
    // Address objects for new addresses
    private AddressDTO shippingAddress;
    private AddressDTO billingAddress;

    // IDs for existing addresses
    private Long shippingAddressId;
    private Long billingAddressId;

    // Flags for saving addresses
    private Boolean saveShippingAddress;
    private Boolean saveBillingAddress;

    private String paymentMethod;

}
