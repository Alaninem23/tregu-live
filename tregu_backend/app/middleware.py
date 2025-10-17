# app/middleware.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import time
import uuid
import hashlib
import os
from .db import SessionLocal
from .db_models import RequestLog, User
import requests
import jwt as pyjwt
from .config import SECRET_KEY

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, salt: str = None):
        super().__init__(app)
        self.salt = salt or os.getenv("IP_HASH_SALT", "default_salt_change_in_prod")

    async def dispatch(self, request: Request, call_next):
        # Get client IP, handling proxies
        client_ip = self.get_client_ip(request)
        
        # Hash the IP for privacy
        ip_hash = hashlib.sha256(f"{self.salt}{client_ip}".encode()).hexdigest()
        
        # Get user info from token if present
        user_id, session_id = await self.get_user_from_token(request)
        
        # Get geolocation data
        geo_data = await self.get_geolocation(client_ip)
        
        start_time = time.perf_counter()
        
        response: Response = await call_next(request)
        
        response_time_ms = int((time.perf_counter() - start_time) * 1000)
        
        # Log the request
        await self.log_request(
            user_id=user_id,
            session_id=session_id,
            client_ip=client_ip,
            ip_hash=ip_hash,
            geo_data=geo_data,
            user_agent=request.headers.get('user-agent'),
            method=request.method,
            path=str(request.url.path),
            status_code=response.status_code,
            response_time_ms=response_time_ms
        )
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Extract real client IP, handling proxies"""
        # Check X-Forwarded-For header (trusted proxy)
        x_forwarded_for = request.headers.get('x-forwarded-for')
        if x_forwarded_for:
            # Take the first IP (original client)
            client_ip = x_forwarded_for.split(',')[0].strip()
        else:
            # Fall back to direct connection
            client_ip = request.client.host if request.client else 'unknown'
        
        return client_ip
    
    async def get_geolocation(self, ip: str) -> dict:
        """Get geolocation data from IP"""
        try:
            # Use ipapi.co (free tier)
            response = requests.get(f"http://ipapi.co/{ip}/json/", timeout=2)
            if response.status_code == 200:
                data = response.json()
                if data.get("error"):
                    return {}
                
                return {
                    "country": data.get("country_name"),
                    "region": data.get("region"),
                    "city": data.get("city"),
                    "postal_code": data.get("postal"),
                    "latitude": str(data.get("latitude", "")),
                    "longitude": str(data.get("longitude", "")),
                    "is_vpn_or_proxy": data.get("proxy", False) or data.get("hosting", False)
                }
        except:
            pass
        return {}
    
    async def log_request(self, **kwargs):
        """Log request to database"""
        try:
            db = SessionLocal()
            log_entry = RequestLog(**kwargs)
            db.add(log_entry)
            db.commit()
            db.close()
        except Exception as e:
            # Don't fail the request if logging fails
            print(f"Failed to log request: {e}")
            pass
    
    async def get_user_from_token(self, request: Request):
        """Extract user_id and session_id from JWT token if present"""
        auth_header = request.headers.get('authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None, None
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        try:
            payload = pyjwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            email = payload.get("sub")
            
            # Get user_id from database
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.email == email).first()
                user_id = user.id if user else None
                session_id = payload.get('jti')  # JWT ID if present
                return user_id, session_id
            finally:
                db.close()
        except:
            return None, None

class ContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # simple context you can expand later
        request.state.request_id = str(uuid.uuid4())
        request.state.start_time = time.perf_counter()
        response: Response = await call_next(request)
        # you could log duration here if you want
        return response
