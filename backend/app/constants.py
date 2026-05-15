"""
Backend constants for FuelWatchPH.

NOTE: If the database stores fuel type strings, changing these values
requires a migration to update existing rows to the new canonical names.
Add a SQL migration to map old values (e.g., "Premium 95") to the new
values (e.g., "Premium 95" -> "PR95") when moving to production.
"""

FUEL_TYPES = [
    "Unleaded 91",
    "Unleaded 95",
    "Unleaded 98",
    "Diesel",
    "Premium Diesel",
    "Kerosene",
]

# Price sanity bounds (PHP per liter)
MIN_PRICE_PHP = 40.0
MAX_PRICE_PHP = 200.0
