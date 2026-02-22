import { NextRequest } from "next/server";

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = "Too many requests, please try again later.",
    skipSuccessfulRequests = false,
    keyGenerator = (req) => getClientIP(req),
  } = options;

  return function rateLimitMiddleware(
    handler: (request: NextRequest) => Promise<Response>
  ) {
    return async (request: NextRequest): Promise<Response> => {
      const key = keyGenerator(request);
      const now = Date.now();

      // Clean up expired entries
      for (const [storeKey, data] of rateLimitStore.entries()) {
        if (data.resetTime < now) {
          rateLimitStore.delete(storeKey);
        }
      }

      // Get or create rate limit data for this key
      let rateLimitData = rateLimitStore.get(key);

      if (!rateLimitData || rateLimitData.resetTime < now) {
        rateLimitData = {
          count: 0,
          resetTime: now + windowMs,
        };
        rateLimitStore.set(key, rateLimitData);
      }

      // Check if limit exceeded
      if (rateLimitData.count >= maxRequests) {
        const resetTimeSeconds = Math.ceil(
          (rateLimitData.resetTime - now) / 1000
        );

        return new Response(
          JSON.stringify({
            error: message,
            retryAfter: resetTimeSeconds,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": rateLimitData.resetTime.toString(),
              "Retry-After": resetTimeSeconds.toString(),
            },
          }
        );
      }

      // Execute the handler
      const response = await handler(request);

      // Increment counter (skip if configured and request was successful)
      const shouldSkip = skipSuccessfulRequests && response.status < 400;
      if (!shouldSkip) {
        rateLimitData.count++;
        rateLimitStore.set(key, rateLimitData);
      }

      // Add rate limit headers to response
      const remaining = Math.max(0, maxRequests - rateLimitData.count);
      response.headers.set("X-RateLimit-Limit", maxRequests.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set(
        "X-RateLimit-Reset",
        rateLimitData.resetTime.toString()
      );

      return response;
    };
  };
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default if no IP found
  return "unknown";
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: "Too many authentication attempts, please try again later.",
  },

  // Moderate rate limiting for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: "Too many API requests, please slow down.",
  },

  // Strict rate limiting for file uploads
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
    message: "Too many upload requests, please wait before uploading again.",
  },

  // Very strict rate limiting for admin actions
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 admin actions per minute
    message: "Too many admin actions, please slow down.",
  },

  // Moderate rate limiting for chat messages
  chat: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 messages per minute
    message: "Too many messages, please slow down.",
  },
};

/**
 * Helper functions for common rate limiting scenarios
 */
export const createAuthRateLimit = () => rateLimit(rateLimitConfigs.auth);
export const createAPIRateLimit = () => rateLimit(rateLimitConfigs.api);
export const createUploadRateLimit = () => rateLimit(rateLimitConfigs.upload);
export const createAdminRateLimit = () => rateLimit(rateLimitConfigs.admin);
export const createChatRateLimit = () => rateLimit(rateLimitConfigs.chat);