import { ApiResponse } from "./api";

// === Types ===
export interface FaissItem {
  id: string;
  item: string;
  description: string;
  location: string;
  date: string; // ISO string
  type: "found" | "lost";
  contact_info?: {
    email?: string;
    phone?: string;
  };
}

export interface LostQuery {
  id: string;
  item: string;
  description: string;
  location: string;
  date: string;
  contact_info?: {
    email?: string;
    phone?: string;
  };
}

export interface SimilarityDetails {
  text_similarity: number;
  location_similarity: number;
  date_similarity: number;
}

export interface MatchResult {
  score: number;
  found_item: FaissItem;
  similarity_details: SimilarityDetails;
}

export interface MatchResponse {
  lost_item: LostQuery;
  matches: MatchResult[];
  total_found_items: number;
}

export interface FaissHealthResponse {
  status: string;
  service: string;
  found_items_count: number;
  index_built: boolean;
}

// === Configuration ===
const PYTHON_API_URL =
  process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000";

// === Helper Functions ===
async function faissRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${PYTHON_API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || `HTTP error! status: ${response.status}`,
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

// === FAISS API Functions ===
export async function addFoundItem(item: FaissItem): Promise<
  ApiResponse<{
    status: string;
    message: string;
    item_id: string;
    total_found_items: number;
  }>
> {
  return faissRequest("/add-found", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function addLostItem(item: FaissItem): Promise<
  ApiResponse<{
    status: string;
    message: string;
    item_id: string;
    total_lost_items: number;
  }>
> {
  return faissRequest("/add-lost", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function matchLostItem(
  query: LostQuery
): Promise<ApiResponse<MatchResponse>> {
  return faissRequest("/match-lost", {
    method: "POST",
    body: JSON.stringify(query),
  });
}

export async function matchFoundItem(
  query: LostQuery
): Promise<ApiResponse<MatchResponse>> {
  return faissRequest("/match-found", {
    method: "POST",
    body: JSON.stringify(query),
  });
}

export async function getFoundItems(): Promise<
  ApiResponse<{
    found_items: FaissItem[];
    count: number;
  }>
> {
  return faissRequest("/found-items");
}

export async function checkFaissHealth(): Promise<
  ApiResponse<FaissHealthResponse>
> {
  return faissRequest("/");
}

export async function clearFaissIndex(): Promise<
  ApiResponse<{
    status: string;
    message: string;
  }>
> {
  return faissRequest("/clear-index", {
    method: "DELETE",
  });
}

// === Utility Functions ===
export function formatSimilarityScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function getSimilarityColor(score: number): string {
  if (score >= 0.8) return "text-green-500";
  if (score >= 0.6) return "text-yellow-500";
  if (score >= 0.4) return "text-orange-500";
  return "text-red-500";
}

export function getSimilarityLabel(score: number): string {
  if (score >= 0.8) return "Very High";
  if (score >= 0.6) return "High";
  if (score >= 0.4) return "Medium";
  if (score >= 0.2) return "Low";
  return "Very Low";
}
