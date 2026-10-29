# MongoDB Query Reference Guide — Smart Hospital Inventory Management System
**Course:** CSE494 — Intelligent NoSQL Databases  
**Database:** `SmartHospitalDB`  
**Shell Environment:** `mongosh` / MongoDB Shell 8.x

---

## 1. Database & Collection Setup

### Switch Database
```javascript
use SmartHospitalDB;
```

### View Collections
```javascript
show collections;
```

---

## 2. Collection Creation with JSON Schema Validation

### 2.1 Inventory Collection Schema Validator
```javascript
db.createCollection("inventory", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["item_id", "item_name", "category", "quantity", "minimum_stock", "unit_price", "location"],
      properties: {
        item_id: {
          bsonType: ["int", "long"],
          minimum: 1,
          description: "Unique positive integer identifier for the item"
        },
        item_name: {
          bsonType: "string",
          minLength: 2,
          description: "Item name, minimum 2 characters"
        },
        category: {
          enum: ["Medicine", "Equipment", "Supplies"],
          description: "Must be Medicine, Equipment, or Supplies"
        },
        quantity: {
          bsonType: ["int", "long"],
          minimum: 0,
          description: "Current stock in inventory"
        },
        minimum_stock: {
          bsonType: ["int", "long"],
          minimum: 0,
          description: "Reorder warning threshold"
        },
        unit_price: {
          bsonType: ["double", "int", "long", "decimal"],
          minimum: 0,
          description: "Unit price in INR (non-negative numeric)"
        },
        supplier_id: {
          bsonType: ["int", "long", "null"],
          description: "Optional supplier identifier"
        },
        supplier_name: {
          bsonType: ["string", "null"]
        },
        expiry_date: {
          bsonType: ["string", "date", "null"]
        },
        location: {
          bsonType: "string",
          minLength: 1,
          description: "Physical department or shelf location"
        },
        description: {
          bsonType: ["string", "null"]
        },
        created_at: {
          bsonType: ["string", "date"]
        },
        updated_at: {
          bsonType: ["string", "date"]
        }
      }
    }
  }
});
```

### 2.2 Suppliers Collection Schema Validator
```javascript
db.createCollection("suppliers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["supplier_id", "company_name", "contact_person", "email", "phone", "address"],
      properties: {
        supplier_id: {
          bsonType: ["int", "long"],
          minimum: 1
        },
        company_name: {
          bsonType: "string",
          minLength: 2
        },
        contact_person: {
          bsonType: "string"
        },
        email: {
          bsonType: "string",
          pattern: "^.+@.+$"
        },
        phone: {
          bsonType: "string"
        },
        address: {
          bsonType: "string"
        },
        status: {
          enum: ["Active", "Inactive"]
        }
      }
    }
  }
});
```

### 2.3 Stock Movements Collection Schema Validator
```javascript
db.createCollection("stock_movements", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["movement_id", "item_id", "item_name", "movement_type", "quantity", "previous_quantity", "new_quantity", "reason", "performed_by", "timestamp"],
      properties: {
        movement_id: {
          bsonType: ["int", "long"],
          minimum: 1
        },
        item_id: {
          bsonType: ["int", "long"],
          minimum: 1
        },
        item_name: {
          bsonType: "string"
        },
        movement_type: {
          enum: ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]
        },
        quantity: {
          bsonType: ["int", "long"],
          minimum: 1
        },
        previous_quantity: {
          bsonType: ["int", "long"],
          minimum: 0
        },
        new_quantity: {
          bsonType: ["int", "long"],
          minimum: 0
        },
        reason: {
          bsonType: "string"
        },
        performed_by: {
          bsonType: "string"
        },
        timestamp: {
          bsonType: ["string", "date"]
        }
      }
    }
  }
});
```

---

## 3. Index Creation Commands

```javascript
// Inventory indexes
db.inventory.createIndex({ item_id: 1 }, { unique: true, name: "idx_unique_item_id" });
db.inventory.createIndex({ category: 1 }, { name: "idx_category" });
db.inventory.createIndex({ quantity: 1 }, { name: "idx_quantity" });
db.inventory.createIndex({ expiry_date: 1 }, { name: "idx_expiry_date" });
db.inventory.createIndex({ supplier_id: 1 }, { name: "idx_supplier_id" });

// Supplier indexes
db.suppliers.createIndex({ supplier_id: 1 }, { unique: true, name: "idx_unique_supplier_id" });

// Movement indexes
db.stock_movements.createIndex({ movement_id: 1 }, { unique: true, name: "idx_unique_movement_id" });
db.stock_movements.createIndex({ item_id: 1 }, { name: "idx_mov_item_id" });
db.stock_movements.createIndex({ timestamp: 1 }, { name: "idx_mov_timestamp" });
```

---

## 4. CRUD Operations

### 4.1 Create (Insert Item)
```javascript
db.inventory.insertOne({
  item_id: NumberInt(1099),
  item_name: "Ciprofloxacin 500mg Tablets",
  category: "Medicine",
  quantity: NumberInt(120),
  minimum_stock: NumberInt(30),
  unit_price: 14.50,
  supplier_id: NumberInt(101),
  supplier_name: "Apex Medicare Pharma Ltd",
  expiry_date: "2027-05-15",
  location: "Pharmacy Rack B-06",
  description: "Fluoroquinolone antibiotic for severe bacterial infections",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});
```

### 4.2 Read (Find by Item ID or Category)
```javascript
// Find specific item
db.inventory.findOne({ item_id: 1001 });

// Find low stock items
db.inventory.find({ $expr: { $lte: ["$quantity", "$minimum_stock"] } });

// Case-insensitive search
db.inventory.find({ item_name: { $regex: "paracetamol", $options: "i" } });
```

### 4.3 Update (Adjust stock or price)
```javascript
db.inventory.updateOne(
  { item_id: 1001 },
  {
    $set: {
      quantity: NumberInt(500),
      unit_price: 2.75,
      updated_at: new Date().toISOString()
    }
  }
);
```

### 4.4 Delete (Remove Item)
```javascript
db.inventory.deleteOne({ item_id: 1099 });
```

---

## 5. Aggregation Pipelines (All 8 Reports)

### Report 1: Category Summary
```javascript
db.inventory.aggregate([
  {
    $project: {
      category: 1,
      quantity: 1,
      unit_price: 1,
      item_valuation: { $multiply: ["$quantity", "$unit_price"] }
    }
  },
  {
    $group: {
      _id: "$category",
      category: { $first: "$category" },
      item_count: { $sum: 1 },
      total_quantity: { $sum: "$quantity" },
      total_valuation: { $sum: "$item_valuation" }
    }
  },
  {
    $project: {
      _id: 0,
      category: 1,
      item_count: 1,
      total_quantity: 1,
      total_valuation: { $round: ["$total_valuation", 2] }
    }
  },
  { $sort: { total_valuation: -1 } }
]);
```

### Report 2: Total Inventory Valuation
```javascript
db.inventory.aggregate([
  {
    $project: {
      line_valuation: { $multiply: ["$quantity", "$unit_price"] },
      quantity: 1,
      unit_price: 1
    }
  },
  {
    $group: {
      _id: null,
      total_valuation: { $sum: "$line_valuation" },
      total_units: { $sum: "$quantity" },
      total_unique_items: { $sum: 1 },
      average_unit_price: { $avg: "$unit_price" }
    }
  },
  {
    $project: {
      _id: 0,
      total_valuation: { $round: ["$total_valuation", 2] },
      total_units: 1,
      total_unique_items: 1,
      average_unit_price: { $round: ["$average_unit_price", 2] }
    }
  }
]);
```

### Report 3: Low-Stock Items
```javascript
db.inventory.aggregate([
  {
    $match: {
      $expr: { $lte: ["$quantity", "$minimum_stock"] }
    }
  },
  {
    $addFields: {
      urgency: {
        $cond: {
          if: { $eq: ["$quantity", 0] },
          then: "OUT_OF_STOCK",
          else: "LOW_STOCK"
        }
      },
      shortage: { $subtract: ["$minimum_stock", "$quantity"] }
    }
  },
  {
    $project: {
      _id: 0,
      item_id: 1,
      item_name: 1,
      category: 1,
      quantity: 1,
      minimum_stock: 1,
      shortage: 1,
      urgency: 1,
      location: 1
    }
  },
  { $sort: { quantity: 1, shortage: -1 } }
]);
```

### Report 4: Expired Items
```javascript
db.inventory.aggregate([
  {
    $match: {
      expiry_date: { $ne: null, $exists: true, $lt: "2026-10-19" },
      category: { $ne: "Equipment" }
    }
  },
  {
    $project: {
      _id: 0,
      item_id: 1,
      item_name: 1,
      category: 1,
      quantity: 1,
      unit_price: 1,
      expiry_date: 1,
      loss_valuation: { $round: [{ $multiply: ["$quantity", "$unit_price"] }, 2] },
      location: 1
    }
  },
  { $sort: { expiry_date: 1 } }
]);
```

### Report 5: Supplier Summary
```javascript
db.inventory.aggregate([
  { $match: { supplier_id: { $ne: null } } },
  {
    $project: {
      supplier_id: 1,
      supplier_name: { $ifNull: ["$supplier_name", "Unknown Supplier"] },
      quantity: 1,
      item_value: { $multiply: ["$quantity", "$unit_price"] }
    }
  },
  {
    $group: {
      _id: "$supplier_id",
      supplier_id: { $first: "$supplier_id" },
      supplier_name: { $first: "$supplier_name" },
      total_items: { $sum: 1 },
      total_units: { $sum: "$quantity" },
      total_valuation: { $sum: "$item_value" }
    }
  },
  {
    $project: {
      _id: 0,
      supplier_id: 1,
      supplier_name: 1,
      total_items: 1,
      total_units: 1,
      total_valuation: { $round: ["$total_valuation", 2] }
    }
  },
  { $sort: { total_valuation: -1 } }
]);
```

### Report 6: Top 5 Most Expensive Items
```javascript
db.inventory.aggregate([
  { $sort: { unit_price: -1 } },
  { $limit: 5 },
  {
    $project: {
      _id: 0,
      item_id: 1,
      item_name: 1,
      category: 1,
      unit_price: 1,
      quantity: 1,
      total_value: { $round: [{ $multiply: ["$quantity", "$unit_price"] }, 2] },
      location: 1
    }
  }
]);
```

### Report 7: Stock Movement Summary
```javascript
db.stock_movements.aggregate([
  {
    $group: {
      _id: "$movement_type",
      movement_type: { $first: "$movement_type" },
      total_events: { $sum: 1 },
      total_units_moved: { $sum: "$quantity" }
    }
  },
  {
    $project: {
      _id: 0,
      movement_type: 1,
      total_events: 1,
      total_units_moved: 1
    }
  },
  { $sort: { total_units_moved: -1 } }
]);
```

### Report 8: Monthly Stock Trends
```javascript
db.stock_movements.aggregate([
  {
    $project: {
      month: { $substrBytes: ["$timestamp", 0, 7] },
      movement_type: 1,
      quantity: 1
    }
  },
  {
    $group: {
      _id: {
        month: "$month",
        movement_type: "$movement_type"
      },
      total_quantity: { $sum: "$quantity" },
      count: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: "$_id.month",
      month: { $first: "$_id.month" },
      movements: {
        $push: {
          type: "$_id.movement_type",
          units: "$total_quantity",
          events: "$count"
        }
      }
    }
  },
  { $sort: { month: 1 } }
]);
```
