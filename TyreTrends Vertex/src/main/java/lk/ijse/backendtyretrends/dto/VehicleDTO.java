package lk.ijse.backendtyretrends.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDTO {
    private Long id;
    private String make;
    private String model;
    private String year;
    private String trim;
    private String tireSizesFront;
    private String tireSizesRear;
    private String licensePlate;
    private String vehicleType;
    private Boolean isPrimary;
    private LocalDateTime createdAt;
}
