// Reports API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Report {
  _id: string;
  title: string;
  description: string;
  category: string;
  type: "lost" | "found";
  status: "Available" | "Claimed" | "Removed" | "Completed";
  location: {
    text: string;
    lat?: number;
    lon?: number;
  };
  images: {
    url: string;
    publicId: string;
  }[];
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReportsResponse {
  success: boolean;
  data: {
    items: Report[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface ReportsQuery {
  type?: "lost" | "found";
  status?: "Available" | "Claimed" | "Removed" | "Completed";
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Get user's reports
export async function getMyReports(query: ReportsQuery = {}): Promise<{
  success: boolean;
  data?: ReportsResponse["data"];
  error?: string;
}> {
  const searchParams = new URLSearchParams();

  // Always add owner=current
  searchParams.append("owner", "current");

  // Add other query parameters
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await apiRequest<ReportsResponse>(
    `/api/reports?${searchParams.toString()}`
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.data, // Extract the inner data
    };
  }

  return response;
}
