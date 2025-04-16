package lk.ijse.backendtyretrends.dto;

import lk.ijse.backendtyretrends.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
    private String address;
    private UserRole role = UserRole.ADMIN; // Default role for admins
    private LocalDateTime createdAt;
}