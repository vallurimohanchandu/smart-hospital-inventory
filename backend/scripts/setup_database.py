"""
Database setup script for Smart Hospital Inventory Management System.
Configures MongoDB JSON Schema Validators and Indexes.
Course: CSE494 Intelligent NoSQL Databases
"""

import sys
import os
from pymongo import MongoClient, ASCENDING
from pymongo.errors import CollectionInvalid, OperationFailure

# Allow running as script directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings

INVENTORY_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["item_id", "item_name", "category", "quantity", "minimum_stock", "unit_price", "location"],
        "properties": {
            "item_id": {
                "bsonType": ["int", "long"],
                "minimum": 1,
                "description": "Unique positive integer identifier for the item"
            },
            "item_name": {
                "bsonType": "string",
                "minLength": 2,
                "description": "Item name, minimum 2 characters"
            },
            "category": {
                "enum": ["Medicine", "Equipment", "Supplies"],
                "description": "Must be Medicine, Equipment, or Supplies"
            },
            "quantity": {
                "bsonType": ["int", "long"],
                "minimum": 0,
                "description": "Current quantity in stock, non-negative integer"
            },
            "minimum_stock": {
                "bsonType": ["int", "long"],
                "minimum": 0,
                "description": "Minimum threshold before low-stock warning"
            },
            "unit_price": {
                "bsonType": ["double", "int", "long", "decimal"],
                "minimum": 0,
                "description": "Unit price in INR (non-negative numeric)"
            },
            "supplier_id": {
                "bsonType": ["int", "long", "null"],
                "description": "Optional supplier identifier"
            },
            "supplier_name": {
                "bsonType": ["string", "null"],
                "description": "Supplier display name"
            },
            "expiry_date": {
                "bsonType": ["string", "date", "null"],
                "description": "Optional ISO expiry date string or null for non-expiring equipment"
            },
            "location": {
                "bsonType": "string",
                "minLength": 1,
                "description": "Physical storage location/department"
            },
            "description": {
                "bsonType": ["string", "null"],
                "description": "Optional item description"
            },
            "created_at": {
                "bsonType": ["string", "date"],
                "description": "Creation timestamp"
            },
            "updated_at": {
                "bsonType": ["string", "date"],
                "description": "Last update timestamp"
            }
        }
    }
}

SUPPLIERS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["supplier_id", "company_name", "contact_person", "email", "phone", "address"],
        "properties": {
            "supplier_id": {
                "bsonType": ["int", "long"],
                "minimum": 1,
                "description": "Unique positive integer identifier for supplier"
            },
            "company_name": {
                "bsonType": "string",
                "minLength": 2,
                "description": "Company name of supplier"
            },
            "contact_person": {
                "bsonType": "string",
                "description": "Name of contact representative"
            },
            "email": {
                "bsonType": "string",
                "pattern": "^.+@.+$",
                "description": "Valid email address format"
            },
            "phone": {
                "bsonType": "string",
                "description": "Contact phone number"
            },
            "address": {
                "bsonType": "string",
                "description": "Postal address"
            },
            "status": {
                "enum": ["Active", "Inactive"],
                "description": "Supplier operational status"
            },
            "created_at": {
                "bsonType": ["string", "date"]
            },
            "updated_at": {
                "bsonType": ["string", "date"]
            }
        }
    }
}

MOVEMENTS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "movement_id", "item_id", "item_name", "movement_type", 
            "quantity", "previous_quantity", "new_quantity", "reason", "performed_by", "timestamp"
        ],
        "properties": {
            "movement_id": {
                "bsonType": ["int", "long"],
                "minimum": 1,
                "description": "Unique positive integer identifier for movement"
            },
            "item_id": {
                "bsonType": ["int", "long"],
                "minimum": 1,
                "description": "Referenced item identifier"
            },
            "item_name": {
                "bsonType": "string",
                "description": "Snapshot of item name at time of movement"
            },
            "movement_type": {
                "enum": ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"],
                "description": "Type of stock transaction"
            },
            "quantity": {
                "bsonType": ["int", "long"],
                "minimum": 1,
                "description": "Quantity moved, must be positive integer"
            },
            "previous_quantity": {
                "bsonType": ["int", "long"],
                "minimum": 0,
                "description": "Item stock before transaction"
            },
            "new_quantity": {
                "bsonType": ["int", "long"],
                "minimum": 0,
                "description": "Item stock after transaction"
            },
            "reason": {
                "bsonType": "string",
                "description": "Audit reason for movement"
            },
            "performed_by": {
                "bsonType": "string",
                "description": "Staff name or ID who executed movement"
            },
            "timestamp": {
                "bsonType": ["string", "date"],
                "description": "Timestamp when movement occurred"
            }
        }
    }
}

def setup_database():
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.DATABASE_NAME]

    collections_config = {
        "inventory": INVENTORY_SCHEMA,
        "suppliers": SUPPLIERS_SCHEMA,
        "stock_movements": MOVEMENTS_SCHEMA
    }

    existing_collections = db.list_collection_names()
    print(f"Existing collections in '{settings.DATABASE_NAME}': {existing_collections}")

    for coll_name, validator in collections_config.items():
        if coll_name not in existing_collections:
            print(f"Creating collection '{coll_name}' with JSON Schema validator...")
            db.create_collection(coll_name, validator=validator)
        else:
            print(f"Updating JSON Schema validator for collection '{coll_name}'...")
            try:
                db.command({
                    "collMod": coll_name,
                    "validator": validator,
                    "validationLevel": "moderate"
                })
            except OperationFailure as e:
                print(f"Warning updating validator for {coll_name}: {e}")

    # Create Indexes
    print("Applying indexes...")
    # 1. inventory indexes
    inv_col = db["inventory"]
    inv_col.create_index([("item_id", ASCENDING)], unique=True, name="idx_unique_item_id")
    inv_col.create_index([("category", ASCENDING)], name="idx_category")
    inv_col.create_index([("quantity", ASCENDING)], name="idx_quantity")
    inv_col.create_index([("expiry_date", ASCENDING)], name="idx_expiry_date")
    inv_col.create_index([("supplier_id", ASCENDING)], name="idx_supplier_id")
    print(" - Created indexes for 'inventory': item_id (unique), category, quantity, expiry_date, supplier_id")

    # 2. suppliers indexes
    supp_col = db["suppliers"]
    supp_col.create_index([("supplier_id", ASCENDING)], unique=True, name="idx_unique_supplier_id")
    print(" - Created indexes for 'suppliers': supplier_id (unique)")

    # 3. stock_movements indexes
    mov_col = db["stock_movements"]
    mov_col.create_index([("movement_id", ASCENDING)], unique=True, name="idx_unique_movement_id")
    mov_col.create_index([("item_id", ASCENDING)], name="idx_mov_item_id")
    mov_col.create_index([("timestamp", ASCENDING)], name="idx_mov_timestamp")
    print(" - Created indexes for 'stock_movements': movement_id (unique), item_id, timestamp")

    print("\nDatabase initialization complete! SmartHospitalDB is ready.")
    client.close()

if __name__ == "__main__":
    setup_database()
