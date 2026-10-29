# Academic Viva Questions & Answers
**Project:** Smart Hospital Inventory Management System  
**Course:** CSE494 — Intelligent NoSQL Databases  
**Technology:** MongoDB 8.x, PyMongo, FastAPI, React

---

### Q1. Why was MongoDB chosen for hospital inventory management instead of a traditional relational database (RDBMS)?
**Answer:** Medical inventories handle highly heterogeneous items. For example, medicines have batch numbers, active salts, and strict expiry dates; equipment has calibration cycles, serial numbers, and maintenance schedules; surgical consumables are bulk items without expiry. MongoDB's polymorphic document model enables storing these varied entities in a unified collection without sparse nullable columns, while indexing and JSON Schema validation ensure ACID properties at the document level.

### Q2. How is MongoDB JSON Schema validation implemented in this project?
**Answer:** JSON Schema validation is configured using MongoDB's `$jsonSchema` operator during collection creation in `backend/scripts/setup_database.py`. The rules enforce positive integer IDs (`item_id >= 1`), permitted categories (`Medicine`, `Equipment`, `Supplies`), non-negative quantities (`quantity >= 0`), minimum stock thresholds, non-negative unit prices, and mandatory storage locations.

### Q3. What is the difference between client-side validation, backend validation, and database validation?
**Answer:** The application implements three defensive layers:
1. **Client-side:** React forms provide instant feedback to improve user experience.
2. **Backend API:** Pydantic v2 schemas strictly validate incoming request payloads before business logic execution.
3. **Database-level:** MongoDB `$jsonSchema` acts as the ultimate authority, rejecting non-compliant documents even if submitted through direct database access.

### Q4. Which indexes are created in `SmartHospitalDB` and what are their roles?
**Answer:**
- `inventory.item_id` (Unique): Ensures no duplicate inventory items exist; provides $O(1)$ point lookups.
- `inventory.category`: Accelerates filtering by category and groups in aggregation pipelines.
- `inventory.quantity`: Speeds up threshold checks for low-stock and out-of-stock items.
- `inventory.expiry_date`: Optimizes range queries for expired and near-expiry medication.
- `inventory.supplier_id`: Accelerates supplier item joins and relationship integrity checks.
- `suppliers.supplier_id` (Unique): Ensures unique supplier IDs.
- `stock_movements.movement_id` (Unique): Enforces immutable sequential audit numbering.
- `stock_movements.item_id` & `stock_movements.timestamp`: Accelerates audit ledger queries and chronological sorting.

### Q5. How does the application prevent duplicate item IDs?
**Answer:** At the database level, a unique B-Tree index on `item_id` rejects duplicate inserts with a MongoDB `DuplicateKeyError` (Error Code 11000). At the service level, `InventoryService.create_item()` performs an initial existence check and catches any duplicate errors, returning an HTTP `409 Conflict` status code.

### Q6. How does the system handle MongoDB ObjectIds when returning JSON to the frontend?
**Answer:** PyMongo returns BSON `ObjectId` instances which are not natively JSON serializable. The helper `serialize_doc()` in `app/database.py` maps `_id` to a string `id` field and converts any nested `ObjectId` values into standard ISO strings before serialization.

### Q7. How is stock consistency maintained during a stock movement?
**Answer:** When receiving (`STOCK_IN`) or dispatching (`STOCK_OUT`) stock, the application detects whether MongoDB is deployed as a replica set. If so, a multi-document ACID transaction session (`client.start_session()`) wraps both the inventory quantity update and movement ledger insert. If running on a standalone instance, the system executes atomic sequential updates with compensating rollback if an error occurs.

### Q8. What happens if a user attempts to dispatch more stock than is available?
**Answer:** `StockService.record_movement()` inspects the item's current stock (`previous_quantity`). If `previous_quantity < requested_quantity`, the transaction is aborted immediately and an HTTP `400 Bad Request` with an explicit message (`"Insufficient stock for [item]"`) is returned. Stock quantity is never allowed to become negative.

### Q9. How does the system enforce medication safety regarding expired drugs?
**Answer:** In `StockService.record_movement()`, when a `STOCK_OUT` operation is requested for an item in the `Medicine` category, the system evaluates `expiry_date` against `date.today()`. If expired, the dispatch is blocked with an HTTP 400 error: `"Cannot issue expired medicine. Expiry date has passed."`

### Q10. What is an aggregation pipeline in MongoDB?
**Answer:** An aggregation pipeline is a framework for data processing modeled on the concept of data processing pipelines. Documents enter a multi-stage pipeline that transforms the documents into aggregated results using stages such as `$match`, `$project`, `$group`, `$sort`, `$limit`, and `$lookup`.

### Q11. Explain Report 1 (Category Summary) pipeline stages.
**Answer:**
1. `$project`: Multiplies `quantity * unit_price` to create a virtual field `item_valuation`.
2. `$group`: Groups documents by `_id: "$category"`, calculating `$sum: 1` for item count, `$sum: "$quantity"` for total units, and `$sum: "$item_valuation"` for category valuation.
3. `$project`: Cleans the output and applies `$round` to 2 decimal places.
4. `$sort`: Orders categories by `total_valuation` in descending order.

### Q12. Explain how Report 2 (Total Inventory Valuation) computes metrics across the entire collection.
**Answer:** By setting `_id: null` in the `$group` stage:
`{ $group: { _id: null, total_valuation: { $sum: "$line_valuation" }, total_units: { $sum: "$quantity" }, total_unique_items: { $sum: 1 }, average_unit_price: { $avg: "$unit_price" } } }`
This treats the entire collection as a single group to compute global accumulators.

### Q13. How does Report 3 identify low-stock items when minimum stock thresholds differ per item?
**Answer:** Since each item has its own `minimum_stock` threshold, the pipeline uses the `$expr` operator inside `$match`:
`{ $match: { $expr: { $lte: ["$quantity", "$minimum_stock"] } } }`
This compares two field values within the same document, which cannot be done with standard query syntax.

### Q14. How does the application extract the year and month in Report 8 (Monthly Trends)?
**Answer:** It uses the `$substrBytes` operator on the ISO timestamp string:
`{ $project: { month: { $substrBytes: ["$timestamp", 0, 7] }, movement_type: 1, quantity: 1 } }`
This extracts the first 7 characters (`YYYY-MM`) for time-series grouping.

### Q15. Why are stock movement records never deleted?
**Answer:** In healthcare administration, inventory movements form a legal audit trail. Stock logs record who received or dispensed controlled drugs, when, and for what medical reason. Modifying or deleting audit records compromises regulatory compliance.

### Q16. How does the system prevent orphaned inventory records when deleting a supplier?
**Answer:** `SupplierService.delete_supplier()` queries the `inventory` collection for documents with `supplier_id == target_id`. If `attached_count > 0`, the deletion is blocked with an HTTP 400 error instructing the administrator to reassign or remove the associated items first.

### Q17. How does Pytest achieve test isolation without corrupting development data?
**Answer:** The test suite uses `backend/tests/conftest.py` which dynamically overrides `settings.DATABASE_NAME` to `SmartHospitalDB_Test`. The test database is created, verified, tested, and dropped automatically, keeping development data in `SmartHospitalDB` pristine.

### Q18. What is the role of CORS middleware in FastAPI?
**Answer:** Cross-Origin Resource Sharing (CORS) allows the React frontend running on `http://localhost:5173` to safely communicate with the FastAPI backend on `http://localhost:8000`. The backend restricts allowed origins to those defined in `.env`.

### Q19. How does the frontend handle empty states and server loading states?
**Answer:** The React frontend includes dedicated `<LoadingSpinner />` and `<EmptyState />` components. When the database has no records or a search yields no results, user-friendly feedback with clear action buttons is displayed instead of a blank screen or raw error.

### Q20. What are the key limitations of the current academic implementation?
**Answer:**
1. Single-node local MongoDB instance (replica set required for production multi-document distributed transactions).
2. Demonstration authentication is not enabled (production systems require JWT/OAuth2 role-based access control for Pharmacists vs Doctors).
3. Hardcoded demo currency formatting (INR); multi-currency hospital branches would require dynamic currency conversion.
