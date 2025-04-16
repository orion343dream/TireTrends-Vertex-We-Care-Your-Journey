package lk.ijse.backendtyretrends.service.Impl;

import lk.ijse.backendtyretrends.dto.AddressDTO;
import lk.ijse.backendtyretrends.dto.OrderDTO;
import lk.ijse.backendtyretrends.dto.OrderItemDTO;
import lk.ijse.backendtyretrends.entity.*;
import lk.ijse.backendtyretrends.enums.OrderStatus;
import lk.ijse.backendtyretrends.enums.PaymentMethod;
import lk.ijse.backendtyretrends.repo.*;
import lk.ijse.backendtyretrends.service.CartService;
import lk.ijse.backendtyretrends.service.OrderService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public OrderDTO createOrder(String userEmail, AddressDTO shippingAddressDTO, AddressDTO billingAddressDTO, String paymentMethod) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Cart cart = cartRepository.findByUser(user);
        if (cart == null || cart.getCartItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // Create new order
        Order order = new Order();
        order.setUser(user);
        order.setOrderNumber(generateOrderNumber());
        order.setStatus(OrderStatus.PENDING);

        // Handle shipping address - either find existing or create new
        Address shippingAddress = findOrCreateAddress(user, shippingAddressDTO);
        order.setShippingAddress(shippingAddress);

        // Handle billing address - either same as shipping or find/create separately
        Address billingAddress;
        if (isSameAddress(shippingAddressDTO, billingAddressDTO)) {
            billingAddress = shippingAddress;
        } else {
            billingAddress = findOrCreateAddress(user, billingAddressDTO);
        }
        order.setBillingAddress(billingAddress);

        // Set payment method
        order.setPaymentMethod(PaymentMethod.valueOf(paymentMethod));

        // Calculate order totals
        BigDecimal subtotal = cart.getTotalPrice();

        // Calculate tax (7%)
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.07"));

        // Calculate shipping (free for orders over $100)
        BigDecimal shipping = subtotal.compareTo(new BigDecimal("100")) >= 0 ?
                BigDecimal.ZERO : new BigDecimal("9.99");

        order.setSubtotal(subtotal);
        order.setTax(tax);
        order.setShippingCost(shipping);
        order.setDiscountAmount(cart.getDiscountAmount());

        // Calculate total
        BigDecimal total = subtotal.add(tax).add(shipping).subtract(cart.getDiscountAmount());
        order.setTotal(total);

        // Create order items from cart items
        List<OrderItem> orderItems = new ArrayList<>();

        Order finalOrder = order;
        cart.getCartItems().forEach(cartItem -> {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(finalOrder);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setProductName(cartItem.getProduct().getName());
            orderItem.setProductSize(cartItem.getProduct().getSize());
            orderItem.setProductType(cartItem.getProduct().getType());
            orderItem.setProductImage(cartItem.getProduct().getImageUrl());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(cartItem.getUnitPrice());
            orderItems.add(orderItem);

            // Update product stock
            cartItem.getProduct().setStock(cartItem.getProduct().getStock() - cartItem.getQuantity());
            productRepository.save(cartItem.getProduct());
        });

        order.setOrderItems(orderItems);

        // Save order
        order = orderRepository.save(order);

        // Clear the cart after successful order creation
        cartService.clearCart(userEmail);

        return mapOrderToDTO(order);
    }

    private String generateOrderNumber() {
        return null;

    }

    @Override
    public OrderDTO getOrderById(Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

            return mapOrderToDTO(order);
        } catch (Exception e) {
            // Log the detailed error for debugging
            System.err.println("Error getting order ID " + orderId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error retrieving order: " + e.getMessage(), e);
        }
    }

    @Override
    public OrderDTO getOrderByOrderNumber(String orderNumber) {
        return null;
    }

    @Override
    public Page<OrderDTO> getUserOrders(String userEmail, Pageable pageable) {
        return null;
    }

    @Override
    public Page<OrderDTO> getUserOrdersByStatus(String userEmail, OrderStatus status, Pageable pageable) {
        return null;
    }

    @Override
    public Page<OrderDTO> getUserOrdersByDateRange(String userEmail, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return null;
    }

    @Override
    public OrderDTO updateOrderStatus(Long orderId, OrderStatus status) {
        return null;
    }

    @Override
    public OrderDTO cancelOrder(Long orderId) {
        return null;
    }

    @Override
    public Page<OrderDTO> getAllOrders(Pageable pageable) {
        return null;
    }

    @Override
    public Page<OrderDTO> getOrdersByStatus(OrderStatus status, Pageable pageable) {
        return null;
    }

    @Override
    public Page<OrderDTO> searchOrders(String query, Pageable pageable) {
        return null;
    }

    @Override
    public Page<OrderDTO> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return null;
    }

    /**
     * Find existing address or create a new one
     */
    private Address findOrCreateAddress(User user, AddressDTO addressDTO) {
        // Try to find an exact match first
        List<Address> userAddresses = addressRepository.findByUser(user);

        for (Address existingAddress : userAddresses) {
            if (matchesExactly(existingAddress, addressDTO)) {
                return existingAddress;
            }
        }

        // If no match found, create new address
        Address newAddress = new Address();
        newAddress.setUser(user);
        newAddress.setFirstName(addressDTO.getFirstName());
        newAddress.setLastName(addressDTO.getLastName());
        newAddress.setAddress(addressDTO.getAddress());
        newAddress.setAddress2(addressDTO.getAddress2());
        newAddress.setCity(addressDTO.getCity());
        newAddress.setState(addressDTO.getState());
        newAddress.setZipCode(addressDTO.getZipCode());
        newAddress.setCountry(addressDTO.getCountry());
        newAddress.setPhone(addressDTO.getPhone());
        newAddress.setIsDefault(false); // Only saved addresses can be default

        return addressRepository.save(newAddress);
    }

    /**
     * Check if an existing address matches the given DTO
     */
    private boolean matchesExactly(Address address, AddressDTO dto) {
        return address.getFirstName().equals(dto.getFirstName()) &&
                address.getLastName().equals(dto.getLastName()) &&
                address.getAddress().equals(dto.getAddress()) &&
                // Check for null on address2
                ((address.getAddress2() == null && dto.getAddress2() == null) ||
                        (address.getAddress2() != null && address.getAddress2().equals(dto.getAddress2()))) &&
                address.getCity().equals(dto.getCity()) &&
                address.getState().equals(dto.getState()) &&
                address.getZipCode().equals(dto.getZipCode()) &&
                address.getCountry().equals(dto.getCountry()) &&
                address.getPhone().equals(dto.getPhone());
    }

    /**
     * Check if shipping and billing address are the same
     */
    private boolean isSameAddress(AddressDTO shipping, AddressDTO billing) {
        if (shipping == null || billing == null) {
            return false;
        }

        return shipping.getFirstName().equals(billing.getFirstName()) &&
                shipping.getLastName().equals(billing.getLastName()) &&
                shipping.getAddress().equals(billing.getAddress()) &&
                // Check for null on address2
                ((shipping.getAddress2() == null && billing.getAddress2() == null) ||
                        (shipping.getAddress2() != null && shipping.getAddress2().equals(billing.getAddress2()))) &&
                shipping.getCity().equals(billing.getCity()) &&
                shipping.getState().equals(billing.getState()) &&
                shipping.getZipCode().equals(billing.getZipCode()) &&
                shipping.getCountry().equals(billing.getCountry()) &&
                shipping.getPhone().equals(billing.getPhone());
    }

    private OrderDTO mapOrderToDTO(Order order) {
        OrderDTO orderDTO = new OrderDTO();
        orderDTO.setId(order.getId());
        orderDTO.setOrderNumber(order.getOrderNumber());
        orderDTO.setUserEmail(order.getUser().getEmail());
        orderDTO.setFirstName(order.getUser().getFirstName());
        orderDTO.setLastName(order.getUser().getLastName());
        orderDTO.setStatus(order.getStatus());
        orderDTO.setSubtotal(order.getSubtotal());
        orderDTO.setTax(order.getTax());
        orderDTO.setShippingCost(order.getShippingCost());
        orderDTO.setDiscountAmount(order.getDiscountAmount());
        orderDTO.setTotal(order.getTotal());
        orderDTO.setCreatedAt(order.getCreatedAt());
        orderDTO.setUpdatedAt(order.getUpdatedAt());

        // Safely map shipping address - handle null case
        if (order.getShippingAddress() != null) {
            orderDTO.setShippingAddress(modelMapper.map(order.getShippingAddress(), AddressDTO.class));
        } else {
            // Create an empty address DTO if shipping address is null
            orderDTO.setShippingAddress(new AddressDTO());
        }

        // Safely map billing address - handle null case
        if (order.getBillingAddress() != null) {
            orderDTO.setBillingAddress(modelMapper.map(order.getBillingAddress(), AddressDTO.class));
        } else {
            // If billing address is null, use same as shipping or empty
            if (orderDTO.getShippingAddress() != null) {
                orderDTO.setBillingAddress(orderDTO.getShippingAddress());
            } else {
                orderDTO.setBillingAddress(new AddressDTO());
            }
        }

        // Set payment method - handle null case
        if (order.getPaymentMethod() != null) {
            orderDTO.setPaymentMethod(order.getPaymentMethod().toString());
        } else {
            orderDTO.setPaymentMethod("UNKNOWN");
        }

        // Set order items
        List<OrderItemDTO> orderItemDTOs = order.getOrderItems().stream()
                .map(this::mapOrderItemToDTO)
                .collect(Collectors.toList());

        orderDTO.setOrderItems(orderItemDTOs);

        return orderDTO;
    }
    private OrderItemDTO mapOrderItemToDTO(OrderItem orderItem) {
        // Existing code for mapping OrderItem to OrderItemDTO
        OrderItemDTO orderItemDTO = new OrderItemDTO();
        orderItemDTO.setId(orderItem.getId());
        orderItemDTO.setProductId(orderItem.getProduct().getId());
        orderItemDTO.setProductName(orderItem.getProductName());
        orderItemDTO.setProductSize(orderItem.getProductSize());
        orderItemDTO.setProductType(orderItem.getProductType());
        orderItemDTO.setProductImage(orderItem.getProductImage());
        orderItemDTO.setQuantity(orderItem.getQuantity());
        orderItemDTO.setPrice(orderItem.getPrice());

        return orderItemDTO;
    }

    // Other methods remain the same...
}