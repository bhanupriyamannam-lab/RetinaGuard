import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Load environment
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "diabetic_retinopathy_db")

print("=" * 60)
print("  MongoDB Connection Health Check")
print("=" * 60)
print(f"Target URI : {MONGO_URI}")
print(f"Database   : {DATABASE_NAME}")
print("-" * 60)

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=4000)
    client.admin.command("ping")
    db = client[DATABASE_NAME]
    print(" Status: SUCCESS")
    print(f" Connected successfully to database '{DATABASE_NAME}'!")
    print(f" Collections present: {db.list_collection_names()}")
    print("=" * 60)
except ServerSelectionTimeoutError:
    print(" Status: FAILED (Server Selection Timeout)")
    print(" Could not reach MongoDB at the specified URI.")
    print(" Hints:")
    print("   1. If running locally, make sure MongoDB service/mongod is running.")
    print("   2. If using MongoDB Atlas (cloud), update MONGO_URI in backend/.env with your connection string.")
    print("=" * 60)
except ConnectionFailure as e:
    print(f" Status: FAILED - Connection Error: {e}")
    print("=" * 60)
except Exception as e:
    print(f" Status: ERROR - {type(e).__name__}: {e}")
    print("=" * 60)
