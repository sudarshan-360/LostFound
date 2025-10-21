import { z } from "zod";

// User validation schemas
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Item validation schemas
export const createItemSchema = z.object({
  type: z.enum(["lost", "found"], { required_error: "Item type is required" }),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description cannot exceed 1000 characters"),
  tags: z
    .array(z.string())
    .max(10, "Cannot have more than 10 tags")
    .default([]),
  location: z.object({
    text: z
      .string()
      .min(1, "Location is required")
      .max(200, "Location cannot exceed 200 characters"),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
  }),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category cannot exceed 50 characters")
    .optional()
    .default("Other"),
  reward: z
    .number()
    .min(0, "Reward cannot be negative")
    .max(100000, "Reward cannot exceed 100,000")
    .optional(),
  contactInfo: z
    .object({
      email: z.string().email("Invalid email format").optional(),
      phone: z
        .string()
        .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format")
        .optional(),
    })
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL"),
        publicId: z.string().min(1, "Public ID is required"),
      })
    )
    .max(5, "Cannot have more than 5 images")
    .default([])
    .optional(),
  isLostRoomItem: z.boolean().optional().default(false),
});

export const updateItemSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  tags: z.array(z.string()).max(10, "Cannot have more than 10 tags").optional(),
  location: z
    .object({
      text: z
        .string()
        .min(1, "Location is required")
        .max(200, "Location cannot exceed 200 characters"),
      lat: z.number().min(-90).max(90).optional(),
      lon: z.number().min(-180).max(180).optional(),
    })
    .optional(),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category cannot exceed 50 characters")
    .optional(),
  status: z.enum(["Available", "Claimed", "Removed", "Completed"]).optional(),
  reward: z
    .number()
    .min(0, "Reward cannot be negative")
    .max(100000, "Reward cannot exceed 100,000")
    .optional(),
  contactInfo: z
    .object({
      email: z.string().email("Invalid email format").optional(),
      phone: z
        .string()
        .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format")
        .optional(),
    })
    .optional(),
  isLostRoomItem: z.boolean().optional(),
});

// Query validation schemas
export const itemQuerySchema = z.object({
  q: z.string().optional(), // search query
  tag: z.string().optional(), // filter by tag
  status: z.enum(["Available", "Claimed", "Removed", "Completed"]).optional(),
  location: z.string().optional(), // filter by location
  page: z
    .string()
    .transform((val) => parseInt(val) || 1)
    .refine((val) => val > 0, "Page must be positive")
    .optional(),
  limit: z
    .string()
    .transform((val) => {
      const num = parseInt(val) || 10;
      return Math.min(Math.max(num, 1), 50); // Limit between 1 and 50
    })
    .optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  lostRoom: z
    .string()
    .transform((val) => ["1", "true", "yes"].includes(val.toLowerCase()))
    .optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any().refine(
    (file) => {
      if (!file) return false;
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      return allowedTypes.includes(file.type) && file.size <= maxSize;
    },
    {
      message: "File must be JPEG, PNG, or WebP and under 5MB",
    }
  ),
});

// Admin validation schemas
export const adminActionSchema = z
  .object({
    action: z.enum(["remove", "restore", "ban_user"]),
    itemId: z.string().optional(),
    userId: z.string().optional(),
    reason: z
      .string()
      .min(1, "Reason is required")
      .max(500, "Reason cannot exceed 500 characters"),
  })
  .refine(
    (data) => {
      if (
        (data.action === "remove" || data.action === "restore") &&
        !data.itemId
      ) {
        return false;
      }
      if (data.action === "ban_user" && !data.userId) {
        return false;
      }
      return true;
    },
    {
      message: "Required fields missing for the specified action",
    }
  );

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ItemQueryInput = z.infer<typeof itemQuerySchema>;
export type AdminActionInput = z.infer<typeof adminActionSchema>;
