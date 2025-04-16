package lk.ijse.backendtyretrends.entity;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "brands")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Brand implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(unique = true)
    private String name;

    @Size(max = 10000)
    private String description;

    @Size(max = 255)
    private String logoUrl;

    @Size(max = 255)
    private String website;

    private Integer yearEstablished;

    @Size(max = 100)
    private String countryOfOrigin;

    private Boolean featured = false;

    @OneToMany(mappedBy = "brand", cascade = CascadeType.ALL)
    private Set<Product> products = new HashSet<>();

    // Constructor with essential fields
    public Brand(String name, String description, String logoUrl) {
        this.name = name;
        this.description = description;
        this.logoUrl = logoUrl;
    }

    // Helper methods
    public void addProduct(Product product) {
        products.add(product);
        product.setBrand(this);
    }

    public void removeProduct(Product product) {
        products.remove(product);
        product.setBrand(null);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Brand brand = (Brand) o;
        return id != null && id.equals(brand.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
}