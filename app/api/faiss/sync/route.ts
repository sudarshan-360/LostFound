import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";
import { addFoundItem, FaissItem } from "@/lib/faissClient";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      await connectDB();

      // Get all found items that haven't been synced to FAISS
      const unsyncedItems = await Item.find({
        type: "found",
        isDeleted: false,
        faissSynced: false,
      }).populate("userId", "name email");

      let syncedCount = 0;
      let errors: string[] = [];

      for (const item of unsyncedItems) {
        try {
          // Convert MongoDB item to FAISS format
          const faissItem: FaissItem = {
            id: item._id.toString(),
            item: item.title,
            description: item.description,
            location: item.location.text,
            date: item.createdAt.toISOString(),
            type: "found",
            contact_info: item.contactInfo
              ? {
                  email: item.contactInfo.email,
                  phone: item.contactInfo.phone,
                }
              : undefined,
          };

          // Add to FAISS
          const result = await addFoundItem(faissItem);

          if (result.success) {
            // Mark as synced in MongoDB
            item.faissSynced = true;
            await item.save();
            syncedCount++;
          } else {
            errors.push(`Failed to sync item ${item._id}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Error processing item ${item._id}: ${error}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${syncedCount} items to FAISS`,
        synced_count: syncedCount,
        total_processed: unsyncedItems.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("FAISS sync error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}
