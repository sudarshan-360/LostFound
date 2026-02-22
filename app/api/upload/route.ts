import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import connectDB from "@/lib/db";
import { getImagesBucket } from "@/lib/gridfs";
import { requireAuth } from "@/lib/auth";
import { addCorsHeaders } from "@/lib/cors";
import mongoose from "mongoose";

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

// POST /api/upload - Upload image to MongoDB GridFS
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await connectDB();
    const bucket = getImagesBucket();
    const ext =
      file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const filename = `image-${Date.now()}-${String(user.id).slice(-6)}.${ext}`;
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        contentType: file.type,
        userId: String(user.id),
      },
    });

    const fileId = uploadStream.id;
    const readable = Readable.from(buffer);
    await new Promise<void>((resolve, reject) => {
      readable.pipe(uploadStream).on("finish", resolve).on("error", reject);
    });

    const baseUrl = getBaseUrl();
    const publicId = fileId.toString();
    const url = `${baseUrl}/api/images/${publicId}`;

    const response = NextResponse.json({
      message: "Image uploaded successfully",
      url,
      publicId,
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error("Upload error:", error);

    let errorMessage = "Failed to upload image";
    if (error instanceof Error) {
      if (error.message.includes("Invalid image")) {
        errorMessage = "Invalid image file";
      } else if (error.message.includes("File too large")) {
        errorMessage = "File size exceeds 5MB limit";
      } else if (
        error.message.includes("Network") ||
        error.message.includes("timeout")
      ) {
        errorMessage = "Network error during upload. Please try again";
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "Please log in to upload images";
      }
    }

    const response = NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
});

// DELETE /api/upload - Delete image from GridFS
export const DELETE = requireAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(publicId)) {
      return NextResponse.json(
        { error: "Invalid image id" },
        { status: 400 }
      );
    }

    await connectDB();
    const bucket = getImagesBucket();
    await bucket.delete(new mongoose.Types.ObjectId(publicId));

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    const err = error as Error & { code?: number };
    if (err.code === 1) {
      return NextResponse.json(
        { error: "Image not found or already deleted" },
        { status: 404 }
      );
    }
    const response = NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete image",
      },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
});
