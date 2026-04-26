#!/usr/bin/env python3
"""
scripts/seed_data.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Data seeding script.

Downloads and indexes all required datasets into data/ for offline use.
Run once before starting the system. Re-run to refresh specific datasets.

Usage:
    python scripts/seed_data.py                  # seed everything
    python scripts/seed_data.py --dataset onet   # seed only O*NET
    python scripts/seed_data.py --dataset esco   # seed only ESCO
    python scripts/seed_data.py --check          # verify what's present
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import json
import argparse
import logging
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed_data")

# ── Sample O*NET Task Statements (representative subset for hackathon) ────────
# In production: download from https://www.onetcenter.org/database.html

ONET_SAMPLE_TASKS = [
    # Electronics / Repair
    {"task_id": "T-EN-001", "onet_soc": "49-2011.00", "title": "Electrical and Electronics Repairers",
     "task": "Diagnose malfunctions in electrical equipment using testing instruments.",
     "taxonomy_skills": ["S5.6.0", "S5.6.1"]},
    {"task_id": "T-EN-002", "onet_soc": "49-2011.00", "title": "Electrical and Electronics Repairers",
     "task": "Replace defective components such as capacitors, resistors, and circuit boards.",
     "taxonomy_skills": ["S5.6.0"]},
    {"task_id": "T-EN-003", "onet_soc": "49-2022.00", "title": "Telecommunications Equipment Installers",
     "task": "Test circuits and components of malfunctioning equipment to isolate sources of problems.",
     "taxonomy_skills": ["S5.6.0", "S5.6.2"]},

    # Customer Service
    {"task_id": "T-CS-001", "onet_soc": "41-2031.00", "title": "Retail Salespersons",
     "task": "Greet customers and determine what each customer wants or needs.",
     "taxonomy_skills": ["S1.2.1"]},
    {"task_id": "T-CS-002", "onet_soc": "43-4051.00", "title": "Customer Service Representatives",
     "task": "Resolve customers' service or billing complaints by exchanging merchandise or adjusting bills.",
     "taxonomy_skills": ["S1.2.1", "S1.2.3"]},

    # Small Business / Entrepreneurship
    {"task_id": "T-BU-001", "onet_soc": "11-1021.00", "title": "General and Operations Managers",
     "task": "Direct and coordinate activities of businesses or departments concerned with pricing and sales.",
     "taxonomy_skills": ["S6.1.0"]},
    {"task_id": "T-BU-002", "onet_soc": "43-3031.00", "title": "Bookkeeping, Accounting Clerks",
     "task": "Operate computers programmed with accounting software to record, store, and analyze information.",
     "taxonomy_skills": ["S6.1.1"]},

    # Agriculture (for Bangladesh config)
    {"task_id": "T-AG-001", "onet_soc": "45-1011.00", "title": "First-Line Supervisors of Farming Workers",
     "task": "Observe and evaluate the work of farming equipment operators and farm workers.",
     "taxonomy_skills": ["S2.1.0"]},
    {"task_id": "T-AG-002", "onet_soc": "45-2041.00", "title": "Graders and Sorters of Agricultural Products",
     "task": "Examine produce to determine whether size, color, and condition meet established standards.",
     "taxonomy_skills": ["S2.1.1"]},

    # Construction / Physical trades
    {"task_id": "T-CO-001", "onet_soc": "47-2061.00", "title": "Construction Laborers",
     "task": "Load, unload, and identify building materials, merchandise, and equipment to be moved.",
     "taxonomy_skills": ["S3.1.0"]},
    {"task_id": "T-CO-002", "onet_soc": "47-2111.00", "title": "Electricians",
     "task": "Connect wires to circuit breakers, transformers, or other components.",
     "taxonomy_skills": ["S5.6.0", "S3.2.1"]},

    # Teaching / Training
    {"task_id": "T-ED-001", "onet_soc": "25-9099.00", "title": "Education Workers",
     "task": "Provide students with opportunities to observe, question, and investigate.",
     "taxonomy_skills": ["S1.4.0"]},

    # Healthcare (basic)
    {"task_id": "T-HC-001", "onet_soc": "31-1014.00", "title": "Nursing Assistants",
     "task": "Answer patient call signals and determine how to assist them.",
     "taxonomy_skills": ["S1.2.1", "S4.1.0"]},
]

# ── Sample ESCO Skill Nodes (subset for hackathon) ───────────────────────────
ESCO_SAMPLE_SKILLS = [
    {"id": "S5.6.0", "label": "Electronic equipment repair",
     "type": "technical", "automation_risk_base": 0.67,
     "description": "Diagnose and repair malfunctions in electronic devices and systems"},
    {"id": "S5.6.1", "label": "Electronic component testing",
     "type": "technical", "automation_risk_base": 0.72,
     "description": "Test electronic components to identify defects"},
    {"id": "S5.6.2", "label": "Circuit fault diagnosis",
     "type": "technical", "automation_risk_base": 0.58,
     "description": "Identify faults in electrical circuits using diagnostic tools"},
    {"id": "S1.2.1", "label": "Customer communication",
     "type": "transferable", "automation_risk_base": 0.30,
     "description": "Communicate with customers to understand needs and provide solutions"},
    {"id": "S1.2.3", "label": "Conflict resolution",
     "type": "transferable", "automation_risk_base": 0.22,
     "description": "Resolve disputes and complaints in a constructive manner"},
    {"id": "S6.1.0", "label": "Business operations management",
     "type": "domain", "automation_risk_base": 0.45,
     "description": "Manage day-to-day operations of a small business"},
    {"id": "S6.1.1", "label": "Basic bookkeeping",
     "type": "technical", "automation_risk_base": 0.81,
     "description": "Record and track financial transactions"},
    {"id": "S2.1.0", "label": "Agricultural production oversight",
     "type": "domain", "automation_risk_base": 0.51,
     "description": "Supervise agricultural production activities"},
    {"id": "S2.1.1", "label": "Quality grading of produce",
     "type": "technical", "automation_risk_base": 0.55,
     "description": "Assess agricultural products against quality standards"},
    {"id": "S3.1.0", "label": "Manual materials handling",
     "type": "technical", "automation_risk_base": 0.62,
     "description": "Move, load, and manage physical materials safely"},
    {"id": "S3.2.1", "label": "Electrical wiring",
     "type": "technical", "automation_risk_base": 0.40,
     "description": "Install and connect electrical wiring in buildings and equipment"},
    {"id": "S1.4.0", "label": "Teaching and instruction",
     "type": "transferable", "automation_risk_base": 0.25,
     "description": "Explain concepts and facilitate learning for others"},
    {"id": "S4.1.0", "label": "Basic patient care",
     "type": "technical", "automation_risk_base": 0.35,
     "description": "Assist patients with basic daily needs and health monitoring"},
]

# ── Sample skill adjacency relationships ─────────────────────────────────────
ESCO_SAMPLE_ADJACENCIES = [
    {"skill_a": "S5.6.0", "skill_b": "S5.6.1", "relatedness_score": 0.92, "source": "ESCO"},
    {"skill_a": "S5.6.0", "skill_b": "S5.6.2", "relatedness_score": 0.88, "source": "ESCO"},
    {"skill_a": "S5.6.0", "skill_b": "S3.2.1", "relatedness_score": 0.65, "source": "ONET"},
    {"skill_a": "S5.6.0", "skill_b": "S1.2.1", "relatedness_score": 0.45, "source": "ONET"},
    {"skill_a": "S5.6.1", "skill_b": "S5.6.2", "relatedness_score": 0.85, "source": "ESCO"},
    {"skill_a": "S1.2.1", "skill_b": "S1.2.3", "relatedness_score": 0.78, "source": "ESCO"},
    {"skill_a": "S1.2.1", "skill_b": "S6.1.0", "relatedness_score": 0.52, "source": "ONET"},
    {"skill_a": "S6.1.0", "skill_b": "S6.1.1", "relatedness_score": 0.71, "source": "ESCO"},
    {"skill_a": "S2.1.0", "skill_b": "S2.1.1", "relatedness_score": 0.83, "source": "ESCO"},
    {"skill_a": "S3.1.0", "skill_b": "S3.2.1", "relatedness_score": 0.60, "source": "ONET"},
    {"skill_a": "S3.2.1", "skill_b": "S5.6.0", "relatedness_score": 0.65, "source": "ONET"},
    {"skill_a": "S1.4.0", "skill_b": "S1.2.1", "relatedness_score": 0.55, "source": "ESCO"},
    {"skill_a": "S4.1.0", "skill_b": "S1.2.1", "relatedness_score": 0.61, "source": "ONET"},
]

# ── Frey-Osborne automation scores (sample subset) ───────────────────────────
FREY_OSBORNE_SAMPLE = [
    {"onet_soc": "49-2011.00", "occupation": "Electrical Equipment Repairers", "probability": 0.67},
    {"onet_soc": "49-2022.00", "occupation": "Telecommunications Equipment Installers", "probability": 0.58},
    {"onet_soc": "41-2031.00", "occupation": "Retail Salespersons", "probability": 0.92},
    {"onet_soc": "43-4051.00", "occupation": "Customer Service Representatives", "probability": 0.55},
    {"onet_soc": "11-1021.00", "occupation": "General and Operations Managers", "probability": 0.16},
    {"onet_soc": "43-3031.00", "occupation": "Bookkeeping, Accounting Clerks", "probability": 0.98},
    {"onet_soc": "45-1011.00", "occupation": "First-Line Supervisors of Farming", "probability": 0.31},
    {"onet_soc": "45-2041.00", "occupation": "Agricultural Graders and Sorters", "probability": 0.55},
    {"onet_soc": "47-2061.00", "occupation": "Construction Laborers", "probability": 0.88},
    {"onet_soc": "47-2111.00", "occupation": "Electricians", "probability": 0.15},
    {"onet_soc": "25-9099.00", "occupation": "Education Workers", "probability": 0.12},
    {"onet_soc": "31-1014.00", "occupation": "Nursing Assistants", "probability": 0.40},
]

# ── Wittgenstein projections (Ghana + Bangladesh sample) ─────────────────────
WITTGENSTEIN_SAMPLE = {
    "GHA": {
        "scenario": "SSP2",
        "projections": [
            {"year": 2025, "age_group": "20-24", "education_shares": {
                "no_education": 0.08, "primary": 0.22, "secondary": 0.48, "post_secondary": 0.22}},
            {"year": 2030, "age_group": "20-24", "education_shares": {
                "no_education": 0.05, "primary": 0.18, "secondary": 0.52, "post_secondary": 0.25}},
            {"year": 2035, "age_group": "20-24", "education_shares": {
                "no_education": 0.03, "primary": 0.14, "secondary": 0.55, "post_secondary": 0.28}},
        ]
    },
    "BGD": {
        "scenario": "SSP2",
        "projections": [
            {"year": 2025, "age_group": "20-24", "education_shares": {
                "no_education": 0.12, "primary": 0.31, "secondary": 0.44, "post_secondary": 0.13}},
            {"year": 2030, "age_group": "20-24", "education_shares": {
                "no_education": 0.08, "primary": 0.26, "secondary": 0.49, "post_secondary": 0.17}},
            {"year": 2035, "age_group": "20-24", "education_shares": {
                "no_education": 0.05, "primary": 0.20, "secondary": 0.54, "post_secondary": 0.21}},
        ]
    }
}


def seed_onet(force: bool = False) -> None:
    path = Path("data/onet/task_statements.json")
    if path.exists() and not force:
        logger.info(f"O*NET task statements already seeded ({len(ONET_SAMPLE_TASKS)} tasks) — skip")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "O*NET 28.0 (sample subset for UNMAPPED hackathon demo)",
            "seeded_at": datetime.utcnow().isoformat() + "Z",
            "task_count": len(ONET_SAMPLE_TASKS),
            "tasks": ONET_SAMPLE_TASKS,
        }, f, indent=2)
    logger.info(f"✓ O*NET: {len(ONET_SAMPLE_TASKS)} task statements → {path}")


def seed_esco(force: bool = False) -> None:
    skills_path    = Path("data/esco/skills.json")
    adjacency_path = Path("data/esco/adjacencies.json")

    if skills_path.exists() and adjacency_path.exists() and not force:
        logger.info("ESCO data already seeded — skip")
        return

    skills_path.parent.mkdir(parents=True, exist_ok=True)

    with open(skills_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "ESCO v1.1.1 (sample subset for UNMAPPED hackathon demo)",
            "seeded_at": datetime.utcnow().isoformat() + "Z",
            "skills": ESCO_SAMPLE_SKILLS,
        }, f, indent=2)

    with open(adjacency_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "ESCO + O*NET co-occurrence (sample)",
            "seeded_at": datetime.utcnow().isoformat() + "Z",
            "adjacencies": ESCO_SAMPLE_ADJACENCIES,
        }, f, indent=2)

    logger.info(f"✓ ESCO: {len(ESCO_SAMPLE_SKILLS)} skills, {len(ESCO_SAMPLE_ADJACENCIES)} adjacencies → {skills_path.parent}")


def seed_frey_osborne(force: bool = False) -> None:
    path = Path("data/frey_osborne/scores.json")
    if path.exists() and not force:
        logger.info("Frey-Osborne scores already seeded — skip")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Frey & Osborne 2017, Oxford (sample subset)",
            "seeded_at": datetime.utcnow().isoformat() + "Z",
            "scores": FREY_OSBORNE_SAMPLE,
        }, f, indent=2)
    logger.info(f"✓ Frey-Osborne: {len(FREY_OSBORNE_SAMPLE)} occupation scores → {path}")


def seed_wittgenstein(force: bool = False) -> None:
    path = Path("data/wittgenstein/projections.json")
    if path.exists() and not force:
        logger.info("Wittgenstein projections already seeded — skip")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Wittgenstein Centre 2023 SSP2 Scenario (sample)",
            "seeded_at": datetime.utcnow().isoformat() + "Z",
            "countries": WITTGENSTEIN_SAMPLE,
        }, f, indent=2)
    logger.info(f"✓ Wittgenstein: {len(WITTGENSTEIN_SAMPLE)} countries → {path}")


def check_data() -> None:
    """Report what data is present."""
    checks = {
        "O*NET task statements":     Path("data/onet/task_statements.json"),
        "ESCO skills":               Path("data/esco/skills.json"),
        "ESCO adjacencies":          Path("data/esco/adjacencies.json"),
        "Frey-Osborne scores":       Path("data/frey_osborne/scores.json"),
        "Wittgenstein projections":  Path("data/wittgenstein/projections.json"),
        "Dataset freshness registry":Path("data/freshness.json"),
    }
    print("\nData status:")
    all_present = True
    for label, path in checks.items():
        status = "✓ present" if path.exists() else "✗ missing"
        print(f"  {status}  {label}")
        if not path.exists():
            all_present = False
    print()
    if all_present:
        print("All required data files present. System ready to boot.")
    else:
        print("Run: python scripts/seed_data.py  to download missing data.")


def main() -> None:
    parser = argparse.ArgumentParser(description="UNMAPPED Data Seeding Script")
    parser.add_argument("--dataset", choices=["onet", "esco", "frey_osborne", "wittgenstein"],
                        help="Seed only a specific dataset")
    parser.add_argument("--force",  action="store_true", help="Re-seed even if data exists")
    parser.add_argument("--check",  action="store_true", help="Check what data is present")
    args = parser.parse_args()

    if args.check:
        check_data()
        return

    if args.dataset == "onet":
        seed_onet(args.force)
    elif args.dataset == "esco":
        seed_esco(args.force)
    elif args.dataset == "frey_osborne":
        seed_frey_osborne(args.force)
    elif args.dataset == "wittgenstein":
        seed_wittgenstein(args.force)
    else:
        # Seed all
        logger.info("Seeding all UNMAPPED datasets...")
        seed_onet(args.force)
        seed_esco(args.force)
        seed_frey_osborne(args.force)
        seed_wittgenstein(args.force)
        logger.info("\n✓ All datasets seeded. Run validate_config.py to verify boot readiness.")


if __name__ == "__main__":
    main()
