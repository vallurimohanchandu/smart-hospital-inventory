from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, db_manager
from app.routes import inventory, suppliers, stock_movements, reports, dashboard

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smart_hospital")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Smart Hospital Inventory System...")
    try:
        connect_to_mongo()
        logger.info("Database connection verified.")
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB on startup: {e}")
    yield
    # Shutdown
    close_mongo_connection()
    logger.info("Database connection closed gracefully.")

app = FastAPI(
    title="Smart Hospital Inventory Management System API",
    description="Backend API for CSE494 Intelligent NoSQL Databases Individual Project",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to sanitize unexpected internal errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing the request. Details have been logged safely."
        }
    )

# Include Routers
app.include_router(dashboard.router)
app.include_router(inventory.router)
app.include_router(suppliers.router)
app.include_router(stock_movements.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {
        "project": "Smart Hospital Inventory Management System",
        "course": "CSE494 — Intelligent NoSQL Databases",
        "database": settings.DATABASE_NAME,
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "status": "operational"
    }

@app.get("/api/health")
def health_check():
    db_connected = False
    try:
        if db_manager.client:
            db_manager.client.admin.command('ping')
            db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "database_connected": db_connected,
        "database_name": settings.DATABASE_NAME
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.BACKEND_HOST, port=settings.BACKEND_PORT, reload=True)
