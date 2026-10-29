from datetime import datetime, date
from typing import Optional, List, Dict, Any, Tuple
from pymongo import DESCENDING
from pymongo.errors import PyMongoError
from fastapi import HTTPException, status
from app.database import get_inventory_col, get_movements_col, serialize_doc, serialize_docs, db_manager
from app.validators.schemas import StockMovementCreate

class StockService:
    @staticmethod
    def get_next_movement_id() -> int:
        col = get_movements_col()
        last = col.find_one(sort=[("movement_id", DESCENDING)])
        if last and "movement_id" in last:
            return last["movement_id"] + 1
        return 1

    @staticmethod
    def record_movement(payload: StockMovementCreate) -> Dict[str, Any]:
        inv_col = get_inventory_col()
        mov_col = get_movements_col()

        # 1. Fetch target item
        item = inv_col.find_one({"item_id": payload.item_id})
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory item with ID {payload.item_id} does not exist."
            )

        prev_qty = item.get("quantity", 0)
        mov_type = payload.movement_type
        delta_qty = payload.quantity

        # Expiry safety check: Do not issue expired medicine for STOCK_OUT
        if mov_type == "STOCK_OUT" and item.get("category") == "Medicine":
            exp_str = item.get("expiry_date")
            if exp_str:
                try:
                    exp_date = datetime.strptime(exp_str, "%Y-%m-%d").date()
                    if exp_date < date.today():
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Cannot issue expired medicine '{item.get('item_name')}'. Expiry date ({exp_str}) has passed."
                        )
                except ValueError:
                    pass

        # Calculate new quantity based on movement type
        if mov_type == "STOCK_IN":
            new_qty = prev_qty + delta_qty
        elif mov_type == "STOCK_OUT":
            if prev_qty < delta_qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{item.get('item_name')}'. Available: {prev_qty}, Requested: {delta_qty}."
                )
            new_qty = prev_qty - delta_qty
        elif mov_type == "ADJUSTMENT":
            if payload.target_quantity is not None:
                new_qty = payload.target_quantity
                delta_qty = abs(new_qty - prev_qty)
                if delta_qty == 0:
                    delta_qty = 1 # Keep movement quantity positive for schema compliance
            else:
                # Target is given by payload.quantity
                new_qty = payload.quantity
                delta_qty = abs(new_qty - prev_qty)
                if delta_qty == 0:
                    delta_qty = 1
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported movement type: {mov_type}")

        if new_qty < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Resulting stock quantity cannot be negative ({new_qty})."
            )

        movement_id = StockService.get_next_movement_id()
        now_iso = datetime.utcnow().isoformat()

        movement_doc = {
            "movement_id": movement_id,
            "item_id": payload.item_id,
            "item_name": item.get("item_name", "Unknown Item"),
            "movement_type": mov_type,
            "quantity": delta_qty,
            "previous_quantity": prev_qty,
            "new_quantity": new_qty,
            "reason": payload.reason.strip(),
            "performed_by": payload.performed_by.strip(),
            "timestamp": now_iso
        }

        # Multi-document execution: Check for replica set / transaction support
        client = db_manager.client
        has_replica_set = False
        try:
            repl_status = client.admin.command("replSetGetStatus")
            has_replica_set = bool(repl_status.get("ok"))
        except Exception:
            has_replica_set = False

        if has_replica_set:
            # Transactional execution
            with client.start_session() as session:
                with session.start_transaction():
                    mov_col.insert_one(movement_doc, session=session)
                    inv_col.update_one(
                        {"item_id": payload.item_id},
                        {"$set": {"quantity": new_qty, "updated_at": now_iso}},
                        session=session
                    )
        else:
            # Safe sequential update with compensating rollback fallback
            try:
                # 1. Update inventory
                inv_col.update_one(
                    {"item_id": payload.item_id},
                    {"$set": {"quantity": new_qty, "updated_at": now_iso}}
                )
                # 2. Insert audit record
                mov_col.insert_one(movement_doc)
            except Exception as e:
                # Rollback inventory update if movement insert failed
                inv_col.update_one(
                    {"item_id": payload.item_id},
                    {"$set": {"quantity": prev_qty}}
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to record movement: {str(e)}"
                )

        return serialize_doc(movement_doc)

    @staticmethod
    def get_movements(
        item_id: Optional[int] = None,
        movement_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Dict[str, Any]], int]:
        col = get_movements_col()
        query: Dict[str, Any] = {}

        if item_id:
            query["item_id"] = item_id

        if movement_type and movement_type != "All":
            query["movement_type"] = movement_type

        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date + "T23:59:59"
            query["timestamp"] = date_filter

        total = col.count_documents(query)
        skip = (page - 1) * limit

        cursor = col.find(query).sort("timestamp", DESCENDING).skip(skip).limit(limit)
        movements = serialize_docs(cursor)

        return movements, total
