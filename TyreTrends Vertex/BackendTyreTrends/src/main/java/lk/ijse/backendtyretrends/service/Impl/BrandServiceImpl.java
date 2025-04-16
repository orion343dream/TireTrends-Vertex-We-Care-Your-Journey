package lk.ijse.backendtyretrends.service.Impl;

import java.util.List;
import java.util.stream.Collectors;

import lk.ijse.backendtyretrends.service.BrandService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lk.ijse.backendtyretrends.dto.BrandDTO;
import lk.ijse.backendtyretrends.entity.Brand;
import lk.ijse.backendtyretrends.repo.BrandRepository;

@Service
@Transactional
public class BrandServiceImpl implements BrandService {

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public BrandDTO createBrand(BrandDTO brandDTO) {
        Brand brand = modelMapper.map(brandDTO, Brand.class);
        Brand savedBrand = brandRepository.save(brand);

        BrandDTO savedDTO = modelMapper.map(savedBrand, BrandDTO.class);
        savedDTO.setProductCount(savedBrand.getProducts().size());

        return savedDTO;
    }

    @Override
    public BrandDTO updateBrand(Long id, BrandDTO brandDTO) {
        Brand existingBrand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found"));

        if (brandDTO.getName() != null) existingBrand.setName(brandDTO.getName());
        if (brandDTO.getDescription() != null) existingBrand.setDescription(brandDTO.getDescription());
        if (brandDTO.getLogoUrl() != null) existingBrand.setLogoUrl(brandDTO.getLogoUrl());
        if (brandDTO.getWebsite() != null) existingBrand.setWebsite(brandDTO.getWebsite());
        if (brandDTO.getYearEstablished() != null) existingBrand.setYearEstablished(brandDTO.getYearEstablished());
        if (brandDTO.getCountryOfOrigin() != null) existingBrand.setCountryOfOrigin(brandDTO.getCountryOfOrigin());
        if (brandDTO.getFeatured() != null) existingBrand.setFeatured(brandDTO.getFeatured());

        Brand updatedBrand = brandRepository.save(existingBrand);

        BrandDTO updatedDTO = modelMapper.map(updatedBrand, BrandDTO.class);
        updatedDTO.setProductCount(updatedBrand.getProducts().size());

        return updatedDTO;
    }

    @Override
    public void deleteBrand(Long id) {
        if (!brandRepository.existsById(id)) {
            throw new RuntimeException("Brand not found");
        }
        brandRepository.deleteById(id);
    }

    @Override
    public BrandDTO getBrandById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found"));

        BrandDTO brandDTO = modelMapper.map(brand, BrandDTO.class);
        brandDTO.setProductCount(brand.getProducts().size());

        return brandDTO;
    }

    @Override
    public List<BrandDTO> getAllBrands() {
        List<Brand> brands = brandRepository.findAll();

        return brands.stream()
                .map(brand -> {
                    BrandDTO dto = modelMapper.map(brand, BrandDTO.class);
                    dto.setProductCount(brand.getProducts().size());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<BrandDTO> getFeaturedBrands() {
        List<Brand> brands = brandRepository.findByFeatured(true);

        return brands.stream()
                .map(brand -> {
                    BrandDTO dto = modelMapper.map(brand, BrandDTO.class);
                    dto.setProductCount(brand.getProducts().size());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public BrandDTO getBrandByName(String name) {
        Brand brand = brandRepository.findByName(name);

        if (brand == null) {
            return null;
        }

        BrandDTO brandDTO = modelMapper.map(brand, BrandDTO.class);
        brandDTO.setProductCount(brand.getProducts().size());

        return brandDTO;
    }
}