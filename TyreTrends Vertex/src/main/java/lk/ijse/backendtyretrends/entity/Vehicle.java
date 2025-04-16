package lk.ijse.backendtyretrends.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "vehicles")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Size(max = 50)
    private String make;

    @NotBlank
    @Size(max = 50)
    private String model;

    @NotBlank
    @Size(max = 10)
    private String year;

    @Size(max = 50)
    private String trim;

    @Size(max = 50)
    private String tireSizesFront;
    
    @Size(max = 50)
    private String tireSizesRear;

    @Size(max = 50)
    private String licensePlate;

    @Size(max = 100)
    private String vehicleType;

    @Column(name = "is_primary")
    private Boolean isPrimary = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ServiceBooking> serviceBookings = new HashSet<>();

    // Constructors
    public Vehicle(User user, String make, String model, String year, String trim, String tireSizesFront) {
        this.user = user;
        this.make = make;
        this.model = model;
        this.year = year;
        this.trim = trim;
        this.tireSizesFront = tireSizesFront;
    }

    // Helper methods
    public void addServiceBooking(ServiceBooking serviceBooking) {
        serviceBookings.add(serviceBooking);
        serviceBooking.setVehicle(this);
    }

    public void removeServiceBooking(ServiceBooking serviceBooking) {
        serviceBookings.remove(serviceBooking);
        serviceBooking.setVehicle(null);
    }

    // Get display name for the vehicle
    public String getDisplayName() {
        if (vehicleType != null && !vehicleType.isEmpty()) {
            return vehicleType;
        }
        return year + " " + make + " " + model + (trim != null && !trim.isEmpty() ? " " + trim : "");
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Vehicle vehicle = (Vehicle) o;
        return id != null && id.equals(vehicle.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
}
