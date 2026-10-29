from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any, Tuple
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException, status
from app.database import get_inventory_col, get_suppliers_col, serialize_doc, serialize_docs
from app.validators.schemas import InventoryCreate, InventoryUpdate

def compute_statuses(doc: Dict[str, Any]) -> Dict[str, Any]:
    qty = doc.get("quantity", 0)
    min_stock = doc.get("minimum_stock", 0)
    category = doc.get("category", "")
    exp_str = doc.get("expiry_date")

    # Stock Status
    if qty == 0:
        stock_status = "Out of Stock"
    elif qty <= min_stock:
        stock_status = "Low Stock"
    else:
        stock_status = "In Stock"

    # Expiry Status
    today = date.today()
    if not exp_str or category == "Equipment":
        expiry_status = "Non-Expiring"
    else:
        try:
            exp_date = datetime.strptime(exp_str, "%Y-%m-%d").date()
            days_left = (exp_date - today).days
            if days_left < 0:
                expiry_status = "Expired"
            elif days_left <= 7:
                expiry_status = "Expiring in 7 Days"
            elif days_left <= 30:
                expiry_status = "Expiring in 30 Days"
            elif days_left <= 90:
                expiry_status = "Expiring in 90 Days"
            else:
                expiry_status = "Valid"
        except Exception:
            expiry_status = "Unknown"

    doc["stock_status"] = stock_status
    doc["expiry_status"] = expiry_status
    return doc

class InventoryService:
    @staticmethod
    def get_items(
        search: Optional[str] = None,
        category: Optional[str] = None,
        stock_status: Optional[str] = None,
        expiry_status: Optional[str] = None,
        supplier_id: Optional[int] = None,
        sort_by: str = "item_id",
        sort_order: str = "asc",
        page: int = 1,
        limit: int = 10
    ) -> Tuple[List[Dict[str, Any]], int]:
        col = get_inventory_col()
        query: Dict[str, Any] = {}

        if search:
            search_regex = {"$regex": search.strip(), "$options": "i"}
            if search.strip().isdigit():
                query["$or"] = [
                    {"item_name": search_regex},
                    {"item_id": int(search.strip())},
                    {"location": search_regex}
                ]
            else:
                query["$or"] = [
                    {"item_name": search_regex},
                    {"location": search_regex},
                    {"description": search_regex}
                ]

        if category and category != "All":
            query["category"] = category

        if supplier_id:
            query["supplier_id"] = supplier_id

        # Pre-filter query for stock_status if possible
        if stock_status == "Out of Stock":
            query["quantity"] = 0
        elif stock_status == "Low Stock":
            # quantity <= minimum_stock and quantity > 0
            query["$expr"] = {"$and": [{"$lte": ["$quantity", "$minimum_stock"]}, {"$gt": ["$quantity", 0]}]}
        elif stock_status == "In Stock":
            query["$expr"] = {"$gt": ["$quantity", "$minimum_stock"]}

        # Expiry status filter at query level
        today_iso = date.today().isoformat()
        if expiry_status == "Expired":
            query["expiry_date"] = {"$ne": None, "$lt": today_iso}
            query["category"] = {"$ne": "Equipment"}
        elif expiry_status == "Expiring in 7 Days":
            next_7 = (date.today() + timedelta(days=7)).isoformat()
            query["expiry_date"] = {"$gte": today_iso, "$lte": next_7}
        elif expiry_status == "Expiring in 30 Days":
            next_30 = (date.today() + timedelta(days=30)).isoformat()
            query["expiry_date"] = {"$gte": today_iso, "$lte": next_30}
        elif expiry_status == "Expiring in 90 Days":
            next_90 = (date.today() + timedelta(days=90)).isoformat()
            query["expiry_date"] = {"$gte": today_iso, "$lte": next_90}
        elif expiry_status == "Non-Expiring":
            query["$or"] = [{"expiry_date": None}, {"expiry_date": ""}, {"category": "Equipment"}]

        # Sort order
        direction = ASCENDING if sort_order.lower() == "asc" else DESCENDING
        sort_field = sort_by if sort_by in ["item_id", "item_name", "quantity", "unit_price", "expiry_date", "created_at"] else "item_id"

        total = col.count_documents(query)
        skip = (page - 1) * limit

        cursor = col.find(query).sort(sort_field, direction).skip(skip).limit(limit)
        items = [compute_statuses(serialize_doc(doc)) for doc in cursor]

        return items, total

    @staticmethod
    def get_item_by_id(item_id: int) -> Dict[str, Any]:
        col = get_inventory_col()
        doc = col.find_one({"item_id": item_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory item with ID {item_id} not found."
            )
        return compute_statuses(serialize_doc(doc))

    @staticmethod
    def create_item(payload: InventoryCreate) -> Dict[str, Any]:
        col = get_inventory_col()
        supp_col = get_suppliers_col()

        # Check existing item_id
        if col.find_one({"item_id": payload.item_id}):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Item ID {payload.item_id} already exists in inventory."
            )

        data = payload.model_dump()
        # Lookup supplier name if supplier_id given but name missing
        if data.get("supplier_id") and not data.get("supplier_name"):
            supp = supp_col.find_one({"supplier_id": data["supplier_id"]})
            if supp:
                data["supplier_name"] = supp.get("company_name")

        now_iso = datetime.utcnow().isoformat()
        data["created_at"] = now_iso
        data["updated_at"] = now_iso

        try:
            res = col.insert_one(data)
            data["_id"] = res.inserted_id
            return compute_statuses(serialize_doc(data))
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Item ID {payload.item_id} already exists."
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create inventory item: {str(e)}"
            )

    @staticmethod
    def update_item(item_id: int, payload: InventoryUpdate) -> Dict[str, Any]:
        col = get_inventory_col()
        existing = col.find_one({"item_id": item_id})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory item with ID {item_id} not found."
            )

        updates = {k: v for k, v in payload.model_dump().items() if v is not None}
        if not updates:
            return compute_statuses(serialize_doc(existing))

        if updates.get("supplier_id") and not updates.get("supplier_name"):
            supp = get_suppliers_col().find_one({"supplier_id": updates["supplier_id"]})
            if supp:
                updates["supplier_name"] = supp.get("company_name")

        updates["updated_at"] = datetime.utcnow().isoformat()

        try:
            col.update_one({"item_id": item_id}, {"$set": updates})
            updated = col.find_one({"item_id": item_id})
            return compute_statuses(serialize_doc(updated))
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update inventory item: {str(e)}"
            )

    @staticmethod
    def delete_item(item_id: int) -> Dict[str, Any]:
        col = get_inventory_col()
        existing = col.find_one({"item_id": item_id})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory item with ID {item_id} not found."
            )

        col.delete_one({"item_id": item_id})
        return {"success": True, "message": f"Item {item_id} ({existing.get('item_name')}) deleted successfully."}
