# Simple seed script to create a tenant admin and demo data
from app.db import SessionLocal, engine
from app.db_models import Base, Tenant, User, Seller, Product, Location, Pod
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

tenant = Tenant(name="tregu-demo"); db.add(tenant); db.flush()
admin = User(email="admin@tregu.com", password_hash=hash_password("Admin123!"), role="admin", tenant_id=tenant.id)
db.add(admin)

seller = Seller(name="Demo Seller", tenant_id=tenant.id); db.add(seller); db.flush()
p = Product(name="Recycled Tote", description="Eco-friendly tote bag", price_cents=2500, stock=100, tenant_id=tenant.id, seller_id=seller.id)
db.add(p)

loc = Location(name="Cleveland Market", city="Cleveland", state="OH", is_active=True, tenant_id=tenant.id); db.add(loc); db.flush()
pod = Pod(label="A1", daily_rate_cents=5000, is_active=True, tenant_id=tenant.id, location_id=loc.id); db.add(pod)

db.commit(); db.close()
print("Seed complete. Login: admin@tregu.local / password")
