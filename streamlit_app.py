"""
Smart Hospital Inventory Management System — Streamlit Cloud Web Application
Course: CSE494 — Intelligent NoSQL Databases
Built with: Streamlit, MongoDB (PyMongo), Plotly Graph Objects
"""

import streamlit as st
import os
from datetime import datetime, date, timedelta
import plotly.graph_objects as go
from pymongo import MongoClient

# --- Page Configuration ---
st.set_page_config(
    page_title="Smart Hospital Inventory System | CSE494",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Custom Styling for Healthcare SaaS Theme ---
st.markdown("""
<style>
    .metric-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
</style>
""", unsafe_allow_html=True)

# --- Database Connection Logic (Supports Localhost, Streamlit Secrets & MongoDB Atlas) ---
try:
    import certifi
    CA_FILE = certifi.where()
except Exception:
    CA_FILE = None

def mask_uri(uri_str):
    """Mask password in URI for safe display."""
    if not uri_str:
        return ""
    if "@" in uri_str:
        parts = uri_str.split("@")
        prefix = parts[0]
        if ":" in prefix:
            proto, rest = prefix.split("://", 1) if "://" in prefix else ("", prefix)
            if ":" in rest:
                user, _ = rest.split(":", 1)
                prefix = f"{proto}://{user}:******" if proto else f"{user}:******"
        return f"{prefix}@{parts[1]}"
    return uri_str

def resolve_mongo_config():
    """
    Intelligently discover MongoDB connection settings across multiple sources:
    1. UI session state (user manual override)
    2. Streamlit Cloud Secrets (handles all casing, nested tables, or direct strings)
    3. Environment variables
    4. Localhost fallback
    """
    # 1. Direct UI input in session state
    if st.session_state.get("custom_mongo_uri"):
        custom_db = st.session_state.get("custom_db_name", "SmartHospitalDB")
        return st.session_state["custom_mongo_uri"].strip(), custom_db.strip(), "Direct UI Input"

    # 2. Inspect Streamlit secrets
    if hasattr(st, "secrets"):
        candidate_keys = [
            "MONGODB_URI", "mongodb_uri", "MONGO_URI", "mongo_uri",
            "MONGODB_URL", "mongodb_url", "MONGO_URL", "DATABASE_URL",
            "connection_string", "uri", "URI"
        ]
        # Direct key matches
        for k in candidate_keys:
            try:
                if k in st.secrets and str(st.secrets[k]).strip():
                    db_name = (
                        st.secrets.get("DATABASE_NAME") or
                        st.secrets.get("database_name") or
                        st.secrets.get("DB_NAME") or
                        "SmartHospitalDB"
                    )
                    return str(st.secrets[k]).strip(), str(db_name).strip(), f"st.secrets['{k}']"
            except Exception:
                pass

        # Nested tables like [mongo] or [mongodb] or [database]
        for sec in ["mongo", "mongodb", "database"]:
            try:
                if sec in st.secrets:
                    sec_obj = st.secrets[sec]
                    for sub_k in ["uri", "url", "connection_string", "MONGODB_URI"]:
                        if sub_k in sec_obj and str(sec_obj[sub_k]).strip():
                            db_name = sec_obj.get("db", sec_obj.get("database", "SmartHospitalDB"))
                            return str(sec_obj[sub_k]).strip(), str(db_name).strip(), f"st.secrets['{sec}']['{sub_k}']"
            except Exception:
                pass

        # Auto-scan: check if any string in secrets begins with mongodb:// or mongodb+srv://
        try:
            for k in st.secrets:
                val = st.secrets[k]
                if isinstance(val, str) and (val.strip().startswith("mongodb://") or val.strip().startswith("mongodb+srv://")):
                    return val.strip(), "SmartHospitalDB", f"st.secrets['{k}'] (auto-detected)"
        except Exception:
            pass

    # 3. Environment variables
    for env_k in ["MONGODB_URI", "MONGO_URI", "MONGODB_URL", "DATABASE_URL"]:
        val = os.getenv(env_k)
        if val and val.strip():
            db_name = os.getenv("DATABASE_NAME", "SmartHospitalDB")
            return val.strip(), db_name.strip(), f"os.environ['{env_k}']"

    # 4. Fallback: Localhost
    return "mongodb://localhost:27017/", "SmartHospitalDB", "Default (localhost:27017)"

@st.cache_resource(show_spinner=False)
def get_mongo_client(uri: str):
    """Instantiate MongoClient with proper SRV & SSL TLS configuration."""
    kwargs = {"serverSelectionTimeoutMS": 7000}
    if uri.startswith("mongodb+srv://") and CA_FILE:
        kwargs["tlsCAFile"] = CA_FILE
    return MongoClient(uri, **kwargs)

def connect_to_database():
    """Test ping and return connection status, db instance, and metadata."""
    uri, db_name, source = resolve_mongo_config()
    try:
        client = get_mongo_client(uri)
        client.admin.command("ping")
        return True, client[db_name], uri, db_name, source, ""
    except Exception as e:
        return False, None, uri, db_name, source, str(e)

# Helper for Currency
def format_inr(val):
    if val is None:
        return "₹0.00"
    return f"₹{float(val):,.2f}"

def format_date_str(d_str):
    if not d_str:
        return "N/A"
    return str(d_str)

# Compute stock and expiry status
def compute_statuses(doc):
    qty = doc.get("quantity", 0)
    min_stock = doc.get("minimum_stock", 0)
    cat = doc.get("category", "")
    exp_str = doc.get("expiry_date")

    if qty == 0:
        stock_status = "Out of Stock"
    elif qty <= min_stock:
        stock_status = "Low Stock"
    else:
        stock_status = "In Stock"

    today = date.today()
    if not exp_str or cat == "Equipment":
        expiry_status = "Non-Expiring"
    else:
        try:
            exp_date = datetime.strptime(str(exp_str), "%Y-%m-%d").date()
            days = (exp_date - today).days
            if days < 0:
                expiry_status = "Expired"
            elif days <= 7:
                expiry_status = "Expiring ≤ 7 Days"
            elif days <= 30:
                expiry_status = "Expiring ≤ 30 Days"
            elif days <= 90:
                expiry_status = "Expiring ≤ 90 Days"
            else:
                expiry_status = "Valid"
        except Exception:
            expiry_status = "Unknown"

    doc["stock_status"] = stock_status
    doc["expiry_status"] = expiry_status
    return doc

# --- Seed Demonstration Data Helper ---
def seed_demonstration_data(db):
    today = date.today()
    now_iso = datetime.utcnow().isoformat()

    demo_suppliers = [
        {"supplier_id": 101, "company_name": "Apex Medicare Pharma Ltd", "contact_person": "Dr. Rajesh Sharma", "email": "contact@apexmedicare.demo", "phone": "+91-98765-43210", "address": "New Delhi, India", "status": "Active"},
        {"supplier_id": 102, "company_name": "LifeLine Bio-Surgical Supplies", "contact_person": "Ms. Ananya Sengupta", "email": "orders@lifelinesurgical.demo", "phone": "+91-98111-22334", "address": "Bengaluru, Karnataka, India", "status": "Active"},
        {"supplier_id": 103, "company_name": "Meditech Precision Devices", "contact_person": "Mr. Vikram Patel", "email": "support@meditechdevices.demo", "phone": "+91-99222-33445", "address": "Kolkata, India", "status": "Active"},
        {"supplier_id": 104, "company_name": "Hindustan Medical Consumables", "contact_person": "Mrs. Priya Nambiar", "email": "sales@hindustanmedical.demo", "phone": "+91-97333-44556", "address": "Ahmedabad, Gujarat, India", "status": "Active"},
        {"supplier_id": 105, "company_name": "Global Care Diagnostic Systems", "contact_person": "Mr. Arvind Swamy", "email": "info@globalcarediagnostics.demo", "phone": "+91-96444-55667", "address": "Chennai, Tamil Nadu, India", "status": "Active"}
    ]
    for s in demo_suppliers:
        s["updated_at"] = now_iso
        db.suppliers.update_one({"supplier_id": s["supplier_id"]}, {"$set": s, "$setOnInsert": {"created_at": now_iso}}, upsert=True)

    demo_items = [
        {"item_id": 1001, "item_name": "Paracetamol 650mg Tablets", "category": "Medicine", "quantity": 450, "minimum_stock": 100, "unit_price": 2.50, "supplier_id": 101, "supplier_name": "Apex Medicare Pharma Ltd", "expiry_date": (today + timedelta(days=365)).isoformat(), "location": "Pharmacy Rack A-01", "description": "Analgesic & antipyretic tablets"},
        {"item_id": 1002, "item_name": "Amoxicillin 500mg Capsules", "category": "Medicine", "quantity": 18, "minimum_stock": 50, "unit_price": 8.75, "supplier_id": 101, "supplier_name": "Apex Medicare Pharma Ltd", "expiry_date": (today + timedelta(days=22)).isoformat(), "location": "Pharmacy Rack A-04", "description": "Antibiotic (LOW STOCK)"},
        {"item_id": 1003, "item_name": "Insulin Glargine 100 IU/ml", "category": "Medicine", "quantity": 5, "minimum_stock": 25, "unit_price": 420.00, "supplier_id": 101, "supplier_name": "Apex Medicare Pharma Ltd", "expiry_date": (today + timedelta(days=5)).isoformat(), "location": "Cold Storage Unit B-2", "description": "Basal insulin (CRITICAL STOCK)"},
        {"item_id": 1004, "item_name": "Ceftriaxone 1g Injection", "category": "Medicine", "quantity": 0, "minimum_stock": 30, "unit_price": 75.00, "supplier_id": 101, "supplier_name": "Apex Medicare Pharma Ltd", "expiry_date": (today + timedelta(days=180)).isoformat(), "location": "ICU Pharmacy", "description": "Third-gen cephalosporin (OUT OF STOCK)"},
        {"item_id": 1005, "item_name": "Azithromycin 250mg Suspension", "category": "Medicine", "quantity": 15, "minimum_stock": 20, "unit_price": 64.00, "supplier_id": 101, "supplier_name": "Apex Medicare Pharma Ltd", "expiry_date": (today - timedelta(days=45)).isoformat(), "location": "Quarantine Shelf Q-1", "description": "EXPIRED DEMONSTRATION ITEM"},
        {"item_id": 1006, "item_name": "Atorvastatin 20mg Tablets", "category": "Medicine", "quantity": 320, "minimum_stock": 80, "unit_price": 12.00, "supplier_id": 101, "supplier_name": "Apex Medicare Pharma Ltd", "expiry_date": (today + timedelta(days=540)).isoformat(), "location": "Pharmacy Rack B-02", "description": "Lipid-lowering statin"},
        {"item_id": 1007, "item_name": "Normal Saline 0.9% IV 500ml", "category": "Medicine", "quantity": 240, "minimum_stock": 100, "unit_price": 38.50, "supplier_id": 102, "supplier_name": "LifeLine Bio-Surgical Supplies", "expiry_date": (today + timedelta(days=400)).isoformat(), "location": "IV Fluid Bay C", "description": "Isotonic crystalloid solution"},
        {"item_id": 1008, "item_name": "Sterile Surgical Latex Gloves (7.5)", "category": "Supplies", "quantity": 850, "minimum_stock": 200, "unit_price": 28.00, "supplier_id": 102, "supplier_name": "LifeLine Bio-Surgical Supplies", "expiry_date": (today + timedelta(days=700)).isoformat(), "location": "Central Sterilization S-1", "description": "OT surgical gloves"},
        {"item_id": 1009, "item_name": "Disposable Syringes 5ml with Needle", "category": "Supplies", "quantity": 1200, "minimum_stock": 300, "unit_price": 6.50, "supplier_id": 104, "supplier_name": "Hindustan Medical Consumables", "expiry_date": (today + timedelta(days=800)).isoformat(), "location": "Central Stores D-10", "description": "Sterile hypodermic syringes"},
        {"item_id": 1010, "item_name": "Absorbent Cotton Gauze Roll (100m)", "category": "Supplies", "quantity": 12, "minimum_stock": 25, "unit_price": 310.00, "supplier_id": 104, "supplier_name": "Hindustan Medical Consumables", "expiry_date": (today + timedelta(days=300)).isoformat(), "location": "Dressing Room Depot", "description": "Cotton bandage (LOW STOCK)"},
        {"item_id": 1011, "item_name": "N95 Particulate Respirator Mask", "category": "Supplies", "quantity": 600, "minimum_stock": 150, "unit_price": 45.00, "supplier_id": 104, "supplier_name": "Hindustan Medical Consumables", "expiry_date": (today + timedelta(days=600)).isoformat(), "location": "PPE Shelf 3", "description": "5-layer face respirator"},
        {"item_id": 1012, "item_name": "Surgical Scalpel Blades #11", "category": "Supplies", "quantity": 140, "minimum_stock": 50, "unit_price": 18.00, "supplier_id": 102, "supplier_name": "LifeLine Bio-Surgical Supplies", "expiry_date": (today - timedelta(days=12)).isoformat(), "location": "OT Supply Locker 02", "description": "EXPIRED LOT"},
        {"item_id": 1013, "item_name": "Syringe Infusion Pump IP-800", "category": "Equipment", "quantity": 8, "minimum_stock": 5, "unit_price": 38500.00, "supplier_id": 103, "supplier_name": "Meditech Precision Devices", "expiry_date": None, "location": "ICU Room B", "description": "Dual-channel micro-infusion system"},
        {"item_id": 1014, "item_name": "Automated External Defibrillator (AED)", "category": "Equipment", "quantity": 3, "minimum_stock": 4, "unit_price": 125000.00, "supplier_id": 103, "supplier_name": "Meditech Precision Devices", "expiry_date": None, "location": "Trauma Bay 1", "description": "Cardiac defibrillator (LOW STOCK)"},
        {"item_id": 1015, "item_name": "Multi-Parameter Patient Vital Monitor", "category": "Equipment", "quantity": 12, "minimum_stock": 5, "unit_price": 74000.00, "supplier_id": 103, "supplier_name": "Meditech Precision Devices", "expiry_date": None, "location": "General Ward Floor 3", "description": "Touchscreen ECG & SpO2 monitor"},
        {"item_id": 1016, "item_name": "Fingertip Pulse Oximeter OLED", "category": "Equipment", "quantity": 35, "minimum_stock": 15, "unit_price": 1450.00, "supplier_id": 105, "supplier_name": "Global Care Diagnostic Systems", "expiry_date": None, "location": "Nursing Station 2", "description": "Digital oxygen saturation monitor"},
        {"item_id": 1017, "item_name": "Digital Non-Contact Infrared Thermometer", "category": "Equipment", "quantity": 22, "minimum_stock": 10, "unit_price": 1850.00, "supplier_id": 105, "supplier_name": "Global Care Diagnostic Systems", "expiry_date": None, "location": "Triage Reception Counter", "description": "Forehead medical sensor thermometer"},
        {"item_id": 1018, "item_name": "Ventilator Breathing Circuit (Reusable)", "category": "Equipment", "quantity": 6, "minimum_stock": 8, "unit_price": 14200.00, "supplier_id": 103, "supplier_name": "Meditech Precision Devices", "expiry_date": None, "location": "Respiratory Care Unit", "description": "Autoclavable tubing (LOW STOCK)"}
    ]
    for item in demo_items:
        item["updated_at"] = now_iso
        db.inventory.update_one({"item_id": item["item_id"]}, {"$set": item, "$setOnInsert": {"created_at": now_iso}}, upsert=True)

    demo_movements = [
        {"movement_id": 1, "item_id": 1001, "item_name": "Paracetamol 650mg Tablets", "movement_type": "STOCK_IN", "quantity": 200, "previous_quantity": 250, "new_quantity": 450, "reason": "Quarterly restock purchase order #PO-2026-081", "performed_by": "Dr. Ramesh Gupta", "timestamp": (datetime.utcnow() - timedelta(days=12)).isoformat()},
        {"movement_id": 2, "item_id": 1002, "item_name": "Amoxicillin 500mg Capsules", "movement_type": "STOCK_OUT", "quantity": 32, "previous_quantity": 50, "new_quantity": 18, "reason": "Dispensed to Inpatient Internal Medicine Ward", "performed_by": "Sister Mary Thomas", "timestamp": (datetime.utcnow() - timedelta(days=8)).isoformat()},
        {"movement_id": 3, "item_id": 1004, "item_name": "Ceftriaxone 1g Injection", "movement_type": "STOCK_OUT", "quantity": 15, "previous_quantity": 15, "new_quantity": 0, "reason": "Emergency surgery consumption batch dispatch", "performed_by": "Pharmacist Amit Roy", "timestamp": (datetime.utcnow() - timedelta(days=4)).isoformat()},
        {"movement_id": 4, "item_id": 1008, "item_name": "Sterile Surgical Latex Gloves (7.5)", "movement_type": "STOCK_IN", "quantity": 500, "previous_quantity": 350, "new_quantity": 850, "reason": "Monthly bulk delivery received from LifeLine", "performed_by": "Inventory Officer Suresh Kumar", "timestamp": (datetime.utcnow() - timedelta(days=2)).isoformat()},
        {"movement_id": 5, "item_id": 1014, "item_name": "Automated External Defibrillator (AED)", "movement_type": "ADJUSTMENT", "quantity": 1, "previous_quantity": 4, "new_quantity": 3, "reason": "Transferred unit to newly opened Cardiac Step-Down Unit", "performed_by": "Biomedical Engineer Priya Deshmukh", "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat()}
    ]
    for mov in demo_movements:
        db.stock_movements.update_one({"movement_id": mov["movement_id"]}, {"$set": mov}, upsert=True)

# --- Test Connection ---
db_connected, db, db_uri, db_name, db_source, db_error = connect_to_database()

# Connection Troubleshooting Assistant Component
def show_connection_assistant():
    st.error("🔴 MongoDB Database Connection Failed")
    st.markdown(f"""
    **Current Status:** Streamlit is unable to connect to MongoDB.
    - **Attempted Target:** `{mask_uri(db_uri)}`
    - **Config Source:** `{db_source}`
    - **Driver Error:** `{db_error}`
    """)

    st.info("💡 **Why did this happen?** Streamlit Community Cloud runs in a remote container that does not have local MongoDB installed on `localhost:27017`. You must connect it to a free **MongoDB Atlas cloud cluster**.")

    st.markdown("---")
    st.subheader("🔑 Instant Fix: Paste your MongoDB Atlas URI below")
    st.caption("You can paste your Atlas connection string here to immediately connect and test live.")

    with st.form("quick_atlas_connect_form"):
        pasted_uri = st.text_input(
            "MongoDB Atlas Connection String (SRV)",
            value=st.session_state.get("custom_mongo_uri", ""),
            type="password",
            placeholder="mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority",
            help="Found in MongoDB Atlas -> Database -> Connect -> Drivers (Python)"
        )
        pasted_db = st.text_input(
            "Database Name",
            value=st.session_state.get("custom_db_name", db_name or "SmartHospitalDB")
        )
        col_f1, col_f2 = st.columns(2)
        with col_f1:
            connect_btn = st.form_submit_button("🚀 Connect to Atlas Now", type="primary", use_container_width=True)
        with col_f2:
            reset_btn = st.form_submit_button("🔄 Re-check Streamlit Cloud Secrets", use_container_width=True)

        if connect_btn:
            if pasted_uri.strip():
                st.session_state["custom_mongo_uri"] = pasted_uri.strip()
                st.session_state["custom_db_name"] = pasted_db.strip()
                st.cache_resource.clear()
                st.rerun()
            else:
                st.warning("Please paste a valid MongoDB connection string.")
        if reset_btn:
            st.session_state.pop("custom_mongo_uri", None)
            st.cache_resource.clear()
            st.rerun()

    st.markdown("---")
    st.subheader("⚙️ Permanent Fix: Add Secrets in Streamlit Community Cloud")
    st.markdown("""
    To ensure the app stays connected permanently across browser sessions:
    
    1. Go to your deployed app on **[share.streamlit.io](https://share.streamlit.io/)**.
    2. Click the **`⋮` Settings** menu in the top right (or lower right 'Manage app') ➡️ select **Settings**.
    3. Click the **Secrets** tab in the modal.
    4. Paste the following configuration (substitute your real Atlas credentials):
    """)
    st.code('''MONGODB_URI = "mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority"
DATABASE_NAME = "SmartHospitalDB"
''', language="toml")
    st.markdown("""
    5. Click **Save**.
    6. In Streamlit Cloud, click the three dots `⋮` ➡️ **Reboot App** (or click the '🔄 Re-check Secrets' button above).
    """)

    st.markdown("---")
    st.subheader("🛡️ MongoDB Atlas Pre-Flight Checklist")
    st.markdown("""
    - **1. Network Access (IP Whitelist `0.0.0.0/0`):**
      In [MongoDB Atlas](https://cloud.mongodb.com/) ➡️ **Security** ➡️ **Network Access** ➡️ **Add IP Address** ➡️ click **Allow Access from Anywhere** (`0.0.0.0/0`) ➡️ click **Confirm**.
    - **2. Database User Password:**
      Ensure your password has no unencoded symbols like `@` or `#`. If it does, either change the password in Atlas to plain letters/numbers or URL-encode special characters.
    """)

with st.sidebar:
    st.markdown("### 🏥 Smart Hospital")
    st.caption("Inventory Intelligence System")
    st.markdown("---")
    st.markdown("**Course:** `CSE494 — NoSQL Databases`")

    if db_connected:
        st.success(f"🟢 Connected: `{db.name}`")
        doc_count = db.inventory.count_documents({})
        if doc_count == 0:
            st.warning("⚠️ Connected Atlas database is empty!")
            if st.button("🌱 Seed Demonstration Hospital Data", type="primary", use_container_width=True):
                seed_demonstration_data(db)
                st.toast("Demonstration hospital data successfully seeded!", icon="✅")
                st.rerun()
    else:
        st.error(f"🔴 DB Disconnected")
        st.caption(f"Source: {db_source}")
        st.caption(f"Target: `{mask_uri(db_uri)}`")

    page = st.radio(
        "Navigation Menu",
        [
            "📊 Dashboard",
            "📦 Inventory Catalog",
            "🔄 Stock Movements",
            "🏢 Suppliers Directory",
            "⚠️ Expiry Management",
            "📈 Reports & Aggregations",
            "ℹ️ Project Information"
        ]
    )

    st.markdown("---")
    with st.expander("⚙️ Database Connection Settings"):
        st.write(f"**Status:** {'🟢 Active' if db_connected else '🔴 Offline'}")
        st.write(f"**Source:** `{db_source}`")
        st.write(f"**Target:** `{mask_uri(db_uri)}`")
        if st.session_state.get("custom_mongo_uri"):
            if st.button("Disconnect UI Override", use_container_width=True):
                st.session_state.pop("custom_mongo_uri", None)
                st.cache_resource.clear()
                st.rerun()
        if st.button("🔄 Clear Client Cache & Reload", use_container_width=True):
            st.cache_resource.clear()
            st.rerun()

    if db_connected:
        if st.button("🌱 Reset Demonstration Data", use_container_width=True):
            seed_demonstration_data(db)
            st.toast("Demonstration data reloaded into MongoDB!", icon="✅")
            st.rerun()

# Guard all database pages against disconnection
if not db_connected and page != "ℹ️ Project Information":
    show_connection_assistant()
    st.stop()

# --- Page 1: Dashboard ---
if page == "📊 Dashboard":
    st.title("Hospital Administration Dashboard")
    st.caption("Live metrics aggregated dynamically from MongoDB collection `inventory`")
    today_iso = date.today().isoformat()
    next_30 = (date.today() + timedelta(days=30)).isoformat()

    # Aggregated KPI Queries
    total_unique = db.inventory.count_documents({})
    val_agg = list(db.inventory.aggregate([
        {"$group": {"_id": None, "total_units": {"$sum": "$quantity"}, "total_val": {"$sum": {"$multiply": ["$quantity", "$unit_price"]}}}}
    ]))
    total_units = val_agg[0]["total_units"] if val_agg else 0
    total_val = val_agg[0]["total_val"] if val_agg else 0.0

    low_stock_count = db.inventory.count_documents({"$expr": {"$lte": ["$quantity", "$minimum_stock"]}})
    out_of_stock_count = db.inventory.count_documents({"quantity": 0})
    expired_count = db.inventory.count_documents({"expiry_date": {"$ne": None, "$lt": today_iso}, "category": {"$ne": "Equipment"}})
    expiring_30_count = db.inventory.count_documents({"expiry_date": {"$gte": today_iso, "$lte": next_30}, "category": {"$ne": "Equipment"}})

    # KPI Metrics Row
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Unique Catalog Items", f"{total_unique} SKUs")
    c2.metric("Total Units in Stock", f"{total_units:,}")
    c3.metric("Low-Stock Alerts", f"{low_stock_count} items", delta="-Attention" if low_stock_count else None, delta_color="inverse")
    c4.metric("Out of Stock", f"{out_of_stock_count} items", delta="-Critical" if out_of_stock_count else None, delta_color="inverse")

    c5, c6, c7, c8 = st.columns(4)
    c5.metric("Expired Medicines", f"{expired_count} batches", delta="-Quarantine" if expired_count else None, delta_color="inverse")
    c6.metric("Expiring ≤ 30 Days", f"{expiring_30_count} items")
    c7.metric("Total Hospital Valuation", format_inr(total_val))
    c8.metric("Database Status", "MongoDB Active")

    st.markdown("---")

    # Visual Analytics
    col_chart1, col_chart2 = st.columns([3, 2])
    with col_chart1:
        st.subheader("Category-Wise Valuation & Units")
        cat_summary = list(db.inventory.aggregate([
            {"$project": {"category": 1, "quantity": 1, "val": {"$multiply": ["$quantity", "$unit_price"]}}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}, "units": {"$sum": "$quantity"}, "valuation": {"$sum": "$val"}}},
            {"$sort": {"valuation": -1}}
        ]))
        if cat_summary:
            cats = [c["_id"] for c in cat_summary]
            vals = [c["valuation"] for c in cat_summary]
            units = [c["units"] for c in cat_summary]

            fig_bar = go.Figure(data=[
                go.Bar(name='Valuation (₹)', x=cats, y=vals, marker_color='#0d9488'),
                go.Bar(name='Stock Units', x=cats, y=units, marker_color='#0284c7')
            ])
            fig_bar.update_layout(barmode='group', margin=dict(l=20, r=20, t=20, b=20), height=300)
            st.plotly_chart(fig_bar, use_container_width=True)

    with col_chart2:
        st.subheader("Inventory Distribution")
        if cat_summary:
            fig_pie = go.Figure(data=[
                go.Pie(labels=cats, values=units, hole=0.4, marker_colors=['#0d9488', '#0284c7', '#6366f1'])
            ])
            fig_pie.update_layout(margin=dict(l=20, r=20, t=20, b=20), height=300)
            st.plotly_chart(fig_pie, use_container_width=True)

    st.markdown("---")

    # Alerts & Recent Movements
    col_alerts, col_recent = st.columns(2)
    with col_alerts:
        st.subheader("⚠️ Critical Stock Alerts")
        low_items = list(db.inventory.find(
            {"$expr": {"$lte": ["$quantity", "$minimum_stock"]}},
            {"_id": 0, "item_id": 1, "item_name": 1, "quantity": 1, "minimum_stock": 1, "location": 1}
        ).sort("quantity", 1).limit(6))
        if low_items:
            st.dataframe(low_items, hide_index=True, use_container_width=True)
        else:
            st.info("All stock levels are optimal.")

    with col_recent:
        st.subheader("🕒 Recent Stock Movements")
        recent_movs = list(db.stock_movements.find(
            {},
            {"_id": 0, "movement_id": 1, "item_name": 1, "movement_type": 1, "quantity": 1, "performed_by": 1}
        ).sort("timestamp", -1).limit(6))
        if recent_movs:
            st.dataframe(recent_movs, hide_index=True, use_container_width=True)
        else:
            st.info("No stock transactions recorded.")

# --- Page 2: Inventory Catalog & CRUD ---
elif page == "📦 Inventory Catalog":
    st.title("Hospital Medical Inventory Catalog")
    st.caption("Full CRUD operations protected by MongoDB JSON Schema validation")

    col_s1, col_s2, col_s3 = st.columns([2, 1, 1])
    search_q = col_s1.text_input("🔍 Search Item Name, ID, or Location", "")
    cat_filter = col_s2.selectbox("Filter Category", ["All", "Medicine", "Equipment", "Supplies"])
    stock_filter = col_s3.selectbox("Stock Level", ["All", "In Stock", "Low Stock", "Out of Stock"])

    query = {}
    if search_q.strip():
        search_regex = {"$regex": search_q.strip(), "$options": "i"}
        if search_q.strip().isdigit():
            query["$or"] = [{"item_name": search_regex}, {"item_id": int(search_q.strip())}, {"location": search_regex}]
        else:
            query["$or"] = [{"item_name": search_regex}, {"location": search_regex}, {"description": search_regex}]

    if cat_filter != "All":
        query["category"] = cat_filter

    if stock_filter == "Out of Stock":
        query["quantity"] = 0
    elif stock_filter == "Low Stock":
        query["$expr"] = {"$and": [{"$lte": ["$quantity", "$minimum_stock"]}, {"$gt": ["$quantity", 0]}]}
    elif stock_filter == "In Stock":
        query["$expr"] = {"$gt": ["$quantity", "$minimum_stock"]}

    cursor = db.inventory.find(query).sort("item_id", 1)
    items = []
    for d in cursor:
        c = compute_statuses(d)
        items.append({
            "Item ID": c.get("item_id"),
            "Name": c.get("item_name"),
            "Category": c.get("category"),
            "Qty": c.get("quantity"),
            "Min": c.get("minimum_stock"),
            "Unit Price": format_inr(c.get("unit_price")),
            "Total Value": format_inr(c.get("quantity", 0) * c.get("unit_price", 0.0)),
            "Stock Status": c.get("stock_status"),
            "Expiry Status": c.get("expiry_status"),
            "Location": c.get("location")
        })

    if items:
        st.dataframe(items, hide_index=True, use_container_width=True)
    else:
        st.warning("No inventory items found matching current filters.")

    st.markdown("---")

    # CRUD Expanders
    t_add, t_edit, t_delete = st.tabs(["➕ Add New Item", "✏️ Edit Item Details", "🗑️ Delete Item"])

    with t_add:
        with st.form("form_add_item", clear_on_submit=True):
            st.markdown("#### Register New Item")
            ca, cb = st.columns(2)
            new_id = ca.number_input("Item ID (Positive Integer) *", min_value=1, step=1, value=1020)
            new_cat = cb.selectbox("Category *", ["Medicine", "Equipment", "Supplies"])
            new_name = st.text_input("Item Name *", placeholder="e.g. Ciprofloxacin 500mg Tablets")

            c1, c2, c3 = st.columns(3)
            new_qty = c1.number_input("Initial Quantity *", min_value=0, step=1, value=50)
            new_min = c2.number_input("Minimum Stock Threshold *", min_value=0, step=1, value=15)
            new_price = c3.number_input("Unit Price in INR (₹) *", min_value=0.0, step=0.5, value=25.0)

            c4, c5 = st.columns(2)
            new_loc = c4.text_input("Storage Location *", placeholder="e.g. Pharmacy Shelf D-3")
            new_exp = c5.date_input("Expiry Date (Optional for Equipment)", value=date.today() + timedelta(days=365))
            new_desc = st.text_area("Item Clinical Description", placeholder="Dosage, packaging details...")

            if st.form_submit_button("Save Item to Database"):
                if len(new_name.strip()) < 2:
                    st.error("Item name must be at least 2 characters.")
                elif not new_loc.strip():
                    st.error("Storage location is required.")
                elif db.inventory.find_one({"item_id": int(new_id)}):
                    st.error(f"Item ID {new_id} already exists (Duplicate Key Error).")
                else:
                    doc = {
                        "item_id": int(new_id),
                        "item_name": new_name.strip(),
                        "category": new_cat,
                        "quantity": int(new_qty),
                        "minimum_stock": int(new_min),
                        "unit_price": float(new_price),
                        "location": new_loc.strip(),
                        "expiry_date": new_exp.isoformat() if new_cat != "Equipment" else None,
                        "description": new_desc.strip(),
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    db.inventory.insert_one(doc)
                    st.success(f"Item #{new_id} ({new_name}) added successfully!")
                    st.rerun()

    with t_edit:
        st.markdown("#### Update Existing Item")
        edit_id = st.number_input("Enter Item ID to Edit", min_value=1, step=1, value=1001)
        existing = db.inventory.find_one({"item_id": int(edit_id)})
        if existing:
            with st.form("form_edit_item"):
                st.info(f"Editing: **{existing.get('item_name')}**")
                e_name = st.text_input("Item Name", value=existing.get("item_name", ""))
                e_col1, e_col2, e_col3 = st.columns(3)
                e_qty = e_col1.number_input("Current Quantity", min_value=0, step=1, value=existing.get("quantity", 0))
                e_min = e_col2.number_input("Minimum Stock", min_value=0, step=1, value=existing.get("minimum_stock", 0))
                e_price = e_col3.number_input("Unit Price (₹)", min_value=0.0, step=0.5, value=float(existing.get("unit_price", 0.0)))
                e_loc = st.text_input("Storage Location", value=existing.get("location", ""))
                
                if st.form_submit_button("Update Item"):
                    db.inventory.update_one(
                        {"item_id": int(edit_id)},
                        {"$set": {
                            "item_name": e_name.strip(),
                            "quantity": int(e_qty),
                            "minimum_stock": int(e_min),
                            "unit_price": float(e_price),
                            "location": e_loc.strip(),
                            "updated_at": datetime.utcnow().isoformat()
                        }}
                    )
                    st.success(f"Item #{edit_id} updated successfully!")
                    st.rerun()
        else:
            st.warning(f"No item with ID #{edit_id} found.")

    with t_delete:
        st.markdown("#### Delete Item")
        del_id = st.number_input("Enter Item ID to Delete", min_value=1, step=1, value=1001, key="del_id")
        del_item = db.inventory.find_one({"item_id": int(del_id)})
        if del_item:
            st.error(f"Target Item: **{del_item.get('item_name')}** (Category: {del_item.get('category')}, Quantity: {del_item.get('quantity')})")
            if st.button("Confirm Deletion", type="primary"):
                db.inventory.delete_one({"item_id": int(del_id)})
                st.success(f"Item #{del_id} deleted successfully.")
                st.rerun()

# --- Page 3: Stock Movements ---
elif page == "🔄 Stock Movements":
    st.title("Stock Movement Audit Ledger")
    st.caption("Immutable transaction records of intake, ward dispatches, and adjustments")

    with st.expander("➕ Record New Stock Movement (Intake / Dispatch)", expanded=True):
        inv_items = list(db.inventory.find({}, {"item_id": 1, "item_name": 1, "quantity": 1, "category": 1, "expiry_date": 1}).sort("item_id", 1))
        item_options = {f"#{i['item_id']} - {i['item_name']} (In Stock: {i['quantity']})": i for i in inv_items}

        selected_label = st.selectbox("Select Target Inventory Item", list(item_options.keys()))
        selected_item = item_options[selected_label]

        col_m1, col_m2 = st.columns(2)
        mov_type = col_m1.selectbox("Movement Type", ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"])
        mov_qty = col_m2.number_input("Quantity Units", min_value=1, step=1, value=10)

        col_m3, col_m4 = st.columns(2)
        mov_reason = col_m3.text_input("Audit Reason / Department", placeholder="e.g. Dispensed to Intensive Care Unit Bay 2")
        mov_operator = col_m4.text_input("Authorized Staff Member", placeholder="e.g. Sister Rita (Head Nurse)")

        if st.button("Execute Movement"):
            prev_qty = selected_item["quantity"]
            if mov_type == "STOCK_OUT" and selected_item.get("category") == "Medicine":
                exp_str = selected_item.get("expiry_date")
                if exp_str:
                    try:
                        exp_d = datetime.strptime(str(exp_str), "%Y-%m-%d").date()
                        if exp_d < date.today():
                            st.error(f"❌ SAFETY POLICY VIOLATION: Cannot issue expired medicine '{selected_item['item_name']}'. Expiry date ({exp_str}) has passed!")
                            st.stop()
                    except ValueError:
                        pass

            if mov_type == "STOCK_OUT" and prev_qty < mov_qty:
                st.error(f"❌ Insufficient Stock: Available: {prev_qty}, Requested: {mov_qty}")
            else:
                if mov_type == "STOCK_IN":
                    new_qty = prev_qty + mov_qty
                elif mov_type == "STOCK_OUT":
                    new_qty = prev_qty - mov_qty
                else:
                    new_qty = mov_qty

                last_mov = db.stock_movements.find_one(sort=[("movement_id", -1)])
                next_mov_id = (last_mov["movement_id"] + 1) if last_mov and "movement_id" in last_mov else 1

                now_iso = datetime.utcnow().isoformat()
                mov_doc = {
                    "movement_id": next_mov_id,
                    "item_id": selected_item["item_id"],
                    "item_name": selected_item["item_name"],
                    "movement_type": mov_type,
                    "quantity": int(mov_qty),
                    "previous_quantity": int(prev_qty),
                    "new_quantity": int(new_qty),
                    "reason": mov_reason.strip() or "Standard inventory transaction",
                    "performed_by": mov_operator.strip() or "Hospital Operator",
                    "timestamp": now_iso
                }

                db.inventory.update_one({"item_id": selected_item["item_id"]}, {"$set": {"quantity": new_qty, "updated_at": now_iso}})
                db.stock_movements.insert_one(mov_doc)
                st.success(f"✅ Movement #{next_mov_id} logged! Item stock updated from {prev_qty} to {new_qty}.")
                st.rerun()

    st.markdown("---")
    st.subheader("Audit Transaction Ledger")
    movements = list(db.stock_movements.find({}, {"_id": 0}).sort("timestamp", -1))
    if movements:
        st.dataframe(movements, hide_index=True, use_container_width=True)
    else:
        st.info("No movements recorded.")

# --- Page 4: Suppliers Directory ---
elif page == "🏢 Suppliers Directory":
    st.title("Authorized Medical Suppliers Directory")
    st.caption("Commercial pharmaceutical distributors and medical device vendors")

    suppliers = list(db.suppliers.find({}, {"_id": 0}).sort("supplier_id", 1))
    for s in suppliers:
        s_id = s["supplier_id"]
        items = list(db.inventory.find({"supplier_id": s_id}))
        s["item_count"] = len(items)
        s["valuation"] = round(sum(i.get("quantity", 0) * i.get("unit_price", 0.0) for i in items), 2)

    if suppliers:
        for s in suppliers:
            with st.container():
                c1, c2, c3 = st.columns([3, 2, 1])
                c1.markdown(f"### {s['company_name']} `#{s['supplier_id']}`")
                c1.markdown(f"**Contact:** {s.get('contact_person')} • 📧 {s.get('email')} • 📞 {s.get('phone')}")
                c1.caption(f"📍 {s.get('address')}")

                c2.metric("Supplied Items", f"{s['item_count']} SKUs")
                c2.metric("Stock Valuation", format_inr(s['valuation']))

                c3.markdown(f"**Status:** `{s.get('status', 'Active')}`")
                st.markdown("---")
    else:
        st.info("No suppliers found.")

# --- Page 5: Expiry Management ---
elif page == "⚠️ Expiry Management":
    st.title("Medication & Perishable Expiry Tracker")
    st.warning("⚠️ Academic Demonstration Notice: Expired pharmaceuticals are isolated and automatically rejected from stock dispatch.")

    today_iso = date.today().isoformat()
    expired_items = list(db.inventory.find({"expiry_date": {"$ne": None, "$lt": today_iso}, "category": {"$ne": "Equipment"}}))
    total_loss = sum(i.get("quantity", 0) * i.get("unit_price", 0.0) for i in expired_items)

    m1, m2, m3 = st.columns(3)
    m1.metric("Expired Batches", f"{len(expired_items)} items", delta="-Critical" if expired_items else None, delta_color="inverse")
    m2.metric("Total Financial Loss", format_inr(total_loss))
    m3.metric("Safety Policy", "STOCK_OUT Blocked")

    st.markdown("---")
    st.subheader("Expired Medication Quarantine List")
    if expired_items:
        formatted_exp = []
        for d in expired_items:
            c = compute_statuses(d)
            formatted_exp.append({
                "Item ID": c.get("item_id"),
                "Item Name": c.get("item_name"),
                "Category": c.get("category"),
                "Expiry Date": c.get("expiry_date"),
                "Units Remaining": c.get("quantity"),
                "Financial Loss": format_inr(c.get("quantity", 0) * c.get("unit_price", 0.0)),
                "Location": c.get("location")
            })
        st.dataframe(formatted_exp, hide_index=True, use_container_width=True)
    else:
        st.success("No expired items found in inventory.")

# --- Page 6: Reports & Aggregations ---
elif page == "📈 Reports & Aggregations":
    st.title("MongoDB Aggregation Pipelines & Analytics")
    st.caption("Native PyMongo multi-stage aggregation pipelines for Course CSE494")

    report_type = st.selectbox(
        "Select Aggregation Report",
        [
            "Report 1: Category Summary ($group by category)",
            "Report 2: Total Inventory Valuation ($group global)",
            "Report 3: Low-Stock Shortage Report ($expr)",
            "Report 4: Expired Items Loss Valuation ($match date)",
            "Report 5: Supplier Volume Summary ($group supplier)",
            "Report 6: Top 5 Expensive Assets ($sort unit_price)",
            "Report 7: Stock Movement Summary ($group movement_type)",
            "Report 8: Monthly Stock Inflow vs Outflow Trends"
        ]
    )

    st.markdown("---")

    if "Report 1" in report_type:
        pipeline = [
            {"$project": {"category": 1, "quantity": 1, "unit_price": 1, "item_valuation": {"$multiply": ["$quantity", "$unit_price"]}}},
            {"$group": {"_id": "$category", "category": {"$first": "$category"}, "item_count": {"$sum": 1}, "total_quantity": {"$sum": "$quantity"}, "total_valuation": {"$sum": "$item_valuation"}}},
            {"$sort": {"total_valuation": -1}}
        ]
        res = list(db.inventory.aggregate(pipeline))
        table_data = []
        for r in res:
            table_data.append({
                "Category": r.get("category"),
                "Catalog SKUs": r.get("item_count"),
                "Total Stock Units": r.get("total_quantity"),
                "Category Valuation": format_inr(r.get("total_valuation"))
            })
        st.dataframe(table_data, hide_index=True, use_container_width=True)

        with st.expander("🔍 View MongoDB Aggregation Pipeline JSON"):
            st.code(str(pipeline), language="json")

    elif "Report 2" in report_type:
        pipeline = [
            {"$project": {"line_val": {"$multiply": ["$quantity", "$unit_price"]}, "quantity": 1, "unit_price": 1}},
            {"$group": {"_id": None, "total_valuation": {"$sum": "$line_val"}, "total_units": {"$sum": "$quantity"}, "total_items": {"$sum": 1}, "avg_price": {"$avg": "$unit_price"}}}
        ]
        res = list(db.inventory.aggregate(pipeline))
        data = res[0] if res else {}
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Total Valuation", format_inr(data.get("total_valuation", 0)))
        c2.metric("Total Units", f"{data.get('total_units', 0):,}")
        c3.metric("Catalog SKUs", data.get("total_items", 0))
        c4.metric("Average Price", format_inr(data.get("avg_price", 0)))

        with st.expander("🔍 View MongoDB Aggregation Pipeline JSON"):
            st.code(str(pipeline), language="json")

    elif "Report 3" in report_type:
        pipeline = [
            {"$match": {"$expr": {"$lte": ["$quantity", "$minimum_stock"]}}},
            {"$project": {"_id": 0, "item_id": 1, "item_name": 1, "category": 1, "quantity": 1, "minimum_stock": 1, "shortage": {"$subtract": ["$minimum_stock", "$quantity"]}, "location": 1}},
            {"$sort": {"quantity": 1}}
        ]
        res = list(db.inventory.aggregate(pipeline))
        st.dataframe(res, hide_index=True, use_container_width=True)

        with st.expander("🔍 View MongoDB Aggregation Pipeline JSON"):
            st.code(str(pipeline), language="json")

    elif "Report 4" in report_type:
        today_iso = date.today().isoformat()
        pipeline = [
            {"$match": {"expiry_date": {"$ne": None, "$lt": today_iso}, "category": {"$ne": "Equipment"}}},
            {"$project": {"_id": 0, "item_id": 1, "item_name": 1, "category": 1, "expiry_date": 1, "quantity": 1, "unit_price": 1, "loss_valuation": {"$round": [{"$multiply": ["$quantity", "$unit_price"]}, 2]}, "location": 1}},
            {"$sort": {"expiry_date": 1}}
        ]
        res = list(db.inventory.aggregate(pipeline))
        formatted = []
        for r in res:
            formatted.append({
                "Item ID": r.get("item_id"),
                "Item Name": r.get("item_name"),
                "Category": r.get("category"),
                "Expiry Date": r.get("expiry_date"),
                "Expired Units": r.get("quantity"),
                "Loss Value": format_inr(r.get("loss_valuation")),
                "Location": r.get("location")
            })
        st.dataframe(formatted, hide_index=True, use_container_width=True)

        with st.expander("🔍 View MongoDB Aggregation Pipeline JSON"):
            st.code(str(pipeline), language="json")

    elif "Report 5" in report_type:
        pipeline = [
            {"$match": {"supplier_id": {"$ne": None}}},
            {"$group": {"_id": "$supplier_id", "supplier_name": {"$first": "$supplier_name"}, "total_items": {"$sum": 1}, "total_units": {"$sum": "$quantity"}, "total_val": {"$sum": {"$multiply": ["$quantity", "$unit_price"]}}}},
            {"$sort": {"total_val": -1}}
        ]
        res = list(db.inventory.aggregate(pipeline))
        formatted = []
        for r in res:
            formatted.append({
                "Supplier ID": r.get("_id"),
                "Supplier Name": r.get("supplier_name"),
                "Catalog SKUs": r.get("total_items"),
                "Total Stock Units": r.get("total_units"),
                "Supplied Valuation": format_inr(r.get("total_val"))
            })
        st.dataframe(formatted, hide_index=True, use_container_width=True)

        with st.expander("🔍 View MongoDB Aggregation Pipeline JSON"):
            st.code(str(pipeline), language="json")

    elif "Report 6" in report_type:
        pipeline = [
            {"$sort": {"unit_price": -1}},
            {"$limit": 5},
            {"$project": {"_id": 0, "item_id": 1, "item_name": 1, "category": 1, "unit_price": 1, "quantity": 1, "total_value": {"$multiply": ["$quantity", "$unit_price"]}}}
        ]
        res = list(db.inventory.aggregate(pipeline))
        formatted = []
        for r in res:
            formatted.append({
                "Item ID": r.get("item_id"),
                "Item Name": r.get("item_name"),
                "Category": r.get("category"),
                "Unit Price": format_inr(r.get("unit_price")),
                "Units Stocked": r.get("quantity"),
                "Total Asset Value": format_inr(r.get("total_value"))
            })
        st.dataframe(formatted, hide_index=True, use_container_width=True)

        with st.expander("🔍 View MongoDB Aggregation Pipeline JSON"):
            st.code(str(pipeline), language="json")

    elif "Report 7" in report_type:
        pipeline = [
            {"$group": {"_id": "$movement_type", "total_events": {"$sum": 1}, "total_units": {"$sum": "$quantity"}}},
            {"$sort": {"total_units": -1}}
        ]
        res = list(db.stock_movements.aggregate(pipeline))
        formatted = []
        for r in res:
            formatted.append({
                "Movement Type": r.get("_id"),
                "Transaction Events": r.get("total_events"),
                "Total Units Moved": r.get("total_units")
            })
        st.dataframe(formatted, hide_index=True, use_container_width=True)

        with st.expander("🔍 View MongoDB Aggregation Pipeline JSON"):
            st.code(str(pipeline), language="json")

    elif "Report 8" in report_type:
        pipeline = [
            {"$project": {"month": {"$substrBytes": ["$timestamp", 0, 7]}, "movement_type": 1, "quantity": 1}},
            {"$group": {"_id": {"month": "$month", "movement_type": "$movement_type"}, "total_quantity": {"$sum": "$quantity"}, "count": {"$sum": 1}}},
            {"$sort": {"_id.month": 1}}
        ]
        res = list(db.stock_movements.aggregate(pipeline))
        if res:
            months = list(dict.fromkeys(r["_id"]["month"] for r in res))
            in_data = {m: 0 for m in months}
            out_data = {m: 0 for m in months}
            for r in res:
                m = r["_id"]["month"]
                t = r["_id"]["movement_type"]
                q = r["total_quantity"]
                if t == "STOCK_IN":
                    in_data[m] = q
                elif t == "STOCK_OUT":
                    out_data[m] = q

            fig = go.Figure(data=[
                go.Bar(name='STOCK_IN Units', x=months, y=[in_data[m] for m in months], marker_color='#0d9488'),
                go.Bar(name='STOCK_OUT Units', x=months, y=[out_data[m] for m in months], marker_color='#e11d48')
            ])
            fig.update_layout(barmode='group', height=350)
            st.plotly_chart(fig, use_container_width=True)

        with st.expander("🔍 View MongoDB Aggregation Pipeline JSON"):
            st.code(str(pipeline), language="json")

# --- Page 7: Project Information ---
elif page == "ℹ️ Project Information":
    st.title("Course Project Architecture & Viva Specifications")
    st.markdown("### CSE494 — Intelligent NoSQL Databases")
    st.markdown("""
    #### 🏥 Smart Hospital Inventory Management System
    - **Database Name:** `SmartHospitalDB`
    - **Primary Driver:** `PyMongo` (Direct Native Driver — No ORM/ODM)
    - **Cloud Deployment:** Streamlit Community Cloud + MongoDB Atlas
    
    #### Collections & Validators Implemented:
    1. **`inventory`:** Stores medicines, equipment, and supplies with schema constraints on `item_id >= 1`, non-negative quantities, and unit prices.
    2. **`suppliers`:** Authorized vendors with email format regex matching and postal details.
    3. **`stock_movements`:** Immutable transaction ledger tracking stock in, dispatch, and adjustment with strict non-negative rules.

    #### Indexes Applied:
    - `inventory.item_id` (Unique B-Tree)
    - `inventory.category`, `inventory.quantity`, `inventory.expiry_date`, `inventory.supplier_id`
    - `suppliers.supplier_id` (Unique B-Tree)
    - `stock_movements.movement_id` (Unique B-Tree), `item_id`, `timestamp`
    """)
