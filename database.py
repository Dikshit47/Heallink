"""
HEAL LINK - SQLite Database Layer
Handles connections, schema initialization, and transactional queries.
"""
import sqlite3
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "heallink.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Vendors Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        distance_km REAL NOT NULL,
        eta_mins INTEGER NOT NULL,
        rating REAL NOT NULL,
        total_inventory INTEGER NOT NULL,
        active_rentals INTEGER NOT NULL,
        phone TEXT NOT NULL,
        verified INTEGER DEFAULT 1
    );
    """)

    # 2. Equipment Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS equipment (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT NOT NULL,
        short_desc TEXT NOT NULL,
        full_desc TEXT NOT NULL,
        daily_price INTEGER NOT NULL,
        weekly_price INTEGER NOT NULL,
        monthly_price INTEGER NOT NULL,
        security_deposit INTEGER NOT NULL,
        delivery_fee INTEGER NOT NULL DEFAULT 199,
        installation_fee INTEGER NOT NULL DEFAULT 150,
        pickup_fee INTEGER NOT NULL DEFAULT 199,
        buy_price INTEGER NOT NULL,
        trust_score INTEGER NOT NULL,
        sanitization_score INTEGER NOT NULL,
        functional_test_score INTEGER NOT NULL,
        maintenance_score INTEGER NOT NULL,
        certification_score INTEGER NOT NULL,
        age_score INTEGER NOT NULL,
        vendor_reliability_score INTEGER NOT NULL,
        vendor_id TEXT NOT NULL,
        vendor_name TEXT NOT NULL,
        vendor_distance_km REAL NOT NULL,
        vendor_eta_mins INTEGER NOT NULL,
        vendor_rating REAL NOT NULL,
        availability TEXT NOT NULL DEFAULT 'In Stock',
        serial_number TEXT NOT NULL,
        last_sanitized TEXT NOT NULL,
        last_functional_test TEXT NOT NULL,
        last_maintenance TEXT NOT NULL,
        certification_status TEXT NOT NULL,
        condition_grade TEXT NOT NULL,
        rental_history_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (vendor_id) REFERENCES vendors (id)
    );
    """)

    # 3. Bookings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_ref TEXT UNIQUE NOT NULL,
        patient_name TEXT NOT NULL,
        patient_phone TEXT NOT NULL,
        patient_address TEXT NOT NULL,
        equipment_id TEXT NOT NULL,
        equipment_name TEXT NOT NULL,
        rental_type TEXT NOT NULL,
        duration_days INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        delivery_slot TEXT NOT NULL,
        installation_required INTEGER DEFAULT 1,
        pickup_required INTEGER DEFAULT 1,
        rental_cost INTEGER NOT NULL,
        delivery_fee INTEGER NOT NULL,
        installation_fee INTEGER NOT NULL,
        pickup_fee INTEGER NOT NULL,
        security_deposit INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        refundable_deposit INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Confirmed',
        tracking_stage INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment (id)
    );
    """)

    # 4. Emergency Requests Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emergency_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_ref TEXT UNIQUE NOT NULL,
        equipment_type TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        patient_phone TEXT NOT NULL,
        location TEXT NOT NULL,
        urgency TEXT NOT NULL,
        vendor_id TEXT NOT NULL,
        vendor_name TEXT NOT NULL,
        eta_mins INTEGER NOT NULL,
        daily_price INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Dispatched',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Return & Sanitization Pipeline Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS return_inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_ref TEXT UNIQUE NOT NULL,
        equipment_id TEXT NOT NULL,
        equipment_name TEXT NOT NULL,
        serial_number TEXT NOT NULL,
        return_date TEXT NOT NULL,
        current_stage INTEGER NOT NULL DEFAULT 1,
        stage_name TEXT NOT NULL DEFAULT 'Returned',
        notes TEXT,
        technician_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'In Process',
        FOREIGN KEY (equipment_id) REFERENCES equipment (id)
    );
    """)

    # 6. Care Services Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS care_services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        duration TEXT NOT NULL,
        price INTEGER NOT NULL,
        provider_name TEXT NOT NULL,
        rating REAL NOT NULL,
        image_url TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()

def query_db(query: str, args=(), one=False):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.close()
    if one:
        return dict(rv[0]) if rv else None
    return [dict(r) for r in rv]

def execute_db(query: str, args=()):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(query, args)
    conn.commit()
    last_id = cur.lastrowid
    conn.close()
    return last_id

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)