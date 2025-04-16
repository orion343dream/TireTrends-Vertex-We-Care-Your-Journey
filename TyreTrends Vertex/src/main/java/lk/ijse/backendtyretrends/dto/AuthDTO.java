package lk.ijse.backendtyretrends.dto;

import lk.ijse.backendtyretrends.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AuthDTO {
    private String email;
    private String token;
    private UserRole role;
}