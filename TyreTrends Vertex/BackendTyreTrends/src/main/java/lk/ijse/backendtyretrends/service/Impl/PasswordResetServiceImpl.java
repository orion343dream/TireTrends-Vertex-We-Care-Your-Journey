package lk.ijse.backendtyretrends.service.Impl;

import lk.ijse.backendtyretrends.dto.ForgotPasswordRequestDTO;
import lk.ijse.backendtyretrends.dto.ResetPasswordRequestDTO;
import lk.ijse.backendtyretrends.entity.PasswordResetToken;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.repo.PasswordResetTokenRepository;
import lk.ijse.backendtyretrends.repo.UserRepository;
import lk.ijse.backendtyretrends.service.EmailService;
import lk.ijse.backendtyretrends.service.PasswordResetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class PasswordResetServiceImpl implements PasswordResetService {
    
    private static final Logger logger = LoggerFactory.getLogger(PasswordResetServiceImpl.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordResetTokenRepository tokenRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Value("${app.password-reset.token-expiration-minutes:30}")
    private int tokenExpirationMinutes;
    
    @Value("${app.password-reset.reset-url:http://localhost:8080/reset-password.html}")
    private String resetUrl;
    
    @Override
    @Transactional
    public boolean processForgotPasswordRequest(ForgotPasswordRequestDTO request) {
        String email = request.getEmail();
        User user = userRepository.findByEmail(email);
        
        if (user == null) {
            // We don't want to reveal that the email doesn't exist for security reasons
            logger.info("Password reset requested for non-existent email: {}", email);
            return true;
        }
        
        // Check if there's an existing token for this user
        Optional<PasswordResetToken> existingToken = tokenRepository.findByUser(user);
        if (existingToken.isPresent()) {
            // Remove existing token
            tokenRepository.delete(existingToken.get());
        }
        
        // Create a new token
        PasswordResetToken token = PasswordResetToken.createTokenForUser(user, tokenExpirationMinutes);
        tokenRepository.save(token);
        
        // Send email with reset link
        boolean emailSent = emailService.sendPasswordResetEmail(email, token.getToken(), resetUrl);
        
        if (!emailSent) {
            logger.error("Failed to send password reset email to: {}", email);
            return false;
        }
        
        logger.info("Password reset token created and email sent for user: {}", email);
        return true;
    }
    
    @Override
    public boolean validatePasswordResetToken(String token) {
        Optional<PasswordResetToken> passwordResetToken = tokenRepository.findByToken(token);
        
        if (passwordResetToken.isEmpty()) {
            logger.info("Token not found: {}", token);
            return false;
        }
        
        PasswordResetToken resetToken = passwordResetToken.get();
        
        if (resetToken.isExpired()) {
            logger.info("Token expired: {}", token);
            return false;
        }
        
        if (resetToken.isUsed()) {
            logger.info("Token already used: {}", token);
            return false;
        }
        
        return true;
    }
    
    @Override
    @Transactional
    public boolean resetPassword(ResetPasswordRequestDTO request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            logger.info("Password mismatch during reset");
            return false;
        }
        
        Optional<PasswordResetToken> passwordResetToken = tokenRepository.findByToken(request.getToken());
        
        if (passwordResetToken.isEmpty()) {
            logger.info("Token not found: {}", request.getToken());
            return false;
        }
        
        PasswordResetToken resetToken = passwordResetToken.get();
        
        if (resetToken.isExpired()) {
            logger.info("Token expired: {}", request.getToken());
            return false;
        }
        
        if (resetToken.isUsed()) {
            logger.info("Token already used: {}", request.getToken());
            return false;
        }
        
        // Update password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
        
        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        
        logger.info("Password reset successful for user: {}", user.getEmail());
        return true;
    }
    
    @Override
    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
        logger.info("Expired password reset tokens cleaned up");
    }
}