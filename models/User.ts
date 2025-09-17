import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string; // Optional for Google OAuth users
  avatarUrl?: string;
  phone?: string; // Phone number for contact
  isAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    passwordHash: {
      type: String,
      required: false, // Not required for Google OAuth users
      minlength: [6, "Password must be at least 6 characters"],
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Removed redundant manual email index; 'unique: true' on email already creates an index

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);