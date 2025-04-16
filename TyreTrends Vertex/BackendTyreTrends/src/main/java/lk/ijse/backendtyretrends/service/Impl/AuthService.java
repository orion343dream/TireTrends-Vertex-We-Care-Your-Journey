package lk.ijse.backendtyretrends.service.Impl;

import lk.ijse.backendtyretrends.dto.AuthDTO;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.enums.UserRole;
import lk.ijse.backendtyretrends.repo.UserRepository;
import lk.ijse.backendtyretrends.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenBlacklistService tokenBlacklistService; // Add this dependency

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }

    public AuthDTO login(String email, String password) {
        try {
            // Load user details
            UserDetails userDetails = loadUserByUsername(email);

            // Validate the password
            if (!passwordEncoder.matches(password, userDetails.getPassword())) {
                throw new RuntimeException("Invalid password");
            }

            // Generate a JWT token
            String token = jwtUtil.generateToken(userDetails);

            // Get the user role
            User user = userRepository.findByEmail(email);
            UserRole role = user.getRole();

            // Return the AuthDTO with the token and role
            return new AuthDTO(email, token, role);
        } catch (UsernameNotFoundException e) {
            throw new RuntimeException("User not found with email: " + email);
        }
    }

    public boolean isTokenValid(String token) {
        // Check if the token is blacklisted
        if (tokenBlacklistService.isTokenBlacklisted(token)) {
            return false;
        }

        // Validate the token using JwtUtil
        String username = jwtUtil.getUsernameFromToken(token);
        if (username == null) {
            return false;
        }

        // Load user details and validate the token
        UserDetails userDetails = this.loadUserByUsername(username);
        return jwtUtil.validateToken(token, userDetails);
    }

    // Add this method to handle logout
    public void logout(String token) {
        // Extract the token from the "Bearer " prefix if present
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        // Add the token to the blacklist
        tokenBlacklistService.blacklistToken(token);
    }
}