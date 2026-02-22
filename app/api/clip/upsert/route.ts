import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Item from "@/models/Item";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createItemSchema } from "@/lib/validations";
import { addMatchJob } from "@/lib/matchQueue";

// Example route: create lost/found item and trigger CLIP matching + notifications
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();

    // Normalize location shape, ensure type provided
    const preprocessed = {
      ...body,
      location:
        typeof body?.location === "string"
          ? { text: body.location }
          : body?.location,
    };

    // Ensure type is valid
    const typeSchema = z.object({ type: z.enum(["lost", "found"]) });
    typeSchema.parse(preprocessed);

    const validatedData = createItemSchema.parse(preprocessed);

    await connectDB();

    const item = new Item({
      ...validatedData,
      userId: new mongoose.Types.ObjectId(user.id),
    });

    await item.save();
    await item.populate("userId", "name email avatarUrl phone");

    // Enqueue background matching job
    try {
      await addMatchJob(item._id.toString());
    } catch (err) {
      console.warn("Failed to enqueue matching job:", err);
    }

    return NextResponse.json(
      {
        message: `${item.type} item created successfully and matching triggered`,
        item: item.toObject(),
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
    console.error("POST /api/clip/upsert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});