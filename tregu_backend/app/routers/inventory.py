from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from ..db import SessionLocal
from ..models import (
    InventoryItem, InventoryLocation, InventoryCategory,
    InventoryTransaction, RFIDTag, User, Tenant
)
from ..auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["inventory"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for API
class InventoryLocationCreate(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    location_type: str = "warehouse"

class InventoryLocationResponse(BaseModel):
    id: uuid.UUID
    name: str
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[str]
    location_type: str
    is_active: bool
    created_at: datetime

class InventoryCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None

class InventoryCategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    parent_id: Optional[uuid.UUID]
    is_active: bool
    created_at: datetime

class InventoryItemCreate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    location_id: Optional[uuid.UUID] = None
    name: str
    description: Optional[str] = None
    sku: str
    barcode: Optional[str] = None
    unit_cost: Optional[int] = None  # in cents
    unit_price: Optional[int] = None  # in cents
    currency: str = "USD"
    current_stock: int = 0
    minimum_stock: int = 0
    maximum_stock: Optional[int] = None
    unit_of_measure: str = "each"

class InventoryItemUpdate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    location_id: Optional[uuid.UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    barcode: Optional[str] = None
    unit_cost: Optional[int] = None
    unit_price: Optional[int] = None
    currency: Optional[str] = None
    minimum_stock: Optional[int] = None
    maximum_stock: Optional[int] = None
    unit_of_measure: Optional[str] = None
    is_active: Optional[bool] = None

class InventoryItemResponse(BaseModel):
    id: uuid.UUID
    category_id: Optional[uuid.UUID]
    location_id: Optional[uuid.UUID]
    name: str
    description: Optional[str]
    sku: str
    barcode: Optional[str]
    unit_cost: Optional[int]
    unit_price: Optional[int]
    currency: str
    current_stock: int
    minimum_stock: int
    maximum_stock: Optional[int]
    unit_of_measure: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

class RFIDTagCreate(BaseModel):
    item_id: uuid.UUID
    tag_id: str
    tag_type: str = "passive"
    frequency: Optional[str] = None

class RFIDTagResponse(BaseModel):
    id: uuid.UUID
    item_id: uuid.UUID
    tag_id: str
    tag_type: str
    frequency: Optional[str]
    is_active: bool
    last_scanned: Optional[datetime]
    created_at: datetime

class InventoryTransactionCreate(BaseModel):
    item_id: uuid.UUID
    location_id: Optional[uuid.UUID] = None
    transaction_type: str  # 'stock_in', 'stock_out', 'adjustment', 'transfer', 'damage', 'return'
    quantity: int
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    rfid_tag_id: Optional[uuid.UUID] = None

class InventoryTransactionResponse(BaseModel):
    id: uuid.UUID
    item_id: uuid.UUID
    location_id: Optional[uuid.UUID]
    transaction_type: str
    quantity: int
    previous_stock: int
    new_stock: int
    reference_number: Optional[str]
    notes: Optional[str]
    performed_by: Optional[uuid.UUID]
    rfid_tag_id: Optional[uuid.UUID]
    created_at: datetime

# Inventory Locations Endpoints
@router.post("/locations", response_model=InventoryLocationResponse)
def create_inventory_location(
    location: InventoryLocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user has enterprise tier (this should be an enterprise-only feature)
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="Inventory management requires Enterprise tier")

    db_location = InventoryLocation(
        tenant_id=current_user.tenant_id,
        **location.dict()
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@router.get("/locations", response_model=List[InventoryLocationResponse])
def get_inventory_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(InventoryLocation).filter(InventoryLocation.tenant_id == current_user.tenant_id)
    if active_only:
        query = query.filter(InventoryLocation.is_active == True)
    return query.offset(skip).limit(limit).all()

# Inventory Categories Endpoints
@router.post("/categories", response_model=InventoryCategoryResponse)
def create_inventory_category(
    category: InventoryCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="Inventory management requires Enterprise tier")

    db_category = InventoryCategory(
        tenant_id=current_user.tenant_id,
        **category.dict()
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/categories", response_model=List[InventoryCategoryResponse])
def get_inventory_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(InventoryCategory).filter(InventoryCategory.tenant_id == current_user.tenant_id)
    if active_only:
        query = query.filter(InventoryCategory.is_active == True)
    return query.offset(skip).limit(limit).all()

@router.put("/categories/{category_id}", response_model=InventoryCategoryResponse)
def update_inventory_category(
    category_id: uuid.UUID,
    category: InventoryCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="Inventory management requires Enterprise tier")

    db_category = db.query(InventoryCategory).filter(
        and_(InventoryCategory.id == category_id, InventoryCategory.tenant_id == current_user.tenant_id)
    ).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    for key, value in category.dict().items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/categories/{category_id}")
def delete_inventory_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="Inventory management requires Enterprise tier")

    db_category = db.query(InventoryCategory).filter(
        and_(InventoryCategory.id == category_id, InventoryCategory.tenant_id == current_user.tenant_id)
    ).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if category is being used by any items
    items_using_category = db.query(InventoryItem).filter(
        and_(InventoryItem.category_id == category_id, InventoryItem.tenant_id == current_user.tenant_id)
    ).count()

    if items_using_category > 0:
        # Soft delete - just mark as inactive
        db_category.is_active = False
        db.commit()
        return {"message": "Category deactivated (has associated items)"}
    else:
        # Hard delete
        db.delete(db_category)
        db.commit()
        return {"message": "Category deleted"}

# Inventory Items Endpoints
@router.post("/items", response_model=InventoryItemResponse)
def create_inventory_item(
    item: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="Inventory management requires Enterprise tier")

    # Check if SKU already exists
    existing_item = db.query(InventoryItem).filter(
        and_(InventoryItem.tenant_id == current_user.tenant_id, InventoryItem.sku == item.sku)
    ).first()
    if existing_item:
        raise HTTPException(status_code=409, detail="SKU already exists")

    # Check if barcode already exists (if provided)
    if item.barcode:
        existing_barcode = db.query(InventoryItem).filter(
            and_(InventoryItem.tenant_id == current_user.tenant_id, InventoryItem.barcode == item.barcode)
        ).first()
        if existing_barcode:
            raise HTTPException(status_code=409, detail="Barcode already exists")

    db_item = InventoryItem(
        tenant_id=current_user.tenant_id,
        **item.dict()
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/items", response_model=List[InventoryItemResponse])
def get_inventory_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category_id: Optional[uuid.UUID] = None,
    location_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    low_stock_only: bool = Query(False),
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(InventoryItem).filter(InventoryItem.tenant_id == current_user.tenant_id)

    if active_only:
        query = query.filter(InventoryItem.is_active == True)
    if category_id:
        query = query.filter(InventoryItem.category_id == category_id)
    if location_id:
        query = query.filter(InventoryItem.location_id == location_id)
    if search:
        query = query.filter(
            or_(InventoryItem.name.ilike(f"%{search}%"),
                InventoryItem.sku.ilike(f"%{search}%"),
                InventoryItem.description.ilike(f"%{search}%"))
        )
    if low_stock_only:
        query = query.filter(InventoryItem.current_stock <= InventoryItem.minimum_stock)

    return query.offset(skip).limit(limit).all()

@router.get("/items/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(InventoryItem).filter(
        and_(InventoryItem.id == item_id, InventoryItem.tenant_id == current_user.tenant_id)
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item

@router.put("/items/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: uuid.UUID,
    item_update: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="Inventory management requires Enterprise tier")

    item = db.query(InventoryItem).filter(
        and_(InventoryItem.id == item_id, InventoryItem.tenant_id == current_user.tenant_id)
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Check barcode uniqueness if updating
    if item_update.barcode and item_update.barcode != item.barcode:
        existing_barcode = db.query(InventoryItem).filter(
            and_(InventoryItem.tenant_id == current_user.tenant_id,
                 InventoryItem.barcode == item_update.barcode,
                 InventoryItem.id != item_id)
        ).first()
        if existing_barcode:
            raise HTTPException(status_code=409, detail="Barcode already exists")

    update_data = item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item

# RFID Tag Endpoints
@router.post("/rfid-tags", response_model=RFIDTagResponse)
def create_rfid_tag(
    tag: RFIDTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="RFID management requires Enterprise tier")

    # Check if tag_id already exists
    existing_tag = db.query(RFIDTag).filter(
        and_(RFIDTag.tenant_id == current_user.tenant_id, RFIDTag.tag_id == tag.tag_id)
    ).first()
    if existing_tag:
        raise HTTPException(status_code=409, detail="RFID tag ID already exists")

    # Verify item belongs to tenant
    item = db.query(InventoryItem).filter(
        and_(InventoryItem.id == tag.item_id, InventoryItem.tenant_id == current_user.tenant_id)
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    db_tag = RFIDTag(
        tenant_id=current_user.tenant_id,
        **tag.dict()
    )
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

@router.post("/rfid-scan")
def scan_rfid_tag(
    tag_id: str = Query(..., description="RFID tag identifier"),
    location_id: Optional[uuid.UUID] = Query(None, description="Location where scan occurred"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="RFID scanning requires Enterprise tier")

    # Find the RFID tag
    tag = db.query(RFIDTag).join(InventoryItem).filter(
        and_(RFIDTag.tag_id == tag_id, InventoryItem.tenant_id == current_user.tenant_id)
    ).first()
    if not tag:
        raise HTTPException(status_code=404, detail="RFID tag not found")

    # Update last scanned time
    tag.last_scanned = datetime.utcnow()
    db.commit()

    return {
        "tag_id": tag.tag_id,
        "item_id": tag.item_id,
        "item_name": tag.item.name,
        "current_stock": tag.item.current_stock,
        "location_id": location_id,
        "scanned_at": tag.last_scanned
    }

# Inventory Transactions Endpoints
@router.post("/transactions", response_model=InventoryTransactionResponse)
def create_inventory_transaction(
    transaction: InventoryTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="Inventory transactions require Enterprise tier")

    # Get the inventory item
    item = db.query(InventoryItem).filter(
        and_(InventoryItem.id == transaction.item_id, InventoryItem.tenant_id == current_user.tenant_id)
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Calculate new stock level
    previous_stock = item.current_stock
    if transaction.transaction_type in ['stock_in', 'return']:
        new_stock = previous_stock + transaction.quantity
    elif transaction.transaction_type in ['stock_out', 'damage']:
        new_stock = previous_stock - transaction.quantity
        if new_stock < 0:
            raise HTTPException(status_code=400, detail="Insufficient stock")
    elif transaction.transaction_type == 'adjustment':
        new_stock = transaction.quantity  # Direct adjustment to specific quantity
    elif transaction.transaction_type == 'transfer':
        # For transfers, we might need additional logic
        new_stock = previous_stock - transaction.quantity
        if new_stock < 0:
            raise HTTPException(status_code=400, detail="Insufficient stock for transfer")
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    # Update item stock
    item.current_stock = new_stock

    # Create transaction record
    db_transaction = InventoryTransaction(
        tenant_id=current_user.tenant_id,
        item_id=transaction.item_id,
        location_id=transaction.location_id,
        transaction_type=transaction.transaction_type,
        quantity=transaction.quantity,
        previous_stock=previous_stock,
        new_stock=new_stock,
        reference_number=transaction.reference_number,
        notes=transaction.notes,
        performed_by=current_user.id,
        rfid_tag_id=transaction.rfid_tag_id
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.get("/transactions", response_model=List[InventoryTransactionResponse])
def get_inventory_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    item_id: Optional[uuid.UUID] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(InventoryTransaction).join(InventoryItem).filter(
        InventoryItem.tenant_id == current_user.tenant_id
    )

    if item_id:
        query = query.filter(InventoryTransaction.item_id == item_id)
    if transaction_type:
        query = query.filter(InventoryTransaction.transaction_type == transaction_type)
    if start_date:
        query = query.filter(InventoryTransaction.created_at >= start_date)
    if end_date:
        query = query.filter(InventoryTransaction.created_at <= end_date)

    return query.order_by(InventoryTransaction.created_at.desc()).offset(skip).limit(limit).all()

# Dashboard/Reports Endpoints
@router.get("/dashboard/low-stock")
def get_low_stock_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="Inventory reports require Enterprise tier")

    items = db.query(InventoryItem).filter(
        and_(InventoryItem.tenant_id == current_user.tenant_id,
             InventoryItem.is_active == True,
             InventoryItem.current_stock <= InventoryItem.minimum_stock)
    ).all()

    return [{"id": item.id, "name": item.name, "sku": item.sku,
             "current_stock": item.current_stock, "minimum_stock": item.minimum_stock}
            for item in items]

@router.get("/dashboard/stock-summary")
def get_stock_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not hasattr(current_user, 'tier') or current_user.tier != 'enterprise':
        raise HTTPException(status_code=403, detail="Inventory reports require Enterprise tier")

    result = db.query(
        func.count(InventoryItem.id).label('total_items'),
        func.sum(InventoryItem.current_stock).label('total_stock'),
        func.sum(InventoryItem.current_stock * InventoryItem.unit_cost / 100.0).label('total_value')
    ).filter(
        and_(InventoryItem.tenant_id == current_user.tenant_id,
             InventoryItem.is_active == True)
    ).first()

    return {
        "total_items": result.total_items or 0,
        "total_stock": result.total_stock or 0,
        "total_value": result.total_value or 0.0
    }