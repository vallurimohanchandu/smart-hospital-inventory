from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from app.database import get_inventory_col, get_movements_col, serialize_docs

class ReportService:
    @staticmethod
    def get_category_summary() -> Dict[str, Any]:
        """
        Report 1: Category Summary Aggregation Pipeline
        Groups items by category, computes document count, sum of quantities, and sum of total valuation (qty * unit_price).
        """
        pipeline = [
            {
                "$project": {
                    "category": 1,
                    "quantity": 1,
                    "unit_price": 1,
                    "item_valuation": {"$multiply": ["$quantity", "$unit_price"]}
                }
            },
            {
                "$group": {
                    "_id": "$category",
                    "category": {"$first": "$category"},
                    "item_count": {"$sum": 1},
                    "total_quantity": {"$sum": "$quantity"},
                    "total_valuation": {"$sum": "$item_valuation"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "category": 1,
                    "item_count": 1,
                    "total_quantity": 1,
                    "total_valuation": {"$round": ["$total_valuation", 2]}
                }
            },
            {"$sort": {"total_valuation": -1}}
        ]

        col = get_inventory_col()
        results = list(col.aggregate(pipeline))

        explanation = (
            "Pipeline Stages: 1. $project: calculates 'item_valuation' as quantity * unit_price. "
            "2. $group: groups documents by '$category', counting items and summing quantities and valuation. "
            "3. $project: rounds valuation to 2 decimal places and cleans up fields. 4. $sort: orders by valuation descending."
        )

        return {
            "title": "Category-Wise Inventory Summary",
            "pipeline_stages": pipeline,
            "explanation": explanation,
            "data": results
        }

    @staticmethod
    def get_inventory_valuation() -> Dict[str, Any]:
        """
        Report 2: Total Inventory Valuation Aggregation Pipeline
        Multiplies quantity by unit_price for each document, then aggregates into total valuation, total units, and total items.
        """
        pipeline = [
            {
                "$project": {
                    "item_id": 1,
                    "item_name": 1,
                    "category": 1,
                    "quantity": 1,
                    "unit_price": 1,
                    "line_valuation": {"$multiply": ["$quantity", "$unit_price"]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_valuation": {"$sum": "$line_valuation"},
                    "total_units": {"$sum": "$quantity"},
                    "total_unique_items": {"$sum": 1},
                    "average_unit_price": {"$avg": "$unit_price"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "total_valuation": {"$round": ["$total_valuation", 2]},
                    "total_units": 1,
                    "total_unique_items": 1,
                    "average_unit_price": {"$round": ["$average_unit_price", 2]}
                }
            }
        ]

        col = get_inventory_col()
        results = list(col.aggregate(pipeline))
        summary = results[0] if results else {
            "total_valuation": 0.0,
            "total_units": 0,
            "total_unique_items": 0,
            "average_unit_price": 0.0
        }

        explanation = (
            "Pipeline Stages: 1. $project: derives line_valuation by multiplying quantity and unit_price. "
            "2. $group (id: None): performs global accumulator calculations across the entire inventory collection. "
            "3. $project: formats numeric averages and round valuations to 2 decimal places."
        )

        return {
            "title": "Total Hospital Inventory Valuation",
            "pipeline_stages": pipeline,
            "explanation": explanation,
            "data": summary
        }

    @staticmethod
    def get_low_stock_report() -> Dict[str, Any]:
        """
        Report 3: Low-Stock Items Aggregation Pipeline
        Matches items where quantity <= minimum_stock, categorizes out-of-stock vs low-stock, and sorts by urgency.
        """
        pipeline = [
            {
                "$match": {
                    "$expr": {"$lte": ["$quantity", "$minimum_stock"]}
                }
            },
            {
                "$addFields": {
                    "urgency": {
                        "$cond": {
                            "if": {"$eq": ["$quantity", 0]},
                            "then": "OUT_OF_STOCK",
                            "else": "LOW_STOCK"
                        }
                    },
                    "shortage": {"$subtract": ["$minimum_stock", "$quantity"]}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "item_id": 1,
                    "item_name": 1,
                    "category": 1,
                    "quantity": 1,
                    "minimum_stock": 1,
                    "shortage": 1,
                    "urgency": 1,
                    "unit_price": 1,
                    "location": 1,
                    "supplier_name": 1
                }
            },
            {"$sort": {"quantity": 1, "shortage": -1}}
        ]

        col = get_inventory_col()
        results = list(col.aggregate(pipeline))

        explanation = (
            "Pipeline Stages: 1. $match: uses $expr to compare '$quantity' against field '$minimum_stock'. "
            "2. $addFields: flags zero-quantity items as OUT_OF_STOCK and calculates the unit shortage. "
            "3. $sort: orders zero stock first, followed by deepest shortages."
        )

        return {
            "title": "Low-Stock and Critical Inventory Items",
            "pipeline_stages": pipeline,
            "explanation": explanation,
            "data": results
        }

    @staticmethod
    def get_expired_report() -> Dict[str, Any]:
        """
        Report 4: Expired Items Aggregation Pipeline
        Matches items where expiry_date < today and is not null and category != Equipment.
        """
        today_iso = date.today().isoformat()
        pipeline = [
            {
                "$match": {
                    "expiry_date": {"$ne": None, "$exists": True, "$lt": today_iso},
                    "category": {"$ne": "Equipment"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "item_id": 1,
                    "item_name": 1,
                    "category": 1,
                    "quantity": 1,
                    "unit_price": 1,
                    "expiry_date": 1,
                    "loss_valuation": {"$round": [{"$multiply": ["$quantity", "$unit_price"]}, 2]},
                    "location": 1,
                    "supplier_name": 1
                }
            },
            {"$sort": {"expiry_date": 1}}
        ]

        col = get_inventory_col()
        results = list(col.aggregate(pipeline))

        explanation = (
            "Pipeline Stages: 1. $match: filters documents having an expiry_date strictly less than the server's current date, "
            "excluding equipment items. 2. $project: calculates potential financial loss valuation. 3. $sort: sorts by oldest expired date first."
        )

        return {
            "title": "Expired Medicines & Perishable Supplies",
            "pipeline_stages": pipeline,
            "explanation": explanation,
            "data": results
        }

    @staticmethod
    def get_supplier_summary() -> Dict[str, Any]:
        """
        Report 5: Supplier Summary Aggregation Pipeline
        Groups inventory items by supplier_id and supplier_name to compute items supplied, total volume, and total value.
        """
        pipeline = [
            {
                "$match": {
                    "supplier_id": {"$ne": None}
                }
            },
            {
                "$project": {
                    "supplier_id": 1,
                    "supplier_name": {"$ifNull": ["$supplier_name", "Unknown Supplier"]},
                    "quantity": 1,
                    "item_value": {"$multiply": ["$quantity", "$unit_price"]}
                }
            },
            {
                "$group": {
                    "_id": "$supplier_id",
                    "supplier_id": {"$first": "$supplier_id"},
                    "supplier_name": {"$first": "$supplier_name"},
                    "total_items": {"$sum": 1},
                    "total_units": {"$sum": "$quantity"},
                    "total_valuation": {"$sum": "$item_value"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "supplier_id": 1,
                    "supplier_name": 1,
                    "total_items": 1,
                    "total_units": 1,
                    "total_valuation": {"$round": ["$total_valuation", 2]}
                }
            },
            {"$sort": {"total_valuation": -1}}
        ]

        col = get_inventory_col()
        results = list(col.aggregate(pipeline))

        explanation = (
            "Pipeline Stages: 1. $match: includes documents having a supplier assigned. 2. $project: computes line values. "
            "3. $group: groups documents by '$supplier_id', summing items, total units, and inventory valuation. "
            "4. $sort: ranks top suppliers by total valuation."
        )

        return {
            "title": "Supplier Inventory & Volume Distribution",
            "pipeline_stages": pipeline,
            "explanation": explanation,
            "data": results
        }

    @staticmethod
    def get_top_expensive() -> Dict[str, Any]:
        """
        Report 6: Top 5 Most Expensive Items Aggregation Pipeline
        Sorts documents by unit_price descending and limits output to 5 items.
        """
        pipeline = [
            {"$sort": {"unit_price": -1}},
            {"$limit": 5},
            {
                "$project": {
                    "_id": 0,
                    "item_id": 1,
                    "item_name": 1,
                    "category": 1,
                    "unit_price": 1,
                    "quantity": 1,
                    "total_value": {"$round": [{"$multiply": ["$quantity", "$unit_price"]}, 2]},
                    "location": 1
                }
            }
        ]

        col = get_inventory_col()
        results = list(col.aggregate(pipeline))

        explanation = (
            "Pipeline Stages: 1. $sort: orders all inventory documents by 'unit_price' descending. "
            "2. $limit: retains only top 5 highest-priced assets. 3. $project: shapes output and computes total asset value."
        )

        return {
            "title": "Top 5 Most Expensive Inventory Assets",
            "pipeline_stages": pipeline,
            "explanation": explanation,
            "data": results
        }

    @staticmethod
    def get_movement_summary() -> Dict[str, Any]:
        """
        Report 7: Stock Movement Summary Aggregation Pipeline
        Groups stock movements by movement_type (STOCK_IN, STOCK_OUT, ADJUSTMENT) and calculates transaction count and volume.
        """
        pipeline = [
            {
                "$group": {
                    "_id": "$movement_type",
                    "movement_type": {"$first": "$movement_type"},
                    "total_events": {"$sum": 1},
                    "total_units_moved": {"$sum": "$quantity"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "movement_type": 1,
                    "total_events": 1,
                    "total_units_moved": 1
                }
            },
            {"$sort": {"total_units_moved": -1}}
        ]

        col = get_movements_col()
        results = list(col.aggregate(pipeline))

        explanation = (
            "Pipeline Stages: 1. $group: partitions movement records by '$movement_type', counting total logged events "
            "and summing quantity units. 2. $sort: presents transactions ordered by volume moved."
        )

        return {
            "title": "Stock Movement Transaction Summary",
            "pipeline_stages": pipeline,
            "explanation": explanation,
            "data": results
        }

    @staticmethod
    def get_monthly_trends() -> Dict[str, Any]:
        """
        Report 8: Monthly Stock Trends Aggregation Pipeline
        Groups stock movements by year-month and movement_type to track month-over-month inflow vs outflow trends.
        """
        pipeline = [
            {
                "$project": {
                    "month": {"$substrBytes": ["$timestamp", 0, 7]},
                    "movement_type": 1,
                    "quantity": 1
                }
            },
            {
                "$group": {
                    "_id": {
                        "month": "$month",
                        "movement_type": "$movement_type"
                    },
                    "total_quantity": {"$sum": "$quantity"},
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": "$_id.month",
                    "month": {"$first": "$_id.month"},
                    "movements": {
                        "$push": {
                            "type": "$_id.movement_type",
                            "units": "$total_quantity",
                            "events": "$count"
                        }
                    }
                }
            },
            {"$sort": {"month": 1}}
        ]

        col = get_movements_col()
        raw = list(col.aggregate(pipeline))

        # Flatten into structured list for charts: [{month: '2026-09', stock_in: 50, stock_out: 20, adjustment: 5}]
        formatted = []
        for entry in raw:
            m = entry.get("month", "Unknown")
            row = {"month": m, "stock_in": 0, "stock_out": 0, "adjustment": 0}
            for mov in entry.get("movements", []):
                t = mov.get("type")
                u = mov.get("units", 0)
                if t == "STOCK_IN":
                    row["stock_in"] = u
                elif t == "STOCK_OUT":
                    row["stock_out"] = u
                elif t == "ADJUSTMENT":
                    row["adjustment"] = u
            formatted.append(row)

        explanation = (
            "Pipeline Stages: 1. $project: extracts YYYY-MM using $substrBytes from the timestamp. "
            "2. $group: groups by month and movement_type to sum units. 3. $group: consolidates types under each month. "
            "4. $sort: arranges chronologically by month."
        )

        return {
            "title": "Monthly Stock Inflow vs Outflow Trends",
            "pipeline_stages": pipeline,
            "explanation": explanation,
            "data": formatted
        }

    @staticmethod
    def get_dashboard_stats() -> Dict[str, Any]:
        """
        Computes real-time live KPI metrics for dashboard directly from MongoDB collections.
        """
        inv_col = get_inventory_col()
        today_iso = date.today().isoformat()
        next_30_iso = (date.today() + timedelta(days=30)).isoformat()

        # 1. Total unique items
        total_unique = inv_col.count_documents({})

        # 2. Total units & Total valuation
        val_agg = list(inv_col.aggregate([
            {
                "$group": {
                    "_id": None,
                    "total_units": {"$sum": "$quantity"},
                    "total_valuation": {"$sum": {"$multiply": ["$quantity", "$unit_price"]}}
                }
            }
        ]))
        total_units = val_agg[0]["total_units"] if val_agg else 0
        total_valuation = round(val_agg[0]["total_valuation"], 2) if val_agg else 0.0

        # 3. Out-of-stock items (quantity == 0)
        out_of_stock_count = inv_col.count_documents({"quantity": 0})

        # 4. Low-stock items (quantity <= minimum_stock)
        low_stock_count = inv_col.count_documents({
            "$expr": {"$lte": ["$quantity", "$minimum_stock"]}
        })

        # 5. Expired medicines (expiry_date < today and not null, category != Equipment)
        expired_count = inv_col.count_documents({
            "expiry_date": {"$ne": None, "$lt": today_iso},
            "category": {"$ne": "Equipment"}
        })

        # 6. Items expiring within 30 days
        expiring_30_count = inv_col.count_documents({
            "expiry_date": {"$gte": today_iso, "$lte": next_30_iso},
            "category": {"$ne": "Equipment"}
        })

        return {
            "total_unique_items": total_unique,
            "total_units": total_units,
            "low_stock_items": low_stock_count,
            "out_of_stock_items": out_of_stock_count,
            "expired_medicines": expired_count,
            "expiring_30_days": expiring_30_count,
            "total_inventory_valuation": total_valuation
        }

    @staticmethod
    def get_dashboard_alerts() -> Dict[str, Any]:
        """
        Fetches active alerts: top low/out of stock items and expired/near-expiry items.
        """
        inv_col = get_inventory_col()
        today_iso = date.today().isoformat()
        next_30_iso = (date.today() + timedelta(days=30)).isoformat()

        # Low stock items
        low_stock_items = list(inv_col.find(
            {"$expr": {"$lte": ["$quantity", "$minimum_stock"]}},
            {"_id": 0, "item_id": 1, "item_name": 1, "quantity": 1, "minimum_stock": 1, "category": 1, "location": 1}
        ).sort("quantity", 1).limit(6))

        # Expired items
        expired_items = list(inv_col.find(
            {
                "expiry_date": {"$ne": None, "$lt": today_iso},
                "category": {"$ne": "Equipment"}
            },
            {"_id": 0, "item_id": 1, "item_name": 1, "expiry_date": 1, "quantity": 1, "location": 1}
        ).sort("expiry_date", 1).limit(5))

        # Near expiry items (next 30 days)
        near_expiry_items = list(inv_col.find(
            {
                "expiry_date": {"$gte": today_iso, "$lte": next_30_iso},
                "category": {"$ne": "Equipment"}
            },
            {"_id": 0, "item_id": 1, "item_name": 1, "expiry_date": 1, "quantity": 1, "location": 1}
        ).sort("expiry_date", 1).limit(5))

        return {
            "low_stock": low_stock_items,
            "expired": expired_items,
            "near_expiry": near_expiry_items
        }
