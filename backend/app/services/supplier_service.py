from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException, status
from app.database import get_suppliers_col, get_inventory_col, serialize_doc, serialize_docs
from app.validators.schemas import SupplierCreate, SupplierUpdate

class SupplierService:
    @staticmethod
    def get_suppliers(
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        sort_by: str = "supplier_id",
        sort_order: str = "asc",
        page: int = 1,
        limit: int = 10
    ) -> Tuple[List[Dict[str, Any]], int]:
        supp_col = get_suppliers_col()
        inv_col = get_inventory_col()
        query: Dict[str, Any] = {}

        if search:
            regex = {"$regex": search.strip(), "$options": "i"}
            query["$or"] = [
                {"company_name": regex},
                {"contact_person": regex},
                {"email": regex},
                {"address": regex}
            ]

        if status_filter and status_filter != "All":
            query["status"] = status_filter

        direction = ASCENDING if sort_order.lower() == "asc" else DESCENDING
        total = supp_col.count_documents(query)
        skip = (page - 1) * limit

        cursor = supp_col.find(query).sort(sort_by, direction).skip(skip).limit(limit)
        suppliers = serialize_docs(cursor)

        # Enrich with inventory counts and total valuation
        for s in suppliers:
            s_id = s.get("supplier_id")
            items = list(inv_col.find({"supplier_id": s_id}))
            s["item_count"] = len(items)
            s["total_valuation"] = round(sum(i.get("quantity", 0) * i.get("unit_price", 0.0) for i in items), 2)

        return suppliers, total

    @staticmethod
    def get_supplier_by_id(supplier_id: int) -> Dict[str, Any]:
        supp_col = get_suppliers_col()
        inv_col = get_inventory_col()

        doc = supp_col.find_one({"supplier_id": supplier_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier with ID {supplier_id} not found."
            )
        data = serialize_doc(doc)

        # Attached inventory items
        items = list(inv_col.find({"supplier_id": supplier_id}))
        data["item_count"] = len(items)
        data["total_valuation"] = round(sum(i.get("quantity", 0) * i.get("unit_price", 0.0) for i in items), 2)
        data["items"] = serialize_docs(items)
        return data

    @staticmethod
    def create_supplier(payload: SupplierCreate) -> Dict[str, Any]:
        supp_col = get_suppliers_col()

        if supp_col.find_one({"supplier_id": payload.supplier_id}):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Supplier ID {payload.supplier_id} already exists."
            )

        data = payload.model_dump()
        now_iso = datetime.utcnow().isoformat()
        data["created_at"] = now_iso
        data["updated_at"] = now_iso

        try:
            res = supp_col.insert_one(data)
            data["_id"] = res.inserted_id
            res_doc = serialize_doc(data)
            res_doc["item_count"] = 0
            res_doc["total_valuation"] = 0.0
            return res_doc
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Supplier ID {payload.supplier_id} already exists."
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create supplier: {str(e)}"
            )

    @staticmethod
    def update_supplier(supplier_id: int, payload: SupplierUpdate) -> Dict[str, Any]:
        supp_col = get_suppliers_col()
        inv_col = get_inventory_col()

        existing = supp_col.find_one({"supplier_id": supplier_id})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier with ID {supplier_id} not found."
            )

        updates = {k: v for k, v in payload.model_dump().items() if v is not None}
        if not updates:
            return SupplierService.get_supplier_by_id(supplier_id)

        updates["updated_at"] = datetime.utcnow().isoformat()

        try:
            supp_col.update_one({"supplier_id": supplier_id}, {"$set": updates})

            # If company_name changed, update supplier_name in inventory
            if "company_name" in updates:
                inv_col.update_many(
                    {"supplier_id": supplier_id},
                    {"$set": {"supplier_name": updates["company_name"]}}
                )

            return SupplierService.get_supplier_by_id(supplier_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update supplier: {str(e)}"
            )

    @staticmethod
    def delete_supplier(supplier_id: int) -> Dict[str, Any]:
        supp_col = get_suppliers_col()
        inv_col = get_inventory_col()

        existing = supp_col.find_one({"supplier_id": supplier_id})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier with ID {supplier_id} not found."
            )

        # Check if items are associated
        attached_count = inv_col.count_documents({"supplier_id": supplier_id})
        if attached_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete supplier '{existing.get('company_name')}'. {attached_count} inventory item(s) are associated with this supplier. Reassign or delete them first."
            )

        supp_col.delete_one({"supplier_id": supplier_id})
        return {"success": True, "message": f"Supplier {supplier_id} ({existing.get('company_name')}) deleted successfully."}
