package lk.ijse.backendtyretrends.service.Impl;

import lk.ijse.backendtyretrends.dto.AdminDTO;
import lk.ijse.backendtyretrends.dto.UserDTO;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.enums.UserRole;
import lk.ijse.backendtyretrends.repo.UserRepository;
import lk.ijse.backendtyretrends.service.UserService;
import lk.ijse.backendtyretrends.util.VarList;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public int saveAdmin(AdminDTO adminDTO) {
        if (userRepository.existsByEmail(adminDTO.getEmail())) {
            return VarList.Not_Acceptable;
        } else {
            // Hash the password before saving
            adminDTO.setPassword(passwordEncoder.encode(adminDTO.getPassword()));
            User user = modelMapper.map(adminDTO, User.class);
            user.setRole(UserRole.ADMIN); // Set role to ADMIN
            userRepository.save(user);
            return VarList.Created;
        }
    }

    @Override
    public int saveUser(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            return VarList.Not_Acceptable;
        }

        User user = modelMapper.map(userDTO, User.class);
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        user.setRole(UserRole.CUSTOMER);

        userRepository.save(user);
        return VarList.Created;
    }

    @Override
    public AdminDTO searchAdmin(String email) {
        User user = userRepository.findByEmailAndRole(email, UserRole.ADMIN);
        return user != null ? modelMapper.map(user, AdminDTO.class) : null;
    }

    @Override
    public UserDTO searchUser(String email) {
        User user = userRepository.findByEmailAndRole(email, UserRole.CUSTOMER);
        return user != null ? modelMapper.map(user, UserDTO.class) : null;
    }

    @Override
    public int updateAdminProfile(AdminDTO adminDTO) {
        User existingUser = userRepository.findByEmailAndRole(adminDTO.getEmail(), UserRole.ADMIN);
        if (existingUser != null) {
            // Hash the new password if it's being updated
            if (adminDTO.getPassword() != null && !adminDTO.getPassword().isEmpty()) {
                adminDTO.setPassword(passwordEncoder.encode(adminDTO.getPassword()));
            }
            modelMapper.map(adminDTO, existingUser);
            userRepository.save(existingUser);
            return VarList.OK;
        }
        return VarList.Not_Found;
    }

    @Override
    public int updateUserProfile(UserDTO userDTO) {
        User existingUser = userRepository.findByEmailAndRole(userDTO.getEmail(), UserRole.CUSTOMER);
        if (existingUser != null) {
            // Hash the new password if it's being updated
            if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
                userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            }
            modelMapper.map(userDTO, existingUser);
            userRepository.save(existingUser);
            return VarList.OK;
        }
        return VarList.Not_Found;
    }

    @Override
    public int changePassword(String email, String oldPassword, String newPassword) {
        User user = userRepository.findByEmail(email);
        if (user != null && passwordEncoder.matches(oldPassword, user.getPassword())) {
            // Hash the new password before saving
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return VarList.OK;
        }
        return VarList.Unauthorized; // Invalid credentials
    }

    @Override
    public AdminDTO getAdminProfile(String email) {
        User user = userRepository.findByEmailAndRole(email, UserRole.ADMIN);
        return user != null ? modelMapper.map(user, AdminDTO.class) : null;
    }

    @Override
    public UserDTO getUserProfile(String email) {
        User user = userRepository.findByEmail(email);
        return user != null ? modelMapper.map(user, UserDTO.class) : null;
    }

    @Override
    public int deleteAdmin(String email) {
        if (userRepository.existsByEmailAndRole(email, UserRole.ADMIN)) {
            userRepository.deleteByEmail(email);
            return VarList.OK;
        }
        return VarList.Not_Found;
    }

    @Override
    public int deleteUser(String email) {
        if (userRepository.existsByEmailAndRole(email, UserRole.CUSTOMER)) {
            userRepository.deleteByEmail(email);
            return VarList.OK;
        }
        return VarList.Not_Found;
    }

    @Override
    public List<AdminDTO> getAllAdmins() {
        return userRepository.findByRole(UserRole.ADMIN).stream()
                .map(user -> modelMapper.map(user, AdminDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<UserDTO> getAllUsers() {
        return userRepository.findByRole(UserRole.CUSTOMER).stream()
                .map(user -> modelMapper.map(user, UserDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}