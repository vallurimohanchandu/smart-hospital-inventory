import pytest
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set test database name before importing settings/app
TEST_DB_NAME = "SmartHospitalDB_Test"
os.environ["DATABASE_NAME"] = TEST_DB_NAME

from app.config import settings
settings.DATABASE_NAME = TEST_DB_NAME

from pymongo import MongoClient
from fastapi.testclient import TestClient
from app.main import app
import app.database as db_module
from scripts.setup_database import INVENTORY_SCHEMA, SUPPLIERS_SCHEMA, MOVEMENTS_SCHEMA

@pytest.fixture(scope="session", autouse=True)
def init_test_db():
    client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.drop_database(TEST_DB_NAME)

    test_db = client[TEST_DB_NAME]
    test_db.create_collection("inventory", validator=INVENTORY_SCHEMA)
    test_db.create_collection("suppliers", validator=SUPPLIERS_SCHEMA)
    test_db.create_collection("stock_movements", validator=MOVEMENTS_SCHEMA)

    test_db["inventory"].create_index("item_id", unique=True)
    test_db["suppliers"].create_index("supplier_id", unique=True)
    test_db["stock_movements"].create_index("movement_id", unique=True)

    db_module.db_manager.client = client
    db_module.db_manager.db = test_db

    yield test_db

    client.drop_database(TEST_DB_NAME)
    client.close()

@pytest.fixture(scope="function")
def mongo_test_db(init_test_db):
    return init_test_db

@pytest.fixture(scope="function", autouse=True)
def clean_collections_between_tests(init_test_db):
    # Ensure fresh test collection state for each test
    init_test_db["inventory"].delete_many({})
    init_test_db["suppliers"].delete_many({})
    init_test_db["stock_movements"].delete_many({})
    db_module.db_manager.db = init_test_db
    yield

@pytest.fixture(scope="function")
def client(init_test_db):
    db_module.db_manager.db = init_test_db
    with TestClient(app) as c:
        yield c
