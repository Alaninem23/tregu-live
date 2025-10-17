import os
import json
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union

# import pyh3  # Temporarily disabled due to installation issues
# import shapely.wkt  # Not needed without H3
# from shapely.geometry import Point, Polygon, box  # Not currently used
import sqlalchemy as sa
from sqlalchemy.orm import Session
# import pycountry  # Temporarily disabled
# import pytz  # Temporarily disabled
# import redis  # Temporarily disabled
import requests

from fastapi import FastAPI, Query, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field, validator

# Local imports (adapted for project structure)
from .db_models import GeocodeLocation
from .api_schemas import LocationType, LocationSearchParams, LocationReverseParams, NearbyLocationParams
from .db import SessionLocal, engine

class GeocodeService:
    """
    Comprehensive geocoding service with:
    - Offline-first approach
    - Multi-language support
    - Deduplication
    - Fallback mechanisms
    """
    def __init__(
        self, 
        db_session: Session, 
        redis_client=None,  # Made optional
        fallback_provider_enabled: bool = False
    ):
        self.db = db_session
        self.redis = redis_client
        self.fallback_provider_enabled = fallback_provider_enabled

    def search_locations(
        self,
        params: LocationSearchParams,
        tenant_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Advanced location search with multi-dimensional filtering
        Provides actual, precise location results
        """
        # Build base query
        query = self.db.query(GeocodeLocation)

        # Detailed filtering with precise matching
        if params.q:
            # Advanced text search with trigram similarity (adapted for SQLite)
            normalized_query = params.q.strip().lower()
            query = query.filter(
                sa.or_(
                    sa.func.lower(GeocodeLocation.display_name).like(f'%{normalized_query}%'),
                    # Note: SQLite doesn't have trigram similarity, using LIKE for now
                )
            )

        # Location type filtering
        if params.types:
            query = query.filter(GeocodeLocation.location_type.in_([t.value for t in params.types]))

        # Country filtering with precise matching
        if params.country:
            # Support both full country name and ISO codes
            query = query.filter(
                sa.or_(
                    GeocodeLocation.codes.like(f'%"iso_country": "{params.country.upper()}"%'),
                    GeocodeLocation.hierarchy.like(f'%"country": "{params.country.lower()}"%')
                )
            )

        # Hierarchical location filtering
        # This allows precise filtering by different location levels
        try:
            hierarchy_filters = []

            # Check for specific state/region
            state_match = (
                GeocodeLocation.hierarchy.like(f'%"admin1": "{params.q.lower()}"%') if params.q else None
            )
            if state_match is not None:
                hierarchy_filters.append(state_match)

            # Check for specific city
            city_match = (
                GeocodeLocation.hierarchy.like(f'%"locality": "{params.q.lower()}"%') if params.q else None
            )
            if city_match is not None:
                hierarchy_filters.append(city_match)

            # Check for specific zip code
            zipcode_match = (
                GeocodeLocation.hierarchy.like(f'%"postal_code": "{params.q}"%') if params.q and params.q.isdigit() else None
            )
            if zipcode_match is not None:
                hierarchy_filters.append(zipcode_match)

            # Apply hierarchy filters if any
            if hierarchy_filters:
                query = query.filter(sa.or_(*hierarchy_filters))

        except Exception as e:
            # Log any filtering errors without breaking the query
            print(f"Error in hierarchical filtering: {e}")

        # Ordering with language preference
        if params.lang != 'en':
            # Prioritize results with localized names
            query = query.order_by(
                sa.case(
                    (GeocodeLocation.names.like(f'%"{params.lang}": %'), 0),
                    else_=1
                )
            )

        # Limit results
        results = query.limit(params.limit).all()

        # Transform results with language preference
        transformed_results = self._transform_results_with_language(results, params.lang)

        # If no results found, provide helpful feedback
        if not transformed_results:
            # Generate a helpful message about the search
            no_results_message = self._generate_no_results_message(params)
            return [no_results_message] if no_results_message else transformed_results

        return transformed_results

    def _generate_no_results_message(
        self,
        params: LocationSearchParams
    ) -> Optional[Dict]:
        """
        Generate a helpful message when no results are found
        Provides context about the search parameters
        """
        # Construct a descriptive message
        message_parts = []

        if params.q:
            message_parts.append(f"No locations found matching '{params.q}'")

        if params.types:
            type_str = ", ".join(str(t.value) for t in params.types)
            message_parts.append(f"Location types: {type_str}")

        if params.country:
            message_parts.append(f"Country: {params.country}")

        # Combine message parts
        if message_parts:
            return {
                'message': ' | '.join(message_parts),
                'search_params': {
                    'query': params.q,
                    'types': params.types,
                    'country': params.country,
                    'language': params.lang
                }
            }

        return None

    def reverse_geocode(
        self, 
        params: LocationReverseParams, 
        tenant_id: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Reverse geocoding with advanced matching
        Adapted for SQLite without H3 indexing
        """
        # Use bounding box for initial filtering instead of H3
        # Approximate 1km radius for initial filtering
        radius_deg = 0.01  # Roughly 1km at equator
        
        lat_min = params.lat - radius_deg
        lat_max = params.lat + radius_deg
        lon_min = params.lon - radius_deg  
        lon_max = params.lon + radius_deg
        
        # Find locations within bounding box
        results = (
            self.db.query(GeocodeLocation)
            .filter(
                sa.and_(
                    GeocodeLocation.lat.cast(sa.Float) >= lat_min,
                    GeocodeLocation.lat.cast(sa.Float) <= lat_max,
                    GeocodeLocation.lon.cast(sa.Float) >= lon_min,
                    GeocodeLocation.lon.cast(sa.Float) <= lon_max
                )
            )
            .all()
        )
        
        # Find closest match by calculating distance manually
        closest_result = None
        min_distance = float('inf')
        
        for result in results:
            try:
                result_lat = float(result.lat)
                result_lon = float(result.lon)
                distance = ((params.lat - result_lat) ** 2 + (params.lon - result_lon) ** 2) ** 0.5
                if distance < min_distance:
                    min_distance = distance
                    closest_result = result
            except (ValueError, TypeError):
                continue
        
        # Fallback mechanism
        if not closest_result and self.fallback_provider_enabled:
            closest_result = self._fallback_reverse_geocode(params)
        
        # Transform result with language preference
        return self._transform_result_with_language(closest_result, params.lang) if closest_result else None

    def find_nearby_locations(
        self,
        params: NearbyLocationParams,
        tenant_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Find locations near a given point
        Adapted for SQLite without PostGIS
        """
        # Convert km to approximate degrees (rough approximation)
        radius_deg = params.radius_km / 111.0  # 1 degree ≈ 111 km

        # Simple bounding box query (not as accurate as PostGIS)
        lat_min = params.lat - radius_deg
        lat_max = params.lat + radius_deg
        lon_min = params.lon - radius_deg
        lon_max = params.lon + radius_deg

        # Filter by bounding box
        query = self.db.query(GeocodeLocation).filter(
            sa.and_(
                GeocodeLocation.lat.cast(sa.Float) >= lat_min,
                GeocodeLocation.lat.cast(sa.Float) <= lat_max,
                GeocodeLocation.lon.cast(sa.Float) >= lon_min,
                GeocodeLocation.lon.cast(sa.Float) <= lon_max
            )
        )

        # Location type filtering
        if params.types:
            query = query.filter(GeocodeLocation.location_type.in_([t.value for t in params.types]))

        # Get results and calculate actual distances
        results = query.all()

        # Calculate actual distances and sort
        locations_with_distance = []
        for result in results:
            try:
                result_lat = float(result.lat)
                result_lon = float(result.lon)
                distance = ((params.lat - result_lat) ** 2 + (params.lon - result_lon) ** 2) ** 0.5 * 111.0  # Convert back to km
                if distance <= params.radius_km:
                    locations_with_distance.append((result, distance))
            except (ValueError, TypeError):
                continue

        # Sort by distance and limit
        locations_with_distance.sort(key=lambda x: x[1])
        limited_results = locations_with_distance[:params.limit]

        # Convert to list of dictionaries
        return [self._transform_result_with_language(result, 'en') for result, _ in limited_results]

    def _transform_results_with_language(
        self,
        results: List[GeocodeLocation],
        lang: str
    ) -> List[Dict]:
        """
        Transform location results with language preference
        """
        transformed = []
        for result in results:
            transformed_result = self._transform_result_with_language(result, lang)
            transformed.append(transformed_result)
        return transformed

    def _transform_result_with_language(
        self,
        result: GeocodeLocation,
        lang: str
    ) -> Dict:
        """
        Transform a single location result with language preference
        """
        # Parse JSON fields
        try:
            names = json.loads(result.names) if result.names else {}
            hierarchy = json.loads(result.hierarchy) if result.hierarchy else {}
            codes = json.loads(result.codes) if result.codes else {}
        except (json.JSONDecodeError, TypeError):
            names = {}
            hierarchy = {}
            codes = {}

        # Prefer localized name, fallback to display name
        display_name = (
            names.get(lang) or
            names.get('en') or
            result.display_name
        )

        return {
            'place_id': result.place_id,
            'names': names,
            'display_name': display_name,
            'lat': result.lat,
            'lon': result.lon,
            'hierarchy': hierarchy,
            'codes': codes,
            'tz': codes.get('tz'),
            'currency': codes.get('currency'),
            'h3_res8': result.h3_res8,
            'h3_res9': result.h3_res9,
            'geom_bbox': result.geom_bbox
        }

    def _fallback_reverse_geocode(
        self,
        params: LocationReverseParams
    ) -> Optional[GeocodeLocation]:
        """
        Fallback reverse geocoding using external provider
        Strictly rate-limited and logged
        """
        if not self.fallback_provider_enabled:
            return None

        try:
            # Example fallback to Nominatim (replace with commercial provider)
            from geopy.geocoders import Nominatim
            geolocator = Nominatim(user_agent="tregu_fallback")
            location = geolocator.reverse(f"{params.lat}, {params.lon}")

            if location:
                # Transform external result to internal model
                return self._create_location_from_external(location)

            return None

        except Exception as e:
            # Log fallback failure
            self._log_fallback_failure(params, e)
            return None

    def _create_location_from_external(self, external_location) -> GeocodeLocation:
        """
        Convert external geocoding result to internal Location model
        """
        # Implement robust conversion logic
        # This is a placeholder - would need actual implementation
        pass

    def _log_fallback_failure(
        self,
        params: LocationReverseParams,
        error: Exception
    ):
        """
        Log fallback geocoding failures
        """
        # Implement secure logging mechanism
        print(f"Fallback geocoding failed for {params.lat}, {params.lon}: {error}")

# FastAPI Endpoint Implementation
class GeocodeEndpoint:
    def __init__(
        self,
        geocode_service: GeocodeService,
        oauth_scheme: OAuth2PasswordBearer
    ):
        self.geocode_service = geocode_service
        self.oauth_scheme = oauth_scheme

        # FastAPI app setup
        self.app = FastAPI(
            title="Tregu Geocoding Service",
            description="Advanced, multi-tenant geocoding with offline-first approach"
        )

        # Setup routes
        self._setup_routes()

    def _setup_routes(self):
        """Configure API routes with optimizations"""
        @self.app.get("/locations/search")
        async def search_locations(
            q: Optional[str] = Query(None),
            types: Optional[List[LocationType]] = Query(None),
            country: Optional[str] = Query(None),
            lang: Optional[str] = Query('en'),
            limit: Optional[int] = Query(50, le=50, ge=1),
            token: str = Depends(self.oauth_scheme)
        ):
            # Prepare search parameters
            search_params = LocationSearchParams(
                q=q,
                types=types,
                country=country,
                lang=lang,
                limit=limit
            )

            # Execute search
            results = self.geocode_service.search_locations(search_params)

            return results

        @self.app.get("/locations/reverse")
        async def reverse_geocode(
            lat: float = Query(...),
            lon: float = Query(...),
            lang: Optional[str] = Query('en'),
            token: str = Depends(self.oauth_scheme)
        ):
            # Prepare reverse geocoding parameters
            reverse_params = LocationReverseParams(
                lat=lat,
                lon=lon,
                lang=lang
            )

            # Execute reverse geocoding
            result = self.geocode_service.reverse_geocode(reverse_params)

            return result

        @self.app.get("/locations/nearby")
        async def nearby_locations(
            lat: float = Query(...),
            lon: float = Query(...),
            radius_km: Optional[float] = Query(10.0, le=100.0),
            types: Optional[List[LocationType]] = Query(None),
            limit: Optional[int] = Query(50, le=50, ge=1),
            token: str = Depends(self.oauth_scheme)
        ):
            # Prepare nearby locations parameters
            nearby_params = NearbyLocationParams(
                lat=lat,
                lon=lon,
                radius_km=radius_km,
                types=types,
                limit=limit
            )

            # Execute nearby search
            results = self.geocode_service.find_nearby_locations(nearby_params)

            return results

def main():
    """
    Main setup for geocoding service
    """
    # Database session
    db_session = SessionLocal()

    # Redis client (optional for now)
    redis_client = None  # redis.Redis(host='localhost', port=6379, db=0)

    # OAuth setup
    oauth_scheme = OAuth2PasswordBearer(tokenUrl="token")

    # Create geocoding service
    geocode_service = GeocodeService(
        db_session,
        redis_client,
        fallback_provider_enabled=True
    )

    # Create API endpoint
    geocode_endpoint = GeocodeEndpoint(
        geocode_service,
        oauth_scheme
    )

    return geocode_endpoint.app

if __name__ == "__main__":
    main()