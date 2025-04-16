package lk.ijse.backendtyretrends.service;

import lk.ijse.backendtyretrends.dto.VehicleDTO;

import java.util.List;

public interface VehicleService {
    VehicleDTO addVehicle(String userEmail, VehicleDTO vehicleDTO);
    
    VehicleDTO updateVehicle(Long id, VehicleDTO vehicleDTO);
    
    VehicleDTO getVehicleById(Long id);
    
    List<VehicleDTO> getUserVehicles(String userEmail);
    
    void deleteVehicle(Long id);
    
    VehicleDTO setDefaultVehicle(String userEmail, Long vehicleId);
}
