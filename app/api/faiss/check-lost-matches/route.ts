import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { matchLostItem, LostQuery } from "@/lib/similarityClient";

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

    const lostQuery: LostQuery = {
      id: `temp_${Date.now()}`,
      item: String(body.item),
      description: String(body.description),
      location: String(body.location),
      date: body.date ? String(body.date) : new Date().toISOString(),
      contact_info: body.contact_info,
      image_urls: Array.isArray(body.image_urls) ? body.image_urls.map(String) : undefined,
    };

    const result = await matchLostItem(lostQuery);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Matching failed",
          details: result.error,
        },
        { status: 503 }
      );
    }

    // Category-aware + lexical relevance filter on top of 60%+ similarity
    const normalize = (s: string) => (s || "").toLowerCase().trim();
    const words = normalize(body.item)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w: string) => w.length >= 3);
    const containsAny = (text: string) => {
      const nt = normalize(text);
      return words.length === 0 ? true : words.some((w) => nt.includes(w));
    };

    // Filter by 60%+ similarity
    const data = result.data!;
    const filteredMatches = (data.matches || [])
      .filter((m) => m.score >= 0.6)
      .filter((m) => {
        if (body.category && m.found_item.category) {
          if (normalize(m.found_item.category) !== normalize(body.category)) {
            return false;
          }
        }
        return (
          containsAny(m.found_item.item) || containsAny(m.found_item.description)
        );
      });

    return NextResponse.json({ success: true, data: { ...data, matches: filteredMatches } });
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
