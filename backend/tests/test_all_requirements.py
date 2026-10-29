import pytest
from datetime import date, timedelta

def test_inventory_creation_and_retrieval(client, mongo_test_db):
    # 1. Successful inventory creation
    payload = {
        "item_id": 9001,
        "item_name": "Test Amoxicillin 250mg",
        "category": "Medicine",
        "quantity": 100,
        "minimum_stock": 20,
        "unit_price": 15.50,
        "location": "Test Pharmacy Shelf 1",
        "expiry_date": (date.today() + timedelta(days=120)).isoformat(),
        "description": "Created during automated test"
    }
    res = client.post("/api/inventory", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["item_id"] == 9001
    assert data["item_name"] == "Test Amoxicillin 250mg"
    assert data["stock_status"] == "In Stock"

    # 2. Retrieval of inventory by ID
    get_res = client.get("/api/inventory/9001")
    assert get_res.status_code == 200
    assert get_res.json()["item_name"] == "Test Amoxicillin 250mg"

    # Retrieval list
    list_res = client.get("/api/inventory?search=Amoxicillin")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

def test_inventory_update_and_delete(client, mongo_test_db):
    # Create item
    payload = {
        "item_id": 9002,
        "item_name": "Test Saline Solution",
        "category": "Medicine",
        "quantity": 50,
        "minimum_stock": 10,
        "unit_price": 25.00,
        "location": "Bay 3",
        "expiry_date": (date.today() + timedelta(days=200)).isoformat()
    }
    client.post("/api/inventory", json=payload)

    # 3. Updating item details
    update_res = client.put("/api/inventory/9002", json={"quantity": 40, "unit_price": 30.00})
    assert update_res.status_code == 200
    assert update_res.json()["quantity"] == 40
    assert update_res.json()["unit_price"] == 30.00

    # 4. Deleting an item
    del_res = client.delete("/api/inventory/9002")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Verify 404 after deletion
    check_res = client.get("/api/inventory/9002")
    assert check_res.status_code == 404

def test_duplicate_item_id_rejection(client, mongo_test_db):
    # 5. Duplicate item ID rejection
    payload = {
        "item_id": 9003,
        "item_name": "Unique Test Item",
        "category": "Supplies",
        "quantity": 10,
        "minimum_stock": 5,
        "unit_price": 100.00,
        "location": "Shelf 9"
    }
    res1 = client.post("/api/inventory", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/inventory", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]

def test_invalid_category_rejection(client, mongo_test_db):
    # 6. Invalid category rejection
    payload = {
        "item_id": 9004,
        "item_name": "Invalid Category Item",
        "category": "Automotive", # Invalid! Must be Medicine, Equipment, Supplies
        "quantity": 10,
        "minimum_stock": 5,
        "unit_price": 50.00,
        "location": "Shelf X"
    }
    res = client.post("/api/inventory", json=payload)
    assert res.status_code == 422 # FastAPI Pydantic validation error

def test_negative_quantity_rejection(client, mongo_test_db):
    # 7. Negative quantity rejection
    payload = {
        "item_id": 9005,
        "item_name": "Negative Quantity Item",
        "category": "Supplies",
        "quantity": -15, # Invalid!
        "minimum_stock": 5,
        "unit_price": 50.00,
        "location": "Shelf X"
    }
    res = client.post("/api/inventory", json=payload)
    assert res.status_code == 422

def test_missing_required_fields_rejection(client, mongo_test_db):
    # 8. Missing required fields (missing unit_price and location)
    payload = {
        "item_id": 9006,
        "item_name": "Incomplete Item",
        "category": "Supplies"
    }
    res = client.post("/api/inventory", json=payload)
    assert res.status_code == 422

def test_reports_aggregation(client, mongo_test_db):
    # Setup test items for low stock and valuation
    client.post("/api/inventory", json={
        "item_id": 9010,
        "item_name": "Low Stock Test Bandage",
        "category": "Supplies",
        "quantity": 5,
        "minimum_stock": 20, # Low stock!
        "unit_price": 10.00,
        "location": "Depot 1"
    })
    client.post("/api/inventory", json={
        "item_id": 9011,
        "item_name": "High Value Equipment",
        "category": "Equipment",
        "quantity": 2,
        "minimum_stock": 1,
        "unit_price": 50000.00,
        "location": "ICU Room"
    })

    # 9. Low-stock report
    low_res = client.get("/api/reports/low-stock")
    assert low_res.status_code == 200
    low_items = [i for i in low_res.json()["data"] if i["item_id"] == 9010]
    assert len(low_items) == 1
    assert low_items[0]["urgency"] == "LOW_STOCK"

    # 10. Inventory valuation aggregation
    val_res = client.get("/api/reports/inventory-value")
    assert val_res.status_code == 200
    val_data = val_res.json()["data"]
    assert val_data["total_valuation"] > 0
    assert val_data["total_units"] > 0

def test_stock_in_and_stock_out(client, mongo_test_db):
    # Create initial item with quantity 20
    client.post("/api/inventory", json={
        "item_id": 9020,
        "item_name": "Stock Movement Test Syringes",
        "category": "Supplies",
        "quantity": 20,
        "minimum_stock": 5,
        "unit_price": 5.00,
        "location": "Store 2"
    })

    # 11. Stock-in movement: add 30 -> new quantity 50
    mov_in_payload = {
        "item_id": 9020,
        "movement_type": "STOCK_IN",
        "quantity": 30,
        "reason": "Shipment intake",
        "performed_by": "Nurse Alex"
    }
    in_res = client.post("/api/stock-movements", json=mov_in_payload)
    assert in_res.status_code == 201
    assert in_res.json()["previous_quantity"] == 20
    assert in_res.json()["new_quantity"] == 50

    # Verify updated inventory quantity
    item_res = client.get("/api/inventory/9020")
    assert item_res.json()["quantity"] == 50

    # 12. Stock-out movement: deduct 15 -> new quantity 35
    mov_out_payload = {
        "item_id": 9020,
        "movement_type": "STOCK_OUT",
        "quantity": 15,
        "reason": "Dispatched to ER",
        "performed_by": "Dr. Sarah"
    }
    out_res = client.post("/api/stock-movements", json=mov_out_payload)
    assert out_res.status_code == 201
    assert out_res.json()["previous_quantity"] == 50
    assert out_res.json()["new_quantity"] == 35

    # 13. Insufficient stock rejection: try to dispatch 100 when only 35 available
    over_dispatch = {
        "item_id": 9020,
        "movement_type": "STOCK_OUT",
        "quantity": 100,
        "reason": "Massive dispatch",
        "performed_by": "Dr. Sarah"
    }
    over_res = client.post("/api/stock-movements", json=over_dispatch)
    assert over_res.status_code == 400
    assert "Insufficient stock" in over_res.json()["detail"]

def test_expired_medicine_stock_out_blocked(client, mongo_test_db):
    # 14. Expired medicine handling: Stock-out must be blocked
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    client.post("/api/inventory", json={
        "item_id": 9030,
        "item_name": "Expired Test Ampoule",
        "category": "Medicine",
        "quantity": 10,
        "minimum_stock": 2,
        "unit_price": 50.00,
        "location": "Quarantine Bin",
        "expiry_date": yesterday
    })

    stock_out = {
        "item_id": 9030,
        "movement_type": "STOCK_OUT",
        "quantity": 2,
        "reason": "Attempted dispatch of expired drug",
        "performed_by": "Test Operator"
    }
    res = client.post("/api/stock-movements", json=stock_out)
    assert res.status_code == 400
    assert "Cannot issue expired medicine" in res.json()["detail"]

def test_supplier_crud_and_item_linkage(client, mongo_test_db):
    # 15. Supplier CRUD and association handling
    supp_payload = {
        "supplier_id": 801,
        "company_name": "Test BioMed Labs",
        "contact_person": "Pooja Verma",
        "email": "pooja@testbiomed.demo",
        "phone": "+91-9876543210",
        "address": "Tech Park, Pune",
        "status": "Active"
    }
    res = client.post("/api/suppliers", json=supp_payload)
    assert res.status_code == 201

    # Link an item to this supplier
    client.post("/api/inventory", json={
        "item_id": 9040,
        "item_name": "Linked Test Item",
        "category": "Supplies",
        "quantity": 10,
        "minimum_stock": 2,
        "unit_price": 100.00,
        "location": "Warehouse A",
        "supplier_id": 801
    })

    # Deleting supplier with attached items must be blocked
    del_res = client.delete("/api/suppliers/801")
    assert del_res.status_code == 400
    assert "Cannot delete supplier" in del_res.json()["detail"]
