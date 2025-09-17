import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";
import { requireAuth } from "@/lib/auth";
import mongoose from "mongoose";

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

      // Find the item and check if user owns it
      const item = await Item.findOne({
        _id: id,
        type: "lost",
        isDeleted: false,
      }).populate("userId", "name email");
      
      if (!item) {
        return NextResponse.json(
          { error: "Lost item not found" },
          { status: 404 }
        );
      }

      // Check if the user owns this item
      if (item.userId.email !== user.email) {
        return NextResponse.json(
          { error: "You can only mark your own items as completed" },
          { status: 403 }
        );
      }

      // Update the item status to Completed
      item.status = "Completed";
      item.updatedAt = new Date();
      await item.save();

      return NextResponse.json({
        success: true,
        data: item,
        message: "Item marked as returned successfully"
      });
    } catch (error) {
      console.error("Error marking lost item as completed:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}