import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";
import { requireAuth, checkOwnership } from "@/lib/auth";
import { updateItemSchema } from "@/lib/validations";
import { z } from "zod";
import mongoose from "mongoose";

// GET /api/found/[id] - Get specific found item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    await connectDB();

    const item = await Item.findOne({
      _id: id,
      type: "found",
      isDeleted: false,
    }).populate("userId", "name email avatarUrl phone");

    if (!item) {
      return NextResponse.json(
        { error: "Found item not found" },
        { status: 404 }
      );
    }

    // Return the item document directly for client simplicity
    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/found/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/found/[id] - Update found item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (request: NextRequest, user) => {
    try {
      const { id } = params;
      const body = await request.json();

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
      }

      // Validate input
      const validatedData = updateItemSchema.parse(body);

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

      // Check ownership (only owner or admin can update)
      if (!checkOwnership(item.userId.toString(), user.id) && !user.isAdmin) {
        return NextResponse.json(
          { error: "You can only update your own items" },
          { status: 403 }
        );
      }

      // Update item
      Object.assign(item, validatedData);
      item.updatedAt = new Date();
      await item.save();

      // Populate user data for response
      await item.populate("userId", "name email avatarUrl phone");

      return NextResponse.json({
        message: "Found item updated successfully",
        item: item.toObject(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }

      console.error("PUT /api/found/[id] error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/found/[id] - Soft delete found item
export async function DELETE(
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

      // Check ownership (only owner or admin can delete)
      if (!checkOwnership(item.userId.toString(), user.id) && !user.isAdmin) {
        return NextResponse.json(
          { error: "You can only delete your own items" },
          { status: 403 }
        );
      }

      // Soft delete
      item.isDeleted = true;
      item.status = "Removed";
      item.updatedAt = new Date();
      await item.save();

      return NextResponse.json({
        message: "Found item deleted successfully",
      });
    } catch (error) {
      console.error("DELETE /api/found/[id] error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}
