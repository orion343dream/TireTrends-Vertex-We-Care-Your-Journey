package lk.ijse.backendtyretrends.service.Impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import lk.ijse.backendtyretrends.entity.Review;
import lk.ijse.backendtyretrends.service.ProductService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lk.ijse.backendtyretrends.dto.ProductDTO;
import lk.ijse.backendtyretrends.entity.Brand;
import lk.ijse.backendtyretrends.entity.Category;
import lk.ijse.backendtyretrends.entity.Product;
import lk.ijse.backendtyretrends.repo.BrandRepository;
import lk.ijse.backendtyretrends.repo.CategoryRepository;
import lk.ijse.backendtyretrends.repo.ProductRepository;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public ProductDTO createProduct(ProductDTO productDTO) {
        // Find category and brand
        Category category = categoryRepository.findById(productDTO.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Brand brand = brandRepository.findById(productDTO.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));

        // Map DTO to entity
        Product product = modelMapper.map(productDTO, Product.class);
        product.setCategory(category);
        product.setBrand(brand);

        // Save product
        Product savedProduct = productRepository.save(product);

        // Map back to DTO
        ProductDTO savedProductDTO = modelMapper.map(savedProduct, ProductDTO.class);
        savedProductDTO.setCategoryName(category.getName());
        savedProductDTO.setBrandName(brand.getName());

        return savedProductDTO;
    }

    @Override
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        // Find existing product
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Find category and brand if changed
        Category category = existingProduct.getCategory();
        if (productDTO.getCategoryId() != null && !productDTO.getCategoryId().equals(existingProduct.getCategory().getId())) {
            category = categoryRepository.findById(productDTO.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        Brand brand = existingProduct.getBrand();
        if (productDTO.getBrandId() != null && !productDTO.getBrandId().equals(existingProduct.getBrand().getId())) {
            brand = brandRepository.findById(productDTO.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Brand not found"));
        }

        // Update fields
        if (productDTO.getName() != null) existingProduct.setName(productDTO.getName());
        if (productDTO.getDescription() != null) existingProduct.setDescription(productDTO.getDescription());
        if (productDTO.getSize() != null) existingProduct.setSize(productDTO.getSize());
        if (productDTO.getType() != null) existingProduct.setType(productDTO.getType());
        if (productDTO.getPrice() != null) existingProduct.setPrice(productDTO.getPrice());
        if (productDTO.getStock() != null) existingProduct.setStock(productDTO.getStock());
        if (productDTO.getImageUrl() != null) existingProduct.setImageUrl(productDTO.getImageUrl());
        if (productDTO.getActive() != null) existingProduct.setActive(productDTO.getActive());

        existingProduct.setCategory(category);
        existingProduct.setBrand(brand);

        // Save updated product
        Product updatedProduct = productRepository.save(existingProduct);

        // Map back to DTO
        ProductDTO updatedProductDTO = modelMapper.map(updatedProduct, ProductDTO.class);
        updatedProductDTO.setCategoryName(category.getName());
        updatedProductDTO.setBrandName(brand.getName());

        return updatedProductDTO;
    }

    @Override
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found");
        }
        productRepository.deleteById(id);
    }

    @Override
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ProductDTO productDTO = modelMapper.map(product, ProductDTO.class);
        productDTO.setCategoryName(product.getCategory().getName());
        productDTO.setBrandName(product.getBrand().getName());

        return productDTO;
    }

    @Override
    public Page<ProductDTO> getAllProducts(Pageable pageable) {
        Page<Product> products = productRepository.findByActive(true, pageable);

        return products.map(product -> {
            ProductDTO dto = modelMapper.map(product, ProductDTO.class);
            dto.setCategoryName(product.getCategory().getName());
            dto.setBrandName(product.getBrand().getName());
            return dto;
        });
    }

    @Override
    public Page<ProductDTO> searchProducts(Long categoryId, Long brandId, String type, String size,
                                           BigDecimal minPrice, BigDecimal maxPrice, String query, Pageable pageable) {

        Page<Product> products = productRepository.searchProducts(
                categoryId, brandId, type, size, minPrice, maxPrice, query, true, pageable);

        return products.map(product -> {
            ProductDTO dto = modelMapper.map(product, ProductDTO.class);
            dto.setCategoryName(product.getCategory().getName());
            dto.setBrandName(product.getBrand().getName());
            return dto;
        });
    }

    @Override
    public List<ProductDTO> getLowStockProducts(Integer threshold) {
        List<Product> products = productRepository.findLowStockProducts(true, threshold);

        return products.stream()
                .map(product -> {
                    ProductDTO dto = modelMapper.map(product, ProductDTO.class);
                    dto.setCategoryName(product.getCategory().getName());
                    dto.setBrandName(product.getBrand().getName());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public boolean updateStock(Long id, Integer quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setStock(quantity);
        productRepository.save(product);

        return true;
    }

    @Override
    public List<ProductDTO> getProductsByCategory(Long categoryId) {
        List<Product> products = productRepository.findByCategoryId(categoryId);

        return products.stream()
                .filter(Product::getActive)
                .map(product -> {
                    ProductDTO dto = modelMapper.map(product, ProductDTO.class);
                    dto.setCategoryName(product.getCategory().getName());
                    dto.setBrandName(product.getBrand().getName());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductDTO> getProductsByBrand(Long brandId) {
        List<Product> products = productRepository.findByBrandId(brandId);

        return products.stream()
                .filter(Product::getActive)
                .map(product -> {
                    ProductDTO dto = modelMapper.map(product, ProductDTO.class);
                    dto.setCategoryName(product.getCategory().getName());
                    dto.setBrandName(product.getBrand().getName());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Calculate and update the product rating based on approved reviews
     * @param product The product to update ratings for
     * @return The updated product
     */
    @Override
    public Product updateProductRating(Product product) {
        if (product.getReviews() == null || product.getReviews().isEmpty()) {
            product.setRating(0.0);
            product.setReviewCount(0);
            return productRepository.save(product);
        }

        double sum = 0.0;
        int approvedCount = 0;

        for (Review review : product.getReviews()) {
            if (review != null && review.getApproved() != null &&
                    review.getApproved() && review.getRating() != null) {
                sum += review.getRating();
                approvedCount++;
            }
        }

        if (approvedCount > 0) {
            product.setRating(sum / approvedCount);
            product.setReviewCount(approvedCount);
        } else {
            product.setRating(0.0);
            product.setReviewCount(0);
        }

        return productRepository.save(product);
    }

    // Call this method whenever a review is added, approved, or deleted
    @Override
    public void addReviewToProduct(Review review) {
        Product product = review.getProduct();
        product.addReview(review);
        updateProductRating(product);
    }

    @Override
    public void removeReviewFromProduct(Review review) {
        Product product = review.getProduct();
        product.removeReview(review);
        updateProductRating(product);
    }
}