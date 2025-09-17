// getSession import removed; unused

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Item types
export interface Item {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string | { text: string; lat?: number; lon?: number };
  dateLost?: string;
  dateFound?: string;
  images: string[] | { url: string; publicId: string }[];
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  status: "Available" | "Claimed" | "Removed" | "Completed";
  user: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemData {
  title: string;
  description: string;
  category: string;
  location: string | { text: string; lat?: number; lon?: number };
  dateLost?: string;
  dateFound?: string;
  images?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
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

// Authentication API
// Note: Manual registration removed - only Google OAuth is supported
export const authApi = {
  // Registration is handled through Google OAuth only
};

// Items API
export const itemsApi = {
  // Lost items
  getLostItems: async (params?: {
    search?: string;
    category?: string;
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiRequest(`/api/lost?${searchParams.toString()}`);
  },

  createLostItem: async (
    itemData: CreateItemData
  ): Promise<ApiResponse<Item>> => {
    return apiRequest("/api/lost", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  },

  getLostItem: async (id: string): Promise<ApiResponse<Item>> => {
    return apiRequest(`/api/lost/${id}`);
  },

  updateLostItem: async (
    id: string,
    itemData: Partial<CreateItemData>
  ): Promise<ApiResponse<Item>> => {
    return apiRequest(`/api/lost/${id}`, {
      method: "PUT",
      body: JSON.stringify(itemData),
    });
  },

  deleteLostItem: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/lost/${id}`, {
      method: "DELETE",
    });
  },

  // Found items
  getFoundItems: async (params?: {
    search?: string;
    category?: string;
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiRequest(`/api/found?${searchParams.toString()}`);
  },

  createFoundItem: async (
    itemData: CreateItemData
  ): Promise<ApiResponse<Item>> => {
    return apiRequest("/api/found", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  },

  getFoundItem: async (id: string): Promise<ApiResponse<Item>> => {
    return apiRequest(`/api/found/${id}`);
  },

  updateFoundItem: async (
    id: string,
    itemData: Partial<CreateItemData>
  ): Promise<ApiResponse<Item>> => {
    return apiRequest(`/api/found/${id}`, {
      method: "PUT",
      body: JSON.stringify(itemData),
    });
  },

  deleteFoundItem: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/found/${id}`, {
      method: "DELETE",
    });
  },

  // Get user's reports (lost and found items)
  getUserReports: async (params?: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Item>>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiRequest(`/api/user/reports?${searchParams.toString()}`);
  },

  // Mark item as completed (returned/claimed)
  markLostItemCompleted: async (id: string): Promise<ApiResponse<Item>> => {
    return apiRequest(`/api/lost/${id}/complete`, {
      method: "PATCH",
    });
  },

  markFoundItemCompleted: async (id: string): Promise<ApiResponse<Item>> => {
    return apiRequest(`/api/found/${id}/complete`, {
      method: "PATCH",
    });
  },
};

// Upload API
export const uploadApi = {
  uploadImage: async (
    file: File
  ): Promise<ApiResponse<{ url: string; publicId: string }>> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle service unavailable gracefully
        if (response.status === 503 && data.development) {
          console.warn("Image upload service unavailable:", data.suggestion);
        }
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
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  },

  deleteImage: async (publicId: string): Promise<ApiResponse> => {
    return apiRequest("/api/upload", {
      method: "DELETE",
      body: JSON.stringify({ publicId }),
    });
  },
};

// Utility functions
export const handleApiError = (error: string): string => {
  // Common error message mappings
  const errorMappings: Record<string, string> = {
    "Validation failed": "Please check your input and try again.",
    Unauthorized: "Please log in to continue.",
    Forbidden: "You do not have permission to perform this action.",
    "Not found": "The requested item was not found.",
    "Internal server error": "Something went wrong. Please try again later.",
  };

  return errorMappings[error] || error;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
