package lk.ijse.backendtyretrends.service.Impl;

import lk.ijse.backendtyretrends.dto.VehicleDTO;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.entity.Vehicle;
import lk.ijse.backendtyretrends.repo.UserRepository;
import lk.ijse.backendtyretrends.repo.VehicleRepository;
import lk.ijse.backendtyretrends.service.VehicleService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VehicleServiceImpl implements VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public VehicleDTO addVehicle(String userEmail, VehicleDTO vehicleDTO) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        // Check if this is the first vehicle for the user
        List<Vehicle> existingVehicles = vehicleRepository.findByUser(user);
        boolean isFirstVehicle = existingVehicles.isEmpty();

        // If setting as primary or it's the first vehicle, ensure no other vehicle is primary
        if (vehicleDTO.getIsPrimary() || isFirstVehicle) {
            clearPrimaryVehicles(user);
        }

        // If it's first vehicle and isPrimary is not explicitly set to false, make it primary
        if (isFirstVehicle && vehicleDTO.getIsPrimary() == null) {
            vehicleDTO.setIsPrimary(true);
        }

        // Map DTO to entity
        Vehicle vehicle = modelMapper.map(vehicleDTO, Vehicle.class);
        vehicle.setUser(user);

        // Save vehicle
        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        // Map back to DTO and return
        return modelMapper.map(savedVehicle, VehicleDTO.class);
    }

    @Override
    public VehicleDTO updateVehicle(Long id, VehicleDTO vehicleDTO) {
        Vehicle existingVehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Check if primary status is changing
        if (vehicleDTO.getIsPrimary() != null && vehicleDTO.getIsPrimary() 
                && (existingVehicle.getIsPrimary() == null || !existingVehicle.getIsPrimary())) {
            clearPrimaryVehicles(existingVehicle.getUser());
        }

        // Update fields
        if (vehicleDTO.getMake() != null) existingVehicle.setMake(vehicleDTO.getMake());
        if (vehicleDTO.getModel() != null) existingVehicle.setModel(vehicleDTO.getModel());
        if (vehicleDTO.getYear() != null) existingVehicle.setYear(vehicleDTO.getYear());
        if (vehicleDTO.getTrim() != null) existingVehicle.setTrim(vehicleDTO.getTrim());
        if (vehicleDTO.getTireSizesFront() != null) existingVehicle.setTireSizesFront(vehicleDTO.getTireSizesFront());
        if (vehicleDTO.getTireSizesRear() != null) existingVehicle.setTireSizesRear(vehicleDTO.getTireSizesRear());
        if (vehicleDTO.getLicensePlate() != null) existingVehicle.setLicensePlate(vehicleDTO.getLicensePlate());
        if (vehicleDTO.getVehicleType() != null) existingVehicle.setVehicleType(vehicleDTO.getVehicleType());
        if (vehicleDTO.getIsPrimary() != null) existingVehicle.setIsPrimary(vehicleDTO.getIsPrimary());

        // Save updated vehicle
        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);

        // Map to DTO and return
        return modelMapper.map(updatedVehicle, VehicleDTO.class);
    }

    @Override
    public VehicleDTO getVehicleById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        return modelMapper.map(vehicle, VehicleDTO.class);
    }

    @Override
    public List<VehicleDTO> getUserVehicles(String userEmail) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        List<Vehicle> vehicles = vehicleRepository.findByUserOrderByIsPrimaryDescCreatedAtDesc(user);
        return vehicles.stream()
                .map(vehicle -> modelMapper.map(vehicle, VehicleDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        
        // Check if this is the primary vehicle
        boolean wasPrimary = vehicle.getIsPrimary() != null && vehicle.getIsPrimary();
        
        // Delete the vehicle
        vehicleRepository.delete(vehicle);
        
        // If this was the primary vehicle, set another vehicle as primary
        if (wasPrimary) {
            List<Vehicle> remainingVehicles = vehicleRepository.findByUser(vehicle.getUser());
            if (!remainingVehicles.isEmpty()) {
                Vehicle newPrimary = remainingVehicles.get(0);
                newPrimary.setIsPrimary(true);
                vehicleRepository.save(newPrimary);
            }
        }
    }

    @Override
    public VehicleDTO setDefaultVehicle(String userEmail, Long vehicleId) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Vehicle vehicle = vehicleRepository.findByUserAndId(user, vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found or does not belong to user"));

        // Clear all existing primary vehicles
        clearPrimaryVehicles(user);

        // Set this vehicle as primary
        vehicle.setIsPrimary(true);
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);

        return modelMapper.map(updatedVehicle, VehicleDTO.class);
    }

    // Helper methods
    private void clearPrimaryVehicles(User user) {
        vehicleRepository.findByUserAndIsPrimaryTrue(user)
                .ifPresent(primaryVehicle -> {
                    primaryVehicle.setIsPrimary(false);
                    vehicleRepository.save(primaryVehicle);
                });
    }
}