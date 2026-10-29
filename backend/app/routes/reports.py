from fastapi import APIRouter
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/category-summary")
def get_category_summary():
    return ReportService.get_category_summary()

@router.get("/inventory-value")
def get_inventory_value():
    return ReportService.get_inventory_valuation()

@router.get("/low-stock")
def get_low_stock():
    return ReportService.get_low_stock_report()

@router.get("/expired")
def get_expired():
    return ReportService.get_expired_report()

@router.get("/supplier-summary")
def get_supplier_summary():
    return ReportService.get_supplier_summary()

@router.get("/top-expensive")
def get_top_expensive():
    return ReportService.get_top_expensive()

@router.get("/movement-summary")
def get_movement_summary():
    return ReportService.get_movement_summary()

@router.get("/monthly-trends")
def get_monthly_trends():
    return ReportService.get_monthly_trends()
