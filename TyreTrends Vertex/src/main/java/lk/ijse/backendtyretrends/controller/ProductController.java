package lk.ijse.backendtyretrends.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lk.ijse.backendtyretrends.dto.ProductDTO;
import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.service.ProductService;
import lk.ijse.backendtyretrends.util.VarList;

@RestController
@RequestMapping("/api/v1/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductService productService;
//    @PreAuthorize("permitAll()")
    @GetMapping
    public ResponseEntity<ResponseDTO> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String direction) {

        ResponseDTO responseDTO = new ResponseDTO();

        try {
            // Build pageable
            Pageable pageable = buildPageable(page, size, sort, direction);

            // Get products
            Page<ProductDTO> productsPage = productService.getAllProducts(pageable);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Products retrieved successfully");
            responseDTO.setData(productsPage);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error retrieving products: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO> getProductById(@PathVariable Long id) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            ProductDTO productDTO = productService.getProductById(id);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Product retrieved successfully");
            responseDTO.setData(productDTO);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Not_Found);
            responseDTO.setMessage("Product not found: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseDTO);
        }
    }
//    @PreAuthorize("permitAll()")
    @GetMapping("/search")
    public ResponseEntity<ResponseDTO> searchProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize, // Renamed to pageSize
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String direction) {

        ResponseDTO responseDTO = new ResponseDTO();

        try {
            // Build pageable
            Pageable pageable = buildPageable(page, pageSize, sort, direction); // Updated parameter
            // Search products
            Page<ProductDTO> productsPage = productService.searchProducts(
                    categoryId, brandId, type, size, minPrice, maxPrice, query, pageable);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Products retrieved successfully");
            responseDTO.setData(productsPage);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error searching products: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> getLowStockProducts(
            @RequestParam(defaultValue = "10") Integer threshold) {

        ResponseDTO responseDTO = new ResponseDTO();

        try {
            List<ProductDTO> products = productService.getLowStockProducts(threshold);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Low stock products retrieved successfully");
            responseDTO.setData(products);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error retrieving low stock products: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ResponseDTO> getProductsByCategory(@PathVariable Long categoryId) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            List<ProductDTO> products = productService.getProductsByCategory(categoryId);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Products retrieved successfully");
            responseDTO.setData(products);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error retrieving products: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @GetMapping("/brand/{brandId}")
    public ResponseEntity<ResponseDTO> getProductsByBrand(@PathVariable Long brandId) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            List<ProductDTO> products = productService.getProductsByBrand(brandId);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Products retrieved successfully");
            responseDTO.setData(products);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error retrieving products: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> createProduct(@RequestBody ProductDTO productDTO) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            ProductDTO createdProduct = productService.createProduct(productDTO);

            responseDTO.setCode(VarList.Created);
            responseDTO.setMessage("Product created successfully");
            responseDTO.setData(createdProduct);

            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error creating product: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductDTO productDTO) {

        ResponseDTO responseDTO = new ResponseDTO();

        try {
            ProductDTO updatedProduct = productService.updateProduct(id, productDTO);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Product updated successfully");
            responseDTO.setData(updatedProduct);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error updating product: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @PutMapping("/{id}/stock")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> updateStock(
            @PathVariable Long id,
            @RequestParam Integer quantity) {

        ResponseDTO responseDTO = new ResponseDTO();

        try {
            boolean updated = productService.updateStock(id, quantity);

            if (updated) {
                responseDTO.setCode(VarList.OK);
                responseDTO.setMessage("Product stock updated successfully");
                responseDTO.setData(null);

                return ResponseEntity.ok(responseDTO);
            } else {
                responseDTO.setCode(VarList.Not_Found);
                responseDTO.setMessage("Product not found");
                responseDTO.setData(null);

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseDTO);
            }
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error updating product stock: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> deleteProduct(@PathVariable Long id) {
        ResponseDTO responseDTO = new ResponseDTO();

        try {
            productService.deleteProduct(id);

            responseDTO.setCode(VarList.OK);
            responseDTO.setMessage("Product deleted successfully");
            responseDTO.setData(null);

            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            responseDTO.setCode(VarList.Internal_Server_Error);
            responseDTO.setMessage("Error deleting product: " + e.getMessage());
            responseDTO.setData(null);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseDTO);
        }
    }

    // Helper method to build pageable for sorting and pagination
    private Pageable buildPageable(int page, int size, String sort, String direction) {
        // Default sort by ID if not specified
        if (sort == null || sort.isEmpty()) {
            return PageRequest.of(page, size);
        }

        // Apply sorting
        Sort.Direction sortDirection = Sort.Direction.ASC;
        if (direction != null && direction.equalsIgnoreCase("desc")) {
            sortDirection = Sort.Direction.DESC;
        }

        return PageRequest.of(page, size, Sort.by(sortDirection, sort));
    }


}