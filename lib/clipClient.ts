const CLIP_SERVICE_URL = process.env.CLIP_API_URL || "http://localhost:8000";

export type EmbedInput = {
  text?: string;
  image_url?: string;
};

export async function embedTextAndImage(input: EmbedInput): Promise<{
  embedding: number[];
  model?: string;
  dim?: number;
}> {
  const res = await fetch(`${CLIP_SERVICE_URL}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`CLIP /embed failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as {
    embedding: number[];
    model?: string;
    dim?: number;
  };
}

export type CompareItem = { id: string; embedding: number[] };
export type CompareScore = { id: string; score: number };

export async function compareQuery(
  queryEmbedding: number[],
  items: CompareItem[]
): Promise<CompareScore[]> {
  const res = await fetch(`${CLIP_SERVICE_URL}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Python service expects { query, items }
    body: JSON.stringify({ query: queryEmbedding, items }),
  });
  if (!res.ok) {
    throw new Error(`CLIP /compare failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { results: CompareScore[] };
  return data.results;
}