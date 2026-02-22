import mongoose from "mongoose";

const BUCKET_NAME = "images";

/**
 * Get MongoDB GridFS bucket for image storage.
 * Call after connectDB().
 */
export function getImagesBucket(): mongoose.mongo.GridFSBucket {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}
