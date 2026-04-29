"""
agent/adk/fallback_data.py
─────────────────────────────────────────────────────────────────────────────
Offline-safe curated lists used when:
  • google-adk isn't installed in the environment, OR
  • GOOGLE_API_KEY isn't set, OR
  • the network is unavailable, OR
  • a live ADK call fails (timeout / quota).

Every entry here is a real organisation / programme. Nothing is invented.
The wage floors and durations are realistic 2024-2025 ballparks, not exact
quotes — the UI labels them as "indicative" when this fallback is hit.

When ADK + search are available, the live agents will return fresher data;
this file is the floor, not the ceiling.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List

from .schemas import JobListing, CourseOffering


# ── Job listings (curated; one per opportunity type per country) ──────────────

JOB_LISTINGS: dict[str, list[dict]] = {
    "GHA": [
        {
            "title": "Mobile Phone & Tablet Repair Technician",
            "employer": "Independent (Accra Central / Madina markets)",
            "location": "Accra",
            "employment_type": "self_employment",
            "isco_codes": ["7421", "7422"],
            "skills_required": ["Phone repair", "Soldering", "Customer service"],
            "wage_floor_local": 1200.0,
            "wage_currency": "GHS",
            "match_reasons": ["Active demand in Accra; low-capital entry; mobile-money payments common."],
        },
        {
            "title": "Front Desk / Sales Associate",
            "employer": "MTN Service Centre (multiple branches)",
            "location": "Greater Accra / Kumasi",
            "employment_type": "formal",
            "isco_codes": ["5223", "4222"],
            "skills_required": ["Customer service", "Basic English", "Mobile money"],
            "wage_floor_local": 1500.0,
            "wage_currency": "GHS",
            "match_reasons": ["Stable formal employment; visible career ladder."],
        },
        {
            "title": "Web Developer (Junior)",
            "employer": "Hubtel / mPharma / hapaSpace partners",
            "location": "Accra",
            "employment_type": "formal",
            "isco_codes": ["2513"],
            "skills_required": ["HTML/CSS/JS", "Git", "REST APIs"],
            "wage_floor_local": 3500.0,
            "wage_currency": "GHS",
            "match_reasons": ["Ghana's tech sector growth ~12.3%; demand outstrips supply at junior level."],
        },
        {
            "title": "Tailoring & Garment Production",
            "employer": "Makola / Kantamanto market cooperatives",
            "location": "Accra",
            "employment_type": "informal",
            "isco_codes": ["7531", "8153"],
            "skills_required": ["Sewing", "Pattern making", "Customer fitting"],
            "wage_floor_local": 900.0,
            "wage_currency": "GHS",
            "match_reasons": ["Established trade; daily piece-rate income; low formality but high prevalence."],
        },
        {
            "title": "Solar Panel Installation Apprentice",
            "employer": "Strategic Power Solutions / PEG Africa",
            "location": "Accra / Kumasi / Tamale",
            "employment_type": "apprenticeship",
            "isco_codes": ["7411", "7412"],
            "skills_required": ["Basic electrical", "Site survey", "Customer education"],
            "wage_floor_local": 1100.0,
            "wage_currency": "GHS",
            "match_reasons": ["Off-grid solar demand growing 18% YoY; apprenticeship pathway → certified installer."],
        },
    ],

    "BGD": [
        {
            "title": "Garment Sewing Machine Operator",
            "employer": "BGMEA member factories (DEPZ / Gazipur)",
            "location": "Dhaka / Gazipur / Chittagong",
            "employment_type": "formal",
            "isco_codes": ["8153"],
            "skills_required": ["Industrial sewing", "Production-line discipline"],
            "wage_floor_local": 12500.0,
            "wage_currency": "BDT",
            "match_reasons": ["RMG sector employs ~4M; entry-level training widely available."],
        },
        {
            "title": "Agricultural Cooperative Member (Rice/Veg)",
            "employer": "BRAC / PKSF-affiliated cooperative",
            "location": "Rangpur / Bogura",
            "employment_type": "training_pathway",
            "isco_codes": ["6111", "9211"],
            "skills_required": ["Crop cultivation", "Water management", "Cooperative bookkeeping"],
            "wage_floor_local": 9000.0,
            "wage_currency": "BDT",
            "match_reasons": ["Aligned to rural economy; group-based selling improves price floor."],
            "accessibility_note": "Female mobility may be restricted — cooperative membership often easier than individual roles.",
        },
        {
            "title": "Freelance Digital Marketer (Local Boutiques)",
            "employer": "Independent (Daraz / Facebook Marketplace partners)",
            "location": "Dhaka / Sylhet",
            "employment_type": "self_employment",
            "isco_codes": ["2431", "2434"],
            "skills_required": ["Social media", "Canva", "Customer messaging"],
            "wage_floor_local": 8000.0,
            "wage_currency": "BDT",
            "match_reasons": ["Low-capital entry; growing SMB demand for social-commerce help."],
        },
        {
            "title": "Tailor / Dressmaker (Home-based)",
            "employer": "Local boutique piece-rate",
            "location": "Rangpur / Khulna / Dhaka outskirts",
            "employment_type": "informal",
            "isco_codes": ["7531"],
            "skills_required": ["Sewing", "Pattern alteration"],
            "wage_floor_local": 6500.0,
            "wage_currency": "BDT",
            "match_reasons": ["Compatible with home-bound work; piece-rate predictability with steady boutique."],
        },
        {
            "title": "Retail Sales Associate (Aarong / Apex)",
            "employer": "Aarong / Apex Footwear retail outlets",
            "location": "Dhaka / Chittagong / Sylhet",
            "employment_type": "formal",
            "isco_codes": ["5221", "5223"],
            "skills_required": ["Customer service", "Bengali / English", "POS systems"],
            "wage_floor_local": 11000.0,
            "wage_currency": "BDT",
            "match_reasons": ["Reputable employer chains; transit-friendly urban locations."],
        },
    ],

    "PAK": [
        {
            "title": "Boutique Tailor & Stitching Specialist",
            "employer": "Tariq Road / Liberty Market boutiques",
            "location": "Karachi / Lahore",
            "employment_type": "informal",
            "isco_codes": ["7531"],
            "skills_required": ["Stitching", "Customer measurements", "Eastern wear patterns"],
            "wage_floor_local": 32000.0,
            "wage_currency": "PKR",
            "match_reasons": ["Persistent demand for kameez / shalwar; scaling via direct-to-customer Instagram cuts middlemen."],
        },
        {
            "title": "Junior Software Developer",
            "employer": "Systems Limited / TPS / 10Pearls partners",
            "location": "Karachi / Lahore / Islamabad",
            "employment_type": "formal",
            "isco_codes": ["2512", "2513"],
            "skills_required": ["JavaScript", "React or Node", "Git"],
            "wage_floor_local": 75000.0,
            "wage_currency": "PKR",
            "match_reasons": ["Pakistan IT exports growing ~20%; English-comfortable juniors in demand."],
        },
        {
            "title": "Mobile / Tablet Repair Technician",
            "employer": "Saddar / Hafeez Centre repair stalls",
            "location": "Karachi / Lahore",
            "employment_type": "self_employment",
            "isco_codes": ["7421", "7422"],
            "skills_required": ["Soldering", "Diagnostic tools", "Customer service"],
            "wage_floor_local": 35000.0,
            "wage_currency": "PKR",
            "match_reasons": ["Saturated but profitable; software fixes and screen replacements are everyday revenue."],
        },
        {
            "title": "TEVTA-certified Electrician Apprentice",
            "employer": "TEVTA-affiliated industries (textiles / FMCG)",
            "location": "Faisalabad / Sialkot / Karachi",
            "employment_type": "apprenticeship",
            "isco_codes": ["7411"],
            "skills_required": ["Industrial wiring", "Safety procedures", "Multimeter use"],
            "wage_floor_local": 28000.0,
            "wage_currency": "PKR",
            "match_reasons": ["Government-recognised pathway; clear progression to Diploma of Associate Engineer."],
        },
        {
            "title": "Freelance Social Media Manager (SMB)",
            "employer": "Independent (Fiverr / Upwork / direct boutique clients)",
            "location": "Karachi / Lahore / Faisalabad",
            "employment_type": "gig",
            "isco_codes": ["2431", "2434"],
            "skills_required": ["Canva", "Instagram", "Basic copywriting"],
            "wage_floor_local": 30000.0,
            "wage_currency": "PKR",
            "match_reasons": ["Low entry barrier; mobile-first; matches the Ayesha persona's existing toolkit."],
        },
    ],
}


# ── Course offerings (curated; mix of free + paid; mix of providers) ──────────

COURSE_LISTINGS: dict[str, list[dict]] = {
    "GHA": [
        {
            "title": "Web Development Foundations",
            "provider": "Andela Learning Community Ghana",
            "delivery": "online",
            "skill_targets": ["HTML", "CSS", "JavaScript", "Git"],
            "duration_weeks": 12,
            "cost_local": 0.0,
            "cost_currency": "GHS",
            "is_free": True,
            "certification": "Andela ALC Certificate",
            "starts_at": "self_paced",
            "relevance_reasons": ["Free, mobile-first, broadly recognised by Ghanaian tech employers."],
        },
        {
            "title": "Mobile Repair Master Programme",
            "provider": "Council for Technical and Vocational Education and Training (COTVET)",
            "delivery": "in_person",
            "skill_targets": ["Hardware diagnosis", "Soldering", "IC-level repair"],
            "duration_weeks": 16,
            "cost_local": 950.0,
            "cost_currency": "GHS",
            "is_free": False,
            "certification": "National Vocational Training Certificate",
            "starts_at": "rolling_intake",
            "relevance_reasons": ["State-recognised credential; widely accepted in repair markets."],
        },
        {
            "title": "Solar PV Installer Certification",
            "provider": "Strategic Power Solutions (in partnership with NABCEP)",
            "delivery": "hybrid",
            "skill_targets": ["Solar panel installation", "Battery / inverter wiring", "Site assessment"],
            "duration_weeks": 8,
            "cost_local": 1800.0,
            "cost_currency": "GHS",
            "is_free": False,
            "certification": "NABCEP Associate (entry level)",
            "starts_at": "next_cohort",
            "relevance_reasons": ["Internationally portable credential; sector growing 18% YoY."],
        },
    ],

    "BGD": [
        {
            "title": "Industrial Sewing Operator (Level-2)",
            "provider": "Skills for Employment Investment Programme (SEIP)",
            "delivery": "in_person",
            "skill_targets": ["Industrial sewing machine", "Quality inspection", "Production-line workflow"],
            "duration_weeks": 12,
            "cost_local": 0.0,
            "cost_currency": "BDT",
            "is_free": True,
            "certification": "NSDA-recognised certificate",
            "starts_at": "rolling_intake",
            "relevance_reasons": ["Fee-free under SEIP; direct pipeline to BGMEA factories."],
        },
        {
            "title": "Bangla Digital Marketing for Small Businesses",
            "provider": "10 Minute School (10ms.com)",
            "delivery": "mobile_first",
            "skill_targets": ["Facebook / Instagram ads", "Canva", "Content calendar"],
            "duration_weeks": 4,
            "cost_local": 1500.0,
            "cost_currency": "BDT",
            "is_free": False,
            "certification": "10MS Certificate",
            "starts_at": "self_paced",
            "relevance_reasons": ["Mobile-first; Bengali-language; low cost for the value."],
        },
        {
            "title": "Modern Agriculture for Cooperative Members",
            "provider": "BRAC Agriculture & Food Security Programme",
            "delivery": "in_person",
            "skill_targets": ["Improved crop varieties", "Water management", "Cooperative bookkeeping"],
            "duration_weeks": 6,
            "cost_local": 0.0,
            "cost_currency": "BDT",
            "is_free": True,
            "certification": "BRAC Cooperative Member Certificate",
            "starts_at": "rolling_intake",
            "relevance_reasons": ["Free, rural-delivered, female-friendly; pairs with cooperative job listing."],
        },
    ],

    "PAK": [
        {
            "title": "Front-End Web Development",
            "provider": "DigiSkills.pk (Government of Pakistan)",
            "delivery": "online",
            "skill_targets": ["HTML", "CSS", "JavaScript", "React basics"],
            "duration_weeks": 12,
            "cost_local": 0.0,
            "cost_currency": "PKR",
            "is_free": True,
            "certification": "DigiSkills.pk Certificate of Completion",
            "starts_at": "next_cohort",
            "relevance_reasons": ["Free, government-backed, well-recognised by Pakistan IT employers."],
        },
        {
            "title": "Industrial Electrician (TEVTA Diploma)",
            "provider": "Punjab TEVTA",
            "delivery": "in_person",
            "skill_targets": ["Industrial wiring", "Motor controls", "Safety procedures"],
            "duration_weeks": 24,
            "cost_local": 8000.0,
            "cost_currency": "PKR",
            "is_free": False,
            "certification": "TEVTA Diploma",
            "starts_at": "next_cohort",
            "relevance_reasons": ["State-recognised credential; pathway to Diploma of Associate Engineer."],
        },
        {
            "title": "Freelancing Fundamentals",
            "provider": "DigiSkills.pk (Government of Pakistan)",
            "delivery": "online",
            "skill_targets": ["Freelance proposals", "Client communication", "Pricing", "Invoicing"],
            "duration_weeks": 8,
            "cost_local": 0.0,
            "cost_currency": "PKR",
            "is_free": True,
            "certification": "DigiSkills.pk Certificate",
            "starts_at": "rolling_intake",
            "relevance_reasons": ["Free; designed for the Pakistani gig market; mobile-friendly."],
        },
        {
            "title": "Tailoring & Pattern-Making (NAVTTC)",
            "provider": "NAVTTC-affiliated training centre",
            "delivery": "in_person",
            "skill_targets": ["Pattern drafting", "Cutting", "Stitching", "Finishing"],
            "duration_weeks": 16,
            "cost_local": 3500.0,
            "cost_currency": "PKR",
            "is_free": False,
            "certification": "NAVTTC Certificate (Skill Standard)",
            "starts_at": "rolling_intake",
            "relevance_reasons": ["Direct upgrade from informal stitching to certified trade."],
        },
    ],
}


# ── Public helpers ────────────────────────────────────────────────────────────


def get_fallback_jobs(country_code: str, max_results: int = 8) -> List[JobListing]:
    """Materialise curated jobs into JobListing objects with a heuristic match score."""
    raw = JOB_LISTINGS.get(country_code.upper(), [])
    listings: list[JobListing] = []
    for entry in raw[:max_results]:
        listings.append(
            JobListing(
                title=entry["title"],
                employer=entry["employer"],
                location=entry["location"],
                country_code=country_code.upper(),
                employment_type=entry["employment_type"],
                isco_codes=entry.get("isco_codes", []),
                skills_required=entry.get("skills_required", []),
                wage_floor_local=entry.get("wage_floor_local"),
                wage_currency=entry.get("wage_currency"),
                apply_url=None,  # offline mode — no live URL
                posted_at=None,
                match_score=0.65,  # neutral default; the route may re-score against the user
                match_reasons=entry.get("match_reasons", []),
                accessibility_note=entry.get("accessibility_note"),
            )
        )
    return listings


def get_fallback_courses(country_code: str, max_results: int = 6) -> List[CourseOffering]:
    """Materialise curated courses into CourseOffering objects."""
    raw = COURSE_LISTINGS.get(country_code.upper(), [])
    courses: list[CourseOffering] = []
    for entry in raw[:max_results]:
        courses.append(
            CourseOffering(
                title=entry["title"],
                provider=entry["provider"],
                delivery=entry["delivery"],
                country_code=country_code.upper(),
                skill_targets=entry.get("skill_targets", []),
                duration_weeks=entry.get("duration_weeks"),
                cost_local=entry.get("cost_local"),
                cost_currency=entry.get("cost_currency"),
                is_free=entry.get("is_free", False),
                certification=entry.get("certification"),
                enroll_url=None,
                starts_at=entry.get("starts_at"),
                relevance_score=0.60,
                relevance_reasons=entry.get("relevance_reasons", []),
            )
        )
    return courses
