import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "@/lib/auth";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate Cloudinary configuration
function validateCloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Image upload service is not configured. Please contact administrator to set up Cloudinary credentials."
    );
  }
}

// POST /api/upload - Upload image to Cloudinary
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    // Check if Cloudinary is configured
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;
    const cloudinaryConfigured =
      CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET;

    if (!cloudinaryConfigured) {
      // Return a development fallback response
      return NextResponse.json(
        {
          error:
            "Image upload service is temporarily unavailable. You can still submit your report without images.",
          development: true,
          suggestion:
            "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local to enable image upload",
        },
        { status: 503 }
      );
    }

    // Validate Cloudinary configuration
    validateCloudinaryConfig();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "lost-found",
            transformation: [
              { width: 1200, height: 1200, crop: "limit" },
              { quality: "auto" },
              { format: "auto" },
            ],
            tags: [`user_${user.id}`],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(
                result as unknown as {
                  secure_url: string;
                  public_id: string;
                  width: number;
                  height: number;
                }
              );
            }
          }
        )
        .end(buffer);
    });

    const result = uploadResult;

    return NextResponse.json({
      message: "Image uploaded successfully",
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to upload image";
    if (error instanceof Error) {
      if (error.message.includes("Image upload service is not configured")) {
        errorMessage =
          "Image upload is temporarily unavailable. You can still submit your report without images.";
      } else if (error.message.includes("Cloudinary configuration")) {
        errorMessage =
          "Image upload service is temporarily unavailable. You can still submit your report without images.";
      } else if (error.message.includes("Invalid image")) {
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

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});

// DELETE /api/upload - Delete image from Cloudinary
export const DELETE = requireAuth(async (request: NextRequest) => {
  try {
    // Validate Cloudinary configuration first
    validateCloudinaryConfig();

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      return NextResponse.json({ message: "Image deleted successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to delete image from storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Delete error:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to delete image";
    if (error instanceof Error) {
      if (error.message.includes("Cloudinary configuration")) {
        errorMessage = "Image service is not properly configured";
      } else if (
        error.message.includes("Network") ||
        error.message.includes("timeout")
      ) {
        errorMessage = "Network error during deletion. Please try again";
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});