// AddressController.java
package lk.ijse.backendtyretrends.controller;

import lk.ijse.backendtyretrends.dto.AddressDTO;
import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.service.AddressService;
import lk.ijse.backendtyretrends.util.JwtUtil;
import lk.ijse.backendtyretrends.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@CrossOrigin(origins = "*")
public class AddressController {

    @Autowired
    private AddressService addressService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<ResponseDTO> getUserAddresses(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            List<AddressDTO> addresses = addressService.getUserAddresses(userEmail);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Addresses retrieved successfully", addresses)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping("/default")
    public ResponseEntity<ResponseDTO> getDefaultAddress(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            AddressDTO address = addressService.getUserDefaultAddress(userEmail);

            if (address != null) {
                return ResponseEntity.ok(
                        new ResponseDTO(VarList.OK, "Default address retrieved successfully", address)
                );
            } else {
                return ResponseEntity.ok(
                        new ResponseDTO(VarList.Not_Found, "No default address found", null)
                );
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping("/{addressId}")
    public ResponseEntity<ResponseDTO> getAddressById(
            @RequestHeader("Authorization") String token,
            @PathVariable Long addressId) {
        try {
            AddressDTO address = addressService.getAddressById(addressId);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Address retrieved successfully", address)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping
    public ResponseEntity<ResponseDTO> createAddress(
            @RequestHeader("Authorization") String token,
            @RequestBody AddressDTO addressDTO) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            AddressDTO createdAddress = addressService.createAddress(userEmail, addressDTO);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Address created successfully", createdAddress));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<ResponseDTO> updateAddress(
            @RequestHeader("Authorization") String token,
            @PathVariable Long addressId,
            @RequestBody AddressDTO addressDTO) {
        try {
            AddressDTO updatedAddress = addressService.updateAddress(addressId, addressDTO);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Address updated successfully", updatedAddress)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<ResponseDTO> deleteAddress(
            @RequestHeader("Authorization") String token,
            @PathVariable Long addressId) {
        try {
            addressService.deleteAddress(addressId);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Address deleted successfully", null)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PutMapping("/{addressId}/default")
    public ResponseEntity<ResponseDTO> setDefaultAddress(
            @RequestHeader("Authorization") String token,
            @PathVariable Long addressId) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            AddressDTO defaultAddress = addressService.setDefaultAddress(userEmail, addressId);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Default address set successfully", defaultAddress)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}