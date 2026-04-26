/**
 * UNMAPPED — FastAPI Backend Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified API client that talks to the Python FastAPI backend.
 * All calls go through Next.js rewrites (/backend/* → localhost:8000/api/*)
 * so there are zero CORS issues.
 *
 * Includes automatic fallback to local processing if backend is unreachable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BACKEND_PREFIX = '/backend';
const HEALTH_URL = '/backend-health';

// ── Health ──────────────────────────────────────────────────────────────────

let _backendAvailable = null; // null = unchecked, true/false = cached

/**
 * Check if the FastAPI backend is running and reachable.
 * Result is cached for 30 seconds.
 */
export async function isBackendAvailable() {
  if (_backendAvailable !== null) return _backendAvailable;

  try {
    const res = await fetch(HEALTH_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    _backendAvailable = res.ok;
  } catch {
    _backendAvailable = false;
  }

  // Reset cache after 30s
  setTimeout(() => { _backendAvailable = null; }, 30_000);
  return _backendAvailable;
}

/**
 * Force re-check backend availability.
 */
export function resetBackendCache() {
  _backendAvailable = null;
}

// ── Generic Fetch Helper ────────────────────────────────────────────────────

async function apiCall(path, options = {}) {
  const url = `${BACKEND_PREFIX}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ detail: res.statusText }));
    const error = new Error(errBody.detail || errBody.error || `API error ${res.status}`);
    error.status = res.status;
    error.body = errBody;
    throw error;
  }

  return res.json();
}

// ── Config Endpoints ────────────────────────────────────────────────────────

/**
 * GET /api/config/active — Returns the currently active country configuration.
 */
export async function getActiveConfig() {
  return apiCall('/config/active');
}

/**
 * POST /api/config/swap — Live config swap (e.g., Ghana → Bangladesh).
 * Must complete in < 2 seconds per Article VI.2.
 */
export async function swapConfig(configId) {
  return apiCall('/config/swap', {
    method: 'POST',
    body: JSON.stringify({ config_id: configId }),
  });
}

// ── Intake / Skill Extraction ───────────────────────────────────────────────

/**
 * POST /api/intake/extract — Extract skills from narrative text using Gemini AI.
 * Returns candidate skills at Tier 0 (UNVERIFIED).
 */
export async function extractSkills(narrative, sessionId = null) {
  return apiCall('/intake/extract', {
    method: 'POST',
    body: JSON.stringify({
      narrative,
      session_id: sessionId,
    }),
  });
}

// ── Mirror Test ─────────────────────────────────────────────────────────────

/**
 * POST /api/mirror/cards — Get Mirror Test cards for given skill IDs.
 * Returns O*NET-based task cards in plain language.
 */
export async function getMirrorCards(sessionId, skillIds) {
  return apiCall('/mirror/cards', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      skill_ids: skillIds,
    }),
  });
}

/**
 * POST /api/mirror/respond — Record a Mirror Test swipe response.
 * Returns tier upgrade result.
 */
export async function recordMirrorResponse(sessionId, skillId, response, cardNumber) {
  return apiCall('/mirror/respond', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      skill_id: skillId,
      response,        // "YES" | "NO" | "SOMETIMES"
      card_number: cardNumber,
    }),
  });
}

// ── Full Pipeline ───────────────────────────────────────────────────────────

/**
 * POST /api/pipeline/run — Run the complete UNMAPPED pipeline.
 * Narrative → Extract → Mirror → Verify → Risk + Match → Profile.
 * This is the "one-shot" endpoint for demo purposes.
 */
export async function runFullPipeline(narrative, sessionId = null) {
  return apiCall('/pipeline/run', {
    method: 'POST',
    body: JSON.stringify({
      narrative,
      session_id: sessionId,
    }),
  });
}

// ── Profile ─────────────────────────────────────────────────────────────────

/**
 * GET /api/profile/{profileId} — Get a portable profile by ID.
 */
export async function getProfile(profileId) {
  return apiCall(`/profile/${encodeURIComponent(profileId)}`);
}

// ── Signals & Matching ──────────────────────────────────────────────────────

/**
 * GET /api/signals/{countryCode} — Get econometric signals for a country.
 */
export async function getSignals(countryCode) {
  return apiCall(`/signals/${encodeURIComponent(countryCode)}`);
}

/**
 * POST /api/match — Get ranked opportunity matches for a skill profile.
 */
export async function matchOpportunities(skillIds) {
  return apiCall(`/match?${skillIds.map(id => `skill_ids=${encodeURIComponent(id)}`).join('&')}`, {
    method: 'POST',
  });
}

// ── Backend Status (for UI indicators) ──────────────────────────────────────

/**
 * Fetch full backend system status.
 */
export async function getSystemStatus() {
  try {
    const health = await fetch(HEALTH_URL, {
      signal: AbortSignal.timeout(3000),
    });
    if (!health.ok) throw new Error('Backend not responding');
    const data = await health.json();
    return {
      online: true,
      ...data,
    };
  } catch {
    return {
      online: false,
      system: 'UNMAPPED Skills Infrastructure',
      status: 'offline',
    };
  }
}
