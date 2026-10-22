from typing import List

class Settings:
    PROJECT_NAME: str = "Solaris Telephony Gateway"
    VERSION: str = "3.1.0"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5175",
    ]
    # Clean Energy Queue Catalog
    QUEUES: List[str] = [
        "Solar & Inverter Tier-1",
        "BESS Battery & Thermal Response",
        "Microgrid & High-Voltage Interconnect",
        "Field Engineering & Truck Roll",
        "Commercial Tariffs & Net Metering",
        "Emergency Arc-Flash & Rapid Shutdown",
    ]
    MAX_LINES_PER_AGENT: int = 3
    DEFAULT_ACW_SECONDS: int = 60

settings = Settings()
