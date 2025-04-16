package lk.ijse.backendtyretrends.enums;

public enum ServiceType {
    TIRE_INSTALLATION("Tire Installation"),
    WHEEL_ALIGNMENT("Wheel Alignment"),
    TIRE_ROTATION("Tire Rotation"),
    TIRE_BALANCING("Tire Balancing"),
    FLAT_REPAIR("Flat Repair"),
    TIRE_INSPECTION("Tire Inspection"),
    TPMS_SERVICE("TPMS Service");

    private final String displayName;

    ServiceType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
