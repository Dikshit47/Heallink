"""
HEAL LINK - AI Care Twin, Bundle Generator & Financial Calculator Engine
Provides deterministic, reliable, and clinically structured recommendations with graceful AI fallbacks.
"""
import re
from typing import Dict, Any, List

MEDICAL_DISCLAIMER = (
    "Recommendations are informational and should not replace advice from a qualified healthcare professional. "
    "Final equipment selection should follow the treating clinician's recommendation."
)

def generate_care_twin(user_input: str) -> Dict[str, Any]:
    """
    Generates a personalized recovery and equipment journey based on patient situation.
    """
    text = user_input.lower()

    # Extract days or duration
    duration_match = re.search(r"(\d+)\s*(day|week|month)", text)
    if duration_match:
        val = int(duration_match.group(1))
        unit = duration_match.group(2)
        if "week" in unit:
            duration_days = val * 7
        elif "month" in unit:
            duration_days = val * 30
        else:
            duration_days = val
    else:
        duration_days = 45 # Default standard recovery

    # Condition classification
    if any(k in text for k in ["hip", "knee", "fracture", "ortho", "joint", "surgery", "replacement"]):
        condition_title = "Post-Orthopedic / Hip Surgery Recovery"
        patient_type = "Orthopedic Surgery Patient"
        phases = [
            {
                "phase": "Weeks 1–2: Acute Recovery & Fall Prevention",
                "focus": "Pain management, zero-strain transfers, and total pressure sore prevention.",
                "equipment": [
                    {"id": "HL-BED-2048", "name": "3-Function Motorized Electric ICU Bed", "reason": "Controlled back and knee elevation prevents hip flexion beyond 90 degrees."},
                    {"id": "HL-WLK-7010", "name": "Reciprocal Folding Adult Walker", "reason": "Mandatory bilateral stability for safe room transfers and non-weight-bearing ambulation."},
                    {"id": "HL-CMD-7020", "name": "Adjustable Bedside Commode Chair", "reason": "Eliminates dangerous bathroom slips and avoids deep low-toilet hip bending."},
                    {"id": "HL-MAT-2050", "name": "Medical Anti-Decubitus Air Mattress", "reason": "Protects sacral skin and enhances blood micro-circulation during initial bed confinement."}
                ],
                "care_actions": [
                    "Perform seated ankle pumps every 2 hours to prevent DVT.",
                    "Ensure bedside commode is height-adjusted so hips remain higher than knees.",
                    "Keep walker within arm's reach at all times before standing."
                ]
            },
            {
                "phase": "Weeks 3–4: Progressive Mobility & Gait Training",
                "focus": "Active quadriceps activation, guided walking, and supervised outdoor visits.",
                "equipment": [
                    {"id": "HL-WLK-7010", "name": "Reciprocal Folding Adult Walker", "reason": "Gradual progression from reciprocal to fixed forward stride."},
                    {"id": "HL-WHL-1080", "name": "Ultra-Light Deluxe Foldable Wheelchair", "reason": "For safe doctor follow-up visits and hospital physiotherapy trips."}
                ],
                "care_actions": [
                    "Physiotherapist home visit (3x per week) for progressive hip abduction exercises.",
                    "Practice smooth sit-to-stand transitions using bed remote assist.",
                    "Begin partial weight bearing as authorized by treating surgeon."
                ]
            },
            {
                "phase": f"Weeks 5–{max(6, duration_days // 7)}: Functional Independence & Safe Equipment Weaning",
                "focus": "Transitioning to independent walking and scheduled equipment return.",
                "equipment": [
                    {"id": "HL-CRU-7030", "name": "Ergonomic Underarm Crutches", "reason": "Optional transition step from walker to single-point cane before full independence."}
                ],
                "care_actions": [
                    "Schedule HealLink Return & Pickup for Hospital Bed & Commode Chair.",
                    "Conduct final home hazard assessment (remove scatter rugs, inspect bathroom grab bars).",
                    "Return rental equipment via one-click return in Family Care Dashboard."
                ]
            }
        ]
        recommended_bundle = "post_surgery_bundle"
        reminders = [
            "Medication & anticoagulation administration at 09:00 AM.",
            "Physiotherapy rehabilitation session scheduled for tomorrow at 10:30 AM.",
            f"Rental milestone reminder: Review equipment return or extension at Day {max(1, duration_days - 7)}."
        ]

    elif any(k in text for k in ["oxygen", "bipap", "cpap", "respiratory", "copd", "breath", "lung", "pneumonia"]):
        condition_title = "Cardiopulmonary & Respiratory Home Support"
        patient_type = "Respiratory Care Patient"
        phases = [
            {
                "phase": "Weeks 1–2: High-Flow Oxygen & Airway Stabilization",
                "focus": "Target oxygen saturation (SpO2 > 94%) and non-invasive ventilation.",
                "equipment": [
                    {"id": "HL-OXY-1024", "name": "Medical Oxygen Concentrator 10L", "reason": "Continuous hospital-grade high-flow oxygen with digital purity alarms."},
                    {"id": "HL-BIP-4011", "name": "ResMed Lumis 150 VPAP Auto BiPAP", "reason": "Reduces work of breathing, clears CO2, and provides night-time pressure support."},
                    {"id": "HL-MON-8010", "name": "Multi-Parameter 5-Para Patient Monitor", "reason": "Continuous SpO2, pulse, and respiratory rate tracking with audio thresholds."}
                ],
                "care_actions": [
                    "Check distilled water level in oxygen humidifier bottle twice daily.",
                    "Verify BiPAP mask cushion seal to prevent high airway leakage.",
                    "Keep emergency B-Type oxygen cylinder on standby."
                ]
            },
            {
                "phase": "Weeks 3–4: Titration & Pulmonary Rehabilitation",
                "focus": "Gradual daytime oxygen tapering and lung expansion therapy.",
                "equipment": [
                    {"id": "HL-OXY-1024", "name": "Medical Oxygen Concentrator 10L", "reason": "Night-time and exertional oxygen support."},
                    {"id": "HL-NEB-5010", "name": "Heavy-Duty Compressor Nebulizer", "reason": "Targeted bronchodilator aerosol inhalation 2-3 times daily."}
                ],
                "care_actions": [
                    "Perform deep-breathing incentive spirometer exercises.",
                    "Record daily morning and evening SpO2 in Family Health log."
                ]
            },
            {
                "phase": f"Weeks 5–{max(6, duration_days // 7)}: Maintenance & Weaning",
                "focus": "Pulmonologist review and return of redundant high-flow equipment.",
                "equipment": [
                    {"id": "HL-BPM-8030", "name": "Digital Upper-Arm Blood Pressure & Pulse Monitor", "reason": "Routine vitals monitoring."}
                ],
                "care_actions": [
                    "Schedule pulmonology tele-consultation before stopping oxygen therapy.",
                    "Initiate Return & Sanitization for BiPAP and Concentrator."
                ]
            }
        ]
        recommended_bundle = "respiratory_bundle"
        reminders = [
            "Check oxygen flowmeter settings as prescribed by pulmonologist.",
            "Wash BiPAP mask cushion daily in mild soapy water.",
            f"HealLink automated oxygen purity check scheduled for Day {min(15, duration_days)}."
        ]

    else:
        # Elderly Home Care & Palliative Recovery
        condition_title = "Elderly Home Care & Assisted Living Support"
        patient_type = "Elderly Patient"
        phases = [
            {
                "phase": "Weeks 1–2: Safe Environment Setup & Fall Prevention",
                "focus": "Maximizing dignity, caregiver ease, and eliminating bed-to-chair fall risks.",
                "equipment": [
                    {"id": "HL-BED-2048", "name": "3-Function Motorized Electric ICU Bed", "reason": "Allows easy patient sit-up for meals and height reduction for safe entry/exit."},
                    {"id": "HL-CMD-7020", "name": "Adjustable Bedside Commode Chair", "reason": "Close bedside toilet accessibility prevents night-time disorientation falls."},
                    {"id": "HL-WLK-7010", "name": "Reciprocal Folding Adult Walker", "reason": "Stable support base for slow assisted indoor walking."}
                ],
                "care_actions": [
                    "Keep bed side rails raised during sleep hours.",
                    "Ensure night lamps illuminate pathway to bedside commode.",
                    "Schedule certified home nurse for daily vitals and hygiene."
                ]
            },
            {
                "phase": "Weeks 3–4: Sustained Mobility & Comfort",
                "focus": "Gentle range of motion, sun exposure, and comfortable family interaction.",
                "equipment": [
                    {"id": "HL-WHL-1080", "name": "Ultra-Light Deluxe Foldable Wheelchair", "reason": "Enables patient to join family in living room and outdoors comfortably."}
                ],
                "care_actions": [
                    "Engage in 15 minutes of guided assisted mobility twice daily.",
                    "Monitor skin over bony prominences for any redness."
                ]
            },
            {
                "phase": f"Weeks 5–{max(6, duration_days // 7)}: Ongoing Care Review",
                "focus": "Long-term rental optimization and monthly renewal discounts.",
                "equipment": [
                    {"id": "HL-BED-2048", "name": "3-Function Motorized Electric ICU Bed", "reason": "Continued ergonomic care support."}
                ],
                "care_actions": [
                    "Review monthly rental auto-renewal or rent-to-own buyout option.",
                    "Schedule periodic HealLink technician preventive maintenance inspection."
                ]
            }
        ]
        recommended_bundle = "elderly_care_bundle"
        reminders = [
            "Ensure hydration and scheduled posture changes every 2 hours.",
            "Nurse visit for weekly health parameter check scheduled for Thursday.",
            f"Monthly rental savings assessment on Day 28."
        ]

    return {
        "user_query": user_input,
        "estimated_duration_days": duration_days,
        "condition_title": condition_title,
        "patient_type": patient_type,
        "phases": phases,
        "recommended_bundle_key": recommended_bundle,
        "care_reminders": reminders,
        "disclaimer": MEDICAL_DISCLAIMER
    }

def get_bundle_details(bundle_key: str = "post_surgery_bundle") -> Dict[str, Any]:
    """
    Returns curated AI equipment bundles with savings, individual vs bundle prices, and item rationales.
    """
    bundles = {
        "post_surgery_bundle": {
            "title": "POST-SURGERY HOME CARE BUNDLE",
            "tagline": "Complete clinical recovery suite recommended for hip, knee, or spine surgery recovery.",
            "items": [
                {
                    "id": "HL-BED-2048",
                    "name": "3-Function Motorized Electric Hospital Bed",
                    "monthly_price": 3299,
                    "daily_price": 349,
                    "why": "Crucial for controlled elevation without stressing hip/knee joints. Empowers patient to sit up for meals and adjust leg height."
                },
                {
                    "id": "HL-MAT-2050",
                    "name": "Medical Anti-Decubitus Air/Ripple Mattress",
                    "monthly_price": 899,
                    "daily_price": 99,
                    "why": "Prevents painful bedsores (pressure ulcers) by constantly alternating air chamber pressure every 6 minutes."
                },
                {
                    "id": "HL-WLK-7010",
                    "name": "Reciprocal Folding Adult Walker with Wheels",
                    "monthly_price": 499,
                    "daily_price": 49,
                    "why": "Essential for immediate postoperative ambulation. Provides rigid bilateral balance and weight offloading."
                },
                {
                    "id": "HL-CMD-7020",
                    "name": "Adjustable Bedside Commode Chair",
                    "monthly_price": 599,
                    "daily_price": 59,
                    "why": "Prevents dangerous slip falls during night bathroom trips and keeps hip angle safely above 90 degrees."
                },
                {
                    "id": "HL-WHL-1080",
                    "name": "Ultra-Light Deluxe Foldable Wheelchair",
                    "monthly_price": 1399,
                    "daily_price": 119,
                    "why": "Facilitates seamless transfers to hospital follow-ups and diagnostic scans without tiring the patient."
                }
            ],
            "individual_total_monthly": 6695,
            "bundle_price_monthly": 4999,
            "savings_monthly": 1696,
            "savings_pct": 25,
            "refundable_deposit": 3000,
            "delivery_fee": 199,
            "installation_fee": 0  # Free installation in bundle
        },
        "respiratory_bundle": {
            "title": "RESPIRATORY & PULMONARY CARE BUNDLE",
            "tagline": "Intensive oxygenation and airway stabilization kit for COPD, post-COVID, and lung therapy.",
            "items": [
                {
                    "id": "HL-OXY-1024",
                    "name": "Medical Oxygen Concentrator (10 LPM High Flow)",
                    "monthly_price": 3999,
                    "daily_price": 399,
                    "why": "Delivers continuous 93% pure oxygen 24/7 without needing frequent cylinder refills."
                },
                {
                    "id": "HL-CYL-3012",
                    "name": "Jumbo Oxygen Cylinder (47L) with Flowmeter",
                    "monthly_price": 1899,
                    "daily_price": 199,
                    "why": "Vital zero-electricity emergency backup in case of residential power outage."
                },
                {
                    "id": "HL-NEB-5010",
                    "name": "Heavy-Duty Compressor & Ultrasonic Nebulizer",
                    "monthly_price": 699,
                    "daily_price": 79,
                    "why": "Direct aerosol medication delivery for bronchodilation and loosening thick pulmonary secretions."
                },
                {
                    "id": "HL-MON-8010",
                    "name": "Multi-Parameter 5-Para Patient Vital Signs Monitor",
                    "monthly_price": 2999,
                    "daily_price": 299,
                    "why": "Continuous bedside SpO2, heart rate, and respiratory trend monitoring with warning alarms."
                }
            ],
            "individual_total_monthly": 9596,
            "bundle_price_monthly": 7499,
            "savings_monthly": 2097,
            "savings_pct": 22,
            "refundable_deposit": 4000,
            "delivery_fee": 199,
            "installation_fee": 0
        },
        "elderly_care_bundle": {
            "title": "ELDERLY HOME COMFORT & MOBILITY BUNDLE",
            "tagline": "Long-term fall prevention and assisted living setup designed for senior loved ones.",
            "items": [
                {
                    "id": "HL-BED-2048",
                    "name": "3-Function Motorized Electric Hospital Bed",
                    "monthly_price": 3299,
                    "daily_price": 349,
                    "why": "Reduces physical strain on both the elderly parent and family caregivers during posture adjustments."
                },
                {
                    "id": "HL-MAT-2050",
                    "name": "Medical Anti-Decubitus Air/Ripple Mattress",
                    "monthly_price": 899,
                    "daily_price": 99,
                    "why": "Gentle 24/7 pressure shifting keeps skin healthy and comfortable."
                },
                {
                    "id": "HL-CMD-7020",
                    "name": "Adjustable Bedside Commode Chair",
                    "monthly_price": 599,
                    "daily_price": 59,
                    "why": "Safe, private toilet assistance right beside the bed with hygiene pan."
                },
                {
                    "id": "HL-WLK-7010",
                    "name": "Reciprocal Folding Adult Walker with Wheels",
                    "monthly_price": 499,
                    "daily_price": 49,
                    "why": "Sturdy confidence builder for maintaining daily balance and light indoor walking."
                }
            ],
            "individual_total_monthly": 5296,
            "bundle_price_monthly": 3999,
            "savings_monthly": 1297,
            "savings_pct": 24,
            "refundable_deposit": 2500,
            "delivery_fee": 199,
            "installation_fee": 0
        }
    }
    return bundles.get(bundle_key, bundles["post_surgery_bundle"])

def calculate_rent_vs_buy(equipment_id: str, duration_days: int, daily_price: int, monthly_price: int, buy_price: int) -> Dict[str, Any]:
    """
    Deterministic financial model comparing Rent vs Buy vs Rent-to-Own.
    Calculates exact amounts and explains the mathematical rationale.
    """
    # 1. Rental Calculation:
    # Use most economical mix of monthly and daily
    months = duration_days // 30
    extra_days = duration_days % 30
    
    # Check if extra_days * daily_price is higher than 1 extra month
    extra_rent = min(extra_days * daily_price, monthly_price)
    total_rent = (months * monthly_price) + extra_rent
    if total_rent == 0:
        total_rent = daily_price * duration_days

    # Add delivery & pickup once
    delivery_and_pickup = 398  # 199 + 199
    total_rent_cost = total_rent + delivery_and_pickup

    # 2. Buy Calculation:
    # Outright purchase price + maintenance allowance - estimated residual resale value (50% after use)
    depreciation_rate = min(0.60, 0.20 + (duration_days / 180) * 0.35)
    estimated_resale_value = int(buy_price * (1.0 - depreciation_rate))
    net_buy_cost = buy_price - estimated_resale_value  # Net out of pocket after selling

    # 3. Rent-to-Own Calculation:
    # 15% surcharge on buy price paid in installments, with 70% rental fee credited towards purchase
    rent_credit = int(total_rent * 0.70)
    rent_to_own_cost = max(total_rent, int(buy_price * 1.15) - rent_credit + total_rent)

    # Deterministic Verdict:
    if total_rent_cost < net_buy_cost:
        best_option = "RENT"
        savings = net_buy_cost - total_rent_cost
        summary = (
            f"Renting is the most cost-effective decision for a {duration_days}-day requirement. "
            f"You save ₹{savings:,} compared to buying and dealing with maintenance and depreciation."
        )
    elif duration_days > 120 and buy_price < (total_rent_cost * 1.2):
        best_option = "BUY"
        savings = total_rent_cost - net_buy_cost
        summary = (
            f"For long-term usage exceeding 120 days, outright purchase offers better equity. "
            f"Net cost after resale is estimated at ₹{net_buy_cost:,} vs ₹{total_rent_cost:,} for continuous rent."
        )
    else:
        best_option = "RENT-TO-OWN"
        summary = (
            f"If recovery timeline is uncertain, Rent-to-Own lets you try for 30–60 days while earning 70% rental credits towards ownership."
        )

    return {
        "duration_days": duration_days,
        "equipment_id": equipment_id,
        "rent": {
            "rental_subtotal": total_rent,
            "logistics_fee": delivery_and_pickup,
            "total_rent_cost": total_rent_cost,
            "label": f"₹{total_rent_cost:,}"
        },
        "buy": {
            "retail_purchase_price": buy_price,
            "estimated_resale_value": estimated_resale_value,
            "net_out_of_pocket": net_buy_cost,
            "label": f"₹{buy_price:,} (Net ₹{net_buy_cost:,})"
        },
        "rent_to_own": {
            "accumulated_rent_credit": rent_credit,
            "total_plan_estimate": rent_to_own_cost,
            "label": f"₹{rent_to_own_cost:,}"
        },
        "best_option": best_option,
        "explanation": summary,
        "disclaimer": "Calculations are financial estimates for demo planning purposes and exclude local taxes."
    }