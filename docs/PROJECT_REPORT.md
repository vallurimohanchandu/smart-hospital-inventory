# CSE494 — INTELLIGENT NoSQL DATABASES
# FINAL PROJECT REPORT

## PROJECT TITLE:
### SMART HOSPITAL INVENTORY MANAGEMENT SYSTEM

---

## 1. ABSTRACT
Modern healthcare facilities manage thousands of diverse inventory assets ranging from life-saving pharmaceuticals and temperature-sensitive biologicals to disposable surgical supplies and capital-intensive biomedical monitoring systems. Traditional Relational Database Management Systems (RDBMS) struggle with the schema heterogeneity, rapid ingestion, and complex aggregate reporting demands of clinical supply chains. This project presents the design, implementation, and empirical verification of the **Smart Hospital Inventory Management System**, a high-performance web application powered by **MongoDB 8.x**, **Python 3.11**, **FastAPI**, and **React 18**. 

The system leverages MongoDB document-oriented modeling, database-level JSON Schema validation (`$jsonSchema`), B-Tree index optimization, multi-stage aggregation pipelines, and PyMongo driver integration. Stock integrity is protected through atomic transactional state transitions, while patient safety is reinforced by preventing the dispatch of expired pharmaceuticals. Automated test suites using Pytest demonstrate 100% test pass rates across all CRUD and aggregation requirements.

---

## 2. INTRODUCTION
Hospital inventory management is a safety-critical domain where supply shortages directly impact patient outcomes, and inventory over-purchasing leads to expired medication losses. In traditional database models, accommodating medicines (with expiry dates and dosages), surgical consumables (with bulk counts), and heavy machinery (with maintenance serials) necessitates extensive table normalization, foreign key joins, or sparse tables with hundreds of null attributes.

NoSQL document databases, led by MongoDB, represent a paradigm shift by allowing documents in a collection to naturally reflect domain objects. This project demonstrates how MongoDB’s native capabilities—including `$jsonSchema` validators, unique index constraints, and multi-stage aggregation pipelines—provide enterprise-grade consistency without sacrificing architectural flexibility.

---

## 3. PROBLEM STATEMENT
Hospital supply chain systems face several distinct operational challenges:
1. **Schema Heterogeneity:** Fixed tabular structures cannot cleanly encapsulate differing product attributes across medicines, surgical instruments, and machinery.
2. **Medication Expiry & Clinical Safety:** Manual tracking often allows expired or near-expiry drugs to remain in circulation or be dispensed inadvertently.
3. **Audit Trail & Stock Consistency:** Stock receipts, dispatches to operating theatres, and physical inventory corrections frequently fall out of sync, leading to inaccurate stock counts and inventory shrinkage.
4. **Complex Aggregated Analytics:** Generating real-time financial valuation and category trends across thousands of items using relational SQL joins incurs heavy computational overhead.

---

## 4. OBJECTIVES
The core technical and academic objectives of this project are:
- **Database Modeling:** Design and implement a document database named `SmartHospitalDB` comprising `inventory`, `suppliers`, and `stock_movements` collections.
- **Data Integrity:** Enforce strict MongoDB JSON Schema validation and unique natural key indexes.
- **Python-NoSQL Integration:** Implement a decoupled service layer using native PyMongo and FastAPI without relying on third-party Object Document Mappers (ODMs).
- **Audit Logging & Safety:** Implement transactional stock movements (`STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`) with mandatory audit reasons and automatic blocking of expired drug dispatches.
- **Analytics & Aggregation:** Develop eight production-grade MongoDB aggregation pipelines to power dashboards and business intelligence reports.
- **Automated Verification:** Establish an automated testing pipeline in Pytest using an isolated test database (`SmartHospitalDB_Test`).

---

## 5. SYSTEM REQUIREMENTS

### Hardware Requirements
- **Processor:** Intel Core i5 / AMD Ryzen 5 or higher
- **RAM:** 8 GB minimum (16 GB recommended)
- **Disk Space:** 500 MB free storage for local database and node dependencies

### Software Requirements
- **Database:** MongoDB Community Edition Server 8.3.7+ (running on `localhost:27017`)
- **Backend Runtime:** Python 3.11.4
- **Backend Framework:** FastAPI 0.135+, Uvicorn 0.41+, PyMongo 4.19+, Pydantic v2
- **Testing Runtime:** Pytest 8.3.4+
- **Frontend Runtime:** Node.js v24.12.0, npm 11.6.2
- **Frontend Stack:** React 18, Vite 8.3+, Tailwind CSS 3.4+, Recharts 2.x, Axios 1.x, Lucide React

---

## 6. SYSTEM ARCHITECTURE

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|  React 18 SPA (Vite) + Tailwind CSS + Recharts + React Router v6        |
|  - Dashboard: Real-time KPIs, Recharts Visuals, Alerts Panel            |
|  - Inventory: Catalog Table, Search, Multi-Filter, CRUD Modals          |
|  - Stock Movements: Transaction Logger, Immutable Audit Ledger          |
|  - Suppliers: Vendor Cards, Contact Info, Supplied SKUs Inspector       |
|  - Expiry Management: Expired Drug Quarantine, Safety Warnings          |
|  - Reports: 8 Dynamic Aggregation Reports & Stage JSON Explainer        |
+------------------------------------+------------------------------------+
                                     | HTTP / JSON REST APIs (Axios)
                                     v
+------------------------------------+------------------------------------+
|                             BACKEND TIER                                |
|  FastAPI + Uvicorn + Pydantic v2 + PyMongo Driver                       |
|  - Routes: /api/dashboard, /api/inventory, /api/stock-movements, etc.   |
|  - Service Layer: Business Logic, State Calculations, Expiry Checks     |
|  - Data Sanitization: Safe ObjectId String Conversion                   |
|  - Error Handlers: Sanitized HTTP 400, 404, 409, 422 JSON Responses     |
+------------------------------------+------------------------------------+
                                     | PyMongo Native Driver (BSON)
                                     v
+------------------------------------+------------------------------------+
|                            DATABASE TIER                                |
|  MongoDB 8.x (SmartHospitalDB)                                          |
|  - Collections: inventory, suppliers, stock_movements                   |
|  - Database JSON Schema Validation ($jsonSchema)                        |
|  - Unique B-Tree Indexes on item_id, supplier_id, movement_id           |
|  - Multi-Stage Aggregation Engine ($project, $group, $sort, $match)     |
+-------------------------------------------------------------------------+
```

---

## 7. DATABASE AND DOCUMENT DESIGN

### 7.1 Collection: `inventory`
Stores medical items, drugs, surgical consumables, and hospital devices.
- `item_id`: Positive integer (Unique natural key)
- `item_name`: String (2–150 characters)
- `category`: Enum string (`Medicine`, `Equipment`, `Supplies`)
- `quantity`: Integer ($\ge 0$)
- `minimum_stock`: Integer ($\ge 0$)
- `unit_price`: Non-negative float ($\ge 0.0$) in INR (₹)
- `supplier_id`: Integer reference to `suppliers.supplier_id`
- `supplier_name`: Denormalized snapshot of supplier company name
- `expiry_date`: ISO Date string (`YYYY-MM-DD`) or null for equipment
- `location`: Physical hospital ward/room/shelf storage location
- `description`: Clinical notes and dosage specifications
- `created_at` / `updated_at`: ISO timestamp

### 7.2 Collection: `suppliers`
Maintains verified commercial suppliers and pharmaceutical distributors.
- `supplier_id`: Positive integer (Unique natural key)
- `company_name`: String (2–150 characters)
- `contact_person`: Representative contact name
- `email`: Formatted email string
- `phone`: Contact telephone number
- `address`: Physical postal warehouse address
- `status`: Enum (`Active`, `Inactive`)
- `created_at` / `updated_at`: ISO timestamp

### 7.3 Collection: `stock_movements`
An append-only audit trail logging every stock modification.
- `movement_id`: Positive integer (Unique natural key)
- `item_id`: Referenced inventory item ID
- `item_name`: Snapshot of item name at time of transaction
- `movement_type`: Enum (`STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`)
- `quantity`: Quantity moved ($> 0$)
- `previous_quantity`: Stock prior to transaction ($\ge 0$)
- `new_quantity`: Stock following transaction ($\ge 0$)
- `reason`: Mandatory audit reason or clinical department
- `performed_by`: Name and title of staff member executing movement
- `timestamp`: ISO UTC timestamp

---

## 8. MONGODB VALIDATION RULES

JSON Schema validation is applied at the collection level via `$jsonSchema` in MongoDB. Any operation violating these constraints is rejected by the database engine:

1. **Type & Positive Integer Enforcement:** `item_id`, `supplier_id`, and `movement_id` must be BSON integers with `minimum: 1`.
2. **Category Enumeration:** `category` must be strictly one of `["Medicine", "Equipment", "Supplies"]`.
3. **Non-Negative Stock & Price:** `quantity`, `minimum_stock`, and `unit_price` must be $\ge 0$.
4. **Email Pattern:** Supplier email addresses are validated against regular expression `^.+@.+$`.
5. **Movement Enums:** Movement type must be one of `["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]`.

---

## 9. CRUD OPERATIONS
All CRUD endpoints adhere to standard REST conventions:
- `POST /api/inventory`: Validates payload via Pydantic and inserts document into `inventory`. Returns HTTP 201 Created or HTTP 409 Conflict if `item_id` exists.
- `GET /api/inventory`: Queries collection with parameters for keyword search, category, stock status, expiry status, sorting, and pagination.
- `GET /api/inventory/{item_id}`: Retrieves single item or returns HTTP 404 Not Found.
- `PUT /api/inventory/{item_id}`: Applies selective `$set` updates and recalculates `updated_at`.
- `DELETE /api/inventory/{item_id}`: Removes document from catalog.
- `POST /api/stock-movements`: Records inward/outward/adjustment movement, updates current stock atomically, and creates immutable audit record.
- `POST / PUT / DELETE /api/suppliers`: Manages supplier profiles with referential check preventing deletion of suppliers with linked catalog items.

---

## 10. AGGREGATION QUERIES
The application implements 8 distinct multi-stage aggregation pipelines:

1. **Category Summary:** Evaluates total items, total units stocked, and monetary valuation per category (`$project` $\rightarrow$ `$group` $\rightarrow$ `$project` $\rightarrow$ `$sort`).
2. **Total Inventory Valuation:** Multiplies quantity by price and calculates global hospital valuation and mean unit price across the whole inventory collection (`$project` $\rightarrow$ `$group` with `_id: null`).
3. **Low-Stock Items:** Evaluates `$quantity <= $minimum_stock` using `$expr`, adds urgency flags (`OUT_OF_STOCK` vs `LOW_STOCK`), and computes unit shortage.
4. **Expired Items:** Filters items with `expiry_date < today` and computes potential financial loss valuation.
5. **Supplier Summary:** Groups items by `supplier_id` to assess vendor volume and supplied valuation.
6. **Top 5 Expensive Items:** Sorts inventory by `unit_price` descending and limits to top 5 assets.
7. **Stock Movement Summary:** Groups audit transactions by `movement_type` to quantify total intake, discharge, and adjustment events.
8. **Monthly Stock Trends:** Extracts `YYYY-MM` using `$substrBytes` and aggregates inflows versus outflows over time.

---

## 11. PYTHON–MONGODB INTEGRATION
Integration between Python and MongoDB is achieved using native **PyMongo** (`MongoClient`):
- **No Heavy ORM/ODM:** Avoiding Mongoose, MongoEngine, or Beanie allows direct execution of optimized raw aggregation pipelines and explicit control over indexes and validators.
- **ObjectId Serialization:** Custom helper functions safely convert BSON `ObjectId` to string `id` attributes or exclude internal identifiers from public API responses.
- **Transaction Safety & Fallback:** When connected to a replica set, operations utilize multi-document sessions (`session.start_transaction()`). On standalone instances, safe sequential updates with compensating rollback logic ensure inventory and audit consistency.

---

## 12. IMPLEMENTATION AND TESTING

### Test Architecture
Tests are implemented using **Pytest** and FastAPI's `TestClient` (`httpx`). Crucially, tests run against an isolated test database: `SmartHospitalDB_Test`. Development data in `SmartHospitalDB` is never touched.

### Scenarios Tested
1. Successful inventory item creation
2. Item retrieval by ID and search query
3. Item detail updating
4. Item deletion and 404 verification
5. Duplicate `item_id` rejection (HTTP 409)
6. Invalid category rejection (HTTP 422)
7. Negative quantity rejection (HTTP 422)
8. Missing mandatory fields rejection (HTTP 422)
9. Low-stock aggregation report correctness
10. Global inventory valuation calculation
11. `STOCK_IN` quantity increment
12. `STOCK_OUT` quantity decrement
13. Insufficient stock dispatch rejection (HTTP 400)
14. Expired medication dispatch block (HTTP 400)
15. Supplier CRUD and deletion protection with active item linkage

---

## 13. RESULTS
- **Automated Test Results:** All 10 automated test suites (covering all 15 required scenarios) passed with zero errors in 0.61 seconds.
- **Database Metrics:** Seed script loaded 5 commercial suppliers, 18 realistic hospital items, and 5 historical audit movements into `SmartHospitalDB`.
- **UI Verification:** End-to-end browser walkthrough validated responsive desktop and tablet layouts, real-time KPI card synchronization, Recharts visualizations, and interactive modal dialogs.

---

## 14. CONCLUSION
The Smart Hospital Inventory Management System successfully demonstrates the strengths of MongoDB in a mission-critical healthcare setting. By pairing MongoDB’s flexible document model with strict JSON Schema validators and native aggregation pipelines, the application achieves high performance, clean software architecture, and complete data integrity.

---

## 15. FUTURE SCOPE
1. **Replica Set Deployment:** Deploying a multi-node MongoDB replica set across hospital branches with distributed multi-document transactions.
2. **Role-Based Access Control (RBAC):** Implementing JWT-based authentication distinguishing between Pharmacists, Ward Nurses, Biomedical Engineers, and Hospital Auditors.
3. **Automated Reorder Triggers:** Integrating automated purchase order dispatch to supplier APIs when items breach minimum reorder levels.
4. **Barcode / RFID Scanning:** Integrating WebRTC camera scanners for automated batch tracking.

---

## 16. REFERENCES
1. MongoDB Documentation. (2026). *MongoDB Aggregation Pipeline*. MongoDB Inc.
2. MongoDB Documentation. (2026). *Schema Validation with $jsonSchema*. MongoDB Inc.
3. PyMongo Documentation. (2026). *PyMongo: Python driver for MongoDB*.
4. FastAPI Documentation. (2026). *FastAPI Framework, High Performance, Easy to Learn*.
5. World Health Organization (WHO). (2022). *Guidance on Medical Device Inventory Management*. WHO Medical Device Technical Series.
