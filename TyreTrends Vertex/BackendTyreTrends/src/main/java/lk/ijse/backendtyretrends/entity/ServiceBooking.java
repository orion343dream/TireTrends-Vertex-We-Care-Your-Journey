package lk.ijse.backendtyretrends.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.ijse.backendtyretrends.enums.ServiceStatus;
import lk.ijse.backendtyretrends.enums.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "service_bookings")
public class ServiceBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @NotBlank
    @Size(max = 20)
    @Column(unique = true)
    private String bookingNumber;

    @NotNull
    @Enumerated(EnumType.STRING)
    private ServiceType serviceType;

    @NotNull
    private LocalDate date;

    @NotNull
    private LocalTime time;

    @Size(max = 1000)
    @Column(length = 1000)
    private String notes;

    @NotNull
    @Enumerated(EnumType.STRING)
    private ServiceStatus status;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    private Boolean isPaid = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    private LocalDateTime cancelledAt;

    // Constructors
    public ServiceBooking(User user, Vehicle vehicle, String bookingNumber, ServiceType serviceType, LocalDate date, LocalTime time) {
        this.user = user;
        this.vehicle = vehicle;
        this.bookingNumber = bookingNumber;
        this.serviceType = serviceType;
        this.date = date;
        this.time = time;
        this.status = ServiceStatus.PENDING;
    }

    // Helper methods
    public void markAsConfirmed() {
        this.status = ServiceStatus.CONFIRMED;
    }

    public void markAsInProgress() {
        this.status = ServiceStatus.IN_PROGRESS;
    }

    public void markAsCompleted() {
        this.status = ServiceStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    public void markAsCancelled() {
        this.status = ServiceStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ServiceBooking that = (ServiceBooking) o;
        return bookingNumber.equals(that.bookingNumber);
    }

    @Override
    public int hashCode() {
        return bookingNumber.hashCode();
    }
}
