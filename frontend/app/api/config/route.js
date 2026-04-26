// API Route: Proxy to FastAPI config endpoints
// GET  /api/config — Returns active config from FastAPI
// POST /api/config — Triggers config swap on FastAPI

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const res = await fetch(`${backendUrl}/api/config/active`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return Response.json({ error: 'Backend not available' }, { status: 503 });
    }

    const data = await res.json();
    return Response.json({ success: true, source: 'fastapi', ...data });

  } catch (error) {
    return Response.json({
      error: 'FastAPI backend not reachable',
      source: 'local',
    }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const res = await fetch(`${backendUrl}/api/config/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config_id: body.config_id }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Swap failed' }));
      return Response.json({ error: err.detail }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({ success: true, source: 'fastapi', ...data });

  } catch (error) {
    return Response.json({
      error: 'FastAPI backend not reachable for config swap',
      details: error.message,
    }, { status: 503 });
  }
}
