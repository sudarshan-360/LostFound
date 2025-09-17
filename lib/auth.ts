import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "./db";
import User from "@/models/User";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      return null;
    }

    await connectDB();
    const user = await User.findById(token.id).select("-passwordHash");

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin || false,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return handler(request, user);
  };
}

/**
 * Middleware to require admin privileges
 */
export function requireAdmin(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!user.isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin privileges required" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return handler(request, user);
  };
}

/**
 * Check if user owns a resource
 */
export function checkOwnership(
  resourceUserId: string,
  currentUserId: string
): boolean {
  return resourceUserId === currentUserId;
}