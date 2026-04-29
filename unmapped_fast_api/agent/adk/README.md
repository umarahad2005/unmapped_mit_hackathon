# `agent/adk/` — Gemini ADK Agents

Two ADK-powered agents that bring **real-time** data into the UNMAPPED pipeline:

| Agent | Endpoint | Purpose |
|---|---|---|
| **Talent Job Aggregator** (`job_aggregator.py`) | `POST /api/jobs/find` | Live job listings matched to a youth user's skills + country. |
| **Course Finder** (`course_finder.py`) | `POST /api/courses/find` | Live course/training offerings matched to the user's skill gaps. |

Both agents use Google's [Agent Development Kit](https://google.github.io/adk-docs/) (`google-adk`) with the built-in `google_search` tool for grounding.

## Resilience model — never blank-screen

```
                  ┌──────────────────────────────────────────────┐
                  │  Live path (LlmAgent + google_search tool)   │
  request ───────►│  Requires:  google-adk installed             │──► live_adk
                  │             GOOGLE_API_KEY env var set       │
                  │             network reachable                │
                  └──────────────────────────────────────────────┘
                                        │
                                        ▼ on any failure
                  ┌──────────────────────────────────────────────┐
                  │  Offline curated path (fallback_data.py)     │──► offline_curated
                  │  Real organisations, indicative wage floors  │
                  └──────────────────────────────────────────────┘
```

The route response always includes a `source` field (`"live_adk"` or `"offline_curated"`) and an honest `note` string the frontend renders verbatim. No silent fallbacks.

## Schema (for the frontend / API consumers)

See `schemas.py` for the full Pydantic models:

- `JobSearchRequest` / `JobSearchResponse` — listings array + source + note
- `CourseSearchRequest` / `CourseSearchResponse` — courses array + source + note
- `JobListing` — title, employer, location, country_code, employment_type (formal / informal / self_employment / apprenticeship / gig / training_pathway), isco_codes, skills_required, wage_floor_local, wage_currency, apply_url, posted_at, match_score, match_reasons, accessibility_note
- `CourseOffering` — title, provider, delivery (online / in_person / hybrid / mobile_first), country_code, skill_targets, duration_weeks, cost_local, cost_currency, is_free, certification, enroll_url, starts_at, relevance_score, relevance_reasons

## Running the live path

```bash
# 1. Install the optional dependency
pip install -r requirements.txt              # picks up google-adk

# 2. Set the API key (either name works — checked in this order):
export GOOGLE_API_KEY="..."                   # ADK convention
# or
export GEMINI_API_KEY="..."                   # Gemini SDK convention

# 3. Boot FastAPI as usual
python -m uvicorn api.main:app --reload --port 8000

# 4. Smoke-test:
curl -X POST http://localhost:8000/api/jobs/find \
  -H 'Content-Type: application/json' \
  -d '{"country_code":"PAK","skills":["Stitching","Pattern making","Customer fitting"],"isco_codes":["7531","8153"],"max_results":5}'
```

Expected response shape:
```jsonc
{
  "listings": [ /* JobListing[] */ ],
  "source":   "live_adk",         // or "offline_curated" if ADK / network unavailable
  "note":     "Listings sourced live via Google Search grounding through Gemini ADK. ..."
}
```

## Running the offline path (no install / no internet / no key)

Just hit the same endpoints. Both routes detect the missing dependency / key / network and fall through to `fallback_data.py` automatically. The `source` field will read `offline_curated` and the `note` will explain.

This is the same constraint-native discipline the rest of UNMAPPED follows — Amara on a 2G connection still gets a useful answer.

## Country coverage in the offline fallback

| Country | Jobs | Courses |
|---|---|---|
| 🇬🇭 Ghana    | Independent mobile repair · MTN service centre · Junior web dev (Hubtel/mPharma) · Tailoring (Makola) · Solar PV apprenticeship | Andela ALC web dev · COTVET mobile repair · Strategic Power Solutions / NABCEP solar |
| 🇧🇩 Bangladesh | BGMEA garment ops · BRAC/PKSF cooperative · Daraz/FB freelance digital marketing · Home-based tailoring · Aarong / Apex retail | SEIP industrial sewing · 10 Minute School digital marketing · BRAC modern agriculture |
| 🇵🇰 Pakistan | Boutique tailoring (Tariq Road / Liberty) · Junior dev (Systems / TPS / 10Pearls) · Saddar / Hafeez Centre repair · TEVTA electrician · Freelance social media | DigiSkills.pk web dev · Punjab TEVTA electrician · DigiSkills.pk freelancing · NAVTTC tailoring |

Every entry references a **real organisation**. Wage floors and durations are realistic 2024-2025 ballparks; the fallback `note` says "indicative" so judges and users see the honest framing.

## Adding more countries

1. Add an entry under `JOB_LISTINGS[<ISO-3>]` and `COURSE_LISTINGS[<ISO-3>]` in `fallback_data.py`. 3–5 listings per type is enough for a useful fallback.
2. The live path needs no code change — the agent's instruction already accepts any country code.

## Why ADK and not raw Gemini?

The existing skill-extraction code (`app/api/extract/route.js` on the frontend) uses the raw Gemini SDK. ADK adds:

- **Built-in `google_search` tool** — the cleanest path to live grounding.
- **Agent / Runner pattern** — easy to add more tools (e.g. an `iso_lookup` tool, a `wage_floor_calculator` tool) as the system grows.
- **Structured output** via Pydantic schemas, so the route returns a clean shape.

When the agents need more sophisticated behaviour (multi-step reasoning, tool chaining, sub-agents), ADK is already the right runtime to extend — no rewrite required.

## Related files

- `agent/adk/__init__.py` — package exports
- `agent/adk/schemas.py` — Pydantic models
- `agent/adk/job_aggregator.py` — talent agent (live + fallback)
- `agent/adk/course_finder.py` — course agent (live + fallback)
- `agent/adk/fallback_data.py` — curated offline lists per country
- `api/routes/talent_routes.py` — FastAPI route surface
- `requirements.txt` — `google-adk==1.0.0` (optional)
