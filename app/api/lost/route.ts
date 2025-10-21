import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";
import { requireAuth } from "@/lib/auth";
import { createItemSchema, itemQuerySchema } from "@/lib/validations";
import { matchLostItem, LostQuery } from "@/lib/similarityClient";
import { addMatchJob } from "@/lib/matchQueue";
import { z } from "zod";
import mongoose from "mongoose";

// GET /api/lost - List lost items with search and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = itemQuerySchema.parse(queryParams);
    const {
      q,
      tag,
      status,
      location,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      lostRoom,
    } = validatedQuery;

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {
      type: "lost",
      isDeleted: false,
    };

    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by location
    if (location) {
      query["location.text"] = { $regex: location, $options: "i" };
    }

    // Filter by Lost Room flag
    if (typeof lostRoom !== "undefined") {
      query.isLostRoomItem = lostRoom;
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    console.error("GET /api/lost error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/lost - Create new lost item
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();

    // Validate input
    const preprocessed = {
      ...body,
      location:
        typeof body?.location === "string"
          ? { text: body.location }
          : body?.location,
      // Only admins can create Lost Room items
      isLostRoomItem: !!(user.isAdmin && body?.isLostRoomItem === true),
      type: "lost",
    };

    const validatedData = createItemSchema.parse(preprocessed);

    await connectDB();

    // Create item
    const item = new Item({
      ...validatedData,
      userId: new mongoose.Types.ObjectId(user.id),
      type: "lost",
    });

    await item.save();

    // Populate user data for response
    await item.populate("userId", "name email avatarUrl phone");

    // Enqueue CLIP matching in background
    try {
      await addMatchJob(item._id.toString());
    } catch (err) {
      console.warn("Failed to enqueue CLIP matching job:", err);
    }

    // Get potential matches using local similarity logic
    let faissMatches = null;
    try {
      const lostQuery: LostQuery = {
        id: item._id.toString(),
        item: item.title,
        description: item.description,
        location: item.location.text,
        date: item.createdAt.toISOString(),
        contact_info: item.contactInfo
          ? {
              email: item.contactInfo.email,
              phone: item.contactInfo.phone,
            }
          : undefined,
      };

      const faissResult = await matchLostItem(lostQuery);

      if (faissResult.success) {
        faissMatches = faissResult.data;
      } else {
        console.warn("Failed to get matches:", faissResult.error);
      }
    } catch (faissError) {
      console.warn("Matching error:", faissError);
      // Don't fail the request if FAISS fails
    }

    return NextResponse.json(
      {
        message: "Lost item created successfully",
        item: item.toObject(),
        faiss_matches: faissMatches,
        matching_job_enqueued: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("POST /api/lost error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
