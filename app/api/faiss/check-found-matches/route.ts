import { NextRequest, NextResponse } from "next/server";
import { matchFoundItem, LostQuery } from "@/lib/faissClient";
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
    };

    // Get matches from FAISS
    const result = await matchFoundItem(foundQuery);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "FAISS matching failed",
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
    console.error("FAISS check found matches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
