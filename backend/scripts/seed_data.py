"""
Demonstration Dataset Seed Script for Smart Hospital Inventory Management System.
Course: CSE494 Intelligent NoSQL Databases
NOTE: ALL DATA IS FICTIONAL DEMONSTRATION DATA FOR ACADEMIC TESTING ONLY.
"""

import sys
import os
from datetime import datetime, date, timedelta
from pymongo import MongoClient

# Allow running directly as script
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings

DEMO_SUPPLIERS = [
    {
        "supplier_id": 101,
        "company_name": "Apex Medicare Pharma Ltd",
        "contact_person": "Dr. Rajesh Sharma",
        "email": "contact@apexmedicare.demo",
        "phone": "+91-98765-43210",
        "address": "Plot 42, Okhla Industrial Area Phase-III, New Delhi, India",
        "status": "Active"
    },
    {
        "supplier_id": 102,
        "company_name": "LifeLine Bio-Surgical Supplies",
        "contact_person": "Ms. Ananya Sengupta",
        "email": "orders@lifelinesurgical.demo",
        "phone": "+91-98111-22334",
        "address": "12/B Sector 18, Electronic City, Bengaluru, Karnataka, India",
        "status": "Active"
    },
    {
        "supplier_id": 103,
        "company_name": "Meditech Precision Devices",
        "contact_person": "Mr. Vikram Patel",
        "email": "support@meditechdevices.demo",
        "phone": "+91-99222-33445",
        "address": "B-404 Godrej Genesis, Salt Lake Sector V, Kolkata, India",
        "status": "Active"
    },
    {
        "supplier_id": 104,
        "company_name": "Hindustan Medical Consumables",
        "contact_person": "Mrs. Priya Nambiar",
        "email": "sales@hindustanmedical.demo",
        "phone": "+91-97333-44556",
        "address": "GIDC Estate, Phase II, Vatva, Ahmedabad, Gujarat, India",
        "status": "Active"
    },
    {
        "supplier_id": 105,
        "company_name": "Global Care Diagnostic Systems",
        "contact_person": "Mr. Arvind Swamy",
        "email": "info@globalcarediagnostics.demo",
        "phone": "+91-96444-55667",
        "address": "77 Anna Salai, Guindy, Chennai, Tamil Nadu, India",
        "status": "Active"
    }
]

def generate_demo_items():
    today = date.today()
    return [
        # --- MEDICINES ---
        {
            "item_id": 1001,
            "item_name": "Paracetamol 650mg Tablets",
            "category": "Medicine",
            "quantity": 450,
            "minimum_stock": 100,
            "unit_price": 2.50,
            "supplier_id": 101,
            "supplier_name": "Apex Medicare Pharma Ltd",
            "expiry_date": (today + timedelta(days=365)).isoformat(),
            "location": "Pharmacy Rack A-01",
            "description": "Analgesic and antipyretic tablets for general fever and pain relief"
        },
        {
            "item_id": 1002,
            "item_name": "Amoxicillin 500mg Capsules",
            "category": "Medicine",
            "quantity": 18,
            "minimum_stock": 50,
            "unit_price": 8.75,
            "supplier_id": 101,
            "supplier_name": "Apex Medicare Pharma Ltd",
            "expiry_date": (today + timedelta(days=22)).isoformat(), # Expiring in < 30 days
            "location": "Pharmacy Rack A-04",
            "description": "Broad-spectrum beta-lactam antibiotic for bacterial infections (LOW STOCK)"
        },
        {
            "item_id": 1003,
            "item_name": "Insulin Glargine 100 IU/ml",
            "category": "Medicine",
            "quantity": 5,
            "minimum_stock": 25,
            "unit_price": 420.00,
            "supplier_id": 101,
            "supplier_name": "Apex Medicare Pharma Ltd",
            "expiry_date": (today + timedelta(days=5)).isoformat(), # Expiring in 5 days!
            "location": "Cold Storage Unit B-2",
            "description": "Long-acting basal insulin analog for diabetes management (CRITICAL STOCK)"
        },
        {
            "item_id": 1004,
            "item_name": "Ceftriaxone 1g Injection",
            "category": "Medicine",
            "quantity": 0,
            "minimum_stock": 30,
            "unit_price": 75.00,
            "supplier_id": 101,
            "supplier_name": "Apex Medicare Pharma Ltd",
            "expiry_date": (today + timedelta(days=180)).isoformat(),
            "location": "ICU Satellite Pharmacy",
            "description": "Third-generation cephalosporin injectable antibiotic (OUT OF STOCK)"
        },
        {
            "item_id": 1005,
            "item_name": "Azithromycin 250mg Suspension",
            "category": "Medicine",
            "quantity": 15,
            "minimum_stock": 20,
            "unit_price": 64.00,
            "supplier_id": 101,
            "supplier_name": "Apex Medicare Pharma Ltd",
            "expiry_date": (today - timedelta(days=45)).isoformat(), # EXPIRED DEMO RECORD
            "location": "Quarantine Shelf Q-1",
            "description": "Pediatric macrolide antibiotic - EXPIRED DEMONSTRATION ITEM"
        },
        {
            "item_id": 1006,
            "item_name": "Atorvastatin 20mg Tablets",
            "category": "Medicine",
            "quantity": 320,
            "minimum_stock": 80,
            "unit_price": 12.00,
            "supplier_id": 101,
            "supplier_name": "Apex Medicare Pharma Ltd",
            "expiry_date": (today + timedelta(days=540)).isoformat(),
            "location": "Pharmacy Rack B-02",
            "description": "Lipid-lowering HMG-CoA reductase inhibitor"
        },
        {
            "item_id": 1007,
            "item_name": "Normal Saline 0.9% IV 500ml",
            "category": "Medicine",
            "quantity": 240,
            "minimum_stock": 100,
            "unit_price": 38.50,
            "supplier_id": 102,
            "supplier_name": "LifeLine Bio-Surgical Supplies",
            "expiry_date": (today + timedelta(days=400)).isoformat(),
            "location": "IV Fluid Bay C",
            "description": "Isotonic crystalloid solution for electrolyte and fluid replacement"
        },

        # --- SUPPLIES ---
        {
            "item_id": 1008,
            "item_name": "Sterile Surgical Latex Gloves (Size 7.5)",
            "category": "Supplies",
            "quantity": 850,
            "minimum_stock": 200,
            "unit_price": 28.00,
            "supplier_id": 102,
            "supplier_name": "LifeLine Bio-Surgical Supplies",
            "expiry_date": (today + timedelta(days=700)).isoformat(),
            "location": "Central Sterilization Store S-1",
            "description": "Pre-powdered sterile surgical gloves for operation theatres"
        },
        {
            "item_id": 1009,
            "item_name": "Disposable Syringes 5ml with Needle",
            "category": "Supplies",
            "quantity": 1200,
            "minimum_stock": 300,
            "unit_price": 6.50,
            "supplier_id": 104,
            "supplier_name": "Hindustan Medical Consumables",
            "expiry_date": (today + timedelta(days=800)).isoformat(),
            "location": "Central Stores Rack D-10",
            "description": "Sterile, non-toxic, pyrogen-free hypodermic syringes"
        },
        {
            "item_id": 1010,
            "item_name": "Absorbent Cotton Gauze Roll (100m)",
            "category": "Supplies",
            "quantity": 12,
            "minimum_stock": 25,
            "unit_price": 310.00,
            "supplier_id": 104,
            "supplier_name": "Hindustan Medical Consumables",
            "expiry_date": (today + timedelta(days=300)).isoformat(),
            "location": "Dressing Room Supply Depot",
            "description": "High absorption medical cotton bandage rolls (LOW STOCK)"
        },
        {
            "item_id": 1011,
            "item_name": "N95 Particulate Respirator Mask",
            "category": "Supplies",
            "quantity": 600,
            "minimum_stock": 150,
            "unit_price": 45.00,
            "supplier_id": 104,
            "supplier_name": "Hindustan Medical Consumables",
            "expiry_date": (today + timedelta(days=600)).isoformat(),
            "location": "PPE Supply Depot Shelf 3",
            "description": "NIOSH-certified 5-layer protective face respirator"
        },
        {
            "item_id": 1012,
            "item_name": "Surgical Scalpel Blades #11",
            "category": "Supplies",
            "quantity": 140,
            "minimum_stock": 50,
            "unit_price": 18.00,
            "supplier_id": 102,
            "supplier_name": "LifeLine Bio-Surgical Supplies",
            "expiry_date": (today - timedelta(days=12)).isoformat(), # EXPIRED DEMO RECORD
            "location": "OT Supply Locker 02",
            "description": "Sterile carbon steel surgical blades - EXPIRED LOT"
        },

        # --- EQUIPMENT ---
        {
            "item_id": 1013,
            "item_name": "Syringe Infusion Pump Model IP-800",
            "category": "Equipment",
            "quantity": 8,
            "minimum_stock": 5,
            "unit_price": 38500.00,
            "supplier_id": 103,
            "supplier_name": "Meditech Precision Devices",
            "expiry_date": None, # Non-expiring equipment
            "location": "ICU Equipment Room B",
            "description": "Dual-channel micro-infusion continuous intravenous delivery system"
        },
        {
            "item_id": 1014,
            "item_name": "Automated External Defibrillator (AED)",
            "category": "Equipment",
            "quantity": 3,
            "minimum_stock": 4,
            "unit_price": 125000.00,
            "supplier_id": 103,
            "supplier_name": "Meditech Precision Devices",
            "expiry_date": None,
            "location": "Emergency Trauma Bay 1",
            "description": "Biphasic portable cardiac defibrillator with voice prompts (LOW STOCK)"
        },
        {
            "item_id": 1015,
            "item_name": "Multi-Parameter Patient Vital Monitor",
            "category": "Equipment",
            "quantity": 12,
            "minimum_stock": 5,
            "unit_price": 74000.00,
            "supplier_id": 103,
            "supplier_name": "Meditech Precision Devices",
            "expiry_date": None,
            "location": "General Ward Floor 3",
            "description": "12.1 inch touchscreen ECG, SpO2, NIBP, Respiration and Temp monitor"
        },
        {
            "item_id": 1016,
            "item_name": "Fingertip Pulse Oximeter OLED",
            "category": "Equipment",
            "quantity": 35,
            "minimum_stock": 15,
            "unit_price": 1450.00,
            "supplier_id": 105,
            "supplier_name": "Global Care Diagnostic Systems",
            "expiry_date": None,
            "location": "OPD Nursing Station 2",
            "description": "Digital oxygen saturation and heart pulse rate monitor"
        },
        {
            "item_id": 1017,
            "item_name": "Digital Non-Contact Infrared Thermometer",
            "category": "Equipment",
            "quantity": 22,
            "minimum_stock": 10,
            "unit_price": 1850.00,
            "supplier_id": 105,
            "supplier_name": "Global Care Diagnostic Systems",
            "expiry_date": None,
            "location": "Triage Reception Counter",
            "description": "Medical forehead sensor thermometer with color alarm"
        },
        {
            "item_id": 1018,
            "item_name": "Ventilator Breathing Circuit (Reusable)",
            "category": "Equipment",
            "quantity": 6,
            "minimum_stock": 8,
            "unit_price": 14200.00,
            "supplier_id": 103,
            "supplier_name": "Meditech Precision Devices",
            "expiry_date": None,
            "location": "Respiratory Care Unit",
            "description": "Autoclavable silicone dual limb adult ventilator tubing circuit (LOW STOCK)"
        }
    ]

def generate_demo_movements():
    now = datetime.utcnow()
    return [
        {
            "movement_id": 1,
            "item_id": 1001,
            "item_name": "Paracetamol 650mg Tablets",
            "movement_type": "STOCK_IN",
            "quantity": 200,
            "previous_quantity": 250,
            "new_quantity": 450,
            "reason": "Quarterly restock purchase order #PO-2026-081",
            "performed_by": "Dr. Ramesh Gupta (Chief Pharmacist)",
            "timestamp": (now - timedelta(days=12)).isoformat()
        },
        {
            "movement_id": 2,
            "item_id": 1002,
            "item_name": "Amoxicillin 500mg Capsules",
            "movement_type": "STOCK_OUT",
            "quantity": 32,
            "previous_quantity": 50,
            "new_quantity": 18,
            "reason": "Dispensed to Inpatient Internal Medicine Ward",
            "performed_by": "Sister Mary Thomas (Head Nurse)",
            "timestamp": (now - timedelta(days=8)).isoformat()
        },
        {
            "movement_id": 3,
            "item_id": 1004,
            "item_name": "Ceftriaxone 1g Injection",
            "movement_type": "STOCK_OUT",
            "quantity": 15,
            "previous_quantity": 15,
            "new_quantity": 0,
            "reason": "Emergency surgery consumption batch dispatch",
            "performed_by": "Pharmacist Amit Roy",
            "timestamp": (now - timedelta(days=4)).isoformat()
        },
        {
            "movement_id": 4,
            "item_id": 1008,
            "item_name": "Sterile Surgical Latex Gloves (Size 7.5)",
            "movement_type": "STOCK_IN",
            "quantity": 500,
            "previous_quantity": 350,
            "new_quantity": 850,
            "reason": "Monthly bulk delivery received from LifeLine",
            "performed_by": "Inventory Officer Suresh Kumar",
            "timestamp": (now - timedelta(days=2)).isoformat()
        },
        {
            "movement_id": 5,
            "item_id": 1014,
            "item_name": "Automated External Defibrillator (AED)",
            "movement_type": "ADJUSTMENT",
            "quantity": 1,
            "previous_quantity": 4,
            "new_quantity": 3,
            "reason": "Transferred unit to newly opened Cardiac Step-Down Unit",
            "performed_by": "Biomedical Engineer Priya Deshmukh",
            "timestamp": (now - timedelta(days=1)).isoformat()
        }
    ]

def seed_database():
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.DATABASE_NAME]

    supp_col = db["suppliers"]
    inv_col = db["inventory"]
    mov_col = db["stock_movements"]

    now_iso = datetime.utcnow().isoformat()

    # 1. Seed Suppliers (Idempotent upsert by supplier_id)
    print(f"Seeding {len(DEMO_SUPPLIERS)} demonstration suppliers...")
    for s in DEMO_SUPPLIERS:
        s_data = dict(s)
        s_data["updated_at"] = now_iso
        supp_col.update_one(
            {"supplier_id": s["supplier_id"]},
            {
                "$set": s_data,
                "$setOnInsert": {"created_at": now_iso}
            },
            upsert=True
        )
    print(f"Suppliers count: {supp_col.count_documents({})}")

    # 2. Seed Inventory Items (Idempotent upsert by item_id)
    items = generate_demo_items()
    print(f"Seeding {len(items)} demonstration inventory items...")
    for item in items:
        item_data = dict(item)
        item_data["updated_at"] = now_iso
        inv_col.update_one(
            {"item_id": item["item_id"]},
            {
                "$set": item_data,
                "$setOnInsert": {"created_at": now_iso}
            },
            upsert=True
        )
    print(f"Inventory items count: {inv_col.count_documents({})}")

    # 3. Seed Stock Movements (Idempotent upsert by movement_id)
    movements = generate_demo_movements()
    print(f"Seeding {len(movements)} demonstration stock movements...")
    for mov in movements:
        mov_col.update_one(
            {"movement_id": mov["movement_id"]},
            {"$set": mov},
            upsert=True
        )
    print(f"Stock movements count: {mov_col.count_documents({})}")

    print("\nDemonstration dataset successfully seeded into SmartHospitalDB!")
    client.close()

if __name__ == "__main__":
    seed_database()
