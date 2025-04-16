package lk.ijse.backendtyretrends.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lk.ijse.backendtyretrends.dto.BrandDTO;
import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.service.BrandService;
import lk.ijse.backendtyretrends.util.VarList;

@RestController
@RequestMapping("/api/v1/brands")
//@CrossOrigin(origins = "*")
public class BrandController {

    @Autowired
    private BrandService brandService;
    @PreAuthorize("permitAll()")
    @GetMapping
    public ResponseEntity<ResponseDTO> getAllBrands() {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            List<BrandDTO> brands = brandService.getAllBrands();

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Brands retrieved successfully");
            responseDTO.setData(brands);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error retrieving brands: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/featured")
    public ResponseEntity<ResponseDTO> getFeaturedBrands() {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            List<BrandDTO> brands = brandService.getFeaturedBrands();

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Featured brands retrieved successfully");
            responseDTO.setData(brands);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error retrieving featured brands: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO> getBrandById(@PathVariable Long id) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            BrandDTO brand = brandService.getBrandById(id);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Brand retrieved successfully");
            responseDTO.setData(brand);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Not_Found);
            responseDTO.setMessage("Brand not found: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseDTO);
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> createBrand(@RequestBody BrandDTO brandDTO) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            BrandDTO createdBrand = brandService.createBrand(brandDTO);

            responseDTO.setCode(VarList.Created);
            responseDTO.setMessage("Brand created successfully");
            responseDTO.setData(createdBrand);

            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error creating brand: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> updateBrand(
            @PathVariable Long id,
            @RequestBody BrandDTO brandDTO) {

        ResponseDTO responseDTO = new ResponseDTO();

        try {
            BrandDTO updatedBrand = brandService.updateBrand(id, brandDTO);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Brand updated successfully");
            responseDTO.setData(updatedBrand);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error updating brand: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> deleteBrand(@PathVariable Long id) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            brandService.deleteBrand(id);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Brand deleted successfully");
            responseDTO.setData(null);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error deleting brand: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }
}