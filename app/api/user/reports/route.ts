import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import mongoose from "mongoose";

// Query schema for user reports
const userReportsQuerySchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(["all", "Available", "Claimed", "Removed", "Completed"])
    .optional()
    .default("all"),
  type: z.enum(["all", "lost", "found"]).optional().default("all"),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// GET /api/user/reports - Get all reports for the authenticated user
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    console.log("User Reports API - User ID:", user.id);
    console.log("User Reports API - User Email:", user.email);

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = userReportsQuerySchema.parse(queryParams);
    const { search, status, type, page, limit, sortBy, sortOrder } =
      validatedQuery;

    await connectDB();

    // Build query - filter by user ID
    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(user.id),
      isDeleted: false,
    };

    console.log("User Reports API - Query:", JSON.stringify(query, null, 2));

    // Filter by type (lost/found)
    if (type !== "all") {
      query.type = type;
    }

    // Filter by status
    if (status !== "all") {
      query.status = status;
    }

    // Text search across title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [items, total] = await Promise.all([
      Item.find(query)
        .populate("userId", "name email avatarUrl phone")
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(query),
    ]);

    console.log("User Reports API - Found items:", items.length);
    console.log("User Reports API - Total count:", total);
    console.log("User Reports API - Items:", JSON.stringify(items, null, 2));

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    console.error("GET /api/user/reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
