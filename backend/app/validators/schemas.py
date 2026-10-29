from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator
import re
from datetime import datetime

class InventoryBase(BaseModel):
    item_id: int = Field(..., gt=0, description="Positive integer unique identifier")
    item_name: str = Field(..., min_length=2, max_length=150, description="Item name (min 2 chars)")
    category: Literal["Medicine", "Equipment", "Supplies"] = Field(..., description="Category must be Medicine, Equipment, or Supplies")
    quantity: int = Field(..., ge=0, description="Current stock quantity (non-negative)")
    minimum_stock: int = Field(..., ge=0, description="Minimum stock threshold (non-negative)")
    unit_price: float = Field(..., ge=0.0, description="Unit price in INR (non-negative)")
    location: str = Field(..., min_length=1, max_length=100, description="Physical storage department or shelf")
    supplier_id: Optional[int] = Field(None, gt=0, description="Associated supplier ID")
    supplier_name: Optional[str] = Field(None, description="Associated supplier name")
    expiry_date: Optional[str] = Field(None, description="ISO format expiry date (YYYY-MM-DD) or None")
    description: Optional[str] = Field(None, max_length=500, description="Optional item description")

    @field_validator("expiry_date")
    @classmethod
    def validate_expiry_date(cls, v):
        if v is not None and v != "":
            try:
                # Accept YYYY-MM-DD
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError("expiry_date must be in YYYY-MM-DD format")
            return v
        return None

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    item_name: Optional[str] = Field(None, min_length=2, max_length=150)
    category: Optional[Literal["Medicine", "Equipment", "Supplies"]] = None
    quantity: Optional[int] = Field(None, ge=0)
    minimum_stock: Optional[int] = Field(None, ge=0)
    unit_price: Optional[float] = Field(None, ge=0.0)
    location: Optional[str] = Field(None, min_length=1, max_length=100)
    supplier_id: Optional[int] = Field(None, gt=0)
    supplier_name: Optional[str] = None
    expiry_date: Optional[str] = None
    description: Optional[str] = None

    @field_validator("expiry_date")
    @classmethod
    def validate_expiry_date(cls, v):
        if v is not None and v != "":
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError("expiry_date must be in YYYY-MM-DD format")
            return v
        return None

class InventoryResponse(InventoryBase):
    id: Optional[str] = None
    created_at: str
    updated_at: str
    stock_status: Optional[str] = None
    expiry_status: Optional[str] = None

class SupplierBase(BaseModel):
    supplier_id: int = Field(..., gt=0, description="Positive integer unique identifier")
    company_name: str = Field(..., min_length=2, max_length=150)
    contact_person: str = Field(..., min_length=2, max_length=100)
    email: str = Field(...)
    phone: str = Field(..., min_length=7, max_length=20)
    address: str = Field(..., min_length=3, max_length=250)
    status: Literal["Active", "Inactive"] = "Active"

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v):
        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        if not re.match(pattern, v):
            raise ValueError("Invalid email address format")
        return v

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=150)
    contact_person: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    address: Optional[str] = Field(None, min_length=3, max_length=250)
    status: Optional[Literal["Active", "Inactive"]] = None

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v):
        if v is not None:
            pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
            if not re.match(pattern, v):
                raise ValueError("Invalid email address format")
        return v

class SupplierResponse(SupplierBase):
    id: Optional[str] = None
    item_count: int = 0
    total_valuation: float = 0.0
    created_at: str
    updated_at: str

class StockMovementCreate(BaseModel):
    item_id: int = Field(..., gt=0, description="Item identifier")
    movement_type: Literal["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"] = Field(..., description="Type of movement")
    quantity: int = Field(..., gt=0, description="Quantity moved (must be > 0)")
    reason: str = Field(..., min_length=3, max_length=250, description="Audit reason for movement")
    performed_by: str = Field(..., min_length=2, max_length=100, description="Operator or staff name")
    target_quantity: Optional[int] = Field(None, ge=0, description="For ADJUSTMENT only: optional target new stock level")

class StockMovementResponse(BaseModel):
    id: Optional[str] = None
    movement_id: int
    item_id: int
    item_name: str
    movement_type: Literal["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]
    quantity: int
    previous_quantity: int
    new_quantity: int
    reason: str
    performed_by: str
    timestamp: str
