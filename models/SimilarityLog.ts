import mongoose, { Document, Schema } from "mongoose";

export type MatchDirection = "lost_to_found" | "found_to_lost";

export interface ISimilarityLog extends Document {
  _id: string;
  sourceItemId: mongoose.Types.ObjectId;
  targetItemId: mongoose.Types.ObjectId;
  sourceType: "lost" | "found";
  targetType: "lost" | "found";
  direction: MatchDirection;
  score: number;
  notified: boolean;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SimilarityLogSchema = new Schema<ISimilarityLog>(
  {
    sourceItemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    targetItemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    sourceType: { type: String, enum: ["lost", "found"], required: true },
    targetType: { type: String, enum: ["lost", "found"], required: true },
    direction: { type: String, enum: ["lost_to_found", "found_to_lost"], required: true },
    score: { type: Number, required: true, min: 0, max: 1 },
    notified: { type: Boolean, default: false },
    notifiedAt: { type: Date, default: undefined },
  },
  { timestamps: true }
);

// Prevent duplicate logs per pair/direction
SimilarityLogSchema.index({ sourceItemId: 1, targetItemId: 1, direction: 1 }, { unique: true });

export default mongoose.models.SimilarityLog ||
  mongoose.model<ISimilarityLog>("SimilarityLog", SimilarityLogSchema);