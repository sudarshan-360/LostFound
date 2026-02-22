import mongoose from "mongoose";
import dns from "dns";

// Prefer IPv4 to reduce DNS-related hiccups on restrictive networks
try {
  // Node >= 17
  // @ts-ignore
  if (typeof dns.setDefaultResultOrder === "function") {
    // @ts-ignore
    dns.setDefaultResultOrder("ipv4first");
  }
} catch {}

const isBuildPhase =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE === "phase-production-build";

/** Production-ready connection options for MongoDB Atlas */
const CONNECTION_OPTIONS: mongoose.ConnectOptions = {
  bufferCommands: false,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  w: "majority",
};

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: CachedConnection | undefined;
}

let cached: CachedConnection = globalThis.mongoose ?? { conn: null, promise: null };

if (process.env.NODE_ENV !== "production") {
  globalThis.mongoose = cached;
}

function getMongoUris(): { primary?: string; noSrv?: string; local?: string } {
  const primary = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim() || undefined;
  const noSrv = (process.env.MONGODB_URI_NOSRV || process.env.MONGO_URI_NOSRV || "").trim() || undefined;
  const explicitLocal = (process.env.MONGODB_URI_LOCAL || process.env.MONGO_URI_LOCAL || "").trim() || undefined;
  const defaultLocal = process.env.NODE_ENV !== "production" ? "mongodb://127.0.0.1:27017/lostfound_dev" : undefined;
  const local = explicitLocal || defaultLocal;
  return { primary, noSrv, local };
}

let connectionEventsSetup = false;

function setupConnectionEvents(): void {
  if (connectionEventsSetup) return;
  connectionEventsSetup = true;

  mongoose.connection.on("connected", () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[MongoDB] Connected");
    }
  });

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    cached.conn = null;
    cached.promise = null;
    if (process.env.NODE_ENV !== "production") {
      console.warn("[MongoDB] Disconnected – next request will reconnect");
    }
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log(`[MongoDB] Connection closed on ${signal}`);
      }
    } catch (e) {
      console.error("[MongoDB] Error during shutdown:", (e as Error).message);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

function isSrvResolutionError(err: unknown): boolean {
  const msg = (err as any)?.message || "";
  return /querySrv|ENOTFOUND|EAI_AGAIN/i.test(msg);
}

function isServerSelectionError(err: unknown): boolean {
  const msg = (err as any)?.message || "";
  return /Could not connect to any servers|server selection/i.test(msg);
}

/**
 * Connect to MongoDB with SRV -> non-SRV -> local fallback.
 */
async function connectDB(): Promise<typeof mongoose | null> {
  if (isBuildPhase) {
    console.warn("[MongoDB] Skipping connection during build");
    return null;
  }

  const { primary, noSrv, local } = getMongoUris();
  if (!primary && !noSrv && !local) {
    throw new Error(
      "No MongoDB URI found. Provide MONGODB_URI/MONGO_URI, MONGODB_URI_NOSRV/MONGO_URI_NOSRV, or MONGODB_URI_LOCAL/MONGO_URI_LOCAL in .env.local or your deployment environment."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  const tryConnect = async (uri: string) => mongoose.connect(uri, CONNECTION_OPTIONS);

  if (!cached.promise) {
    cached.promise = (async () => {
      // 1) Try SRV
      if (primary) {
        try {
          const conn = await tryConnect(primary);
          setupConnectionEvents();
          return conn;
        } catch (err) {
          console.error("[MongoDB] Primary connection failed:", (err as Error).message);
          if (noSrv && (isSrvResolutionError(err) || isServerSelectionError(err))) {
            console.warn("[MongoDB] Attempting non-SRV fallback...");
            try {
              const conn = await tryConnect(noSrv);
              setupConnectionEvents();
              return conn;
            } catch (err2) {
              console.error("[MongoDB] Non-SRV fallback failed:", (err2 as Error).message);
              if (local) {
                console.warn("[MongoDB] Attempting local fallback...");
                const conn = await tryConnect(local);
                setupConnectionEvents();
                return conn;
              }
              throw err2;
            }
          }
          // If no non-SRV or not a DNS/selection error, try local if provided
          if (local) {
            console.warn("[MongoDB] Attempting local fallback...");
            const conn = await tryConnect(local);
            setupConnectionEvents();
            return conn;
          }
          throw err;
        }
      }

      // 2) No SRV – try non-SRV
      if (noSrv) {
        try {
          const conn = await tryConnect(noSrv);
          setupConnectionEvents();
          return conn;
        } catch (err) {
          console.error("[MongoDB] Non-SRV connection failed:", (err as Error).message);
          if (local) {
            console.warn("[MongoDB] Attempting local fallback...");
            const conn = await tryConnect(local);
            setupConnectionEvents();
            return conn;
          }
          throw err;
        }
      }

      // 3) Only local
      const conn = await tryConnect(local!);
      setupConnectionEvents();
      return conn;
    })()
      .then((conn) => {
        cached.conn = conn;
        return conn;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

export default connectDB;
