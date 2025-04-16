package lk.ijse.backendtyretrends.controller;

import jakarta.validation.Valid;
import lk.ijse.backendtyretrends.dto.*;
import lk.ijse.backendtyretrends.service.Impl.AuthService;
import lk.ijse.backendtyretrends.service.PasswordResetService;
import lk.ijse.backendtyretrends.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/authenticate")
    public ResponseEntity<ResponseDTO> login(@RequestBody UserDTO userDTO) {
        ResponseDTO responseDTO = new ResponseDTO();
        try {
            AuthDTO authDTO = authService.login(userDTO.getEmail(), userDTO.getPassword());
            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Login successful");
            responseDTO.setData(authDTO);

            // Return the response with HTTP status 200 (OK)
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("An error occurred: " + e.getMessage());
            responseDTO.setData(null);

            // Return the response with HTTP status 500 (Internal Server Error)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String token) {
        // Logout the user by blacklisting the token
        authService.logout(token);

        return ResponseEntity.ok("Logged out successfully");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ResponseDTO> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO request) {
        ResponseDTO responseDTO = new ResponseDTO();
        try {
            boolean processed = passwordResetService.processForgotPasswordRequest(request);

            if (processed) {
                responseDTO.setCode(VarList.OK);
                responseDTO.setMessage("If the email exists in our system, a password reset link has been sent.");
                responseDTO.setData(null);
                return ResponseEntity.ok(responseDTO);
            } else {
                responseDTO.setCode(VarList.Internal_Server_Error);
                responseDTO.setMessage("Failed to process password reset request.");
                responseDTO.setData(null);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
            }
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("An error occurred: " + e.getMessage());
            responseDTO.setData(null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/validate-reset-token")
    public ResponseEntity<ResponseDTO> validateResetToken(@RequestParam String token) {
        ResponseDTO responseDTO = new ResponseDTO();
        try {
            boolean isValid = passwordResetService.validatePasswordResetToken(token);

            if (isValid) {
                responseDTO.setCode(VarList.OK);
                responseDTO.setMessage("Token is valid");
                responseDTO.setData(true);
                return ResponseEntity.ok(responseDTO);
            } else {
                responseDTO.setCode(VarList.Bad_Request);
                responseDTO.setMessage("Invalid or expired token");
                responseDTO.setData(false);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseDTO);
            }
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("An error occurred: " + e.getMessage());
            responseDTO.setData(null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ResponseDTO> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO request) {
        ResponseDTO responseDTO = new ResponseDTO();
        try {
            boolean resetSuccessful = passwordResetService.resetPassword(request);

            if (resetSuccessful) {
                responseDTO.setCode(VarList.OK);
                responseDTO.setMessage("Password reset successful");
                responseDTO.setData(null);
                return ResponseEntity.ok(responseDTO);
            } else {
                responseDTO.setCode(VarList.Bad_Request);
                responseDTO.setMessage("Failed to reset password. Token may be invalid or expired.");
                responseDTO.setData(null);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseDTO);
            }
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("An error occurred: " + e.getMessage());
            responseDTO.setData(null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }
}