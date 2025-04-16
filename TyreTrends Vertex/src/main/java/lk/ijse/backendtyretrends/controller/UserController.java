package lk.ijse.backendtyretrends.controller;

import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.dto.UserDTO;
import lk.ijse.backendtyretrends.service.UserService;
import lk.ijse.backendtyretrends.util.JwtUtil;
import lk.ijse.backendtyretrends.util.VarList;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ModelMapper modelMapper;

    private static final String UPLOAD_DIR = "uploads/profile-pictures/";

    @PostMapping("/register")
    public ResponseEntity<ResponseDTO> registerUser(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam("phoneNumber") String phoneNumber,
            @RequestParam("address") String address,
            @RequestParam("password") String password,
            @RequestParam(value = "profilePicture", required = false) MultipartFile profilePicture) {

        try {
            UserDTO userDTO = UserDTO.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(email)
                    .phoneNumber(phoneNumber)
                    .address(address)
                    .password(password)
                    .build();

            if (profilePicture != null && !profilePicture.isEmpty()) {
                String fileName = saveProfilePicture(profilePicture);
                userDTO.setProfilePicture(fileName);
            }

            int result = userService.saveUser(userDTO);
            if (result == VarList.Created) {
                return ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ResponseDTO(VarList.Created, "User registered successfully", null));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Not_Acceptable, "User already exists", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error registering user: " + e.getMessage(), null));
        }
    }

    private String saveProfilePicture(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String fileName = UUID.randomUUID().toString() + fileExtension;

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        return fileName;
    }

    @GetMapping("/profile")
    public ResponseEntity<ResponseDTO> getProfile(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String email = jwtUtil.getUsernameFromToken(jwt);

            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ResponseDTO(VarList.Unauthorized, "Invalid token", null));
            }

            UserDTO userDTO = userService.getUserProfile(email);
            if (userDTO != null) {
                return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Profile retrieved successfully", userDTO));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseDTO(VarList.Not_Found, "User not found", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving profile", null));
        }
    }
}