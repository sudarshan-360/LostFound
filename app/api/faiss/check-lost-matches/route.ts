import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// Use server-side env var; fallback to public if set; last resort default
const PYTHON_API_URL =
  process.env.PYTHON_API_URL ||
  process.env.NEXT_PUBLIC_PYTHON_API_URL ||
  "http://127.0.0.1:8000";

export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate required fields early with explicit 422
    if (!body?.item || !body?.description || !body?.location) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: "item, description, location are required",
        },
        { status: 422 }
      );
    }

    const lostQuery = {
      id: `temp_${Date.now()}`,
      item: String(body.item),
      description: String(body.description),
      location: String(body.location),
      date: body.date ? String(body.date) : new Date().toISOString(),
      contact_info: body.contact_info,
    };

    const controller = new AbortController();
    // Allow more time for initial model warm-up on FastAPI side
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const url = `${PYTHON_API_URL}/match-lost`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lostQuery),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error("Failed to reach FastAPI", { url: url, error: fetchErr });
      return NextResponse.json(
        {
          error: "FastAPI unreachable",
          details:
            fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
          hint: `Is the service running at ${url}?`,
        },
        { status: 503 }
      );
    }
    clearTimeout(timeout);

    let payload: unknown;
    const text = await response.text();
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text; // non-JSON error body
    }

    if (!response.ok) {
      console.error("FastAPI error response", {
        status: response.status,
        body: payload,
      });
      return NextResponse.json(
        {
          error: "FastAPI error",
          status: response.status,
          details: payload,
        },
        { status: response.status === 422 ? 422 : 502 }
      );
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("/api/faiss/check-lost-matches unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});
