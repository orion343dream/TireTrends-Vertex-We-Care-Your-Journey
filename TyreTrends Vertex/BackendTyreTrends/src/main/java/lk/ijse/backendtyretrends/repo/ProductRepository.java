package lk.ijse.backendtyretrends.repo;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import lk.ijse.backendtyretrends.entity.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByActive(Boolean active, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = :active AND p.stock <= :threshold ORDER BY p.stock ASC")
    List<Product> findLowStockProducts(@Param("active") Boolean active, @Param("threshold") Integer threshold);

    @Query("SELECT p FROM Product p WHERE " +
            "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
            "(:brandId IS NULL OR p.brand.id = :brandId) AND " +
            "(:type IS NULL OR p.type = :type) AND " +
            "(:size IS NULL OR p.size = :size) AND " +
            "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
            "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
            "(:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "p.active = :active")
    Page<Product> searchProducts(
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("type") String type,
            @Param("size") String size,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("query") String query,
            @Param("active") Boolean active,
            Pageable pageable);

    List<Product> findByCategoryId(Long categoryId);

    List<Product> findByBrandId(Long brandId);
}