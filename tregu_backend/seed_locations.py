# Seed script for location data (States, Cities, ZipCodes)
from app.db import SessionLocal, engine
from app.db_models import Base, State, City, ZipCode

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Sample US states
states_data = [
    {"name": "California", "code": "CA"},
    {"name": "New York", "code": "NY"},
    {"name": "Texas", "code": "TX"},
    {"name": "Florida", "code": "FL"},
    {"name": "Illinois", "code": "IL"},
]

states = {}
for state_data in states_data:
    state = State(name=state_data["name"], code=state_data["code"])
    db.add(state)
    db.flush()
    states[state_data["code"]] = state

# Sample cities
cities_data = [
    {"name": "Los Angeles", "state_code": "CA"},
    {"name": "San Francisco", "state_code": "CA"},
    {"name": "New York City", "state_code": "NY"},
    {"name": "Buffalo", "state_code": "NY"},
    {"name": "Houston", "state_code": "TX"},
    {"name": "Dallas", "state_code": "TX"},
    {"name": "Miami", "state_code": "FL"},
    {"name": "Orlando", "state_code": "FL"},
    {"name": "Chicago", "state_code": "IL"},
    {"name": "Springfield", "state_code": "IL"},
]

cities = {}
for city_data in cities_data:
    city = City(name=city_data["name"], state_id=states[city_data["state_code"]].id)
    db.add(city)
    db.flush()
    cities[city_data["name"]] = city

# Sample zip codes
zip_codes_data = [
    {"code": "90210", "city": "Los Angeles", "lat": "34.0901", "lon": "-118.4065"},
    {"code": "94102", "city": "San Francisco", "lat": "37.7749", "lon": "-122.4194"},
    {"code": "10001", "city": "New York City", "lat": "40.7505", "lon": "-73.9934"},
    {"code": "14202", "city": "Buffalo", "lat": "42.8864", "lon": "-78.8784"},
    {"code": "77001", "city": "Houston", "lat": "29.7604", "lon": "-95.3698"},
    {"code": "75201", "city": "Dallas", "lat": "32.7767", "lon": "-96.7970"},
    {"code": "33101", "city": "Miami", "lat": "25.7617", "lon": "-80.1918"},
    {"code": "32801", "city": "Orlando", "lat": "28.5383", "lon": "-81.3792"},
    {"code": "60601", "city": "Chicago", "lat": "41.8781", "lon": "-87.6298"},
    {"code": "62701", "city": "Springfield", "lat": "39.7817", "lon": "-89.6501"},
]

for zip_data in zip_codes_data:
    zip_code = ZipCode(
        code=zip_data["code"],
        city_id=cities[zip_data["city"]].id,
        latitude=zip_data["lat"],
        longitude=zip_data["lon"]
    )
    db.add(zip_code)

db.commit()
db.close()
print("Location data seeded successfully.")