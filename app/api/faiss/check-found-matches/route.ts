import { NextRequest, NextResponse } from "next/server";
import { matchFoundItem, LostQuery } from "@/lib/similarityClient";
import { requireAuth } from "@/lib/auth";

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.item || !body.description || !body.location) {
      return NextResponse.json(
        { error: "Missing required fields: item, description, location" },
        { status: 400 }
      );
    }

    // Create found query
    const foundQuery: LostQuery = {
      id: `temp_${Date.now()}`,
      item: body.item,
      description: body.description,
      location: body.location,
      date: body.date || new Date().toISOString(),
      contact_info: body.contact_info,
      image_urls: Array.isArray(body.image_urls) ? body.image_urls : undefined,
    };

    // Get matches using local similarity logic
    const result = await matchFoundItem(foundQuery);

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

    const data = result.data!;
    const filteredMatches = (data.matches || [])
      .filter((m) => m.score >= 0.6)
      .filter((m) => {
        // If category provided, require exact match
        if (body.category && m.found_item.category) {
          if (normalize(m.found_item.category) !== normalize(body.category)) {
            return false;
          }
        }
        // Basic lexical relevance check on item or description
        return (
          containsAny(m.found_item.item) || containsAny(m.found_item.description)
        );
      });

    return NextResponse.json({
      success: true,
      data: { ...data, matches: filteredMatches },
    });
  } catch (error) {
    console.error("Check found matches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
