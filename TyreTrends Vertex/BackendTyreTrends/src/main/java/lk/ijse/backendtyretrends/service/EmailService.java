package lk.ijse.backendtyretrends.service;

public interface EmailService {
    
    /**
     * Send a simple text email
     * 
     * @param to Recipient email address
     * @param subject Email subject
     * @param body Email content
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendSimpleMessage(String to, String subject, String body);
    
    /**
     * Send a password reset email
     * 
     * @param to Recipient email address
     * @param token Password reset token
     * @param resetUrl Base URL for password reset
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendPasswordResetEmail(String to, String token, String resetUrl);
}