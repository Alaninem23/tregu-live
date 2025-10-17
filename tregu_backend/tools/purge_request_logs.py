#!/usr/bin/env python3
"""
Data purging script for request logs to comply with privacy requirements.

- Raw IP addresses are purged after 30 days
- Derived geolocation data (country, region, city, postal_code) is purged after 12 months
- Request logs are kept for analytics but with anonymized location data
"""

import os
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import sessionmaker
from sqlalchemy import update, and_

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db import engine
from app.models import RequestLog

def purge_old_ip_addresses():
    """Purge raw IP addresses older than 30 days"""
    cutoff_date = datetime.utcnow() - timedelta(days=30)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Update records to remove IP addresses
        result = db.execute(
            update(RequestLog)
            .where(
                and_(
                    RequestLog.created_at < cutoff_date,
                    RequestLog.ip_address.isnot(None)
                )
            )
            .values(ip_address=None, ip_hash=None)
        )

        db.commit()
        print(f"Purged IP addresses from {result.rowcount} records older than 30 days")

    except Exception as e:
        print(f"Error purging IP addresses: {e}")
        db.rollback()
    finally:
        db.close()

def purge_old_geolocation_data():
    """Purge derived geolocation data older than 12 months"""
    cutoff_date = datetime.utcnow() - timedelta(days=365)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Update records to remove geolocation data
        result = db.execute(
            update(RequestLog)
            .where(RequestLog.created_at < cutoff_date)
            .values(
                country=None,
                region=None,
                city=None,
                postal_code=None,
                latitude=None,
                longitude=None,
                timezone=None,
                is_vpn_or_proxy=None
            )
        )

        db.commit()
        print(f"Purged geolocation data from {result.rowcount} records older than 12 months")

    except Exception as e:
        print(f"Error purging geolocation data: {e}")
        db.rollback()
    finally:
        db.close()

def purge_very_old_logs():
    """Purge request logs older than 2 years (keeping only recent analytics)"""
    cutoff_date = datetime.utcnow() - timedelta(days=730)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Delete very old logs completely
        result = db.query(RequestLog).filter(RequestLog.created_at < cutoff_date).delete()
        db.commit()
        print(f"Deleted {result} request logs older than 2 years")

    except Exception as e:
        print(f"Error purging old logs: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting data purging process...")

    print("1. Purging IP addresses older than 30 days...")
    purge_old_ip_addresses()

    print("2. Purging geolocation data older than 12 months...")
    purge_old_geolocation_data()

    print("3. Purging logs older than 2 years...")
    purge_very_old_logs()

    print("Data purging completed.")