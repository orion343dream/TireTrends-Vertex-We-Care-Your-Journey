package lk.ijse.backendtyretrends.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lk.ijse.backendtyretrends.dto.CategoryDTO;
import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.service.CategoryService;
import lk.ijse.backendtyretrends.util.VarList;

@RestController
@RequestMapping("/api/v1/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;
    @PreAuthorize("permitAll()")
    @GetMapping
    public ResponseEntity<ResponseDTO> getAllCategories() {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            List<CategoryDTO> categories = categoryService.getAllCategories();

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Categories retrieved successfully");
            responseDTO.setData(categories);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error retrieving categories: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/featured")
    public ResponseEntity<ResponseDTO> getFeaturedCategories() {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            List<CategoryDTO> categories = categoryService.getFeaturedCategories();

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Featured categories retrieved successfully");
            responseDTO.setData(categories);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error retrieving featured categories: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO> getCategoryById(@PathVariable Long id) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            CategoryDTO category = categoryService.getCategoryById(id);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Category retrieved successfully");
            responseDTO.setData(category);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Not_Found);
            responseDTO.setMessage("Category not found: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseDTO);
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> createCategory(@RequestBody CategoryDTO categoryDTO) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            CategoryDTO createdCategory = categoryService.createCategory(categoryDTO);

            responseDTO.setCode(VarList.Created);
            responseDTO.setMessage("Category created successfully");
            responseDTO.setData(createdCategory);

            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error creating category: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryDTO categoryDTO) {

        ResponseDTO responseDTO = new ResponseDTO();

        try {
            CategoryDTO updatedCategory = categoryService.updateCategory(id, categoryDTO);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Category updated successfully");
            responseDTO.setData(updatedCategory);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error updating category: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> deleteCategory(@PathVariable Long id) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            categoryService.deleteCategory(id);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Category deleted successfully");
            responseDTO.setData(null);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error deleting category: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }
}