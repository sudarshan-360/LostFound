import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";

// Make this endpoint public to allow syncing without authentication
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get ALL found items regardless of sync status to ensure complete indexing
    const foundItems = await Item.find({
      type: "found",
      isDeleted: false,
    }).populate("userId", "name email");

    console.log(`Found ${foundItems.length} items to process for similarity (no-op)`);

    // No-op sync: FAISS removed. Return counts to preserve API compatibility.
    const syncedCount = foundItems.length;
    return NextResponse.json({
      success: true,
      message: `Processed ${syncedCount} items for similarity (no-op)`,
      synced_count: syncedCount,
      total_processed: foundItems.length,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
