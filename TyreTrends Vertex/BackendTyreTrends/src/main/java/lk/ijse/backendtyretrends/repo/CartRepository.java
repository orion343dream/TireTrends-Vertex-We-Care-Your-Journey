// CartRepository.java
package lk.ijse.backendtyretrends.repo;

import lk.ijse.backendtyretrends.entity.Cart;
import lk.ijse.backendtyretrends.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Cart findByUser(User user);
}