import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";
import { requireAuth, checkOwnership } from "@/lib/auth";
import mongoose from "mongoose";

// PATCH /api/found/[id]/complete - Mark found item as completed (claimed by finder)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const { id } = params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
      }

      await connectDB();

      // Find item
      const item = await Item.findOne({
        _id: id,
        type: "found",
        isDeleted: false,
      });

      if (!item) {
        return NextResponse.json(
          { error: "Found item not found" },
          { status: 404 }
        );
      }

      // Enforce admin-only completion for Lost Room items; otherwise require ownership
      if (item.isLostRoomItem) {
        if (!user.isAdmin) {
          return NextResponse.json(
            { error: "Only admins can mark Lost Room items as completed" },
            { status: 403 }
          );
        }
        // Admins can proceed regardless of ownership for Lost Room items
      } else {
        // Non-Lost Room items: only owner can mark as completed
        if (!checkOwnership(item.userId.toString(), user.id)) {
          return NextResponse.json(
            { error: "You can only mark your own items as completed" },
            { status: 403 }
          );
        }
      }

      // Check if already completed
      if (item.status === "Completed") {
        return NextResponse.json(
          { error: "Item is already marked as completed" },
          { status: 400 }
        );
      }

      // Update status to completed
      item.status = "Completed";
      item.updatedAt = new Date();
      await item.save();

      // Populate user data for response
      await item.populate("userId", "name email avatarUrl phone");

      return NextResponse.json({
        message: "Found item marked as completed (claimed by finder)",
        item: item.toObject(),
      });
    } catch (error) {
      console.error("PATCH /api/found/[id]/complete error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}



