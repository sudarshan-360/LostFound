import { ApiResponse } from "./api";

// === Types ===
export interface FaissItem {
  id: string;
  item: string;
  description: string;
  location: string;
  date: string; // ISO string
  type: "found" | "lost";
  category?: string;
  contact_info?: {
    email?: string;
    phone?: string;
  };
  image_url?: string;
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
  image_urls?: string[];
}

export interface SimilarityDetails {
  text_similarity: number;
  location_similarity: number;
  date_similarity: number;
  image_similarity?: number;
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

// === Local Mock + Heuristics (No Python) ===
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
import { embedTextAndImage, compareQuery } from "./clipClient";

function toWords(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function jaccardSimilarity(aText: string, bText: string): number {
  const a = new Set(toWords(aText));
  const b = new Set(toWords(bText));
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function dateSimilarity(queryDateISO: string, itemDateISO: string): number {
  try {
    const q = new Date(queryDateISO).getTime();
    const i = new Date(itemDateISO).getTime();
    if (isNaN(q) || isNaN(i)) return 0.5;
    const diffDays = Math.abs(q - i) / (1000 * 60 * 60 * 24);
    // Within 0–30 days window gets higher score
    return clamp01(1 - Math.min(diffDays, 30) / 30);
  } catch {
    return 0.5;
  }
}

function locationSimilarity(a: string, b: string): number {
  // Use Jaccard on location words and boost if substring matches
  const j = jaccardSimilarity(a, b);
  if (!a || !b) return j;
  const substr = a.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(a.toLowerCase());
  return clamp01(substr ? Math.max(j, 0.7) : j);
}

function computeScore(query: LostQuery, item: FaissItem): SimilarityDetails & { score: number } {
  const textA = `${query.item} ${query.description}`;
  const textB = `${item.item} ${item.description}`;
  const text = jaccardSimilarity(textA, textB);
  const loc = locationSimilarity(query.location, item.location);
  const date = dateSimilarity(query.date, item.date);
  // Weighted combination to mimic prior thresholds
  const score = clamp01(0.5 * text + 0.3 * loc + 0.2 * date);
  return {
    score,
    text_similarity: text,
    location_similarity: loc,
    date_similarity: date,
  };
}

async function fetchItems(path: string): Promise<{ items: any[]; total: number }> {
  const res = await fetch(`${APP_URL}${path}`);
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  const total = data.pagination?.total ?? items.length;
  return { items, total };
}

function mapToFaissItem(raw: any, type: "found" | "lost"): FaissItem {
  const id = (raw?._id ?? raw?.id ?? "").toString();
  const locationText = raw?.location?.text ?? raw?.location ?? "";
  const createdAt = raw?.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString();
  const contact = raw?.contactInfo ? { email: raw.contactInfo.email, phone: raw.contactInfo.phone } : undefined;
  const imageUrl = Array.isArray(raw?.images) && raw.images.length > 0 ? raw.images[0]?.url : undefined;
  return {
    id,
    item: raw?.title ?? raw?.item ?? "",
    description: raw?.description ?? "",
    location: locationText,
    date: createdAt,
    type,
    category: raw?.category,
    contact_info: contact,
    image_url: imageUrl,
  };
}

// === Mocked API Functions (no Python) ===
export async function addFoundItem(item: FaissItem): Promise<
  ApiResponse<{ status: string; message: string; item_id: string; total_found_items: number }>
> {
  try {
    const { total } = await fetchItems("/api/found?limit=1");
    return {
      success: true,
      data: {
        status: "ok",
        message: "Indexed found item (mock)",
        item_id: item.id,
        total_found_items: total,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Mock index error" };
  }
}

export async function addLostItem(item: FaissItem): Promise<
  ApiResponse<{ status: string; message: string; item_id: string; total_lost_items: number }>
> {
  try {
    const res = await fetch(`${APP_URL}/api/lost?limit=1`);
    const data = await res.json();
    const total = data.pagination?.total ?? (Array.isArray(data.items) ? data.items.length : 0);
    return {
      success: true,
      data: {
        status: "ok",
        message: "Indexed lost item (mock)",
        item_id: item.id,
        total_lost_items: total,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Mock index error" };
  }
}

export async function matchLostItem(query: LostQuery): Promise<ApiResponse<MatchResponse>> {
  try {
    // Build CLIP query embedding from text + optional image
    const queryText = `${query.item} ${query.description}`.trim();
    const queryImage = Array.isArray(query.image_urls) && query.image_urls.length > 0 ? query.image_urls[0] : undefined;
    const queryEmb = await embedTextAndImage({ text: queryText, image_url: queryImage });

    // Retrieve all found items
    const { items, total } = await fetchItems("/api/found?limit=1000");
    const faissItems = items.map((i) => mapToFaissItem(i, "found"));

    // Generate embeddings for counterpart items purely via CLIP
    const compareItems: { id: string; embedding: number[] }[] = [];
    for (const fi of faissItems) {
      try {
        const text = `${fi.item} ${fi.description}`.trim();
        const { embedding } = await embedTextAndImage({ text, image_url: fi.image_url });
        compareItems.push({ id: fi.id, embedding });
      } catch (e) {
        // Skip items that fail to embed
        continue;
      }
    }

    if (compareItems.length === 0) {
      return {
        success: true,
        data: { lost_item: query, matches: [], total_found_items: total },
      };
    }

    // Compute cosine similarity via CLIP service
    const clipResults = await compareQuery(queryEmb.embedding, compareItems);
    const byId = new Map(faissItems.map((i) => [i.id, i]));

    // Take top 5 results, scores are direct CLIP similarities
    const top = clipResults.sort((a, b) => b.score - a.score).slice(0, 5);

    return {
      success: true,
      data: {
        lost_item: query,
        matches: top
          .filter((r) => byId.has(r.id))
          .map((r) => ({
            score: r.score,
            found_item: byId.get(r.id)!,
            similarity_details: {
              // Keep structure for UI compatibility; values reflect CLIP-only scoring
              text_similarity: r.score,
              location_similarity: 0,
              date_similarity: 0,
              image_similarity: undefined,
            },
          })),
        total_found_items: total,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "CLIP match error" };
  }
}

export async function matchFoundItem(query: LostQuery): Promise<ApiResponse<MatchResponse>> {
  try {
    // Build CLIP query embedding from text + optional image
    const queryText = `${query.item} ${query.description}`.trim();
    const queryImage = Array.isArray(query.image_urls) && query.image_urls.length > 0 ? query.image_urls[0] : undefined;
    const queryEmb = await embedTextAndImage({ text: queryText, image_url: queryImage });

    // Retrieve all lost items
    const { items, total } = await fetchItems("/api/lost?limit=1000");
    const faissItems = items.map((i) => mapToFaissItem(i, "lost"));

    // Generate embeddings for counterpart items via CLIP
    const compareItems: { id: string; embedding: number[] }[] = [];
    for (const fi of faissItems) {
      try {
        const text = `${fi.item} ${fi.description}`.trim();
        const { embedding } = await embedTextAndImage({ text, image_url: fi.image_url });
        compareItems.push({ id: fi.id, embedding });
      } catch (e) {
        continue;
      }
    }

    if (compareItems.length === 0) {
      return {
        success: true,
        data: { lost_item: query, matches: [], total_found_items: total },
      };
    }

    const clipResults = await compareQuery(queryEmb.embedding, compareItems);
    const byId = new Map(faissItems.map((i) => [i.id, i]));
    const top = clipResults.sort((a, b) => b.score - a.score).slice(0, 5);

    return {
      success: true,
      data: {
        lost_item: query,
        matches: top
          .filter((r) => byId.has(r.id))
          .map((r) => ({
            score: r.score,
            found_item: byId.get(r.id)!,
            similarity_details: {
              text_similarity: r.score,
              location_similarity: 0,
              date_similarity: 0,
              image_similarity: undefined,
            },
          })),
        total_found_items: total,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "CLIP match error" };
  }
}

export async function getFoundItems(): Promise<ApiResponse<{ found_items: FaissItem[]; count: number }>> {
  try {
    const { items, total } = await fetchItems("/api/found?limit=1000");
    const faissItems = items.map((i) => mapToFaissItem(i, "found"));
    return { success: true, data: { found_items: faissItems, count: total } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Mock list error" };
  }
}

export async function checkFaissHealth(): Promise<ApiResponse<FaissHealthResponse>> {
  try {
    const { total } = await fetchItems("/api/found?limit=1");
    return {
      success: true,
      data: {
        status: "ok",
        service: "mock",
        found_items_count: total,
        index_built: true,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Mock health error" };
  }
}

export async function clearFaissIndex(): Promise<ApiResponse<{ status: string; message: string }>> {
  return { success: true, data: { status: "ok", message: "Cleared index (mock)" } };
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
