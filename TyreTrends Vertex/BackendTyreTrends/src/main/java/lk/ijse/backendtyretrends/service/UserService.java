package lk.ijse.backendtyretrends.service;

import lk.ijse.backendtyretrends.dto.AdminDTO;
import lk.ijse.backendtyretrends.dto.UserDTO;

import java.util.List;

public interface UserService {
    int saveAdmin(AdminDTO adminDTO); // Save an admin
    int saveUser(UserDTO userDTO); // Save a customer

    AdminDTO searchAdmin(String email); // Search for an admin
    UserDTO searchUser(String email); // Search for a customer

    int updateAdminProfile(AdminDTO adminDTO); // Update an admin's profile
    int updateUserProfile(UserDTO userDTO); // Update a customer's profile

    int changePassword(String email, String oldPassword, String newPassword); // Change password

    AdminDTO getAdminProfile(String email); // Get admin profile
    UserDTO getUserProfile(String email); // Get customer profile

    int deleteAdmin(String email); // Delete an admin
    int deleteUser(String email); // Delete a customer

    List<AdminDTO> getAllAdmins(); // Get all admins
    List<UserDTO> getAllUsers(); // Get all customers

    boolean existsByEmail(String email); // Check if a user exists by email
}