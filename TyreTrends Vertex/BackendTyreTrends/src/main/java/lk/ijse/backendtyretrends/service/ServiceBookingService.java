package lk.ijse.backendtyretrends.service;

import lk.ijse.backendtyretrends.dto.ServiceBookingDTO;
import lk.ijse.backendtyretrends.dto.ServiceBookingRequestDTO;
import lk.ijse.backendtyretrends.dto.ServiceTimeSlotDTO;
import lk.ijse.backendtyretrends.enums.ServiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface ServiceBookingService {
    ServiceBookingDTO createBooking(String userEmail, ServiceBookingRequestDTO bookingRequest);

    ServiceBookingDTO getBookingById(Long id);

    ServiceBookingDTO getBookingByNumber(String bookingNumber);

    Page<ServiceBookingDTO> getUserBookings(String userEmail, Pageable pageable);

    Page<ServiceBookingDTO> getUserBookingsByStatus(String userEmail, ServiceStatus status, Pageable pageable);

    Page<ServiceBookingDTO> getAllBookings(Pageable pageable);

    Page<ServiceBookingDTO> getBookingsByStatus(ServiceStatus status, Pageable pageable);

    Page<ServiceBookingDTO> searchBookings(String search, Pageable pageable);

    ServiceBookingDTO updateBookingStatus(Long id, ServiceStatus status);

    ServiceBookingDTO cancelBooking(Long id);

    void deleteBooking(Long id);

    List<ServiceTimeSlotDTO> getAvailableTimeSlots(LocalDate date, String serviceType);

    boolean isTimeSlotAvailable(LocalDate date, String time);
}
