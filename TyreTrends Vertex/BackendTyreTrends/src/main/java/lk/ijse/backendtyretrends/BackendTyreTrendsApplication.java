package lk.ijse.backendtyretrends;

import lk.ijse.backendtyretrends.dto.AdminDTO;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.enums.UserRole;
import lk.ijse.backendtyretrends.repo.UserRepository;

import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class BackendTyreTrendsApplication {

    private static final Logger log = LoggerFactory.getLogger(BackendTyreTrendsApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(BackendTyreTrendsApplication.class, args);
    }

    @Bean
    CommandLineRunner initAdmin(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                ModelMapper modelMapper) {
        return args -> {
            String adminEmail = "admin@tyretrendsvertex.com";

            try {
                if (userRepository.findByEmailAndRole(adminEmail, UserRole.ADMIN) == null) {
                    AdminDTO adminDTO = new AdminDTO();
                    adminDTO.setFirstName("Admin");
                    adminDTO.setLastName("Administrator");
                    adminDTO.setEmail(adminEmail);
                    adminDTO.setPassword(passwordEncoder.encode("admin123"));
                    adminDTO.setPhoneNumber("1234567890");
                    adminDTO.setAddress("Admin Address");
                    adminDTO.setRole(UserRole.ADMIN);

                    User admin = modelMapper.map(adminDTO, User.class);
                    userRepository.save(admin);

                    log.info("Default admin created successfully with email: {}", adminEmail);
                } else {
                    log.info("Admin user already exists with email: {}", adminEmail);
                }
            } catch (Exception e) {
                log.error("Failed to initialize admin user", e);
            }
        };
    }
}


