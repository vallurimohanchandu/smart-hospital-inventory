from fastapi import APIRouter, Query, status
from typing import Optional
from app.validators.schemas import InventoryCreate, InventoryUpdate
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("")
def list_inventory(
    search: Optional[str] = Query(None, description="Search by item name, ID, or location"),
    category: Optional[str] = Query(None, description="Filter by Medicine, Equipment, Supplies"),
    stock_status: Optional[str] = Query(None, description="Filter by Out of Stock, Low Stock, In Stock"),
    expiry_status: Optional[str] = Query(None, description="Filter by Expired, Expiring in 7 Days, etc."),
    supplier_id: Optional[int] = Query(None, description="Filter by supplier ID"),
    sort_by: str = Query("item_id", description="Field to sort by"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page")
):
    items, total = InventoryService.get_items(
        search=search,
        category=category,
        stock_status=stock_status,
        expiry_status=expiry_status,
        supplier_id=supplier_id,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1
    }

@router.get("/{item_id}")
def get_inventory_item(item_id: int):
    return InventoryService.get_item_by_id(item_id)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_inventory_item(payload: InventoryCreate):
    return InventoryService.create_item(payload)

@router.put("/{item_id}")
def update_inventory_item(item_id: int, payload: InventoryUpdate):
    return InventoryService.update_item(item_id, payload)

@router.delete("/{item_id}")
def delete_inventory_item(item_id: int):
    return InventoryService.delete_item(item_id)
