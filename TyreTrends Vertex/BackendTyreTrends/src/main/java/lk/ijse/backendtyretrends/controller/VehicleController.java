package lk.ijse.backendtyretrends.controller;

import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.dto.VehicleDTO;
import lk.ijse.backendtyretrends.service.VehicleService;
import lk.ijse.backendtyretrends.util.JwtUtil;
import lk.ijse.backendtyretrends.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<ResponseDTO> getUserVehicles(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            List<VehicleDTO> vehicles = vehicleService.getUserVehicles(userEmail);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Vehicles retrieved successfully", vehicles)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO> getVehicleById(@PathVariable Long id) {
        try {
            VehicleDTO vehicle = vehicleService.getVehicleById(id);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Vehicle retrieved successfully", vehicle)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping
    public ResponseEntity<ResponseDTO> addVehicle(
            @RequestHeader("Authorization") String token,
            @RequestBody VehicleDTO vehicleDTO) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            VehicleDTO addedVehicle = vehicleService.addVehicle(userEmail, vehicleDTO);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Vehicle added successfully", addedVehicle));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseDTO> updateVehicle(
            @PathVariable Long id,
            @RequestBody VehicleDTO vehicleDTO) {
        try {
            VehicleDTO updatedVehicle = vehicleService.updateVehicle(id, vehicleDTO);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Vehicle updated successfully", updatedVehicle)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseDTO> deleteVehicle(@PathVariable Long id) {
        try {
            vehicleService.deleteVehicle(id);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Vehicle deleted successfully", null)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<ResponseDTO> setDefaultVehicle(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            VehicleDTO defaultVehicle = vehicleService.setDefaultVehicle(userEmail, id);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Default vehicle set successfully", defaultVehicle)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}
