// OrderService.java
package lk.ijse.backendtyretrends.service;

import lk.ijse.backendtyretrends.dto.AddressDTO;
import lk.ijse.backendtyretrends.dto.OrderDTO;
import lk.ijse.backendtyretrends.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface OrderService {
    OrderDTO createOrder(String userEmail, AddressDTO shippingAddress, AddressDTO billingAddress, String paymentMethod);

    OrderDTO getOrderById(Long orderId);

    OrderDTO getOrderByOrderNumber(String orderNumber);

    Page<OrderDTO> getUserOrders(String userEmail, Pageable pageable);

    Page<OrderDTO> getUserOrdersByStatus(String userEmail, OrderStatus status, Pageable pageable);

    Page<OrderDTO> getUserOrdersByDateRange(String userEmail, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    OrderDTO updateOrderStatus(Long orderId, OrderStatus status);

    OrderDTO cancelOrder(Long orderId);

    // Admin methods
    Page<OrderDTO> getAllOrders(Pageable pageable);

    Page<OrderDTO> getOrdersByStatus(OrderStatus status, Pageable pageable);

    Page<OrderDTO> searchOrders(String query, Pageable pageable);

    Page<OrderDTO> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
}