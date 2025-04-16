package lk.ijse.backendtyretrends.repo;

import lk.ijse.backendtyretrends.entity.ServiceBooking;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.enums.ServiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceBookingRepository extends JpaRepository<ServiceBooking, Long> {
    Optional<ServiceBooking> findByBookingNumber(String bookingNumber);

    Page<ServiceBooking> findByUser(User user, Pageable pageable);

    Page<ServiceBooking> findByUserAndStatus(User user, ServiceStatus status, Pageable pageable);

    Page<ServiceBooking> findByStatus(ServiceStatus status, Pageable pageable);

    List<ServiceBooking> findByDateAndStatus(LocalDate date, ServiceStatus status);

    @Query("SELECT sb FROM ServiceBooking sb WHERE DATE(sb.createdAt) BETWEEN :startDate AND :endDate")
    Page<ServiceBooking> findByCreatedAtBetween(@Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate,
                                                Pageable pageable);

    @Query("SELECT COUNT(sb) FROM ServiceBooking sb WHERE sb.status = :status")
    Long countByStatus(@Param("status") ServiceStatus status);

    @Query("SELECT COUNT(sb) FROM ServiceBooking sb WHERE sb.date = :date")
    Long countByDate(@Param("date") LocalDate date);

    @Query("SELECT sb FROM ServiceBooking sb WHERE " +
            "(LOWER(sb.user.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(sb.user.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(sb.user.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(sb.bookingNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(sb.vehicle.make) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(sb.vehicle.model) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ServiceBooking> searchBookings(@Param("search") String search, Pageable pageable);
}
