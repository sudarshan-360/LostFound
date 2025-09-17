import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";
import { adminActionSchema } from "@/lib/validations";
import { z } from "zod";
// mongoose import removed; not used here

// GET /api/admin/items - Get all items for admin review
export const GET = requireAdmin(async (request: NextRequest, _user) => {
  try {
    void _user;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (type && ["lost", "found"].includes(type)) {
      query.type = type;
    }

    if (!includeDeleted) {
      query.isDeleted = false;
    }

    // Get items with user information
    const [items, total] = await Promise.all([
      Item.find(query)
        .populate("userId", "name email avatarUrl isAdmin createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(query),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

// POST /api/admin/items/action - Perform admin actions on items
export const POST = requireAdmin(async (request: NextRequest, user) => {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = adminActionSchema.parse(body);
    const { action, itemId, userId, reason } = validatedData;

    await connectDB();

    let result: Record<string, unknown> = {};

    switch (action) {
      case "remove":
        if (!itemId) {
          return NextResponse.json(
            { error: "Item ID is required for remove action" },
            { status: 400 }
          );
        }

        const itemToRemove = await Item.findById(itemId);
        if (!itemToRemove) {
          return NextResponse.json(
            { error: "Item not found" },
            { status: 404 }
          );
        }

        itemToRemove.isDeleted = true;
        itemToRemove.status = "Removed";
        itemToRemove.updatedAt = new Date();
        await itemToRemove.save();

        result = {
          message: "Item removed successfully",
          item: itemToRemove.toObject(),
        };
        break;

      case "restore":
        if (!itemId) {
          return NextResponse.json(
            { error: "Item ID is required for restore action" },
            { status: 400 }
          );
        }

        const itemToRestore = await Item.findById(itemId);
        if (!itemToRestore) {
          return NextResponse.json(
            { error: "Item not found" },
            { status: 404 }
          );
        }

        itemToRestore.isDeleted = false;
        itemToRestore.status = "Available";
        itemToRestore.updatedAt = new Date();
        await itemToRestore.save();

        result = {
          message: "Item restored successfully",
          item: itemToRestore.toObject(),
        };
        break;

      case "ban_user":
        if (!userId) {
          return NextResponse.json(
            { error: "User ID is required for ban action" },
            { status: 400 }
          );
        }

        const userToBan = await User.findById(userId);
        if (!userToBan) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        if (userToBan.isAdmin) {
          return NextResponse.json(
            { error: "Cannot ban admin users" },
            { status: 403 }
          );
        }

        // Mark all user's items as deleted
        await Item.updateMany(
          { userId: userId },
          {
            isDeleted: true,
            status: "Removed",
            updatedAt: new Date(),
          }
        );

        // You might want to add a 'banned' field to the User model
        // For now, we'll just mark them as inactive by removing their name
        userToBan.name = `[BANNED] ${userToBan.name}`;
        userToBan.updatedAt = new Date();
        await userToBan.save();

        result = {
          message: "User banned successfully",
          user: {
            id: userToBan._id,
            name: userToBan.name,
            email: userToBan.email,
          },
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Log admin action (you might want to create an AdminLog model)
    console.log(`Admin action performed:`, {
      adminId: user.id,
      adminEmail: user.email,
      action,
      itemId,
      userId,
      reason,
      timestamp: new Date(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("POST /api/admin/items/action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});