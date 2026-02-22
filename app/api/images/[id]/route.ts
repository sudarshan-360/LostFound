import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getImagesBucket } from "@/lib/gridfs";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid image id", { status: 400 });
    }

    await connectDB();
    const bucket = getImagesBucket();
    const chunks: Buffer[] = [];
    const stream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id));

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    if (buffer.length === 0) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const files = await bucket
      .find({ _id: new mongoose.Types.ObjectId(id) })
      .toArray();
    const contentType =
      files[0]?.metadata?.contentType ?? files[0]?.contentType ?? "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Image serve error:", error);
    const err = error as Error & { code?: number };
    if (err.code === 1) {
      return new NextResponse("Image not found", { status: 404 });
    }
    return new NextResponse("Failed to load image", { status: 500 });
  }
}
