# UNMAPPED: Open Skills Infrastructure

UNMAPPED is an open, localizable infrastructure layer designed to close the gap between unrecognized youth skills and real economic opportunity, especially in constrained environments (low-bandwidth, informal labor markets). Built as a protocol layer, it replaces traditional recall-based exams with an honest, evidence-based skills assessment protocol.

## Core Features
- **Narrative Intake**: Extracts skill signals from natural language using AI.
- **Mirror Test Engine**: Replaces MCQs with an adaptive, swipe-based interface where users verify experience against plain-language O*NET and ESCO task descriptions.
- **Confidence Tiers**: Assigns transparent confidence levels to skills (*Unverified, Recognized, Demonstrated*).
- **Contextual AI Readiness Lens**: Recalibrates global automation risk metrics using local infrastructure data (ITU Digital Development, Global Findex).
- **Configuration-Driven**: Fully localizable via JSON. Hot-swap labor data, taxonomies, and languages without altering code.

## Tech Stack
- **Frontend**: Next.js (React), CSS Modules
- **Backend Orchestrator**: Next.js API Routes & FastAPI (hybrid offline-first)
- **AI/Extraction**: Google Gemini API (with deterministic offline fallbacks for rate limits)
- **Taxonomies**: O*NET, ESCO, ISCO-08

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.13)
- Git

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/umarahad2005/unmapped_mit_hackathon.git
   cd unmapped_mit_hackathon
   ```

2. Setup Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Setup Backend (FastAPI):
   ```bash
   cd unmapped_fast_api
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate
   pip install -r requirements.txt
   python -m uvicorn api.main:app --reload --port 8000
   ```

## Documentation
For detailed architecture, engine mechanics, and configuration protocols, please refer to [DOCUMENTATION.md](./DOCUMENTATION.md).

## License
MIT
