from app.db import SessionLocal
from app.models.seller import Seller
db = SessionLocal()
if not db.query(Seller).filter_by(account_id='SELLER001').first():
    db.add(Seller(account_id='SELLER001', email='metro@example.com', name='Metro Apparel', company_name='Metro Apparel', logo_url=''))
if not db.query(Seller).filter_by(account_id='SELLER002').first():
    db.add(Seller(account_id='SELLER002', email='roast@example.com', name='Roast & Co', company_name='Roast & Co', logo_url=''))
db.commit()
db.close()
