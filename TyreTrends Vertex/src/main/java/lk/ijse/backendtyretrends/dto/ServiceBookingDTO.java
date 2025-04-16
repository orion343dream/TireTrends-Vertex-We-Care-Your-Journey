package lk.ijse.backendtyretrends.dto;

import lk.ijse.backendtyretrends.enums.ServiceStatus;
import lk.ijse.backendtyretrends.enums.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceBookingDTO {
    private Long id;
    private String bookingNumber;
    private ServiceType serviceType;
    private String serviceTypeName;
    private Long vehicleId;
    private String vehicleInfo;
    private String userEmail;
    private String userName;
    private String userPhone;
    private LocalDate date;
    private LocalTime time;
    private String notes;
    private ServiceStatus status;
    private BigDecimal price;
    private Boolean isPaid;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
}
