package lk.ijse.backendtyretrends.service.Impl;

import lk.ijse.backendtyretrends.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired
    private JavaMailSender emailSender;

    @Override
    public boolean sendSimpleMessage(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            emailSender.send(message);
            logger.info("Email sent successfully to: {}", to);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send email to: {}", to, e);
            return false;
        }
    }

    @Override
    public boolean sendPasswordResetEmail(String to, String token, String resetUrl) {
        String subject = "Password Reset Request";
        String resetLink = resetUrl + "?token=" + token;

        String body = "Dear User,\n\n"
                + "You have requested to reset your password. Click the link below to reset your password:\n\n"
                + resetLink + "\n\n"
                + "This link will expire in 30 minutes.\n\n"
                + "If you did not request a password reset, please ignore this email.\n\n"
                + "Best regards,\nThe ToolNest Team";

        return sendSimpleMessage(to, subject, body);
    }
}