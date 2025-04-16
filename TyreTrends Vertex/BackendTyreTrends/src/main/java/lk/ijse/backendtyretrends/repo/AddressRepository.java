// AddressRepository.java
package lk.ijse.backendtyretrends.repo;

import lk.ijse.backendtyretrends.entity.Address;
import lk.ijse.backendtyretrends.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser(User user);

    Address findByUserAndIsDefaultTrue(User user);
}