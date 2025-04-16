package lk.ijse.backendtyretrends.config;

import lk.ijse.backendtyretrends.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class ScheduledTasks {

    @Autowired
    private PasswordResetService passwordResetService;

    // Run every day at midnight to clean up expired tokens
    @Scheduled(cron = "0 0 0 * * ?")
    public void cleanupExpiredTokens() {
        passwordResetService.cleanupExpiredTokens();
    }
}