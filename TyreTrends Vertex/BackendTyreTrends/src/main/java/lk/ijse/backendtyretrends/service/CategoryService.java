package lk.ijse.backendtyretrends.service;

import java.util.List;

import lk.ijse.backendtyretrends.dto.CategoryDTO;

public interface CategoryService {
    CategoryDTO createCategory(CategoryDTO categoryDTO);
    CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO);
    void deleteCategory(Long id);
    CategoryDTO getCategoryById(Long id);
    List<CategoryDTO> getAllCategories();
    List<CategoryDTO> getFeaturedCategories();
    CategoryDTO getCategoryByName(String name);
}