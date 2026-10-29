# Smart Hospital Inventory Management System

**Course:** CSE494 — Intelligent NoSQL Databases  
**Project Type:** Individual Academic Capstone Project  
**Database:** MongoDB Community Edition 8.x / Atlas (`SmartHospitalDB`)  
**Backend:** Python 3.11, FastAPI, PyMongo, Pydantic v2, Pytest  
**Frontend Options:** 
- React 18, Vite, Tailwind CSS, Recharts (Port 5173)
- Streamlit Cloud Python Web App (Port 8501, 1-Click Cloud Hosting)

---

## ⚡ 1-Click Streamlit Cloud Deployment
This project includes a dedicated, cloud-ready Streamlit application ([`streamlit_app.py`](file:///c:/smart%20hospital/streamlit_app.py)) that can be deployed for free on [Streamlit Community Cloud](https://share.streamlit.io/) with MongoDB Atlas!  
👉 **Full Step-by-Step Guide:** [Streamlit Deployment Guide](docs/STREAMLIT_DEPLOYMENT_GUIDE.md)

## 🏥 Project Overview & Objectives

The **Smart Hospital Inventory Management System** is a full-stack, document-oriented web application designed for hospital clinical inventory tracking. Healthcare facilities manage thousands of diverse inventory assets ranging from life-saving pharmaceuticals and temperature-sensitive biologicals to disposable surgical supplies and capital-intensive biomedical monitoring systems.

### Core Objectives:
1. **Document-Oriented Data Modeling:** Model diverse clinical supplies without rigid relational table normalization.
2. **Database-Level JSON Schema Validation:** Enforce integrity using MongoDB's `$jsonSchema` validators.
3. **Python–MongoDB Integration:** Utilize native **PyMongo** directly without ODM overhead.
4. **Stock Consistency & Medication Safety:** Maintain an immutable audit ledger of stock movements and prevent the dispatch of expired drugs.
5. **Multi-Stage Aggregation Pipelines:** Generate real-time clinical dashboards and business intelligence reports directly in MongoDB.
6. **Automated Testing:** Validate all CRUD operations, schema constraints, and aggregation results with an isolated Pytest suite.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Database** | MongoDB 8.x | Native BSON document engine, `$jsonSchema` validation, B-Tree indexes |
| **Backend API** | FastAPI + Python 3.11 | High-performance asynchronous REST API framework |
| **Database Driver** | PyMongo 4.x | Official Python native driver for direct BSON/MongoDB manipulation |
| **Data Validation** | Pydantic v2 | Layer-1 payload validation and serialization |
| **Testing** | Pytest + HTTPX | Automated test suite with isolated test database |
| **Frontend** | React 18 (Vite) | Single Page Application (SPA) architecture |
| **Styling** | Tailwind CSS | Hospital SaaS design system (teal/sky/slate theme) |
| **Data Visualization** | Recharts | Dynamic bar, pie, and line charts |
| **Icons** | Lucide React | Modern medical and operational iconography |
| **HTTP Client** | Axios | Centralized request/response interceptor and error formatting |

---

## 📐 System Architecture

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

## 🗄️ Database & Document Design

### Collections & Fields

#### 1. `inventory` Collection
Stores medications, surgical supplies, and biomedical equipment.
```json
{
  "_id": ObjectId("..."),
  "item_id": 1001,
  "item_name": "Paracetamol 650mg Tablets",
  "category": "Medicine",
  "quantity": 450,
  "minimum_stock": 100,
  "unit_price": 2.50,
  "supplier_id": 101,
  "supplier_name": "Apex Medicare Pharma Ltd",
  "expiry_date": "2027-10-19",
  "location": "Pharmacy Rack A-01",
  "description": "Analgesic and antipyretic tablets",
  "created_at": "2026-10-19T08:28:26.549210",
  "updated_at": "2026-10-19T08:28:26.549210"
}
```

#### 2. `suppliers` Collection
Maintains pharmaceutical distributors and authorized vendors.
```json
{
  "_id": ObjectId("..."),
  "supplier_id": 101,
  "company_name": "Apex Medicare Pharma Ltd",
  "contact_person": "Dr. Rajesh Sharma",
  "email": "contact@apexmedicare.demo",
  "phone": "+91-98765-43210",
  "address": "Plot 42, Okhla Industrial Area Phase-III, New Delhi, India",
  "status": "Active",
  "created_at": "2026-10-19T08:28:26.549210",
  "updated_at": "2026-10-19T08:28:26.549210"
}
```

#### 3. `stock_movements` Collection
Immutable audit ledger of all inventory transactions.
```json
{
  "_id": ObjectId("..."),
  "movement_id": 1,
  "item_id": 1001,
  "item_name": "Paracetamol 650mg Tablets",
  "movement_type": "STOCK_IN",
  "quantity": 200,
  "previous_quantity": 250,
  "new_quantity": 450,
  "reason": "Quarterly restock purchase order #PO-2026-081",
  "performed_by": "Dr. Ramesh Gupta (Chief Pharmacist)",
  "timestamp": "2026-10-07T08:28:26.549210"
}
```

---

## 🔒 MongoDB JSON Schema Validation & Indexes

### Validation Rules (`$jsonSchema`)
Applied at collection creation time in `backend/scripts/setup_database.py`:
- `item_id`: Positive integer $\ge 1$ (Unique index constraint)
- `item_name`: Non-empty string, minimum length 2
- `category`: Must be strictly one of `["Medicine", "Equipment", "Supplies"]`
- `quantity`: Non-negative integer $\ge 0$
- `minimum_stock`: Non-negative integer $\ge 0$
- `unit_price`: Non-negative numeric $\ge 0.0$
- `location`: Non-empty string (mandatory storage bay/shelf)
- `supplier.email`: Valid email format via regex pattern `^.+@.+$`
- `stock_movements.movement_type`: Must be strictly one of `["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]`

### Indexes Implemented
- `inventory.item_id` (Unique): Enforces uniqueness of item IDs; provides $O(1)$ point lookups.
- `inventory.category`: Optimizes category filtering and `$group` aggregations.
- `inventory.quantity`: Enables fast index scans for low-stock and out-of-stock items.
- `inventory.expiry_date`: Accelerates range queries for expired and near-expiry medications.
- `inventory.supplier_id`: Accelerates supplier joins and referential integrity checks.
- `suppliers.supplier_id` (Unique): Enforces unique supplier identifiers.
- `stock_movements.movement_id` (Unique): Ensures sequential immutable transaction numbering.
- `stock_movements.item_id` & `stock_movements.timestamp`: Speeds up audit ledger queries and chronological sorting.

---

## 📊 8 MongoDB Aggregation Pipelines Implemented

| # | Report Name | Pipeline Stages | Purpose |
|---|---|---|---|
| 1 | **Category Summary** | `$project` $\rightarrow$ `$group` $\rightarrow$ `$project` $\rightarrow$ `$sort` | Calculates document count, units in stock, and total valuation per category. |
| 2 | **Total Inventory Valuation** | `$project` $\rightarrow$ `$group` (`_id: null`) $\rightarrow$ `$project` | Aggregates global hospital valuation, total physical units, and average price. |
| 3 | **Low-Stock Items** | `$match` (`$expr: { $lte: ["$quantity", "$minimum_stock"] }`) $\rightarrow$ `$addFields` $\rightarrow$ `$project` $\rightarrow$ `$sort` | Identifies items needing replenishment and computes shortage deficit. |
| 4 | **Expired Items** | `$match` (`expiry_date < today`, `category != Equipment`) $\rightarrow$ `$project` $\rightarrow$ `$sort` | Finds expired medications and calculates financial loss valuation. |
| 5 | **Supplier Summary** | `$match` $\rightarrow$ `$project` $\rightarrow$ `$group` $\rightarrow$ `$project` $\rightarrow$ `$sort` | Evaluates total items supplied and total financial volume per vendor. |
| 6 | **Top 5 Expensive Assets** | `$sort` (`unit_price: -1`) $\rightarrow$ `$limit: 5` $\rightarrow$ `$project` | Ranks top capital equipment and high-value pharmaceuticals. |
| 7 | **Movement Summary** | `$group` $\rightarrow$ `$project` $\rightarrow$ `$sort` | Summarizes intake vs dispatch transaction counts and total volume moved. |
| 8 | **Monthly Stock Trends** | `$project` (`$substrBytes: YYYY-MM`) $\rightarrow$ `$group` $\rightarrow$ `$group` $\rightarrow$ `$sort` | Tracks month-over-month stock inflow versus outflow trends. |

---

## 🚀 Installation & Running Guide

### 1. Prerequisites
- Python 3.11+
- Node.js v18+ & npm
- MongoDB Community Server running locally on `localhost:27017`

### 2. Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize MongoDB Collections, JSON Schema Validators, and Indexes
python scripts/setup_database.py

# Seed Demonstration Dataset (Idempotent)
python scripts/seed_data.py

# Run Automated Test Suite (Isolated test database: SmartHospitalDB_Test)
python run_tests.py

# Start FastAPI Backend Server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be active at: `http://127.0.0.1:8000`  
Interactive Swagger API documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

Frontend will be active at: `http://127.0.0.1:5173`

---

## 🧪 Automated Testing Results

The test suite runs against an isolated database (`SmartHospitalDB_Test`) to guarantee that production/development records are untouched.

Run command:
```bash
python backend/run_tests.py
```

### Verified Test Scenarios (10 Test Suites, 15 Scenarios):
1. ✅ Successful inventory item creation with computed stock and expiry statuses.
2. ✅ Retrieval of inventory by item ID and full-text keyword search.
3. ✅ Updating item details (quantity, price, location).
4. ✅ Deleting an item and confirming 404 response.
5. ✅ Duplicate `item_id` rejection with HTTP 409 Conflict.
6. ✅ Invalid category rejection with HTTP 422 Unprocessable Entity.
7. ✅ Negative quantity rejection with HTTP 422.
8. ✅ Missing required fields rejection with HTTP 422.
9. ✅ Low-stock report aggregation pipeline with shortage calculation.
10. ✅ Global inventory valuation aggregation pipeline.
11. ✅ `STOCK_IN` movement and atomic quantity increment.
12. ✅ `STOCK_OUT` movement and atomic quantity decrement.
13. ✅ Insufficient stock rejection (HTTP 400 Bad Request).
14. ✅ Expired medicine stock-out prevention block (HTTP 400).
15. ✅ Supplier CRUD and deletion protection when inventory items are linked.

**Execution Result:** `10 passed in 0.61s` (100% Pass Rate).

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and course information |
| `GET` | `/api/health` | Live MongoDB connection health check |
| `GET` | `/api/dashboard/stats` | Live KPI cards computed directly from MongoDB |
| `GET` | `/api/dashboard/recent-movements` | Latest 6 stock movement transactions |
| `GET` | `/api/dashboard/alerts` | Active low-stock and expiry risk alerts |
| `GET` | `/api/inventory` | Catalog listing with search, category, status, sort, pagination |
| `GET` | `/api/inventory/{item_id}` | Detailed single inventory item view |
| `POST` | `/api/inventory` | Create new item (enforces schema & unique item_id) |
| `PUT` | `/api/inventory/{item_id}` | Update existing item attributes |
| `DELETE` | `/api/inventory/{item_id}` | Delete item from catalog |
| `GET` | `/api/suppliers` | Suppliers directory with supplied item count and valuation |
| `GET` | `/api/suppliers/{supplier_id}` | Supplier profile with attached inventory items |
| `POST` | `/api/suppliers` | Register new medical supplier |
| `PUT` | `/api/suppliers/{supplier_id}` | Update supplier contact information |
| `DELETE` | `/api/suppliers/{supplier_id}` | Delete supplier (blocked if items attached) |
| `GET` | `/api/stock-movements` | Audit ledger with filters by item, type, and date |
| `POST` | `/api/stock-movements` | Execute stock movement (STOCK_IN, STOCK_OUT, ADJUSTMENT) |
| `GET` | `/api/reports/category-summary` | Aggregation Report 1: Category summary |
| `GET` | `/api/reports/inventory-value` | Aggregation Report 2: Global valuation |
| `GET` | `/api/reports/low-stock` | Aggregation Report 3: Low-stock items |
| `GET` | `/api/reports/expired` | Aggregation Report 4: Expired medications |
| `GET` | `/api/reports/supplier-summary` | Aggregation Report 5: Supplier distribution |
| `GET` | `/api/reports/top-expensive` | Aggregation Report 6: Top 5 expensive assets |
| `GET` | `/api/reports/movement-summary` | Aggregation Report 7: Movement volume summary |
| `GET` | `/api/reports/monthly-trends` | Aggregation Report 8: Monthly inflow vs outflow |

---

## 📂 Project Structure

```
smart hospital/
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment configuration & settings
│   │   ├── database.py            # MongoDB connection & ObjectId serializer
│   │   ├── main.py                # FastAPI app, lifespan, CORS, routes
│   │   ├── routes/                # REST endpoints
│   │   │   ├── dashboard.py
│   │   │   ├── inventory.py
│   │   │   ├── stock_movements.py
│   │   │   ├── suppliers.py
│   │   │   └── reports.py
│   │   ├── services/              # Business logic & PyMongo services
│   │   │   ├── inventory_service.py
│   │   │   ├── stock_service.py
│   │   │   ├── supplier_service.py
│   │   │   └── report_service.py
│   │   └── validators/
│   │       └── schemas.py         # Pydantic v2 validation models
│   ├── scripts/
│   │   ├── setup_database.py      # Schema validators & index initializers
│   │   ├── seed_data.py           # Demonstration dataset generator
│   │   └── reset_database.py      # Development cleanup utility
│   ├── tests/
│   │   ├── conftest.py            # Isolated test database fixture
│   │   └── test_all_requirements.py # 10 test suites / 15 scenarios
│   ├── run_tests.py               # Clean test runner script
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            # Badge, Modal, Feedback components
│   │   │   └── layout/            # Sidebar, Header, Layout components
│   │   ├── pages/                 # 7 main hospital views
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── StockMovements.jsx
│   │   │   ├── Suppliers.jsx
│   │   │   ├── ExpiryManagement.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── ProjectInfo.jsx
│   │   ├── services/
│   │   │   └── api.js             # Centralized Axios API client
│   │   ├── utils/
│   │   │   └── formatters.js      # INR currency & date formatting
│   │   ├── App.jsx                # Routing configuration
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── docs/
│   ├── PROJECT_REPORT.md          # 16-section comprehensive report
│   ├── VIVA_QUESTIONS.md          # 20+ viva questions & answers
│   ├── DEMO_SCRIPT.md             # 5–7 minute presentation guide
│   └── QUERY_REFERENCE.md         # Executable mongosh shell queries
└── README.md
```

---

## 👥 Course & Academic Deliverables Reference
- **Course:** CSE494 — Intelligent NoSQL Databases
- **Full Project Report:** [`docs/PROJECT_REPORT.md`](file:///c:/smart%20hospital/docs/PROJECT_REPORT.md)
- **Viva Preparation Guide:** [`docs/VIVA_QUESTIONS.md`](file:///c:/smart%20hospital/docs/VIVA_QUESTIONS.md)
- **Live Demo Sequence:** [`docs/DEMO_SCRIPT.md`](file:///c:/smart%20hospital/docs/DEMO_SCRIPT.md)
- **MongoDB Shell Reference:** [`docs/QUERY_REFERENCE.md`](file:///c:/smart%20hospital/docs/QUERY_REFERENCE.md)
