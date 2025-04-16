package lk.ijse.backendtyretrends.repo;

import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByUser(User user);
    
    Optional<Vehicle> findByUserAndIsPrimaryTrue(User user);
    
    List<Vehicle> findByUserOrderByIsPrimaryDescCreatedAtDesc(User user);
    
    Optional<Vehicle> findByUserAndId(User user, Long id);
    
    boolean existsByUserAndMakeAndModelAndYear(User user, String make, String model, String year);
}
