import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";
import { runMatchingForItemId } from "./matching";

// Feature flag to enable/disable BullMQ in certain environments (e.g., local dev)
const ENABLED = (process.env.BULLMQ_ENABLED || "").toLowerCase() === "true";
const queueName = "item-matching";
const LOG_PREFIX = "[MatchQueue]";

let queue: Queue | null = null;

export function getMatchQueue() {
  if (!queue) {
    queue = new Queue(queueName, { connection: getRedisConnection() });
  }
  return queue;
}

export async function addMatchJob(itemId: string) {
  // In disabled mode, run matching directly as a fallback
  if (!ENABLED) {
    console.log(
      `${LOG_PREFIX} BullMQ disabled - running matching directly for item ${itemId}`
    );
    
    // Run matching in background (don't await) to avoid blocking the API response
    setImmediate(async () => {
      try {
        const result = await runMatchingForItemId(itemId);
        console.log(`${LOG_PREFIX} Direct matching completed for item ${itemId}`, result);
      } catch (error) {
        console.error(`${LOG_PREFIX} Direct matching failed for item ${itemId}:`, error);
      }
    });
    
    return { mode: "direct", itemId };
  }

  // Use BullMQ queue when enabled
  console.log(`${LOG_PREFIX} Enqueueing matching job for item ${itemId}`);
  const q = getMatchQueue();
  const job = await q.add(
    "match-item",
    { itemId },
    {
      removeOnComplete: 1000,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    }
  );
  
  console.log(`${LOG_PREFIX} Job ${job.id} enqueued for item ${itemId}`);
  return { mode: "queue", jobId: job.id, itemId };
}