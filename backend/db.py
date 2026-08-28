import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from datetime import datetime

# Load environment variables from .env
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "diabetic_retinopathy_db")


class Database:
    _instance = None
    _client = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._connect()
        return cls._instance

    def _connect(self):
        try:
            # Set a 5-second timeout for server selection
            self._client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            # Trigger a connection check
            self._client.admin.command('ping')
            self._db = self._client[DATABASE_NAME]
            print(f" Connected to MongoDB Database: '{DATABASE_NAME}'")
        except (ConnectionFailure, ServerSelectionTimeoutError) as err:
            print(f" MongoDB Connection Error: {err}")
            self._db = None

    @property
    def db(self):
        if self._db is None:
            self._connect()
        return self._db

    # ------------------ Helper CRUD Methods ------------------

    def save_prediction(self, patient_id, image_name, prediction_result, confidence=None, metadata=None):
        """
        Saves a diabetic retinopathy prediction record.
        """
        if self.db is None:
            raise Exception("Database connection is not available.")
            
        record = {
            "patient_id": patient_id,
            "image_name": image_name,
            "prediction": prediction_result,  # e.g., 'No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative'
            "confidence": confidence,
            "metadata": metadata or {},
            "created_at": datetime.utcnow()
        }
        return self.db.predictions.insert_one(record).inserted_id

    def get_predictions(self, patient_id=None, limit=50):
        """
        Retrieves prediction history.
        """
        if self.db is None:
            return []
        query = {"patient_id": patient_id} if patient_id else {}
        return list(self.db.predictions.find(query).sort("created_at", -1).limit(limit))

    def save_patient(self, patient_data):
        """
        Creates or updates a patient profile.
        """
        if self.db is None:
            raise Exception("Database connection is not available.")
        return self.db.patients.update_one(
            {"patient_id": patient_data.get("patient_id")},
            {"$set": patient_data, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True
        )


# Singleton helper instance
db_client = Database()