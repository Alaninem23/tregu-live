from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from .db import Base

def uuid_column():
    return UUID(as_uuid=True)

def uuid_pk():
    return Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

class Tenant(Base):
    __tablename__ = "tenants"
    id = uuid_pk()
    name = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class User(Base):
    __tablename__ = "users"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="buyer")
    created_at = Column(DateTime, server_default=func.now())

class Seller(Base):
    __tablename__ = "sellers"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    name = Column(String, nullable=False)
    kyc_status = Column(String, default="pending")
    stripe_account_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class Product(Base):
    __tablename__ = "products"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id", ondelete="CASCADE"), index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    price_cents = Column(Integer, nullable=False)
    currency = Column(String, default="USD")
    sku = Column(String)
    stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class AdCampaign(Base):
    __tablename__ = "ad_campaigns"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id", ondelete="CASCADE"), index=True)
    name = Column(String, nullable=False)
    budget_cents = Column(Integer, nullable=False)
    status = Column(String, default="draft")

class AdEvent(Base):
    __tablename__ = "ad_events"
    id = uuid_pk()
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("ad_campaigns.id", ondelete="CASCADE"), index=True)
    event_type = Column(String, nullable=False)
    event_time = Column(DateTime, server_default=func.now())
    meta = Column(Text)

class Location(Base):
    __tablename__ = "locations"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    name = Column(String, nullable=False)
    city = Column(String)
    state = Column(String)
    is_active = Column(Boolean, default=True)

class Pod(Base):
    __tablename__ = "pods"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="CASCADE"), index=True)
    label = Column(String, nullable=False)
    daily_rate_cents = Column(Integer, default=5000)
    is_active = Column(Boolean, default=True)

class Booking(Base):
    __tablename__ = "bookings"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    pod_id = Column(UUID(as_uuid=True), ForeignKey("pods.id", ondelete="CASCADE"), index=True)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id", ondelete="CASCADE"), index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default="confirmed")

class TwoFactorMethod(Base):
    __tablename__ = "two_factor_methods"
    id = uuid_pk()
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    method_type = Column(String, nullable=False)  # 'totp', 'sms', 'email'
    is_enabled = Column(Boolean, default=True)
    secret = Column(String)  # For TOTP
    phone_number = Column(String)  # For SMS
    backup_codes = Column(Text)  # JSON array of backup codes
    created_at = Column(DateTime, server_default=func.now())
    last_used = Column(DateTime)

class TwoFactorAttempt(Base):
    __tablename__ = "two_factor_attempts"
    id = uuid_pk()
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    method_type = Column(String, nullable=False)
    code = Column(String, nullable=False)
    is_successful = Column(Boolean, default=False)
    ip_address = Column(String)
    user_agent = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class SecurityEvent(Base):
    __tablename__ = "security_events"
    id = uuid_pk()
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    event_type = Column(String, nullable=False)  # 'login_attempt', 'suspicious_activity', 'password_change', etc.
    description = Column(Text)
    ip_address = Column(String)
    user_agent = Column(String)
    is_suspicious = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class InventoryLocation(Base):
    __tablename__ = "inventory_locations"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    name = Column(String, nullable=False)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    location_type = Column(String, default="warehouse")  # 'warehouse', 'distribution_center', 'store'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class InventoryCategory(Base):
    __tablename__ = "inventory_categories"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("inventory_categories.id", ondelete="SET NULL"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("inventory_categories.id", ondelete="SET NULL"))
    location_id = Column(UUID(as_uuid=True), ForeignKey("inventory_locations.id", ondelete="SET NULL"))
    name = Column(String, nullable=False)
    description = Column(Text)
    sku = Column(String, unique=True, nullable=False)
    barcode = Column(String, unique=True)
    unit_cost = Column(Integer)  # in cents
    unit_price = Column(Integer)  # in cents
    currency = Column(String, default="USD")
    current_stock = Column(Integer, default=0)
    minimum_stock = Column(Integer, default=0)
    maximum_stock = Column(Integer)
    unit_of_measure = Column(String, default="each")  # 'each', 'lb', 'kg', 'liter', etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class RFIDTag(Base):
    __tablename__ = "rfid_tags"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), index=True)
    tag_id = Column(String, unique=True, nullable=False)  # RFID tag identifier
    tag_type = Column(String, default="passive")  # 'passive', 'active', 'semi-passive'
    frequency = Column(String)  # 'LF', 'HF', 'UHF', 'MW'
    is_active = Column(Boolean, default=True)
    last_scanned = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    id = uuid_pk()
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), index=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("inventory_locations.id", ondelete="CASCADE"))
    transaction_type = Column(String, nullable=False)  # 'stock_in', 'stock_out', 'adjustment', 'transfer', 'damage', 'return'
    quantity = Column(Integer, nullable=False)
    previous_stock = Column(Integer, nullable=False)
    new_stock = Column(Integer, nullable=False)
    reference_number = Column(String)  # PO number, invoice number, etc.
    notes = Column(Text)
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    rfid_tag_id = Column(UUID(as_uuid=True), ForeignKey("rfid_tags.id", ondelete="SET NULL"))
    created_at = Column(DateTime, server_default=func.now())

class State(Base):
    __tablename__ = "states"
    id = uuid_pk()
    name = Column(String, nullable=False, unique=True)
    code = Column(String(2), nullable=False, unique=True)  # e.g., 'CA', 'NY'
    created_at = Column(DateTime, server_default=func.now())

class City(Base):
    __tablename__ = "cities"
    id = uuid_pk()
    name = Column(String, nullable=False)
    state_id = Column(UUID(as_uuid=True), ForeignKey("states.id", ondelete="CASCADE"), index=True)
    created_at = Column(DateTime, server_default=func.now())

class ZipCode(Base):
    __tablename__ = "zip_codes"
    id = uuid_pk()
    code = Column(String(10), nullable=False, unique=True)  # e.g., '90210', '10001-1234'
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), index=True)
    latitude = Column(String)  # Optional for geolocation
    longitude = Column(String)  # Optional for geolocation
    created_at = Column(DateTime, server_default=func.now())

class RequestLog(Base):
    __tablename__ = "request_logs"
    id = uuid_pk()
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    session_id = Column(String, index=True)  # Could be JWT jti or session cookie
    client_ip = Column(String, nullable=False, index=True)
    ip_hash = Column(String, nullable=False, index=True)  # Salted hash for privacy
    country = Column(String)
    region = Column(String)  # State/Province
    city = Column(String)
    postal_code = Column(String)
    latitude = Column(String)
    longitude = Column(String)
    is_vpn_or_proxy = Column(Boolean, default=False)
    user_agent = Column(String)
    method = Column(String, nullable=False)
    path = Column(String, nullable=False)
    status_code = Column(Integer)
    response_time_ms = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())

class GeocodeLocation(Base):
    """
    Comprehensive geocoding location model for advanced location services
    Adapted for SQLite compatibility
    """
    __tablename__ = "geocode_locations"

    id = Column(String, primary_key=True)  # place_id as string
    place_id = Column(String, unique=True, index=True)
    names = Column(Text)  # JSON string for multilingual names
    display_name = Column(String, index=True)
    lat = Column(String)  # Store as string for SQLite
    lon = Column(String)  # Store as string for SQLite
    hierarchy = Column(Text)  # JSON string for location hierarchy
    codes = Column(Text)  # JSON string for ISO codes, currency, etc.
    h3_res8 = Column(String, index=True)  # H3 cell at resolution 8
    h3_res9 = Column(String, index=True)  # H3 cell at resolution 9
    geom = Column(Text)  # WKT geometry string
    geom_bbox = Column(Text)  # WKT bbox string
    location_type = Column(String, index=True)  # locality, address, etc.
    importance = Column(String)  # Store as string
    source = Column(String, index=True)  # Data source
    version = Column(String, index=True)  # Import version
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

# Import AI messenger models to ensure they are registered with SQLAlchemy Base
# Import after all other models to avoid circular imports
try:
    from .models.ai_messenger import AICharacter, ChatConversation, ChatMessage
except ImportError:
    pass  # AI models may not be available in all contexts

# Import settings models
# from .models import SiteSettings
