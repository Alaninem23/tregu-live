from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db import SessionLocal
from ..db_models import State, City, ZipCode
from ..schemas.locations import StateResponse, CityResponse, ZipCodeResponse
import requests

router = APIRouter(prefix="/locations")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/states", response_model=List[StateResponse])
def get_states(db: Session = Depends(get_db)):
    states = db.query(State).all()
    return states

@router.get("/cities/{state_id}", response_model=List[CityResponse])
def get_cities_by_state(state_id: str, db: Session = Depends(get_db)):
    cities = db.query(City).filter(City.state_id == state_id).all()
    return cities

@router.get("/zip-codes/{city_id}", response_model=List[ZipCodeResponse])
def get_zip_codes_by_city(city_id: str, db: Session = Depends(get_db)):
    zip_codes = db.query(ZipCode).filter(ZipCode.city_id == city_id).all()
    return zip_codes

@router.get("/location-by-ip")
def get_location_by_ip(ip: str, db: Session = Depends(get_db)):
    try:
        # Use ipapi.co for geolocation (free tier)
        response = requests.get(f"http://ipapi.co/{ip}/json/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("error"):
                raise HTTPException(status_code=400, detail="Invalid IP address")
            
            # Try to find matching location in our database
            zip_code = db.query(ZipCode).filter(ZipCode.code == data.get("postal")).first()
            if zip_code:
                city = db.query(City).filter(City.id == zip_code.city_id).first()
                state = db.query(State).filter(State.id == city.state_id).first() if city else None
                return {
                    "ip": ip,
                    "country": data.get("country_name"),
                    "region": data.get("region"),
                    "city": data.get("city"),
                    "zip_code": data.get("postal"),
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude"),
                    "state": state.name if state else None,
                    "state_code": state.code if state else None
                }
            else:
                # Return geolocation data even if not in our database
                return {
                    "ip": ip,
                    "country": data.get("country_name"),
                    "region": data.get("region"),
                    "city": data.get("city"),
                    "zip_code": data.get("postal"),
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude"),
                    "state": None,
                    "state_code": None,
                    "note": "Location not found in database"
                }
        else:
            raise HTTPException(status_code=500, detail="Geolocation service unavailable")
    except requests.RequestException:
        # Fallback for demo - return mock data
        return {
            "ip": ip,
            "country": "United States",
            "region": "California",
            "city": "Los Angeles",
            "zip_code": "90210",
            "latitude": "34.0901",
            "longitude": "-118.4065",
            "state": "California",
            "state_code": "CA",
            "note": "Using mock data (geolocation service unavailable)"
        }