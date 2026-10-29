# Smart Hospital Inventory Management System — Live Demonstration Script
**Target Duration:** 5–7 Minutes  
**Course:** CSE494 — Intelligent NoSQL Databases  
**Evaluation Focus:** Schema Validation, CRUD Operations, Stock Movement Consistency, Aggregation Pipelines

---

## Pre-Demo Checklist
1. Ensure MongoDB service is running: `Get-Service MongoDB`
2. Start FastAPI Backend: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` (in `backend/`)
3. Start Vite Frontend: `npm run dev` (in `frontend/`)
4. Open Chrome / Edge browser to: `http://127.0.0.1:5173`
5. Open interactive API docs in a secondary tab: `http://127.0.0.1:8000/docs`

---

## Minute 0:00 – 1:00: Introduction & Architecture
- **Spoken Points:**
  - *"Good morning/afternoon evaluators. Today I am presenting the Smart Hospital Inventory Management System, developed for CSE494 Intelligent NoSQL Databases."*
  - *"Hospital inventories require handling diverse assets — ranging from perishable antibiotics to durable ventilators. We chose MongoDB for its polymorphic document structure, expressive aggregation pipelines, and JSON Schema validation."*
  - *"Our stack uses React and Vite on the client, Python 3.11 with FastAPI and PyMongo on the server, and MongoDB 8.x for data persistence."*
- **Action:**
  - Navigate to the **Project Information** page (`/project-info`).
  - Highlight the architecture matrix, the 3 collections (`inventory`, `suppliers`, `stock_movements`), and the active index table.

---

## Minute 1:00 – 2:30: Live Dashboard & Real-Time Aggregations
- **Spoken Points:**
  - *"Here on the Dashboard, every single metric is calculated dynamically from MongoDB. There are zero hardcoded statistics."*
  - *"We see total unique catalog items, current stock units, critical low-stock items, expired batches, and total inventory valuation in Indian Rupees (₹)."*
  - *"Notice the two Recharts visualizations: a category-wise valuation bar chart and a stock distribution pie chart, derived via MongoDB's `$group` pipeline stage."*
- **Action:**
  - Point out the KPI cards.
  - Show the **Stock Replenishment Alerts** panel and the **Expiry Risk Alerts** panel.
  - Click the **Refresh** button to demonstrate live polling.

---

## Minute 2:30 – 4:00: Inventory Management & Schema Validation
- **Spoken Points:**
  - *"Now let's inspect the Inventory Catalog page (`/inventory`). Here we have full CRUD functionality, server-side pagination, search, and multi-dimensional filtering."*
  - *"Let's demonstrate MongoDB's natural key enforcement and JSON Schema validation."*
- **Action:**
  - Search for `"Paracetamol"` in the search bar. Observe instant table filtering.
  - Click **Add New Item**:
    - Enter Item ID: `1001` (an existing ID). Attempt to save.
    - Show the error banner: `"Item ID 1001 already exists in inventory (HTTP 409 Conflict)"`.
    - Change ID to `1099`, Name: `"Ciprofloxacin 500mg"`, Category: `Medicine`, Quantity: `100`, Min Stock: `20`, Unit Price: `14.50`, Location: `"Pharmacy Bay 4"`.
    - Click **Save to Database**. Show that the item immediately appears with an `"In Stock"` badge.
  - Click the **Eye icon** (View Details) on the newly added item to show batch metadata, storage location, and line valuation.

---

## Minute 4:00 – 5:30: Stock Movement Ledger & Medication Safety Enforcement
- **Spoken Points:**
  - *"In a hospital, auditing every transaction is critical. Let's navigate to Stock Movements (`/movements`)."*
  - *"The application enforces two strict rules: stock cannot drop below zero, and expired medication cannot be dispensed."*
- **Action:**
  - Click **Record Movement**.
  - **Scenario A (Insufficient Stock):** Select an item with low stock (e.g., Ceftriaxone or Amoxicillin). Select `STOCK_OUT`, enter quantity `500`.
    - Submit. Show the error: `"Insufficient stock available. Requested: 500"`.
  - **Scenario B (Expired Drug Safety Block):** Select an expired medicine (e.g., Azithromycin 250mg Suspension).
    - Select `STOCK_OUT`, enter quantity `2`.
    - Submit. Show that the backend blocks the transaction: `"Cannot issue expired medicine. Expiry date has passed."`
  - **Scenario C (Valid STOCK_IN):** Select an item, choose `STOCK_IN`, enter `50`, reason: `"Quarterly intake PO-2026-901"`, Operator: `"Dr. Rajesh"`.
    - Submit. Show the newly created transaction in the audit table with stock transition from previous to new quantity.

---

## Minute 5:30 – 7:00: 8 Aggregation Pipelines & Automated Pytest Suite
- **Spoken Points:**
  - *"Under Reports & Analytics (`/reports`), we have implemented all 8 required MongoDB aggregation pipelines."*
  - *"Each report provides an interactive chart or data table, along with an 'Aggregation Pipeline Explained' card displaying the exact stages: `$project`, `$group`, `$match`, and `$sort`."*
- **Action:**
  - Click through **Report 1** (Category Summary), **Report 2** (Total Valuation), **Report 5** (Supplier Summary), and **Report 8** (Monthly Trends).
  - Click **View Pipeline JSON** to reveal the raw pipeline stages executed by PyMongo.
  - Switch to terminal: run `python backend/run_tests.py`.
  - Show the evaluator that all 10 automated test suites (15 requirement scenarios) execute against an isolated test database (`SmartHospitalDB_Test`) and pass with 100% success rate in under 1 second.

---

## Concluding Remarks
- *"To conclude, the Smart Hospital Inventory Management System fulfills all requirements of CSE494: rigorous JSON Schema validation, indexed natural keys, transactional stock integrity, PyMongo service architecture, and rich aggregation analytics. Thank you, and I am now ready for viva questions."*
