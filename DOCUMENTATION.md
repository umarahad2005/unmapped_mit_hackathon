# UNMAPPED System Documentation

## Architecture Overview
UNMAPPED operates as a dual-layer system combining a Next.js frontend with a flexible backend orchestrator (Next.js serverless functions and an optional FastAPI microservice). The system is built with an **Offline-First, Constraint-Native** philosophy to support users in low-bandwidth, shared-device environments.

## Core Modules

### Module 1: The Evidence-First Skills Signal Engine
The system replaces traditional knowledge-based testing with a multi-stage evidence verification pipeline.
1. **Narrative Intake**: Users describe their work in their own words. Natural Language Processing (via Gemini API) extracts potential skills and maps them to standard taxonomies at **Tier 0 (Unverified)**.
2. **The Mirror Test**: The adaptive engine presents O*NET task statements translated into plain language. Users answer whether they perform these tasks ("Yes", "Sometimes", or "No"). Consistent affirmative responses advance the skill to **Tier 1 (Recognized)**.
3. **Micro-Verification**: High-confidence skills trigger a brief scenario test or evidence upload request. Successful completion upgrades the skill to **Tier 2 (Demonstrated)**.

### Module 2: Contextual AI Readiness & Displacement Risk
Automation risk is not uniform globally. The system ingests global automation exposure metrics (e.g., Frey & Osborne, ILO) but recalibrates them using local indicators (e.g., ITU Digital Development data). This ensures that automation risks are contextualized, preventing the system from over-estimating displacement in regions lacking the digital infrastructure required to automate those tasks.

### Module 3: Dual Econometric Dashboard & Matching
Matching algorithms prioritize realistic opportunities by cross-referencing World Bank Enterprise Surveys (demand realities) and ILOSTAT data (supply realities, wage floors). The system also integrates structural barrier checks (e.g., World Bank's Women, Business and the Law data) to qualify recommendations honestly.

## Resilience & Fallbacks
UNMAPPED is designed to gracefully handle AI service failures, rate limits (like HTTP 429), and network drops:
- **Keyword-based Fallback**: If the Gemini API fails during Narrative Intake, the system uses a localized offline keyword matching engine to extract skills.
- **O*NET Fallback Tasks**: If the LLM fails to simplify a task description dynamically, the system relies on pre-seeded O*NET tasks.

## Configuration Protocol (Localizability)
System parameters are externalized into JSON configuration files. This allows rapid deployment to new regional contexts without code changes. A configuration file defines:
- Active taxonomies (ESCO vs O*NET)
- Wage floor references and data sources
- Automation calibration coefficients
- UI strings, localizations, and language mappings
