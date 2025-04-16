// AddressServiceImpl.java
package lk.ijse.backendtyretrends.service.Impl;

import lk.ijse.backendtyretrends.dto.AddressDTO;
import lk.ijse.backendtyretrends.entity.Address;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.repo.AddressRepository;
import lk.ijse.backendtyretrends.repo.UserRepository;
import lk.ijse.backendtyretrends.service.AddressService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AddressServiceImpl implements AddressService {

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public AddressDTO createAddress(String userEmail, AddressDTO addressDTO) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Address address = new Address();
        address.setUser(user);
        address.setFirstName(addressDTO.getFirstName());
        address.setLastName(addressDTO.getLastName());
        address.setAddress(addressDTO.getAddress());
        address.setAddress2(addressDTO.getAddress2());
        address.setCity(addressDTO.getCity());
        address.setState(addressDTO.getState());
        address.setZipCode(addressDTO.getZipCode());
        address.setCountry(addressDTO.getCountry());
        address.setPhone(addressDTO.getPhone());

        // If this is the user's first address, set it as default
        List<Address> userAddresses = addressRepository.findByUser(user);
        if (userAddresses.isEmpty() || addressDTO.getIsDefault()) {
            // Clear any existing default address
            for (Address existingAddress : userAddresses) {
                if (existingAddress.getIsDefault()) {
                    existingAddress.setIsDefault(false);
                    addressRepository.save(existingAddress);
                }
            }
            address.setIsDefault(true);
        }

        address = addressRepository.save(address);

        return modelMapper.map(address, AddressDTO.class);
    }

    @Override
    public AddressDTO updateAddress(Long addressId, AddressDTO addressDTO) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        address.setFirstName(addressDTO.getFirstName());
        address.setLastName(addressDTO.getLastName());
        address.setAddress(addressDTO.getAddress());
        address.setAddress2(addressDTO.getAddress2());
        address.setCity(addressDTO.getCity());
        address.setState(addressDTO.getState());
        address.setZipCode(addressDTO.getZipCode());
        address.setCountry(addressDTO.getCountry());
        address.setPhone(addressDTO.getPhone());

        // Handle default address changes
        if (addressDTO.getIsDefault() && !address.getIsDefault()) {
            // Clear any existing default address
            List<Address> userAddresses = addressRepository.findByUser(address.getUser());
            for (Address existingAddress : userAddresses) {
                if (existingAddress.getIsDefault()) {
                    existingAddress.setIsDefault(false);
                    addressRepository.save(existingAddress);
                }
            }
            address.setIsDefault(true);
        }

        address = addressRepository.save(address);

        return modelMapper.map(address, AddressDTO.class);
    }

    @Override
    public void deleteAddress(Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // If deleting the default address, set another address as default if available
        if (address.getIsDefault()) {
            List<Address> userAddresses = addressRepository.findByUser(address.getUser());
            if (userAddresses.size() > 1) {
                // Find a non-default address to set as new default
                Address newDefault = userAddresses.stream()
                        .filter(a -> !a.getId().equals(addressId))
                        .findFirst()
                        .orElse(null);

                if (newDefault != null) {
                    newDefault.setIsDefault(true);
                    addressRepository.save(newDefault);
                }
            }
        }

        addressRepository.deleteById(addressId);
    }

    @Override
    public AddressDTO getAddressById(Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        return modelMapper.map(address, AddressDTO.class);
    }

    @Override
    public List<AddressDTO> getUserAddresses(String userEmail) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        List<Address> addresses = addressRepository.findByUser(user);

        return addresses.stream()
                .map(address -> modelMapper.map(address, AddressDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public AddressDTO getUserDefaultAddress(String userEmail) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Address defaultAddress = addressRepository.findByUserAndIsDefaultTrue(user);
        if (defaultAddress == null) {
            return null;
        }

        return modelMapper.map(defaultAddress, AddressDTO.class);
    }

    @Override
    public AddressDTO setDefaultAddress(String userEmail, Long addressId) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Address newDefaultAddress = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // Change this line to use getUserId() instead of getId()
        if (!newDefaultAddress.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Address does not belong to user");
        }

        // Clear any existing default address
        List<Address> userAddresses = addressRepository.findByUser(user);
        for (Address address : userAddresses) {
            if (address.getIsDefault()) {
                address.setIsDefault(false);
                addressRepository.save(address);
            }
        }

        // Set new default address
        newDefaultAddress.setIsDefault(true);
        newDefaultAddress = addressRepository.save(newDefaultAddress);

        return modelMapper.map(newDefaultAddress, AddressDTO.class);
    }
}