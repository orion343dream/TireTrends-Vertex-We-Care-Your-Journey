package lk.ijse.backendtyretrends.repo;

import lk.ijse.backendtyretrends.entity.PasswordResetToken;
import lk.ijse.backendtyretrends.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    Optional<PasswordResetToken> findByToken(String token);
    
    Optional<PasswordResetToken> findByUser(User user);
    
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiryDate <= ?1 OR t.used = true")
    void deleteExpiredTokens(LocalDateTime now);
}