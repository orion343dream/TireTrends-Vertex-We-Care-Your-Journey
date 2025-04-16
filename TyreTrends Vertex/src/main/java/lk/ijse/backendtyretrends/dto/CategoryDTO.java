package lk.ijse.backendtyretrends.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    private Long id;
    private String name;
    private String description;
    private Integer productCount;
    private Boolean featured;
    private Boolean active;
    private String imageUrl;
}