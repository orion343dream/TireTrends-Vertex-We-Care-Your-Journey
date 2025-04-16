// OrderRepository.java
package lk.ijse.backendtyretrends.repo;

import lk.ijse.backendtyretrends.entity.Order;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUser(User user, Pageable pageable);

    Page<Order> findByUserAndStatus(User user, OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.user = ?1 AND o.createdAt BETWEEN ?2 AND ?3")
    Page<Order> findByUserAndDateRange(User user, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.status = ?1")
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.orderNumber LIKE %?1% OR o.user.firstName LIKE %?1% OR o.user.lastName LIKE %?1% OR o.user.email LIKE %?1%")
    Page<Order> searchOrders(String query, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN ?1 AND ?2")
    Page<Order> findByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
}