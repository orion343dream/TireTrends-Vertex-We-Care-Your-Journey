package lk.ijse.backendtyretrends.enums;

public enum OrderStatus {
    PENDING,    // Order has been created but not paid
    PAID,       // Order has been paid
    PROCESSING, // Order is being processed
    SHIPPED,    // Order has been shipped
    DELIVERED,  // Order has been delivered
    COMPLETED, CANCELLED   // Order has been cancelled
}