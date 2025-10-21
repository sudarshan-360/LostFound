import { NextRequest, NextResponse } from "next/server";
import { matchLostItem, LostQuery } from "@/lib/similarityClient";
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

    // Create lost query
    const lostQuery: LostQuery = {
      id: body.id || `temp_${Date.now()}`,
      item: body.item,
      description: body.description,
      location: body.location,
      date: body.date || new Date().toISOString(),
      contact_info: body.contact_info,
    };

    // Get matches using local similarity logic
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

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Match error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
