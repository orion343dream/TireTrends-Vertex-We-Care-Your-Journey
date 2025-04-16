// CartItemRepository.java
package lk.ijse.backendtyretrends.repo;

import lk.ijse.backendtyretrends.entity.Cart;
import lk.ijse.backendtyretrends.entity.CartItem;
import lk.ijse.backendtyretrends.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    CartItem findByCartAndProduct(Cart cart, Product product);
}