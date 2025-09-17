import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import mongoose from "mongoose";

// Query schema for user reports
const reportsQuerySchema = z.object({
  owner: z.enum(["current"]).optional(),
  type: z.enum(["lost", "found"]).optional(),
  status: z.enum(["Available", "Claimed", "Removed", "Completed"]).optional(),
  q: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// GET /api/reports - Get user's reports
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    console.log("Reports API - User ID:", user.id);
    console.log("Reports API - User Email:", user.email);
    console.log("Reports API - User ID type:", typeof user.id);

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = reportsQuerySchema.parse(queryParams);
    const { owner, type, status, q, page, limit, sortBy, sortOrder } =
      validatedQuery;

    // Only allow current user's reports
    if (owner !== "current") {
      return NextResponse.json(
        { error: "Only current user reports are accessible" },
        { status: 403 }
      );
    }

    await connectDB();

    // Build query - filter by user ID
    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(user.id),
      isDeleted: false,
    };

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { "location.text": { $regex: q, $options: "i" } },
      ];
    }

    console.log("Reports API - Query:", JSON.stringify(query, null, 2));
    console.log(
      "Reports API - ObjectId conversion:",
      new mongoose.Types.ObjectId(user.id)
    );

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

    console.log("Reports API - Found items:", items.length);
    console.log("Reports API - Total count:", total);

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

    console.error("GET /api/reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
