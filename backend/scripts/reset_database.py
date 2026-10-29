"""
Reset and cleanup script for Smart Hospital Inventory Management System.
DEVELOPMENT USE ONLY. Cleans collections in SmartHospitalDB.
"""

import sys
import os
from pymongo import MongoClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings
from scripts.setup_database import setup_database

def reset_database(force: bool = False):
    if not force:
        confirm = input(f"WARNING: This will delete ALL data in '{settings.DATABASE_NAME}'. Type 'CONFIRM_RESET' to proceed: ")
        if confirm != "CONFIRM_RESET":
            print("Reset operation aborted by user.")
            return

    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.DATABASE_NAME]

    print(f"Dropping collections in '{settings.DATABASE_NAME}'...")
    db["inventory"].drop()
    db["suppliers"].drop()
    db["stock_movements"].drop()

    print("Re-applying schema validators and indexes...")
    client.close()
    setup_database()
    print("Database reset complete. All collections cleared and schemas reapplied.")

if __name__ == "__main__":
    force_flag = "--force" in sys.argv
    reset_database(force=force_flag)
