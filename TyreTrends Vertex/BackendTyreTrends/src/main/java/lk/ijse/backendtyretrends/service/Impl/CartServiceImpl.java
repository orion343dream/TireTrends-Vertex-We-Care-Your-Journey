// CartServiceImpl.java
package lk.ijse.backendtyretrends.service.Impl;

import lk.ijse.backendtyretrends.dto.CartDTO;
import lk.ijse.backendtyretrends.dto.CartItemDTO;
import lk.ijse.backendtyretrends.entity.Cart;
import lk.ijse.backendtyretrends.entity.CartItem;
import lk.ijse.backendtyretrends.entity.Product;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.repo.CartItemRepository;
import lk.ijse.backendtyretrends.repo.CartRepository;
import lk.ijse.backendtyretrends.repo.ProductRepository;
import lk.ijse.backendtyretrends.repo.UserRepository;
import lk.ijse.backendtyretrends.service.CartService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CartServiceImpl implements CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public CartDTO getCartByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Cart cart = cartRepository.findByUser(user);
        if (cart == null) {
            cart = new Cart();
            cart.setUser(user);
            cart = cartRepository.save(cart);
        }

        return mapCartToDTO(cart);
    }

    @Override
    public CartDTO addToCart(String userEmail, Long productId, Integer quantity) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getStock() < quantity) {
            throw new RuntimeException("Not enough stock available");
        }

        Cart cart = cartRepository.findByUser(user);
        if (cart == null) {
            cart = new Cart();
            cart.setUser(user);
            cart = cartRepository.save(cart);
        }

        CartItem cartItem = cartItemRepository.findByCartAndProduct(cart, product);

        if (cartItem != null) {
            // Update existing cart item
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
        } else {
            // Create new cart item
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            cartItem.setUnitPrice(product.getPrice());
            cart.getCartItems().add(cartItem);
        }

        // Update cart totals
        updateCartTotals(cart);

        cart = cartRepository.save(cart);

        return mapCartToDTO(cart);
    }

    @Override
    public CartDTO updateCartItemQuantity(String userEmail, Long cartItemId, Integer quantity) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Cart cart = cartRepository.findByUser(user);
        if (cart == null) {
            throw new RuntimeException("Cart not found");
        }

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Cart item does not belong to user's cart");
        }

        Product product = cartItem.getProduct();
        if (product.getStock() < quantity) {
            throw new RuntimeException("Not enough stock available");
        }

        cartItem.setQuantity(quantity);

        // Update cart totals
        updateCartTotals(cart);

        cart = cartRepository.save(cart);

        return mapCartToDTO(cart);
    }

    @Override
    public CartDTO removeFromCart(String userEmail, Long cartItemId) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Cart cart = cartRepository.findByUser(user);
        if (cart == null) {
            throw new RuntimeException("Cart not found");
        }

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Cart item does not belong to user's cart");
        }

        cart.getCartItems().remove(cartItem);
        cartItemRepository.delete(cartItem);

        // Update cart totals
        updateCartTotals(cart);

        cart = cartRepository.save(cart);

        return mapCartToDTO(cart);
    }

    @Override
    public CartDTO clearCart(String userEmail) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Cart cart = cartRepository.findByUser(user);
        if (cart == null) {
            throw new RuntimeException("Cart not found");
        }

        cart.getCartItems().clear();
        cart.setTotalPrice(BigDecimal.ZERO);
        cart.setTotalItems(0);
        cart.setDiscountAmount(BigDecimal.ZERO);
        cart.setAppliedPromoCode(null);

        cart = cartRepository.save(cart);

        return mapCartToDTO(cart);
    }

    @Override
    public CartDTO applyPromoCode(String userEmail, String promoCode) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Cart cart = cartRepository.findByUser(user);
        if (cart == null) {
            throw new RuntimeException("Cart not found");
        }

        // Simulate promo code validation
        if ("WELCOME10".equalsIgnoreCase(promoCode)) {
            // 10% discount
            BigDecimal discount = cart.getTotalPrice().multiply(new BigDecimal("0.1"));
            cart.setDiscountAmount(discount);
            cart.setAppliedPromoCode(promoCode);
        } else if ("SUMMER20".equalsIgnoreCase(promoCode)) {
            // 20% discount
            BigDecimal discount = cart.getTotalPrice().multiply(new BigDecimal("0.2"));
            cart.setDiscountAmount(discount);
            cart.setAppliedPromoCode(promoCode);
        } else {
            throw new RuntimeException("Invalid promo code");
        }

        cart = cartRepository.save(cart);

        return mapCartToDTO(cart);
    }

    @Override
    public CartDTO removePromoCode(String userEmail) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Cart cart = cartRepository.findByUser(user);
        if (cart == null) {
            throw new RuntimeException("Cart not found");
        }

        cart.setDiscountAmount(BigDecimal.ZERO);
        cart.setAppliedPromoCode(null);

        cart = cartRepository.save(cart);

        return mapCartToDTO(cart);
    }

    private void updateCartTotals(Cart cart) {
        BigDecimal totalPrice = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartItem item : cart.getCartItems()) {
            BigDecimal itemTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            totalPrice = totalPrice.add(itemTotal);
            totalItems += item.getQuantity();
        }

        cart.setTotalPrice(totalPrice);
        cart.setTotalItems(totalItems);

        // Recalculate discount if promo code is applied
        if (cart.getAppliedPromoCode() != null) {
            if ("WELCOME10".equalsIgnoreCase(cart.getAppliedPromoCode())) {
                cart.setDiscountAmount(totalPrice.multiply(new BigDecimal("0.1")));
            } else if ("SUMMER20".equalsIgnoreCase(cart.getAppliedPromoCode())) {
                cart.setDiscountAmount(totalPrice.multiply(new BigDecimal("0.2")));
            }
        }
    }

    private CartDTO mapCartToDTO(Cart cart) {
        CartDTO cartDTO = new CartDTO();
        cartDTO.setId(cart.getId());
        cartDTO.setUserEmail(cart.getUser().getEmail());
        cartDTO.setTotalPrice(cart.getTotalPrice());
        cartDTO.setTotalItems(cart.getTotalItems());
        cartDTO.setDiscountAmount(cart.getDiscountAmount());
        cartDTO.setAppliedPromoCode(cart.getAppliedPromoCode());

        List<CartItemDTO> cartItemDTOs = cart.getCartItems().stream()
                .map(this::mapCartItemToDTO)
                .collect(Collectors.toList());

        cartDTO.setCartItems(cartItemDTOs);

        return cartDTO;
    }

    private CartItemDTO mapCartItemToDTO(CartItem cartItem) {
        CartItemDTO cartItemDTO = new CartItemDTO();
        cartItemDTO.setId(cartItem.getId());
        cartItemDTO.setProductId(cartItem.getProduct().getId());
        cartItemDTO.setProductName(cartItem.getProduct().getName());
        cartItemDTO.setProductSize(cartItem.getProduct().getSize());
        cartItemDTO.setProductType(cartItem.getProduct().getType());
        cartItemDTO.setProductImage(cartItem.getProduct().getImageUrl());
        cartItemDTO.setQuantity(cartItem.getQuantity());
        cartItemDTO.setUnitPrice(cartItem.getUnitPrice());

        return cartItemDTO;
    }
}