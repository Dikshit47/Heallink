"""
HEAL LINK - FastAPI Application Server
REST API for medical equipment rentals, AI care twin, transparent pricing, emergency swarm, and family dashboard.
"""
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import random
import time

from database import init_db, query_db, execute_db
import ai_engine

app = FastAPI(
    title="HEAL LINK API",
    description="AI-Powered Medical Equipment Rental & Home-Care Platform",
    version="1.0.0"
)

# Enable CORS for seamless client interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Ensure database is initialized on startup
@app.on_event("startup")
def startup_event():
    init_db()

# ----------------- HTML Frontend Route -----------------
@app.get("/")
def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

# ----------------- Equipment Catalogue APIs -----------------
@app.get("/api/equipment")
def get_equipment(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None
):
    sql = "SELECT * FROM equipment WHERE 1=1"
    params = []

    if category and category.lower() != "all":
        sql += " AND category = ?"
        params.append(category)

    if search:
        sql += " AND (name LIKE ? OR short_desc LIKE ? OR category LIKE ?)"
        search_param = f"%{search}%"
        params.extend([search_param, search_param, search_param])

    if sort_by == "price_asc":
        sql += " ORDER BY daily_price ASC"
    elif sort_by == "price_desc":
        sql += " ORDER BY daily_price DESC"
    elif sort_by == "trust_desc":
        sql += " ORDER BY trust_score DESC"
    elif sort_by == "eta_asc":
        sql += " ORDER BY vendor_eta_mins ASC"
    elif sort_by == "distance_asc":
        sql += " ORDER BY vendor_distance_km ASC"
    else:
        sql += " ORDER BY trust_score DESC, daily_price ASC"

    items = query_db(sql, params)
    return {"status": "success", "count": len(items), "data": items}

@app.get("/api/equipment/{equipment_id}")
def get_equipment_detail(equipment_id: str):
    item = query_db("SELECT * FROM equipment WHERE id = ?", [equipment_id], one=True)
    if not item:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Calculate sample pricing package
    daily = item["daily_price"]
    weekly = item["weekly_price"]
    monthly = item["monthly_price"]
    deposit = item["security_deposit"]
    delivery = item["delivery_fee"]
    installation = item["installation_fee"]
    pickup = item["pickup_fee"]

    pricing_breakdown = {
        "daily": {
            "rental_rate": daily,
            "duration_days": 1,
            "delivery_fee": delivery,
            "installation_fee": installation,
            "pickup_fee": pickup,
            "security_deposit": deposit,
            "total_payable_today": daily + delivery + installation + pickup + deposit,
            "refundable_deposit": deposit
        },
        "weekly": {
            "rental_rate": weekly,
            "duration_days": 7,
            "delivery_fee": delivery,
            "installation_fee": installation,
            "pickup_fee": pickup,
            "security_deposit": deposit,
            "total_payable_today": weekly + delivery + installation + pickup + deposit,
            "refundable_deposit": deposit
        },
        "monthly": {
            "rental_rate": monthly,
            "duration_days": 30,
            "delivery_fee": delivery,
            "installation_fee": installation,
            "pickup_fee": pickup,
            "security_deposit": deposit,
            "total_payable_today": monthly + delivery + installation + pickup + deposit,
            "refundable_deposit": deposit
        }
    }

    # Trust Score breakdown
    trust_breakdown = {
        "overall_score": item["trust_score"],
        "sanitization": item["sanitization_score"],
        "functional_test": item["functional_test_score"],
        "maintenance": item["maintenance_score"],
        "certification": item["certification_score"],
        "equipment_age": item["age_score"],
        "vendor_reliability": item["vendor_reliability_score"]
    }

    # QR Health Passport Details
    health_passport = {
        "equipment_id": item["id"],
        "serial_number": item["serial_number"],
        "name": item["name"],
        "last_sanitized": item["last_sanitized"],
        "last_functional_test": item["last_functional_test"],
        "last_maintenance": item["last_maintenance"],
        "certification_status": item["certification_status"],
        "condition_grade": item["condition_grade"],
        "rental_history_count": item["rental_history_count"],
        "qr_verification_url": f"https://heallink.health/verify/{item['id']}",
        "disclaimer": "This prototype uses simulated verified equipment records for demonstration."
    }

    return {
        "status": "success",
        "equipment": item,
        "pricing_breakdown": pricing_breakdown,
        "trust_breakdown": trust_breakdown,
        "health_passport": health_passport
    }

# ----------------- AI Care Twin & Bundle APIs -----------------
class CareTwinRequest(BaseModel):
    query: str

@app.post("/api/ai/care-twin")
def create_care_twin(req: CareTwinRequest):
    result = ai_engine.generate_care_twin(req.query)
    # Fetch actual equipment details for recommended items
    bundle_data = ai_engine.get_bundle_details(result["recommended_bundle_key"])
    return {
        "status": "success",
        "journey": result,
        "bundle": bundle_data
    }

@app.get("/api/ai/bundle/{bundle_key}")
def get_bundle(bundle_key: str):
    bundle = ai_engine.get_bundle_details(bundle_key)
    return {"status": "success", "bundle": bundle}

# ----------------- AI Rent vs Buy vs Rent-to-Own API -----------------
class RentVsBuyRequest(BaseModel):
    equipment_id: str
    duration_days: int

@app.post("/api/ai/rent-vs-buy")
def rent_vs_buy(req: RentVsBuyRequest):
    item = query_db("SELECT * FROM equipment WHERE id = ?", [req.equipment_id], one=True)
    if not item:
        # Fallback to default hospital bed if ID not provided
        item = query_db("SELECT * FROM equipment WHERE id = 'HL-BED-2048'", one=True)
    
    result = ai_engine.calculate_rent_vs_buy(
        equipment_id=item["id"],
        duration_days=req.duration_days,
        daily_price=item["daily_price"],
        monthly_price=item["monthly_price"],
        buy_price=item["buy_price"]
    )
    result["equipment_name"] = item["name"]
    return {"status": "success", "calculation": result}

# ----------------- Emergency Equipment Swarm APIs -----------------
@app.get("/api/emergency/swarm")
def emergency_swarm(
    equipment_type: str = Query("Oxygen Concentrator", description="Requested emergency equipment"),
    location: str = Query("Metro Central Zone", description="Patient current location")
):
    # Retrieve matching equipment from multiple verified vendors
    sql = """
    SELECT e.id as equipment_id, e.name as equipment_name, e.daily_price, e.trust_score,
           e.availability, e.sanitization_score, e.last_sanitized,
           v.id as vendor_id, v.name as vendor_name, v.distance_km, v.eta_mins, v.rating as vendor_rating, v.phone
    FROM equipment e
    JOIN vendors v ON e.vendor_id = v.id
    WHERE e.category = 'Respiratory' OR e.name LIKE ?
    ORDER BY v.eta_mins ASC, e.trust_score DESC
    """
    matches = query_db(sql, [f"%{equipment_type}%"])
    if not matches:
        matches = query_db("SELECT * FROM equipment LIMIT 3")

    # Format swarm ranking
    swarm_vendors = []
    for idx, row in enumerate(matches):
        is_fastest = (idx == 0)
        swarm_vendors.append({
            "vendor_id": row["vendor_id"],
            "vendor_name": row["vendor_name"],
            "equipment_id": row["equipment_id"],
            "equipment_name": row["equipment_name"],
            "distance_km": row["distance_km"],
            "eta_mins": row["eta_mins"],
            "daily_price": row["daily_price"],
            "trust_score": row["trust_score"],
            "vendor_rating": row["vendor_rating"],
            "availability": row["availability"],
            "is_recommended_fastest": is_fastest,
            "badge": "Recommended Fastest Verified Option" if is_fastest else "Alternative Verified Vendor"
        })

    return {
        "status": "success",
        "query": {"equipment_type": equipment_type, "location": location},
        "fastest_eta": swarm_vendors[0]["eta_mins"] if swarm_vendors else 25,
        "swarm_vendors": swarm_vendors,
        "disclaimer": "Emergency mode is a logistics-assistance feature and does not replace emergency medical services. In a medical emergency, contact appropriate emergency services / 112 immediately."
    }

class EmergencyBookingRequest(BaseModel):
    equipment_type: str
    patient_name: str
    patient_phone: str
    location: str
    urgency: str
    vendor_id: str
    vendor_name: str
    eta_mins: int
    daily_price: int

@app.post("/api/emergency/book")
def book_emergency(req: EmergencyBookingRequest):
    ref = f"EMG-{random.randint(1000, 9999)}"
    execute_db("""
    INSERT INTO emergency_requests (
        request_ref, equipment_type, patient_name, patient_phone,
        location, urgency, vendor_id, vendor_name, eta_mins, daily_price, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        ref, req.equipment_type, req.patient_name, req.patient_phone,
        req.location, req.urgency, req.vendor_id, req.vendor_name,
        req.eta_mins, req.daily_price, "Dispatched (Priority Express)"
    ])
    return {
        "status": "success",
        "request_ref": ref,
        "message": f"Emergency swarm alert dispatched to {req.vendor_name}. Equipment en route! Estimated arrival in {req.eta_mins} minutes.",
        "eta_mins": req.eta_mins
    }

# ----------------- Booking & Transparent Checkout APIs -----------------
class BookingCreateRequest(BaseModel):
    patient_name: str
    patient_phone: str
    patient_address: str
    equipment_id: str
    rental_type: str  # daily, weekly, monthly, custom
    duration_days: int
    start_date: str
    delivery_slot: str
    installation_required: bool = True
    pickup_required: bool = True

@app.post("/api/bookings")
def create_booking(req: BookingCreateRequest):
    item = query_db("SELECT * FROM equipment WHERE id = ?", [req.equipment_id], one=True)
    if not item:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # Precise transparent pricing calculation
    days = max(1, req.duration_days)
    if req.rental_type == "daily":
        rental_cost = item["daily_price"] * days
    elif req.rental_type == "weekly":
        weeks = (days + 6) // 7
        rental_cost = item["weekly_price"] * weeks
    elif req.rental_type == "monthly":
        months = (days + 29) // 30
        rental_cost = item["monthly_price"] * months
    else: # Custom days optimized
        m = days // 30
        rem = days % 30
        rental_cost = (m * item["monthly_price"]) + min(rem * item["daily_price"], item["monthly_price"])

    delivery_fee = item["delivery_fee"]
    installation_fee = item["installation_fee"] if req.installation_required else 0
    pickup_fee = item["pickup_fee"] if req.pickup_required else 0
    security_deposit = item["security_deposit"]

    total_amount = rental_cost + delivery_fee + installation_fee + pickup_fee + security_deposit
    refundable_deposit = security_deposit

    booking_ref = f"HL-BK-{random.randint(1000, 9999)}"

    execute_db("""
    INSERT INTO bookings (
        booking_ref, patient_name, patient_phone, patient_address,
        equipment_id, equipment_name, rental_type, duration_days,
        start_date, delivery_slot, installation_required, pickup_required,
        rental_cost, delivery_fee, installation_fee, pickup_fee,
        security_deposit, total_amount, refundable_deposit, status, tracking_stage
    ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
    )
    """, [
        booking_ref, req.patient_name, req.patient_phone, req.patient_address,
        item["id"], item["name"], req.rental_type, days,
        req.start_date, req.delivery_slot, 1 if req.installation_required else 0, 1 if req.pickup_required else 0,
        rental_cost, delivery_fee, installation_fee, pickup_fee,
        security_deposit, total_amount, refundable_deposit, "Confirmed", 1
    ])

    return {
        "status": "success",
        "booking_ref": booking_ref,
        "equipment_name": item["name"],
        "breakdown": {
            "rental_cost": rental_cost,
            "delivery_fee": delivery_fee,
            "installation_fee": installation_fee,
            "pickup_fee": pickup_fee,
            "security_deposit": security_deposit,
            "total_payable_today": total_amount,
            "refundable_deposit": refundable_deposit
        },
        "tracking_url": f"/orders/{booking_ref}"
    }

# ----------------- Order Tracking APIs -----------------
TRACKING_STAGES = [
    {"stage": 1, "title": "Order Confirmed", "desc": "Payment authorized & reservation booked."},
    {"stage": 2, "title": "Equipment Verified", "desc": "Biomedical technician inspection & serial number allocated."},
    {"stage": 3, "title": "Sanitized & Sealed", "desc": "Medical-grade hospital disinfection protocol completed."},
    {"stage": 4, "title": "Dispatched", "desc": "Loaded onto specialized temperature-controlled delivery vehicle."},
    {"stage": 5, "title": "Out for Delivery", "desc": "Delivery technician en route to patient residence."},
    {"stage": 6, "title": "Delivered", "desc": "Equipment safely unloaded and inspected at home."},
    {"stage": 7, "title": "Installation Completed", "desc": "Bedside setup, circuit testing, and family demo completed."}
]

@app.get("/api/orders/{booking_ref}")
def get_order_tracking(booking_ref: str):
    order = query_db("SELECT * FROM bookings WHERE booking_ref = ?", [booking_ref], one=True)
    if not order:
        # If demo ref or not found, pull the latest booking
        order = query_db("SELECT * FROM bookings ORDER BY id DESC LIMIT 1", one=True)
        if not order:
            raise HTTPException(status_code=404, detail="No orders found")

    return {
        "status": "success",
        "order": order,
        "stages": TRACKING_STAGES,
        "current_stage": order["tracking_stage"]
    }

@app.post("/api/orders/{booking_ref}/advance-stage")
def advance_order_stage(booking_ref: str):
    order = query_db("SELECT * FROM bookings WHERE booking_ref = ?", [booking_ref], one=True)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    current = order["tracking_stage"]
    next_stage = min(7, current + 1)
    status_text = TRACKING_STAGES[next_stage - 1]["title"]

    execute_db("UPDATE bookings SET tracking_stage = ?, status = ? WHERE booking_ref = ?", [next_stage, status_text, booking_ref])
    return {
        "status": "success",
        "booking_ref": booking_ref,
        "previous_stage": current,
        "current_stage": next_stage,
        "stage_title": status_text
    }

# ----------------- Family Care Dashboard APIs -----------------
@app.get("/api/family")
def get_family_dashboard():
    # Active patient rentals
    active_rentals = query_db("SELECT * FROM bookings WHERE status != 'Returned'")
    
    # Calculate days remaining for demo presentation
    family_members = [
        {"name": "Rajesh Kumar", "relation": "Father (Patient)", "condition": "Post-Hip Surgery Recovery", "age": 68},
        {"name": "Ananya Kumar", "relation": "Daughter (Primary Caregiver)", "phone": "+91 98201 12345"},
        {"name": "Rohan Kumar", "relation": "Son (Secondary Caregiver)", "phone": "+91 98201 54321"}
    ]

    rentals_with_countdown = []
    for r in active_rentals:
        item = dict(r)
        # Add realistic countdown remaining days for demo
        item["days_remaining"] = 29 if "BED" in item["equipment_id"] else (24 if "WLK" in item["equipment_id"] else 6)
        item["expiry_date"] = "14 Oct 2026"
        item["installation_status"] = "Completed & Certified"
        item["maintenance_status"] = "Next Routine Check: 25 Sept 2026"
        rentals_with_countdown.append(item)

    care_schedule = [
        {"service": "Orthopedic Physiotherapy", "provider": "Dr. Rohit Verma (PT)", "date": "Tomorrow, 10:30 AM", "type": "Home Visit", "badge": "Confirmed"},
        {"service": "Certified ICU Nurse Shift", "provider": "Sister Sunita R.", "date": "Daily (08:00 AM - 08:00 PM)", "type": "Bedside Nursing", "badge": "Active"},
        {"service": "Preventive Equipment Audit", "provider": "HealLink Tech Vikram", "date": "25 Sept 2026", "type": "Free Quality Check", "badge": "Scheduled"}
    ]

    return {
        "status": "success",
        "patient": family_members[0],
        "caregivers": family_members[1:],
        "active_rentals": rentals_with_countdown,
        "care_schedule": care_schedule
    }

# ----------------- Return & Reuse Sanitization Pipeline APIs -----------------
SANITIZATION_STAGES = [
    {"stage": 1, "name": "Returned Equipment", "action": "Arrival logged at biomedical decontamination depot."},
    {"stage": 2, "name": "Inspection", "action": "Physical integrity, frame stress, and wear & tear examination."},
    {"stage": 3, "name": "Deep Cleaning", "action": "Enzymatic degreasing and ultrasonic particulate removal."},
    {"stage": 4, "name": "Disinfection", "action": "Hospital-grade hydrogen peroxide & UV-C sterilization."},
    {"stage": 5, "name": "Functional Test", "action": "14-point sensor calibration and load performance verification."},
    {"stage": 6, "name": "Technician Sign-off", "action": "Biomedical engineer digital stamp & QR passport update."},
    {"stage": 7, "name": "Ready for Next Rental", "action": "Shrink-wrapped, sealed, and added to verified available pool."}
]

@app.get("/api/return-inspections")
def get_return_inspections():
    items = query_db("SELECT * FROM return_inspections ORDER BY current_stage ASC")
    return {
        "status": "success",
        "pipeline_stages": SANITIZATION_STAGES,
        "inspections": items
    }

@app.post("/api/return-inspections/{inspection_ref}/advance")
def advance_return_inspection(inspection_ref: str):
    item = query_db("SELECT * FROM return_inspections WHERE inspection_ref = ?", [inspection_ref], one=True)
    if not item:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    current = item["current_stage"]
    next_stage = min(7, current + 1)
    stage_name = SANITIZATION_STAGES[next_stage - 1]["name"]
    new_status = "Certified Ready" if next_stage == 7 else "In Process"

    execute_db("""
    UPDATE return_inspections
    SET current_stage = ?, stage_name = ?, status = ?
    WHERE inspection_ref = ?
    """, [next_stage, stage_name, new_status, inspection_ref])

    return {
        "status": "success",
        "inspection_ref": inspection_ref,
        "current_stage": next_stage,
        "stage_name": stage_name,
        "status_label": new_status
    }

# ----------------- Vendor & Admin Dashboard APIs -----------------
@app.get("/api/vendor/inventory")
def get_vendor_inventory():
    inventory = query_db("""
    SELECT e.id, e.name, e.category, e.serial_number, e.daily_price, e.weekly_price, e.monthly_price,
           e.availability, e.trust_score, e.last_sanitized, e.last_maintenance, v.name as vendor_name
    FROM equipment e
    JOIN vendors v ON e.vendor_id = v.id
    ORDER BY e.category, e.name
    """)
    stats = {
        "total_units": len(inventory),
        "in_stock": sum(1 for i in inventory if i["availability"] == "In Stock"),
        "rented": sum(1 for i in inventory if i["availability"] == "Rented"),
        "maintenance": sum(1 for i in inventory if i["availability"] == "Maintenance")
    }
    return {"status": "success", "stats": stats, "inventory": inventory}

@app.post("/api/vendor/equipment/{equipment_id}/status")
def update_equipment_status(equipment_id: str, status: str = Query(..., enum=["In Stock", "Rented", "Maintenance"])):
    execute_db("UPDATE equipment SET availability = ? WHERE id = ?", [status, equipment_id])
    return {"status": "success", "equipment_id": equipment_id, "new_status": status}

@app.get("/api/admin/metrics")
def get_admin_metrics():
    total_patients = 184
    total_vendors = query_db("SELECT COUNT(*) as cnt FROM vendors", one=True)["cnt"]
    total_equipment = query_db("SELECT COUNT(*) as cnt FROM equipment", one=True)["cnt"]
    active_rentals = query_db("SELECT COUNT(*) as cnt FROM bookings WHERE status != 'Returned'", one=True)["cnt"]
    revenue = query_db("SELECT SUM(total_amount) as rev FROM bookings", one=True)["rev"] or 184500
    emergency_reqs = query_db("SELECT COUNT(*) as cnt FROM emergency_requests", one=True)["cnt"]
    in_maintenance = query_db("SELECT COUNT(*) as cnt FROM return_inspections WHERE current_stage < 7", one=True)["cnt"]

    return {
        "status": "success",
        "metrics": {
            "total_patients": total_patients,
            "total_vendors": total_vendors,
            "total_equipment": total_equipment,
            "active_rentals": active_rentals,
            "monthly_revenue": f"₹{revenue:,}",
            "emergency_requests": emergency_reqs,
            "maintenance_units": in_maintenance,
            "trust_compliance_rate": "99.4%"
        }
    }

# ----------------- Care Services API -----------------
@app.get("/api/care-services")
def get_care_services():
    services = query_db("SELECT * FROM care_services")
    return {"status": "success", "services": services}

if __name__ == "__main__":
    import uvicorn
    print("Starting HEAL LINK MVP on http://localhost:8000")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)