from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from typing import Optional, Any, Dict
from bson import ObjectId
from app.config import settings
import logging

logger = logging.getLogger("uvicorn.error")

class MongoDBManager:
    client: Optional[MongoClient] = None
    db: Optional[Database] = None

db_manager = MongoDBManager()

def connect_to_mongo():
    try:
        db_manager.client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connect=True
        )
        # Test connection
        db_manager.client.admin.command('ping')
        db_manager.db = db_manager.client[settings.DATABASE_NAME]
        logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME} at {settings.MONGODB_URI}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e

def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")

def get_database() -> Database:
    if db_manager.db is None:
        connect_to_mongo()
    return db_manager.db

def get_inventory_col() -> Collection:
    return get_database()["inventory"]

def get_suppliers_col() -> Collection:
    return get_database()["suppliers"]

def get_movements_col() -> Collection:
    return get_database()["stock_movements"]

def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Convert MongoDB document to JSON-safe dictionary, converting ObjectId to string."""
    if doc is None:
        return None
    res = {}
    for k, v in doc.items():
        if k == "_id":
            res["id"] = str(v)
        elif isinstance(v, ObjectId):
            res[k] = str(v)
        else:
            res[k] = v
    return res

def serialize_docs(docs) -> list:
    return [serialize_doc(d) for d in docs]
