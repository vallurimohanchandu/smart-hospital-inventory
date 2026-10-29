from fastapi import APIRouter
from app.services.report_service import ReportService
from app.services.stock_service import StockService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats():
    return ReportService.get_dashboard_stats()

@router.get("/recent-movements")
def get_recent_movements():
    movements, _ = StockService.get_movements(page=1, limit=6)
    return movements

@router.get("/alerts")
def get_dashboard_alerts():
    return ReportService.get_dashboard_alerts()
