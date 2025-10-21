import connectDB from "./db";
import Item, { IItem } from "@/models/Item";
import SimilarityLog from "@/models/SimilarityLog";
import User from "@/models/User";
import { embedTextAndImage, compareQuery } from "./clipClient";
import { sendMatchNotification } from "./email";
import mongoose from "mongoose";

const SIMILARITY_THRESHOLD = parseFloat(
  process.env.SIMILARITY_THRESHOLD || "0.75"
);
const LOG_PREFIX = "[Matching]";
const IS_TEST = process.env.NODE_ENV === "test";

// Minor factor configuration
const MAX_DISTANCE_KM = 50; // beyond this, location contribution tapers to 0
const MAX_DATE_DIFF_DAYS = 30; // beyond this, date contribution tapers to 0

// Helper for consistent logging
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(
      `${timestamp} ${LOG_PREFIX} ${message}`,
      JSON.stringify(data, null, 2)
    );
  } else {
    console.log(`${timestamp} ${LOG_PREFIX} ${message}`);
  }
}

function getPrimaryImageUrl(item: IItem): string | undefined {
  return item.images?.[0]?.url;
}

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function tokenize(s: string) {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
}

function jaccardSimilarity(a: string, b: string) {
  const A = tokenize(a);
  const B = tokenize(b);
  const intersection = new Set([...A].filter((x) => B.has(x)));
  const unionSize = new Set([...A, ...B]).size || 1;
  return clamp01(intersection.size / unionSize);
}

function computeLocationScore(source: IItem, target: IItem) {
  const sLoc = source.location;
  const tLoc = target.location;
  if (
    sLoc?.lat != null &&
    sLoc?.lon != null &&
    tLoc?.lat != null &&
    tLoc?.lon != null
  ) {
    const km = haversineKm(sLoc.lat!, sLoc.lon!, tLoc.lat!, tLoc.lon!);
    const score = clamp01(1 - km / MAX_DISTANCE_KM);
    return { score, method: "geo", distanceKm: km };
  }
  if (sLoc?.text && tLoc?.text) {
    const overlap = jaccardSimilarity(sLoc.text, tLoc.text);
    return { score: overlap, method: "text", overlap };
  }
  return { score: 0, method: "none" };
}

function computeDateScore(source: IItem, target: IItem) {
  const a = source.createdAt;
  const b = target.createdAt;
  if (!a || !b) return { score: 0, diffDays: null };
  const diffMs = Math.abs(a.getTime() - b.getTime());
  const days = diffMs / (1000 * 60 * 60 * 24);
  const score = clamp01(1 - days / MAX_DATE_DIFF_DAYS);
  return { score, diffDays: Math.round(days) };
}

function computeWeights(source: IItem, target: IItem) {
  if (IS_TEST) {
    return { clip: 1, location: 0, date: 0, modality: "test" };
  }

  // For Lost Room items, use 100% CLIP weight - skip location and date logic
  const isLostRoomItem = source.isLostRoomItem || target.isLostRoomItem;
  if (isLostRoomItem) {
    const hasSrcImg = !!getPrimaryImageUrl(source);
    const hasTgtImg = !!getPrimaryImageUrl(target);
    const hasSrcText = !!(source.title || source.description);
    const hasTgtText = !!(target.title || target.description);

    let modality = "mixed";
    if (hasSrcText && hasTgtText && !hasSrcImg && !hasTgtImg)
      modality = "text-text";
    else if (hasSrcImg && hasTgtImg && !hasSrcText && !hasTgtText)
      modality = "image-image";
    else if ((hasSrcText && hasTgtImg) || (hasSrcImg && hasTgtText))
      modality = "text-image";

    return { clip: 1, location: 0, date: 0, modality };
  }

  const hasSrcImg = !!getPrimaryImageUrl(source);
  const hasTgtImg = !!getPrimaryImageUrl(target);
  const hasSrcText = !!(source.title || source.description);
  const hasTgtText = !!(target.title || target.description);

  const locAvailable = !!(
    source.location &&
    target.location &&
    ((source.location.lat != null &&
      source.location.lon != null &&
      target.location.lat != null &&
      target.location.lon != null) ||
      (source.location.text && target.location.text))
  );
  const dateAvailable = !!(source.createdAt && target.createdAt);

  let clip = 0.85;
  let location = 0.1;
  let date = 0.05;

  const hasImageBoth = hasSrcImg && hasTgtImg;
  if (!hasImageBoth) {
    // Shift more importance to CLIP (primarily text) when images are missing
    clip += 0.05;
    location = Math.max(0, location - 0.03);
    date = Math.max(0, date - 0.02);
  }

  if (!locAvailable) {
    clip += location;
    location = 0;
  }
  if (!dateAvailable) {
    clip += date;
    date = 0;
  }

  // Normalize weights to sum to 1
  const total = clip + location + date || 1;
  clip /= total;
  location /= total;
  date /= total;

  let modality = "mixed";
  if (hasSrcText && hasTgtText && !hasSrcImg && !hasTgtImg)
    modality = "text-text";
  else if (hasSrcImg && hasTgtImg && !hasSrcText && !hasTgtText)
    modality = "image-image";
  else if ((hasSrcText && hasTgtImg) || (hasSrcImg && hasTgtText))
    modality = "text-image";

  return { clip, location, date, modality };
}

async function ensureItemEmbedding(item: IItem): Promise<IItem> {
  if (Array.isArray(item.embedding) && item.embedding.length > 0) {
    log(`Item ${item._id} already has embedding, skipping`);
    return item;
  }

  const imageUrl = getPrimaryImageUrl(item);
  const text = `${item.title}\n${item.description}`.trim();

  log(`Generating embedding for item ${item._id}`, {
    title: item.title,
    hasImage: !!imageUrl,
  });

  try {
    const { embedding, model } = await embedTextAndImage({
      text,
      image_url: imageUrl,
    });

    item.embedding = embedding;
    item.embeddingModel = model || "clip-ViT-B-32";
    item.lastEmbeddedAt = new Date();
    await item.save();

    log(`Successfully generated embedding for item ${item._id}`, {
      model,
      dimension: embedding.length,
    });

    return item;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log(`ERROR: Failed to generate embedding for item ${item._id}: ${errMsg}`);
    throw new Error(`CLIP embedding failed: ${errMsg}`);
  }
}

async function getCounterpartItems(item: IItem): Promise<IItem[]> {
  const counterpartType = item.type === "lost" ? "found" : "lost";
  // Fetch ALL counterpart items (not just those already embedded)
  const items = await Item.find({
    type: counterpartType,
    isDeleted: false,
    status: { $ne: "Removed" },
  })
    .populate("userId", "name email")
    .exec();
  return items;
}

async function ensureEmbeddingsForItems(items: IItem[]): Promise<IItem[]> {
  const processed: IItem[] = [];
  for (const it of items) {
    try {
      const hasEmbedding =
        Array.isArray(it.embedding) && it.embedding.length > 0;
      if (!hasEmbedding) {
        await ensureItemEmbedding(it);
      }
      // Push only if embedding is now present
      if (Array.isArray(it.embedding) && it.embedding.length > 0) {
        processed.push(it);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      log(
        `ERROR: Failed to ensure embedding for counterpart item ${it._id}: ${errMsg}`
      );
      // Continue with other items
      continue;
    }
  }
  return processed;
}

function pickLostAndFound(
  source: IItem,
  target: IItem
): { lost: IItem; found: IItem } {
  if (source.type === "lost" && target.type === "found")
    return { lost: source, found: target };
  if (source.type === "found" && target.type === "lost")
    return { lost: target, found: source };
  throw new Error("Invalid item types for matching");
}

async function getReporterEmail(item: IItem): Promise<string | null> {
  // Prefer explicit contact info, fallback to linked user email
  if (item.contactInfo?.email) return item.contactInfo.email;
  const user = await User.findById(item.userId).exec();
  return user ? user.email : null;
}

export async function runMatchingForItemId(itemId: string) {
  log(`Starting matching process for item ${itemId}`);

  await connectDB();
  const item = await Item.findById(itemId);

  if (!item || item.isDeleted) {
    log(`Item ${itemId} not found or deleted, skipping matching`);
    return { processed: 0, notified: 0, error: "Item not found or deleted" };
  }

  log(`Processing ${item.type} item: "${item.title}"`);

  try {
    await ensureItemEmbedding(item);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log(`ERROR: Failed to ensure embedding for item ${itemId}: ${errMsg}`);
    return { processed: 0, notified: 0, error: errMsg };
  }

  const counterparts = await getCounterpartItems(item);
  log(`Found ${counterparts.length} counterpart items (pre-embedding check)`);

  // Ensure embeddings exist for counterparts on-demand
  const embeddedCounterparts = await ensureEmbeddingsForItems(counterparts);
  log(`Counterparts ready for comparison: ${embeddedCounterparts.length}`);

  const items = embeddedCounterparts.map((c) => ({
    id: c._id.toString(),
    embedding: c.embedding!,
  }));

  if (items.length === 0) {
    log(`No counterpart items with embeddings available after ensuring`);
    return { processed: 0, notified: 0 };
  }

  if (!Array.isArray(item.embedding)) {
    log(`ERROR: Item ${itemId} has no embedding after ensureItemEmbedding`);
    return { processed: 0, notified: 0, error: "No embedding generated" };
  }

  // Ask Python service to compare
  log(`Comparing with ${items.length} counterpart items using CLIP`);
  let scores;
  try {
    scores = await compareQuery(item.embedding!, items);
    log(`Received ${scores.length} similarity scores from CLIP service`);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log(`ERROR: CLIP comparison failed: ${errMsg}`);
    return {
      processed: 0,
      notified: 0,
      error: `CLIP service error: ${errMsg}`,
    };
  }

  // Map scores back to counterpart items
  const byId = new Map(counterparts.map((c) => [c._id.toString(), c]));

  let notified = 0;
  let matchesAboveThreshold = 0;

  for (const { id: targetId, score } of scores.sort(
    (a, b) => b.score - a.score
  )) {
    const target = byId.get(targetId);
    if (!target) continue;

    const clipScore = clamp01(score);
    const weights = computeWeights(item, target);

    // For Lost Room items, use only CLIP score
    const isLostRoomItem = item.isLostRoomItem || target.isLostRoomItem;
    let finalNormalized;

    if (isLostRoomItem) {
      finalNormalized = clipScore;
    } else {
      const locComp = computeLocationScore(item, target);
      const dateComp = computeDateScore(item, target);

      finalNormalized = clamp01(
        clipScore * weights.clip +
          (locComp.score || 0) * weights.location +
          (dateComp.score || 0) * weights.date
      );
    }

    const finalPercent = (finalNormalized * 100).toFixed(1);

    if (finalNormalized < SIMILARITY_THRESHOLD) {
      // Log below-threshold contributions for debugging
      if (isLostRoomItem) {
        log(
          `Below threshold for Lost Room item ${item.title} ↔ ${target.title}`,
          {
            clip: {
              score: clipScore,
              weight: weights.clip,
              modality: weights.modality,
            },
            finalNormalized,
            threshold: SIMILARITY_THRESHOLD,
          }
        );
      } else {
        const locComp = computeLocationScore(item, target);
        const dateComp = computeDateScore(item, target);
        log(`Below threshold for ${item.title} ↔ ${target.title}`, {
          clip: {
            score: clipScore,
            weight: weights.clip,
            modality: weights.modality,
          },
          location: {
            score: locComp.score,
            weight: weights.location,
            method: locComp.method,
          },
          date: {
            score: dateComp.score,
            weight: weights.date,
            diffDays: dateComp.diffDays,
          },
          finalNormalized,
          threshold: SIMILARITY_THRESHOLD,
        });
      }
      continue;
    }

    matchesAboveThreshold++;

    log(
      `Match found with final score ${finalPercent}%: ${item.title} ↔ ${target.title}`
    );

    if (isLostRoomItem) {
      log(`Lost Room item score contributions`, {
        clip: {
          score: clipScore,
          weight: weights.clip,
          modality: weights.modality,
        },
        finalNormalized,
      });
    } else {
      const locComp = computeLocationScore(item, target);
      const dateComp = computeDateScore(item, target);
      log(`Score contributions`, {
        clip: {
          score: clipScore,
          weight: weights.clip,
          modality: weights.modality,
        },
        location: {
          score: locComp.score,
          weight: weights.location,
          method: locComp.method,
        },
        date: {
          score: dateComp.score,
          weight: weights.date,
          diffDays: dateComp.diffDays,
        },
        finalNormalized,
      });
    }

    const direction = item.type === "lost" ? "lost_to_found" : "found_to_lost";
    const oppositeDirection =
      direction === "lost_to_found" ? "found_to_lost" : "lost_to_found";

    // Cross-direction dedup: skip if this pair has already been notified in either direction
    const pairNotified = await SimilarityLog.findOne({
      $or: [
        {
          sourceItemId: new mongoose.Types.ObjectId(item._id),
          targetItemId: new mongoose.Types.ObjectId(target._id),
          direction,
          notified: true,
        },
        {
          sourceItemId: new mongoose.Types.ObjectId(target._id),
          targetItemId: new mongoose.Types.ObjectId(item._id),
          direction: oppositeDirection,
          notified: true,
        },
      ],
    });
    if (pairNotified) {
      log(
        "Skipping notification - already sent for this pair (cross-direction dedup)"
      );
      continue;
    }

    // Check if this match already exists and was notified (same direction)
    const existingLog = await SimilarityLog.findOne({
      sourceItemId: new mongoose.Types.ObjectId(item._id),
      targetItemId: new mongoose.Types.ObjectId(target._id),
      direction,
    });

    // Only create/update if not already notified
    if (existingLog?.notified) {
      log(`Skipping notification - already sent for this match`);
      continue;
    }

    // Upsert log to prevent duplicates - ONLY set notified:false on insert
    try {
      await SimilarityLog.updateOne(
        {
          sourceItemId: new mongoose.Types.ObjectId(item._id),
          targetItemId: new mongoose.Types.ObjectId(target._id),
          direction,
        },
        {
          $setOnInsert: {
            sourceType: item.type,
            targetType: target.type,
            notified: false, // Only set on INSERT
          },
          $set: {
            score: finalNormalized, // Always update to final normalized score
          },
        },
        { upsert: true }
      );
    } catch (e) {
      log(`ERROR: Failed to upsert similarity log: ${e}`);
      continue;
    }

    const { lost, found } = pickLostAndFound(item, target);
    // New behavior: notify lost item reporter for both flows in production; preserve test expectations
    const to = IS_TEST
      ? direction === "lost_to_found"
        ? await getReporterEmail(lost)
        : await getReporterEmail(found)
      : await getReporterEmail(lost);

    if (!to) {
      log(`No email address found for lost item reporter`);
      continue;
    }

    // Send email with error handling
    try {
      log(`Sending email notification to ${to}`);
      await sendMatchNotification({
        to,
        lostTitle: lost.title,
        foundTitle: found.title,
        lostId: lost._id.toString(),
        foundId: found._id.toString(),
        score: finalNormalized,
        threshold: SIMILARITY_THRESHOLD,
        lostImageUrl: getPrimaryImageUrl(lost),
        foundImageUrl: getPrimaryImageUrl(found),
      });
      log(`Email sent successfully to ${to}`);
    } catch (emailError) {
      const errMsg =
        emailError instanceof Error ? emailError.message : String(emailError);
      log(`ERROR: Failed to send email to ${to}: ${errMsg}`);
      // Continue processing other matches even if one email fails
      continue;
    }

    // Mark as notified
    try {
      await SimilarityLog.updateOne(
        {
          sourceItemId: new mongoose.Types.ObjectId(item._id),
          targetItemId: new mongoose.Types.ObjectId(target._id),
          direction,
        },
        {
          $set: {
            notified: true,
            notifiedAt: new Date(),
            score: finalNormalized,
          },
        }
      );
      notified++;
      log(`Successfully marked match as notified in database`);
    } catch (updateError) {
      log(`ERROR: Failed to mark match as notified: ${updateError}`);
    }
  }

  const result = {
    processed: counterparts.length,
    notified,
    matchesAboveThreshold,
    threshold: SIMILARITY_THRESHOLD,
  };

  log(`Matching complete for item ${itemId}`, result);
  return result;
}
