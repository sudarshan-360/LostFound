import { NextRequest, NextResponse } from "next/server";

// CORS headers for API routes
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

// CORS middleware for API routes
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      const response = await handler(request);

      // Add CORS headers to the response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error("API route error:", error);
      const errorResponse = NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );

      // Add CORS headers to error response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }
  };
}

// Helper function to add CORS headers to any response
export function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
