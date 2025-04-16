package lk.ijse.backendtyretrends.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandDTO {
    private Long id;
    private String name;
    private String description;
    private String logoUrl;
    private String website;
    private Integer yearEstablished;
    private String countryOfOrigin;
    private Boolean featured;
    private Integer productCount;
}