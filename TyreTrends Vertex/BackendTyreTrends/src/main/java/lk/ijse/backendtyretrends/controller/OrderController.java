// OrderController.java
package lk.ijse.backendtyretrends.controller;

import lk.ijse.backendtyretrends.dto.OrderDTO;
import lk.ijse.backendtyretrends.dto.OrderRequestDTO;
import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.enums.OrderStatus;
import lk.ijse.backendtyretrends.service.OrderService;
import lk.ijse.backendtyretrends.util.JwtUtil;
import lk.ijse.backendtyretrends.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ResponseDTO> createOrder(
            @RequestHeader("Authorization") String token,
            @RequestBody OrderRequestDTO orderRequest) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            // Note: OrderRequestDTO must be updated to include:
            // - shippingAddressId and billingAddressId for existing addresses
            // - saveShippingAddress and saveBillingAddress flags for new addresses

            OrderDTO order = orderService.createOrder(
                    userEmail,
                    orderRequest.getShippingAddress(),
                    orderRequest.getBillingAddress(),
                    orderRequest.getPaymentMethod()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Order created successfully", order));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
    @GetMapping("/{orderId}")
    public ResponseEntity<ResponseDTO> getOrderById(
            @RequestHeader("Authorization") String token,
            @PathVariable Long orderId) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            OrderDTO order = orderService.getOrderById(orderId);

            // Check if order belongs to user (unless admin)
            if (!order.getUserEmail().equals(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ResponseDTO(VarList.Forbidden, "Access denied", null));
            }

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Order retrieved successfully", order)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<ResponseDTO> getOrderByOrderNumber(
            @RequestHeader("Authorization") String token,
            @PathVariable String orderNumber) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            OrderDTO order = orderService.getOrderByOrderNumber(orderNumber);

            // Check if order belongs to user (unless admin)
            if (!order.getUserEmail().equals(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ResponseDTO(VarList.Forbidden, "Access denied", null));
            }

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Order retrieved successfully", order)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping
    public ResponseEntity<ResponseDTO> getUserOrders(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<OrderDTO> orders;

            if (status != null && !status.isEmpty()) {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                orders = orderService.getUserOrdersByStatus(userEmail, orderStatus, pageable);
            } else {
                orders = orderService.getUserOrders(userEmail, pageable);
            }

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Orders retrieved successfully", orders)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    // OrderController.java (continued)
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ResponseDTO> cancelOrder(
            @RequestHeader("Authorization") String token,
            @PathVariable Long orderId) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            OrderDTO order = orderService.getOrderById(orderId);

            // Check if order belongs to user (unless admin)
            if (!order.getUserEmail().equals(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ResponseDTO(VarList.Forbidden, "Access denied", null));
            }

            // Can only cancel orders in PENDING or PAID status
            if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PAID) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Cannot cancel order in " + order.getStatus() + " status", null));
            }

            OrderDTO cancelledOrder = orderService.cancelOrder(orderId);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Order cancelled successfully", cancelledOrder)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    // Admin endpoints

    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<OrderDTO> orders;

            if (status != null && !status.isEmpty()) {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                orders = orderService.getOrdersByStatus(orderStatus, pageable);
            } else if (search != null && !search.isEmpty()) {
                orders = orderService.searchOrders(search, pageable);
            } else {
                orders = orderService.getAllOrders(pageable);
            }

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Orders retrieved successfully", orders)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PutMapping("/admin/{orderId}/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam OrderStatus status) {
        try {
            OrderDTO updatedOrder = orderService.updateOrderStatus(orderId, status);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Order status updated successfully", updatedOrder)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping("/admin/date-range")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> getOrdersByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
            LocalDateTime start = LocalDateTime.parse(startDate, formatter);
            LocalDateTime end = LocalDateTime.parse(endDate, formatter);

            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<OrderDTO> orders = orderService.getOrdersByDateRange(start, end, pageable);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Orders retrieved successfully", orders)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}

