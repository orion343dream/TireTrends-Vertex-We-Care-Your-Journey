package lk.ijse.backendtyretrends.service;

import lk.ijse.backendtyretrends.dto.ForgotPasswordRequestDTO;
import lk.ijse.backendtyretrends.dto.ResetPasswordRequestDTO;

public interface PasswordResetService {
    
    /**
     * Process a forgot password request and send a reset email
     * 
     * @param request The forgot password request containing the user's email
     * @return true if the request was processed successfully, false otherwise
     */
    boolean processForgotPasswordRequest(ForgotPasswordRequestDTO request);
    
    /**
     * Validate a password reset token
     * 
     * @param token The token to validate
     * @return true if the token is valid, false otherwise
     */
    boolean validatePasswordResetToken(String token);
    
    /**
     * Reset a user's password using a valid token
     * 
     * @param request The reset password request containing the token and new password
     * @return true if the password was reset successfully, false otherwise
     */
    boolean resetPassword(ResetPasswordRequestDTO request);
    
    /**
     * Clean up expired tokens from the database
     */
    void cleanupExpiredTokens();
}