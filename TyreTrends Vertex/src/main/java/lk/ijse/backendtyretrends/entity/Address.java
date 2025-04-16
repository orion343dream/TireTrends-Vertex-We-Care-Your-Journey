// Address.java
package lk.ijse.backendtyretrends.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "addresses")
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String firstName;

    private String lastName;

    private String address;

    private String address2;

    private String city;

    private String state;

    private String zipCode;

    private String country;

    private String phone;

    private Boolean isDefault = false;
}