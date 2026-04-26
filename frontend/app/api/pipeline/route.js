// API Route: Proxy to FastAPI full pipeline
// POST /api/pipeline — Runs the full UNMAPPED pipeline via FastAPI
// Falls back to error if FastAPI is unavailable

export async function POST(request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const res = await fetch(`${backendUrl}/api/pipeline/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        narrative: body.narrative || body.skillsText,
        session_id: body.session_id || body.sessionId || null,
      }),
      signal: AbortSignal.timeout(60000), // 60s timeout for full pipeline
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Pipeline failed' }));
      return Response.json({
        error: err.detail || 'Pipeline failed',
        source: 'fastapi',
      }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({
      success: true,
      source: 'fastapi',
      ...data,
    });

  } catch (error) {
    console.error('FastAPI pipeline proxy error:', error.message);
    return Response.json({
      error: 'FastAPI backend not available',
      details: error.message,
      source: 'proxy_error',
    }, { status: 503 });
  }
}
