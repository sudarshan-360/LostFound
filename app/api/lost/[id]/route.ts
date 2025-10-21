import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";
import { requireAuth, checkOwnership } from "@/lib/auth";
import { updateItemSchema } from "@/lib/validations";
import { z } from "zod";
import mongoose from "mongoose";

// GET /api/lost/[id] - Get specific lost item
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
      type: "lost",
      isDeleted: false,
    }).populate("userId", "name email avatarUrl phone");

    if (!item) {
      return NextResponse.json(
        { error: "Lost item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/lost/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/lost/[id] - Update lost item
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
        type: "lost",
        isDeleted: false,
      });

      if (!item) {
        return NextResponse.json(
          { error: "Lost item not found" },
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

      // Enforce admin-only updates for Lost Room items or flag changes
      if (item.isLostRoomItem && !user.isAdmin) {
        return NextResponse.json(
          { error: "Only admins can update Lost Room items" },
          { status: 403 }
        );
      }
      if (validatedData?.isLostRoomItem === true && !user.isAdmin) {
        return NextResponse.json(
          { error: "Only admins can mark items as Lost Room" },
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
        message: "Lost item updated successfully",
        item: item.toObject(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }

      console.error("PUT /api/lost/[id] error:", error);
      return NextResponse.json(
        {
          error: "Internal server error",
        },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/lost/[id] - Soft delete lost item
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
        type: "lost",
        isDeleted: false,
      });

      if (!item) {
        return NextResponse.json(
          { error: "Lost item not found" },
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

      // Enforce admin-only delete for Lost Room items
      if (item.isLostRoomItem && !user.isAdmin) {
        return NextResponse.json(
          { error: "Only admins can delete Lost Room items" },
          { status: 403 }
        );
      }

      // Soft delete
      item.isDeleted = true;
      item.status = "Removed";
      item.updatedAt = new Date();
      await item.save();

      return NextResponse.json({
        message: "Lost item deleted successfully",
      });
    } catch (error) {
      console.error("DELETE /api/lost/[id] error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}
