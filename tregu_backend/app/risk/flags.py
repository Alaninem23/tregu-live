import os
flags = {
    "enableSignups": os.getenv("FEATURE_ENABLE_SIGNUPS", "true") == "true",
    "enableListings": os.getenv("FEATURE_ENABLE_LISTINGS", "true") == "true",
    "enablePayouts": os.getenv("FEATURE_ENABLE_PAYOUTS", "false") == "true",
    "maintenanceMode": os.getenv("MAINTENANCE_MODE", "false") == "true",
}
