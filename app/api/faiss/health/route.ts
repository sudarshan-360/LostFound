import { NextRequest, NextResponse } from "next/server";
import { checkFaissHealth } from "@/lib/faissClient";

export async function GET(request: NextRequest) {
  try {
    const result = await checkFaissHealth();

    if (!result.success) {
      return NextResponse.json(
        {
          error: "FAISS service unavailable",
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
    console.error("FAISS health check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
