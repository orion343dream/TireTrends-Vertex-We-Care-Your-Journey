package lk.ijse.backendtyretrends.repo;

import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface UserRepository extends JpaRepository<User, String> {
    User findByEmail(String email);
    User findByEmailAndRole(String email, UserRole role); // Find by email and role
    boolean existsByEmail(String email);
    boolean existsByEmailAndRole(String email, UserRole role); // Check if a user exists by email and role
    void deleteByEmail(String email);
    List<User> findByRole(UserRole role); // Find users by role
}