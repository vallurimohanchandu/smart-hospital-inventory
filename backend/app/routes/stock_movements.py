from fastapi import APIRouter, Query, status
from typing import Optional
from app.validators.schemas import StockMovementCreate
from app.services.stock_service import StockService

router = APIRouter(prefix="/api/stock-movements", tags=["Stock Movements"])

@router.get("")
def list_stock_movements(
    item_id: Optional[int] = Query(None, description="Filter by item ID"),
    movement_type: Optional[str] = Query(None, description="Filter by STOCK_IN, STOCK_OUT, ADJUSTMENT"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    movements, total = StockService.get_movements(
        item_id=item_id,
        movement_type=movement_type,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit
    )
    return {
        "movements": movements,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def record_stock_movement(payload: StockMovementCreate):
    return StockService.record_movement(payload)
