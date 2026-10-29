from fastapi import APIRouter, Query, status
from typing import Optional
from app.validators.schemas import SupplierCreate, SupplierUpdate
from app.services.supplier_service import SupplierService

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.get("")
def list_suppliers(
    search: Optional[str] = Query(None, description="Search company name, contact, email, or address"),
    status: Optional[str] = Query(None, description="Filter by status: Active, Inactive"),
    sort_by: str = Query("supplier_id", description="Field to sort by"),
    sort_order: str = Query("asc", description="asc or desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    suppliers, total = SupplierService.get_suppliers(
        search=search,
        status_filter=status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )
    return {
        "suppliers": suppliers,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1
    }

@router.get("/{supplier_id}")
def get_supplier_details(supplier_id: int):
    return SupplierService.get_supplier_by_id(supplier_id)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_supplier(payload: SupplierCreate):
    return SupplierService.create_supplier(payload)

@router.put("/{supplier_id}")
def update_supplier(supplier_id: int, payload: SupplierUpdate):
    return SupplierService.update_supplier(supplier_id, payload)

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int):
    return SupplierService.delete_supplier(supplier_id)
