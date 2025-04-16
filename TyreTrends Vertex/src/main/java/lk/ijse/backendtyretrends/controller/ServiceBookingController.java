package lk.ijse.backendtyretrends.controller;

import lk.ijse.backendtyretrends.dto.ResponseDTO;
import lk.ijse.backendtyretrends.dto.ServiceBookingDTO;
import lk.ijse.backendtyretrends.dto.ServiceBookingRequestDTO;
import lk.ijse.backendtyretrends.dto.ServiceTimeSlotDTO;
import lk.ijse.backendtyretrends.enums.ServiceStatus;
import lk.ijse.backendtyretrends.service.ServiceBookingService;
import lk.ijse.backendtyretrends.util.JwtUtil;
import lk.ijse.backendtyretrends.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
@CrossOrigin(origins = "*")
public class ServiceBookingController {

    @Autowired
    private ServiceBookingService serviceBookingService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ResponseDTO> createBooking(
            @RequestHeader("Authorization") String token,
            @RequestBody ServiceBookingRequestDTO bookingRequest) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            ServiceBookingDTO booking = serviceBookingService.createBooking(userEmail, bookingRequest);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Service booking created successfully", booking));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO> getBookingById(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        try {
            ServiceBookingDTO booking = serviceBookingService.getBookingById(id);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Service booking retrieved successfully", booking)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping("/number/{bookingNumber}")
    public ResponseEntity<ResponseDTO> getBookingByNumber(
            @RequestHeader("Authorization") String token,
            @PathVariable String bookingNumber) {
        try {
            ServiceBookingDTO booking = serviceBookingService.getBookingByNumber(bookingNumber);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Service booking retrieved successfully", booking)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping
    public ResponseEntity<ResponseDTO> getUserBookings(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ServiceStatus status) {
        try {
            String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
            String userEmail = jwtUtil.getUsernameFromToken(jwt);

            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ServiceBookingDTO> bookings;

            if (status != null) {
                bookings = serviceBookingService.getUserBookingsByStatus(userEmail, status, pageable);
            } else {
                bookings = serviceBookingService.getUserBookings(userEmail, pageable);
            }

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Service bookings retrieved successfully", bookings)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping("/time-slots")
    public ResponseEntity<ResponseDTO> getAvailableTimeSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String serviceType) {
        try {
            List<ServiceTimeSlotDTO> timeSlots = serviceBookingService.getAvailableTimeSlots(date, serviceType);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Available time slots retrieved successfully", timeSlots)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping("/check-slot")
    public ResponseEntity<ResponseDTO> checkTimeSlotAvailability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String time) {
        try {
            boolean isAvailable = serviceBookingService.isTimeSlotAvailable(date, time);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Time slot availability checked", isAvailable)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ResponseDTO> cancelBooking(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        try {
            ServiceBookingDTO cancelledBooking = serviceBookingService.cancelBooking(id);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Service booking cancelled successfully", cancelledBooking)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    // Admin endpoints
    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ServiceStatus status,
            @RequestParam(required = false) String search) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ServiceBookingDTO> bookings;

            if (status != null) {
                bookings = serviceBookingService.getBookingsByStatus(status, pageable);
            } else if (search != null && !search.isEmpty()) {
                bookings = serviceBookingService.searchBookings(search, pageable);
            } else {
                bookings = serviceBookingService.getAllBookings(pageable);
            }

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Service bookings retrieved successfully", bookings)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam ServiceStatus status) {
        try {
            ServiceBookingDTO updatedBooking = serviceBookingService.updateBookingStatus(id, status);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Service booking status updated successfully", updatedBooking)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ResponseDTO> deleteBooking(@PathVariable Long id) {
        try {
            serviceBookingService.deleteBooking(id);

            return ResponseEntity.ok(
                    new ResponseDTO(VarList.OK, "Service booking deleted successfully", null)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}
