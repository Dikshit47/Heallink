"""
HEAL LINK - Seed Data Generator
Populates realistic medical equipment, verified vendors, care services, sample bookings, and inspection pipelines.
"""
from database import get_db, init_db

def seed_database():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Clear existing data to ensure idempotent seeding
    cursor.execute("DELETE FROM care_services")
    cursor.execute("DELETE FROM return_inspections")
    cursor.execute("DELETE FROM emergency_requests")
    cursor.execute("DELETE FROM bookings")
    cursor.execute("DELETE FROM equipment")
    cursor.execute("DELETE FROM vendors")

    # 1. Insert Vendors
    vendors = [
        ("VND-01", "PulseCare Home Logistics", "Metro Central Zone", 1.8, 20, 4.9, 142, 38, "+91 98765 43210", 1),
        ("VND-02", "MedEquip Express Central", "Sector 14 Healthcare Hub", 2.5, 30, 4.9, 210, 64, "+91 98765 43211", 1),
        ("VND-03", "CareFirst Medical Devices", "Apollo Link Road", 3.2, 35, 4.8, 185, 49, "+91 98765 43212", 1),
        ("VND-04", "LifeLine Critical Care Logistics", "Outer Ring Road", 4.5, 45, 4.7, 96, 22, "+91 98765 43213", 1),
        ("VND-05", "Apex Home Health Hub", "West Valley Medical District", 5.2, 50, 4.6, 120, 31, "+91 98765 43214", 1)
    ]
    cursor.executemany("""
    INSERT INTO vendors (id, name, location, distance_km, eta_mins, rating, total_inventory, active_rentals, phone, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, vendors)

    # 2. Insert Medical Equipment Items
    equipment = [
        # Respiratory
        (
            "HL-OXY-1024",
            "Medical Oxygen Concentrator (10 LPM High Flow)",
            "Respiratory",
            "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
            "Dual-flow continuous oxygen delivery up to 10 L/min with digital purity sensor (93% +/- 3%).",
            "Hospital-grade 10L oxygen concentrator engineered for patients with severe respiratory distress, post-COVID recovery, COPD, or hypoxemia. Features dual flowmeters, low-purity audio-visual alarm, integrated humidifier bottle slot, and ultra-quiet motor (<45 dB). Comes fully certified and pre-calibrated.",
            399, 1499, 3999, 2000, 199, 150, 199, 58000,
            96, 100, 98, 96, 100, 90, 95,
            "VND-02", "MedEquip Express Central", 2.5, 30, 4.9,
            "In Stock", "HL-OXY-1024", "Today, 08:30 AM", "Passed (14-Point Gas Audit)", "10 Sept 2026",
            "ISO 13485 & CE Medical Verified", "Grade A+ (Pristine Hospital Standard)", 5
        ),
        (
            "HL-OXY-1025",
            "Compact Portable Oxygen Concentrator (5 LPM)",
            "Respiratory",
            "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
            "Lightweight 5-liter concentrator with internal lithium backup battery and rolling trolley.",
            "Designed for patient mobility and domestic recovery. Provides continuous 1-5 LPM medical-grade oxygen with whisper-quiet operation and built-in power surge safety. Ideal for elderly patients requiring supplemental oxygen at home.",
            349, 1299, 3499, 2000, 199, 150, 199, 45000,
            94, 98, 96, 94, 98, 92, 94,
            "VND-01", "PulseCare Home Logistics", 1.8, 20, 4.9,
            "In Stock", "HL-OXY-1025", "Yesterday, 04:15 PM", "Passed (Purity 94.2%)", "08 Sept 2026",
            "ISO 13485 Verified", "Grade A+ (Sanitized & Sealed)", 3
        ),
        (
            "HL-CYL-3012",
            "Jumbo Oxygen Cylinder (B-Type 47L) with Flowmeter",
            "Respiratory",
            "https://images.unsplash.com/photo-1583912267670-6575ad472688?auto=format&fit=crop&w=600&q=80",
            "Full medical oxygen cylinder with bullnose regulator, humidification unit, and trolley.",
            "High-capacity 47-liter pressurized medical oxygen cylinder for emergency backup and home ICU stabilization. Pressure-tested hydrostatic cylinder with twin safety valve and quick-connect nasal cannula.",
            199, 799, 1899, 1500, 249, 100, 249, 14500,
            95, 100, 97, 95, 100, 88, 93,
            "VND-01", "PulseCare Home Logistics", 1.8, 20, 4.9,
            "In Stock", "HL-CYL-3012", "Today, 06:45 AM", "Passed (Hydrostatic & Valve Test)", "12 Sept 2026",
            "PESO & ISO Certified", "Grade A (Refilled & Sealed)", 8
        ),
        (
            "HL-BIP-4011",
            "ResMed Lumis 150 VPAP Auto BiPAP Machine",
            "Respiratory",
            "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
            "Non-invasive ventilator with intelligent backup rate (iVAPS) and heated humidification.",
            "Premium therapeutic BiPAP system for respiratory insufficiency, severe sleep apnea, and neuromuscular conditions. Features ClimateLineAir heated tubing, automatic leak compensation, and SD-card compliance reporting for treating pulmonologists.",
            499, 1999, 5999, 3000, 199, 200, 199, 89000,
            98, 100, 99, 98, 100, 94, 98,
            "VND-02", "MedEquip Express Central", 2.5, 30, 4.9,
            "In Stock", "HL-BIP-4011", "14 Sept 2026", "Passed (Pressure Waveform Calibrated)", "05 Sept 2026",
            "US FDA 510(k) & CE Marked", "Grade A+ (Sterilized Airway)", 4
        ),
        (
            "HL-CPA-4022",
            "Auto CPAP Device with Heated Humidifier",
            "Respiratory",
            "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80",
            "Smart auto-adjusting pressure CPAP with quiet motor and sleep therapy analytics.",
            "Effective non-invasive therapy for obstructive sleep apnea. Features ramp mode, expiratory pressure relief (EPR), and ultra-soft nasal mask assembly for maximum night-time comfort.",
            349, 1399, 3799, 2000, 199, 150, 199, 48000,
            97, 100, 97, 96, 100, 92, 96,
            "VND-03", "CareFirst Medical Devices", 3.2, 35, 4.8,
            "In Stock", "HL-CPA-4022", "13 Sept 2026", "Passed (Blower & Sensor Test)", "01 Sept 2026",
            "CE Class IIa Verified", "Grade A+ (Disinfected)", 6
        ),
        (
            "HL-NEB-5010",
            "Heavy-Duty Compressor & Ultrasonic Nebulizer",
            "Respiratory",
            "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
            "High nebulization rate (0.4 ml/min) with adult & pediatric masks and medication chamber.",
            "Durable piston compressor nebulizer for targeted aerosol medication delivery in asthma, bronchitis, and post-operative respiratory physiotherapy.",
            79, 299, 699, 500, 99, 0, 99, 3800,
            95, 100, 96, 94, 98, 92, 95,
            "VND-01", "PulseCare Home Logistics", 1.8, 20, 4.9,
            "In Stock", "HL-NEB-5010", "Today, 10:00 AM", "Passed (Flow Rate Calibrated)", "11 Sept 2026",
            "ISO Medical Device 13485", "Grade A+ (Sterile Packed)", 7
        ),
        (
            "HL-SUC-6015",
            "Electric Clinical Phlegm Suction Unit",
            "Respiratory",
            "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
            "Oil-free vacuum pump with 1000ml autoclavable jar, antibacterial filter, and regulator.",
            "High negative pressure medical aspirator for tracheostomy care, sputum extraction, and airway clearance in bedridden or post-operative patients.",
            149, 599, 1499, 1000, 199, 100, 199, 12500,
            96, 100, 98, 95, 99, 90, 96,
            "VND-03", "CareFirst Medical Devices", 3.2, 35, 4.8,
            "In Stock", "HL-SUC-6015", "12 Sept 2026", "Passed (Max Suction -0.075 MPa)", "04 Sept 2026",
            "CE Certified Class II", "Grade A (Deep Sanitized)", 4
        ),

        # Beds & Mattresses
        (
            "HL-BED-2048",
            "3-Function Motorized Electric ICU Hospital Bed",
            "Beds",
            "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
            "Handheld remote control for Backrest elevation, Knee-rest elevation, and Bed Height adjustment.",
            "State-of-the-art motorized hospital bed designed for post-surgery orthopedic recovery, paralysis, or elderly palliative care. Features collapsible aluminum side guardrails, ABS head/foot boards, heavy-duty central locking castors, and emergency manual CPR release lever. Promotes independence and caregiver ergonomics.",
            349, 1299, 3299, 2500, 299, 250, 299, 62000,
            97, 100, 98, 97, 100, 92, 97,
            "VND-02", "MedEquip Express Central", 2.5, 30, 4.9,
            "In Stock", "HL-BED-2048", "Today, 09:00 AM", "Passed (Motor Load & Limit Switches)", "09 Sept 2026",
            "ISO 9001 & IEC 60601-2-52", "Grade A+ (Hospital Sanitized)", 3
        ),
        (
            "HL-BED-2049",
            "Deluxe 2-Function Manual Hospital Bed",
            "Beds",
            "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
            "Dual smooth crank system for independent Backrest and Knee-rest adjustment.",
            "Sturdy epoxy powder-coated mild steel hospital bed. Equipped with drop-down safety side rails, IV pole attachment sockets, and lockable rubber wheels for effortless maneuverability.",
            249, 899, 2299, 1500, 299, 150, 299, 32000,
            95, 100, 96, 95, 98, 90, 94,
            "VND-04", "LifeLine Critical Care Logistics", 4.5, 45, 4.7,
            "In Stock", "HL-BED-2049", "11 Sept 2026", "Passed (Mechanical Linkage Lubricated)", "02 Sept 2026",
            "ISO 13485 Verified", "Grade A (Clean & Inspected)", 5
        ),
        (
            "HL-MAT-2050",
            "Medical Anti-Decubitus Air/Ripple Mattress with Pump",
            "Beds",
            "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80",
            "Alternating pressure bubble cell pad prevents bedsores and improves micro-circulation.",
            "Essential for bed-bound patients recovering from spine, hip, or neurological surgeries. The silent compressor operates 24/7 with alternating A-B air chambers that redistribute pressure every 6 minutes, preventing Stage 1-4 pressure ulcers.",
            99, 349, 899, 800, 149, 0, 149, 4500,
            98, 100, 99, 97, 100, 96, 98,
            "VND-01", "PulseCare Home Logistics", 1.8, 20, 4.9,
            "In Stock", "HL-MAT-2050", "Today, 11:15 AM", "Passed (A-B Pressure Cycle Tested)", "13 Sept 2026",
            "CE Medical Device Directive", "Grade A+ (Disinfected & Airtight)", 9
        ),

        # Mobility
        (
            "HL-WHL-1080",
            "Ultra-Light Deluxe Foldable Wheelchair",
            "Mobility",
            "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80",
            "Aircraft-grade aluminum frame, swing-away footrests, and dual attendant handbrakes.",
            "Ergonomically designed for easy transport and car trunk storage. Weighs only 11 kg yet supports up to 125 kg patient weight. Breathable antimicrobial mesh seat cushions with puncture-proof polyurethane rear wheels.",
            119, 549, 1399, 1000, 149, 0, 149, 12500,
            96, 100, 97, 96, 99, 92, 95,
            "VND-02", "MedEquip Express Central", 2.5, 30, 4.9,
            "In Stock", "HL-WHL-1080", "Yesterday, 02:00 PM", "Passed (Brake Tension & Wheel Alignment)", "07 Sept 2026",
            "ISO 7176 Wheelchair Certified", "Grade A+ (Pristine)", 8
        ),
        (
            "HL-WHL-1085",
            "High-Back Reclining Wheelchair with Commode",
            "Mobility",
            "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
            "Full 180-degree reclining backrest, head support cushion, elevating leg rests, and toilet pan.",
            "Versatile multi-care wheelchair for patients who cannot sit upright for extended periods. Allows transforming from sitting to reclining bed position without transferring the patient.",
            169, 749, 1899, 1500, 199, 50, 199, 18500,
            95, 100, 96, 94, 98, 91, 95,
            "VND-03", "CareFirst Medical Devices", 3.2, 35, 4.8,
            "In Stock", "HL-WHL-1085", "10 Sept 2026", "Passed (Hydraulic Recliner Checked)", "03 Sept 2026",
            "ISO 13485 Verified", "Grade A (Clean & Serviced)", 4
        ),
        (
            "HL-WLK-7010",
            "Reciprocal Folding Adult Walker with Front Wheels",
            "Mobility",
            "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
            "Dual-mode (reciprocal and fixed) height-adjustable walker with slip-resistant rubber tips.",
            "Crucial orthopedic rehabilitation aid following hip replacement, knee surgery, or stroke recovery. Lightweight anodized aluminum tubing with soft foam handgrips and one-touch fold button.",
            49, 199, 499, 500, 99, 0, 99, 3200,
            98, 100, 99, 98, 100, 96, 98,
            "VND-01", "PulseCare Home Logistics", 1.8, 20, 4.9,
            "In Stock", "HL-WLK-7010", "Today, 07:00 AM", "Passed (Lock Mechanism & Load Test)", "14 Sept 2026",
            "ISO 11199 Walking Aids", "Grade A+ (Sterilized Grips)", 12
        ),
        (
            "HL-CMD-7020",
            "Adjustable Bedside Commode Chair with Removable Bucket",
            "Mobility",
            "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80",
            "Rust-resistant powder-coated frame with splash shield, lid, and padded armrests.",
            "Eliminates painful and dangerous post-surgery bathroom trips. Can be placed right next to the patient bed or positioned over standard toilet commodes as an elevated safety seat.",
            59, 249, 599, 500, 99, 0, 99, 3500,
            97, 100, 98, 97, 100, 94, 96,
            "VND-02", "MedEquip Express Central", 2.5, 30, 4.9,
            "In Stock", "HL-CMD-7020", "Today, 08:00 AM", "Passed (Hygiene Disinfection Certified)", "10 Sept 2026",
            "Medical Sanitation Grade A", "Grade A+ (Autoclaved Bucket)", 6
        ),
        (
            "HL-CRU-7030",
            "Ergonomic Lightweight Underarm Crutches (Pair)",
            "Mobility",
            "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80",
            "Dual height and handgrip push-button adjustments with thick TPR non-slip tips.",
            "High-tensile aluminum orthopedic crutches for non-weight-bearing recovery after lower limb fractures, knee arthroscopy, or ankle trauma.",
            39, 149, 349, 300, 99, 0, 99, 1800,
            99, 100, 100, 98, 100, 98, 99,
            "VND-01", "PulseCare Home Logistics", 1.8, 20, 4.9,
            "In Stock", "HL-CRU-7030", "Today, 09:30 AM", "Passed (Stress Test 140kg)", "12 Sept 2026",
            "ISO 11334 Certified", "Grade A+ (Sterilized)", 15
        ),

        # Monitoring & Home ICU
        (
            "HL-MON-8010",
            "Multi-Parameter 5-Para Patient Vital Signs Monitor",
            "Monitoring",
            "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
            "12.1-inch color TFT display monitoring ECG, SpO2, NIBP, Respiration, and Temperature.",
            "Hospital ICU-standard vital sign monitor configured for home ICU setups. Features real-time visual and audio alarms, 72-hour trend review, arrhythmia detection, and rechargeable backup battery.",
            299, 1199, 2999, 2000, 199, 150, 199, 42000,
            97, 100, 98, 97, 100, 93, 97,
            "VND-02", "MedEquip Express Central", 2.5, 30, 4.9,
            "In Stock", "HL-MON-8010", "13 Sept 2026", "Passed (NIBP & ECG Simulator Calibrated)", "06 Sept 2026",
            "IEC 60601-1 Medical Verified", "Grade A+ (Calibrated)", 5
        ),
        (
            "HL-PMP-8020",
            "Precision Micro-Syringe Infusion Pump",
            "Home ICU",
            "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80",
            "Accurate drug delivery (0.1 to 1500 ml/h) with occlusion sensor and dual CPU microprocessors.",
            "Essential for controlled administration of antibiotics, cardiac infusions, and parenteral medications at home. Compatible with 10ml, 20ml, 30ml, and 50/60ml standard syringes.",
            199, 799, 1999, 1500, 199, 100, 199, 28000,
            98, 100, 99, 97, 100, 95, 98,
            "VND-04", "LifeLine Critical Care Logistics", 4.5, 45, 4.7,
            "In Stock", "HL-PMP-8020", "14 Sept 2026", "Passed (Flow Accuracy +/-2% Verified)", "07 Sept 2026",
            "CE Class IIb Certified", "Grade A+ (Calibrated & Tested)", 3
        ),
        (
            "HL-BPM-8030",
            "Digital Upper-Arm Blood Pressure & Pulse Monitor",
            "Monitoring",
            "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
            "Clinically validated oscillometric monitor with irregular heartbeat detection.",
            "Accurate and quick blood pressure tracking with large backlit LCD and memory storage for two family users.",
            39, 149, 399, 400, 99, 0, 99, 2400,
            96, 100, 97, 95, 98, 92, 95,
            "VND-01", "PulseCare Home Logistics", 1.8, 20, 4.9,
            "In Stock", "HL-BPM-8030", "Today, 10:30 AM", "Passed (Pressure Accuracy Tested)", "11 Sept 2026",
            "AAMI/ESH Validated", "Grade A+ (Sanitized)", 10
        ),
        (
            "HL-GLU-8040",
            "Continuous Blood Glucose Monitoring System",
            "Monitoring",
            "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
            "No-coding glucometer kit with 5-second test time and 0.5 microliter blood sample.",
            "Supplied with sterile lancing device and 25 test strips for diabetic monitoring during home rehabilitation.",
            49, 199, 499, 500, 99, 0, 99, 2900,
            95, 100, 96, 94, 98, 90, 94,
            "VND-05", "Apex Home Health Hub", 5.2, 50, 4.6,
            "In Stock", "HL-GLU-8040", "11 Sept 2026", "Passed (Control Solution Calibration)", "08 Sept 2026",
            "ISO 15197 In-Vitro Diagnostic", "Grade A (Sterile)", 7
        ),

        # Accessories & Orthopedic
        (
            "HL-ACC-9010",
            "Post-Operative Hinged Knee Immobilizer & Brace",
            "Accessories",
            "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80",
            "Telescopic range-of-motion dial pins (0-120 degrees flexion) for ACL and knee surgery recovery.",
            "Medical-grade rehabilitation knee orthosis with breathable lining and quick-release safety buckles.",
            49, 179, 449, 500, 99, 0, 99, 4500,
            97, 100, 98, 96, 99, 95, 96,
            "VND-02", "MedEquip Express Central", 2.5, 30, 4.9,
            "In Stock", "HL-ACC-9010", "Today, 09:15 AM", "Passed (Hinge Lock Verified)", "10 Sept 2026",
            "CE Class I Medical", "Grade A+ (Fresh Washed & Sanitized)", 8
        ),
        (
            "HL-ACC-9020",
            "Orthopedic Rigid Cervical Collar & Lumbar Support Belt",
            "Accessories",
            "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80",
            "Anatomical contour chin support and double-pull lumbar belt with flexible steel stays.",
            "Designed for cervical spine stabilization, lower back post-operative decompression, and sciatica relief.",
            39, 149, 399, 400, 99, 0, 99, 3200,
            98, 100, 99, 97, 100, 97, 98,
            "VND-03", "CareFirst Medical Devices", 3.2, 35, 4.8,
            "In Stock", "HL-ACC-9020", "Yesterday, 03:30 PM", "Passed (Tensile & Velcro Integrity)", "12 Sept 2026",
            "ISO Medical Quality", "Grade A+ (Sterilized)", 11
        )
    ]

    cursor.executemany("""
    INSERT INTO equipment (
        id, name, category, image_url, short_desc, full_desc,
        daily_price, weekly_price, monthly_price, security_deposit,
        delivery_fee, installation_fee, pickup_fee, buy_price,
        trust_score, sanitization_score, functional_test_score,
        maintenance_score, certification_score, age_score, vendor_reliability_score,
        vendor_id, vendor_name, vendor_distance_km, vendor_eta_mins, vendor_rating,
        availability, serial_number, last_sanitized, last_functional_test,
        last_maintenance, certification_status, condition_grade, rental_history_count
    ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
    )
    """, equipment)

    # 3. Insert Care Services
    services = [
        (
            "SRV-01", "Certified ICU Home Care Nurse", "Nursing",
            "Experienced registered nurse providing 12-hour comprehensive bedside critical care, medication administration, vitals recording, catheter care, and tracheostomy suctioning.",
            "12-Hour Shift", 1499, "PulseCare Nursing Network", 4.9,
            "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=400&q=80"
        ),
        (
            "SRV-02", "Orthopedic Rehabilitation Physiotherapist", "Physiotherapy",
            "Licensed post-surgery orthopedic physiotherapist conducting tailored gait re-training, range-of-motion drills, joint mobilization, and strength rehabilitation.",
            "45-Min Home Session", 699, "Apex Physio Solutions", 4.9,
            "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80"
        ),
        (
            "SRV-03", "Senior Consultant Tele-Consultation", "Doctor",
            "High-definition video teleconsultation with a senior general physician or pulmonologist to review home recovery parameters and equipment settings.",
            "20-Min Video Call", 499, "HealLink Clinician Panel", 4.8,
            "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80"
        ),
        (
            "SRV-04", "Certified Medical Technician Setup & Training", "Technician",
            "On-site biomedical technician for full equipment installation, circuit leak testing, electrical earthing verification, and patient/family hands-on demo.",
            "On-Site Visit (60 Min)", 250, "MedEquip Technical Force", 5.0,
            "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&q=80"
        )
    ]
    cursor.executemany("""
    INSERT INTO care_services (id, name, category, description, duration, price, provider_name, rating, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, services)

    # 4. Insert Demo Bookings (Active Family Dashboard)
    bookings = [
        (
            "HL-BK-9401", "Rajesh Kumar (Father)", "+91 98201 12345",
            "Flat 402, Sunrise Heights, 12th Cross, Metro Central",
            "HL-BED-2048", "3-Function Motorized Electric ICU Hospital Bed",
            "Monthly", 30, "2026-09-01", "Morning (09:00 - 12:00)", 1, 1,
            3299, 299, 250, 299, 2500, 6647, 2500, "Active", 6
        ),
        (
            "HL-BK-9402", "Rajesh Kumar (Father)", "+91 98201 12345",
            "Flat 402, Sunrise Heights, 12th Cross, Metro Central",
            "HL-WLK-7010", "Reciprocal Folding Adult Walker with Front Wheels",
            "Monthly", 30, "2026-09-01", "Morning (09:00 - 12:00)", 0, 1,
            499, 99, 0, 99, 500, 1197, 500, "Active", 6
        ),
        (
            "HL-BK-9403", "Smt. Shanti Devi", "+91 98331 87654",
            "House #15, Green Park Avenue, Sector 14",
            "HL-OXY-1024", "Medical Oxygen Concentrator (10 LPM High Flow)",
            "Weekly", 7, "2026-09-14", "Immediate Express", 1, 1,
            1499, 199, 150, 199, 2000, 4047, 2000, "Dispatched", 4
        )
    ]
    cursor.executemany("""
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
    """, bookings)

    # 5. Insert Return Inspections (AI Return & Reuse Intelligence Workflow)
    inspections = [
        ("INS-7801", "HL-BIP-4011", "ResMed Lumis 150 VPAP Auto BiPAP Machine", "SN-BIP-9921", "2026-09-14", 3, "Deep Cleaning & Disinfection", "Filter replaced, ultrasonic chamber sanitized", "Tech. Vikram Rao", "In Process"),
        ("INS-7802", "HL-BED-2049", "Deluxe 2-Function Manual Hospital Bed", "SN-BED-4410", "2026-09-13", 5, "Technician Verification", "Crank gears greased, all structural welds inspected", "Tech. Suresh Nair", "Pending Sign-off"),
        ("INS-7803", "HL-OXY-1025", "Compact Portable Oxygen Concentrator (5 LPM)", "SN-OXY-3382", "2026-09-12", 6, "Ready for Rental", "Passed 14-point purity & flow audit (94.4%)", "Tech. Vikram Rao", "Certified Ready"),
        ("INS-7804", "HL-WHL-1080", "Ultra-Light Deluxe Foldable Wheelchair", "SN-WHL-2291", "2026-09-15", 2, "Visual & Structural Inspection", "Minor scratch on right footrest; frame intact", "Tech. Amit Verma", "In Process")
    ]
    cursor.executemany("""
    INSERT INTO return_inspections (
        inspection_ref, equipment_id, equipment_name, serial_number,
        return_date, current_stage, stage_name, notes, technician_name, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, inspections)

    # 6. Insert Emergency Requests
    emergencies = [
        ("EMG-101", "Oxygen Concentrator 10L", "Anil Mehta", "+91 98450 11223", "Outer Ring Road, Block B", "Critical High Urgency", "VND-01", "PulseCare Home Logistics", 20, 399, "Dispatched"),
        ("EMG-102", "Suction Phlegm Aspirator", "Pooja Sharma", "+91 98711 44556", "Apollo Road, Apt 2B", "Urgent Post-Discharge", "VND-02", "MedEquip Express Central", 30, 149, "Arrived at Doorstep")
    ]
    cursor.executemany("""
    INSERT INTO emergency_requests (
        request_ref, equipment_type, patient_name, patient_phone,
        location, urgency, vendor_id, vendor_name, eta_mins, daily_price, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, emergencies)

    conn.commit()
    conn.close()
    print("HealLink database seeded with comprehensive equipment, vendors, bookings, and inspections successfully!")

if __name__ == "__main__":
    seed_database()