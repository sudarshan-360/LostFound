import mongoose, { Document, Schema } from "mongoose";

export interface IItem extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  tags: string[];
  location: {
    text: string;
    lat?: number;
    lon?: number;
  };
  images: {
    url: string;
    publicId: string;
  }[];
  status: "Available" | "Claimed" | "Removed" | "Completed";
  reward?: number;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  isDeleted: boolean;
  faissSynced: boolean; // Track if item has been synced to FAISS
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      enum: ["lost", "found"],
      required: [true, "Item type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: false, // Made optional for backward compatibility
      trim: true,
      maxlength: [50, "Category cannot exceed 50 characters"],
      default: "Other",
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10;
        },
        message: "Cannot have more than 10 tags",
      },
    },
    location: {
      text: {
        type: String,
        required: [true, "Location text is required"],
        trim: true,
        maxlength: [200, "Location cannot exceed 200 characters"],
      },
      lat: {
        type: Number,
        min: [-90, "Latitude must be between -90 and 90"],
        max: [90, "Latitude must be between -90 and 90"],
      },
      lon: {
        type: Number,
        min: [-180, "Longitude must be between -180 and 180"],
        max: [180, "Longitude must be between -180 and 180"],
      },
    },
    images: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
          publicId: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
      validate: {
        validator: function (images: any[]) {
          return images.length <= 5;
        },
        message: "Cannot have more than 5 images",
      },
    },
    status: {
      type: String,
      enum: ["Available", "Claimed", "Removed", "Completed"],
      default: "Available",
    },
    reward: {
      type: Number,
      min: [0, "Reward cannot be negative"],
      max: [100000, "Reward cannot exceed 100,000"],
    },
    contactInfo: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
      },
      phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    faissSynced: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ItemSchema.index({ type: 1, status: 1, isDeleted: 1 });
ItemSchema.index({ userId: 1 });
ItemSchema.index({ createdAt: -1 });
ItemSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.models.Item ||
  mongoose.model<IItem>("Item", ItemSchema);
