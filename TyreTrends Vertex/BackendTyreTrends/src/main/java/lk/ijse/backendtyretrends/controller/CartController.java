// CartController.java
package lk.ijse.backendtyretrends.controller;

import lk.ijse.backendtyretrends.dto.CartDTO;
import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.service.CartService;
import lk.ijse.backendtyretrends.util.JwtUtil;
import lk.ijse.backendtyretrends.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@CrossOrigin(origins = "*")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<ResponseDTO> getCart(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            CartDTO cart = cartService.getCartByUser(userEmail);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Cart retrieved successfully", cart)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addToCart(
            @RequestHeader("Authorization") String token,
            @RequestParam Long productId,
            @RequestParam Integer quantity) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            CartDTO updatedCart = cartService.addToCart(userEmail, productId, quantity);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Item added to cart successfully", updatedCart)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateCartItemQuantity(
            @RequestHeader("Authorization") String token,
            @RequestParam Long cartItemId,
            @RequestParam Integer quantity) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            CartDTO updatedCart = cartService.updateCartItemQuantity(userEmail, cartItemId, quantity);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Cart updated successfully", updatedCart)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @DeleteMapping("/remove")
    public ResponseEntity<ResponseDTO> removeFromCart(
            @RequestHeader("Authorization") String token,
            @RequestParam Long cartItemId) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            CartDTO updatedCart = cartService.removeFromCart(userEmail, cartItemId);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Item removed from cart successfully", updatedCart)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ResponseDTO> clearCart(
            @RequestHeader("Authorization") String token) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            CartDTO emptyCart = cartService.clearCart(userEmail);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Cart cleared successfully", emptyCart)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping("/apply-promo")
    public ResponseEntity<ResponseDTO> applyPromoCode(
            @RequestHeader("Authorization") String token,
            @RequestParam String promoCode) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            CartDTO updatedCart = cartService.applyPromoCode(userEmail, promoCode);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Promo code applied successfully", updatedCart)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @DeleteMapping("/remove-promo")
    public ResponseEntity<ResponseDTO> removePromoCode(
            @RequestHeader("Authorization") String token) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            CartDTO updatedCart = cartService.removePromoCode(userEmail);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Promo code removed successfully", updatedCart)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}