package lk.ijse.backendtyretrends.service;

import java.util.List;

import lk.ijse.backendtyretrends.dto.BrandDTO;

public interface BrandService {
    BrandDTO createBrand(BrandDTO brandDTO);
    BrandDTO updateBrand(Long id, BrandDTO brandDTO);
    void deleteBrand(Long id);
    BrandDTO getBrandById(Long id);
    List<BrandDTO> getAllBrands();
    List<BrandDTO> getFeaturedBrands();
    BrandDTO getBrandByName(String name);
}