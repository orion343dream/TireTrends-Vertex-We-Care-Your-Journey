package lk.ijse.backendtyretrends.service.Impl;

import java.util.List;
import java.util.stream.Collectors;

import lk.ijse.backendtyretrends.service.CategoryService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lk.ijse.backendtyretrends.dto.CategoryDTO;
import lk.ijse.backendtyretrends.entity.Category;
import lk.ijse.backendtyretrends.repo.CategoryRepository;

@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        Category category = modelMapper.map(categoryDTO, Category.class);
        Category savedCategory = categoryRepository.save(category);

        CategoryDTO savedDTO = modelMapper.map(savedCategory, CategoryDTO.class);
        savedDTO.setProductCount(savedCategory.getProducts().size());

        return savedDTO;
    }

    @Override
    public CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO) {
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (categoryDTO.getName() != null) existingCategory.setName(categoryDTO.getName());
        if (categoryDTO.getDescription() != null) existingCategory.setDescription(categoryDTO.getDescription());

        Category updatedCategory = categoryRepository.save(existingCategory);

        CategoryDTO updatedDTO = modelMapper.map(updatedCategory, CategoryDTO.class);
        updatedDTO.setProductCount(updatedCategory.getProducts().size());

        return updatedDTO;
    }

    @Override
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found");
        }
        categoryRepository.deleteById(id);
    }

    @Override
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        CategoryDTO categoryDTO = modelMapper.map(category, CategoryDTO.class);
        categoryDTO.setProductCount(category.getProducts().size());

        return categoryDTO;
    }

    @Override
    public List<CategoryDTO> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();

        return categories.stream()
                .map(category -> {
                    CategoryDTO dto = modelMapper.map(category, CategoryDTO.class);
                    dto.setProductCount(category.getProducts().size());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryDTO> getFeaturedCategories() {
        List<Category> categories = categoryRepository.findAll();

        return categories.stream()
                .filter(category -> {
                    // Add logic to determine featured categories
                    // For now, let's consider categories with most products as featured
                    return category.getProducts().size() > 0;
                })
                .limit(5) // Limit to top 5
                .map(category -> {
                    CategoryDTO dto = modelMapper.map(category, CategoryDTO.class);
                    dto.setProductCount(category.getProducts().size());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public CategoryDTO getCategoryByName(String name) {
        Category category = categoryRepository.findByName(name);

        if (category == null) {
            return null;
        }

        CategoryDTO categoryDTO = modelMapper.map(category, CategoryDTO.class);
        categoryDTO.setProductCount(category.getProducts().size());

        return categoryDTO;
    }
}