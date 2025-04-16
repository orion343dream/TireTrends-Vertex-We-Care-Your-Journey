package lk.ijse.backendtyretrends.service.Impl;

import lk.ijse.backendtyretrends.dto.ServiceBookingDTO;
import lk.ijse.backendtyretrends.dto.ServiceBookingRequestDTO;
import lk.ijse.backendtyretrends.dto.ServiceTimeSlotDTO;
import lk.ijse.backendtyretrends.entity.ServiceBooking;
import lk.ijse.backendtyretrends.entity.User;
import lk.ijse.backendtyretrends.entity.Vehicle;
import lk.ijse.backendtyretrends.enums.ServiceStatus;
import lk.ijse.backendtyretrends.enums.ServiceType;
import lk.ijse.backendtyretrends.repo.ServiceBookingRepository;
import lk.ijse.backendtyretrends.repo.UserRepository;
import lk.ijse.backendtyretrends.repo.VehicleRepository;
import lk.ijse.backendtyretrends.service.ServiceBookingService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServiceBookingServiceImpl implements ServiceBookingService {

    @Autowired
    private ServiceBookingRepository serviceBookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private ModelMapper modelMapper;

    // Service pricing
    private static final Map<ServiceType, BigDecimal> SERVICE_PRICES = new HashMap<>();
    private static final Set<ServiceType> PER_TIRE_SERVICES = EnumSet.of(
            ServiceType.TIRE_INSTALLATION,
            ServiceType.FLAT_REPAIR
    );

    static {
        SERVICE_PRICES.put(ServiceType.TIRE_INSTALLATION, new BigDecimal("25.00"));
        SERVICE_PRICES.put(ServiceType.WHEEL_ALIGNMENT, new BigDecimal("89.99"));
        SERVICE_PRICES.put(ServiceType.TIRE_ROTATION, new BigDecimal("39.99"));
        SERVICE_PRICES.put(ServiceType.TIRE_BALANCING, new BigDecimal("49.99"));
        SERVICE_PRICES.put(ServiceType.FLAT_REPAIR, new BigDecimal("29.99"));
        SERVICE_PRICES.put(ServiceType.TIRE_INSPECTION, new BigDecimal("19.99"));
        SERVICE_PRICES.put(ServiceType.TPMS_SERVICE, new BigDecimal("15.99"));
    }

    @Override
    public ServiceBookingDTO createBooking(String userEmail, ServiceBookingRequestDTO bookingRequest) {
        // Find user by email
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        // Find vehicle by ID
        Vehicle vehicle = vehicleRepository.findById(bookingRequest.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Validate that vehicle belongs to user
        if (!vehicle.getUser().equals(user)) {
            throw new RuntimeException("Vehicle does not belong to user");
        }

        // Validate service type
        ServiceType serviceType;
        try {
            serviceType = bookingRequest.getServiceType();
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid service type");
        }

        // Check if selected time slot is available
        if (!isTimeSlotAvailable(bookingRequest.getDate(), bookingRequest.getTime().toString())) {
            throw new RuntimeException("Selected time slot is not available");
        }

        // Generate booking number
        String bookingNumber = generateBookingNumber();

        // Calculate price based on service type
        BigDecimal price = calculateServicePrice(serviceType);

        // Create new booking
        ServiceBooking booking = new ServiceBooking();
        booking.setUser(user);
        booking.setVehicle(vehicle);
        booking.setBookingNumber(bookingNumber);
        booking.setServiceType(serviceType);
        booking.setDate(bookingRequest.getDate());
        booking.setTime(bookingRequest.getTime());
        booking.setNotes(bookingRequest.getNotes());
        booking.setStatus(ServiceStatus.PENDING);
        booking.setPrice(price);
        booking.setIsPaid(false);

        // Save booking
        ServiceBooking savedBooking = serviceBookingRepository.save(booking);

        // Map to DTO and return
        return mapToDTO(savedBooking);
    }

    @Override
    public ServiceBookingDTO getBookingById(Long id) {
        ServiceBooking booking = serviceBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return mapToDTO(booking);
    }

    @Override
    public ServiceBookingDTO getBookingByNumber(String bookingNumber) {
        ServiceBooking booking = serviceBookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return mapToDTO(booking);
    }

    @Override
    public Page<ServiceBookingDTO> getUserBookings(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Page<ServiceBooking> bookings = serviceBookingRepository.findByUser(user, pageable);
        return bookings.map(this::mapToDTO);
    }

    @Override
    public Page<ServiceBookingDTO> getUserBookingsByStatus(String userEmail, ServiceStatus status, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Page<ServiceBooking> bookings = serviceBookingRepository.findByUserAndStatus(user, status, pageable);
        return bookings.map(this::mapToDTO);
    }

    @Override
    public Page<ServiceBookingDTO> getAllBookings(Pageable pageable) {
        Page<ServiceBooking> bookings = serviceBookingRepository.findAll(pageable);
        return bookings.map(this::mapToDTO);
    }

    @Override
    public Page<ServiceBookingDTO> getBookingsByStatus(ServiceStatus status, Pageable pageable) {
        Page<ServiceBooking> bookings = serviceBookingRepository.findByStatus(status, pageable);
        return bookings.map(this::mapToDTO);
    }

    @Override
    public Page<ServiceBookingDTO> searchBookings(String search, Pageable pageable) {
        Page<ServiceBooking> bookings = serviceBookingRepository.searchBookings(search, pageable);
        return bookings.map(this::mapToDTO);
    }

    @Override
    public ServiceBookingDTO updateBookingStatus(Long id, ServiceStatus status) {
        ServiceBooking booking = serviceBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        switch (status) {
            case CONFIRMED:
                booking.markAsConfirmed();
                break;
            case IN_PROGRESS:
                booking.markAsInProgress();
                break;
            case COMPLETED:
                booking.markAsCompleted();
                break;
            case CANCELLED:
                booking.markAsCancelled();
                break;
            default:
                booking.setStatus(status);
        }

        ServiceBooking updatedBooking = serviceBookingRepository.save(booking);
        return mapToDTO(updatedBooking);
    }

    @Override
    public ServiceBookingDTO cancelBooking(Long id) {
        ServiceBooking booking = serviceBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.markAsCancelled();
        ServiceBooking cancelledBooking = serviceBookingRepository.save(booking);
        return mapToDTO(cancelledBooking);
    }

    @Override
    public void deleteBooking(Long id) {
        ServiceBooking booking = serviceBookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        serviceBookingRepository.delete(booking);
    }

    @Override
    public List<ServiceTimeSlotDTO> getAvailableTimeSlots(LocalDate date, String serviceTypeStr) {
        // Validate service type
        ServiceType serviceType;
        try {
            serviceType = ServiceType.valueOf(serviceTypeStr);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid service type");
        }

        // Get all bookings for the selected date with status not cancelled
        List<ServiceBooking> existingBookings = serviceBookingRepository.findByDateAndStatus(date, ServiceStatus.PENDING);
        existingBookings.addAll(serviceBookingRepository.findByDateAndStatus(date, ServiceStatus.CONFIRMED));
        existingBookings.addAll(serviceBookingRepository.findByDateAndStatus(date, ServiceStatus.IN_PROGRESS));

        // Set of booked time slots
        Set<LocalTime> bookedSlots = existingBookings.stream()
                .map(ServiceBooking::getTime)
                .collect(Collectors.toSet());

        // Generate all available time slots for the day
        List<ServiceTimeSlotDTO> timeSlots = generateTimeSlots(date, bookedSlots);

        return timeSlots;
    }

    @Override
    public boolean isTimeSlotAvailable(LocalDate date, String timeStr) {
        LocalTime time = LocalTime.parse(timeStr);

        // Get all bookings for the selected date and time with status not cancelled
        List<ServiceBooking> existingBookings = serviceBookingRepository.findByDateAndStatus(date, ServiceStatus.PENDING);
        existingBookings.addAll(serviceBookingRepository.findByDateAndStatus(date, ServiceStatus.CONFIRMED));
        existingBookings.addAll(serviceBookingRepository.findByDateAndStatus(date, ServiceStatus.IN_PROGRESS));

        // Check if time slot is already booked
        return existingBookings.stream()
                .noneMatch(booking -> booking.getTime().equals(time));
    }

    // Helper methods
    private List<ServiceTimeSlotDTO> generateTimeSlots(LocalDate date, Set<LocalTime> bookedSlots) {
        List<ServiceTimeSlotDTO> timeSlots = new ArrayList<>();
        LocalTime startTime = LocalTime.of(9, 0); // 9:00 AM
        LocalTime endTime = LocalTime.of(17, 0);  // 5:00 PM
        int interval = 30; // 30-minute intervals

        LocalTime currentTime = startTime;
        while (currentTime.isBefore(endTime)) {
            boolean isAvailable = !bookedSlots.contains(currentTime);

            // If date is today, don't show past times
            if (date.equals(LocalDate.now()) && currentTime.isBefore(LocalTime.now())) {
                isAvailable = false;
            }

            timeSlots.add(new ServiceTimeSlotDTO(currentTime, isAvailable));
            currentTime = currentTime.plusMinutes(interval);
        }

        return timeSlots;
    }

    private String generateBookingNumber() {
        // Format: SB-YYYYMMDD-XXXX where XXXX is a random 4-digit number
        LocalDate now = LocalDate.now();
        String datePart = String.format("%d%02d%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());
        String randomPart = String.format("%04d", new Random().nextInt(10000));
        return "SB-" + datePart + "-" + randomPart;
    }

    private BigDecimal calculateServicePrice(ServiceType serviceType) {
        BigDecimal basePrice = SERVICE_PRICES.getOrDefault(serviceType, BigDecimal.ZERO);

        // For per-tire services, multiply by 4 (assuming 4 tires)
        if (PER_TIRE_SERVICES.contains(serviceType)) {
            return basePrice.multiply(new BigDecimal("4"));
        }

        return basePrice;
    }

    private ServiceBookingDTO mapToDTO(ServiceBooking booking) {
        ServiceBookingDTO dto = new ServiceBookingDTO(); // Manually instantiate instead of using modelMapper

        // Manually map fields
        dto.setId(booking.getId());
        dto.setBookingNumber(booking.getBookingNumber());
        dto.setServiceType(booking.getServiceType());
        dto.setServiceTypeName(booking.getServiceType().getDisplayName());

        // Explicitly handle user name mapping
        User user = booking.getUser();
        dto.setUserName(user.getFirstName() + " " + user.getLastName());
        dto.setUserEmail(user.getEmail());
        dto.setUserPhone(user.getPhoneNumber());

        // Continue mapping other fields similarly
        Vehicle vehicle = booking.getVehicle();
        dto.setVehicleId(vehicle.getId());
        dto.setVehicleInfo(vehicle.getYear() + " " + vehicle.getMake() + " " + vehicle.getModel());

        // Map remaining fields
        dto.setDate(booking.getDate());
        dto.setTime(booking.getTime());
        dto.setNotes(booking.getNotes());
        dto.setStatus(booking.getStatus());
        dto.setPrice(booking.getPrice());
        dto.setIsPaid(booking.getIsPaid());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());
        dto.setCompletedAt(booking.getCompletedAt());
        dto.setCancelledAt(booking.getCancelledAt());

        return dto;
    }
}