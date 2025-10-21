// Load .env.local FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Now import everything else
import { Worker } from "bullmq";
import { getRedisConnection } from "@/lib/redis";
import { runMatchingForItemId } from "@/lib/matching";

const queueName = "item-matching";

// Feature flag: allow disabling BullMQ worker in dev environments
const ENABLED = (process.env.BULLMQ_ENABLED || "").toLowerCase() === "true";

if (!ENABLED) {
  console.log(
    "[matchWorker] BullMQ disabled via BULLMQ_ENABLED=false; worker not started"
  );
  // Exit early to avoid Redis connection attempts
  process.exit(0);
}

const worker = new Worker(
  queueName,
  async (job) => {
    const { itemId } = job.data as { itemId: string };
    const res = await runMatchingForItemId(itemId);
    return res;
  },
  { connection: getRedisConnection() }
);

worker.on("completed", (job, result) => {
  console.log(`[matchWorker] completed job ${job.id}`, result);
});

worker.on("failed", (job, err) => {
  console.error(`[matchWorker] failed job ${job?.id}`, err);
});

console.log(`[matchWorker] Listening on queue '${queueName}'`);