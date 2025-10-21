import { NextRequest, NextResponse } from "next/server";
import { checkFaissHealth } from "@/lib/similarityClient";

export async function GET(request: NextRequest) {
  try {
    const result = await checkFaissHealth();

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Similarity service unavailable",
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
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
