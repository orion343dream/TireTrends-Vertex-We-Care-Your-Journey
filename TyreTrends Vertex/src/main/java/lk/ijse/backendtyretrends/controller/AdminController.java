package lk.ijse.backendtyretrends.controller;

import lk.ijse.backendtyretrends.dto.AdminDTO;
import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.service.UserService;
import lk.ijse.backendtyretrends.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserService userService;

    @GetMapping("/getAll")
    public ResponseEntity<ResponseDTO> getAllAdmins() {
        List<AdminDTO> adminList = userService.getAllAdmins();
        return !adminList.isEmpty()
                ? ResponseEntity.ok(new ResponseDTO(VarList.OK, "Admins retrieved successfully", adminList))
                : ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ResponseDTO(VarList.Not_Found, "No admins found", null));
    }
}