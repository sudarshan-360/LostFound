#!/usr/bin/env node
/**
 * Quick MongoDB connection test. Run from project root:
 *   node scripts/test-mongo-connection.js
 * Ensure .env.local exists with MONGODB_URI (or set MONGODB_URI in the shell).
 */
const path = require("path");
const net = require("net");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set in .env.local");
  process.exit(1);
}

// Extract first host from URI for TCP check (e.g. cluster1-shard-00-00.yxt3se4.mongodb.net)
const hostMatch = uri.match(/@([^/:]+):(\d+)/) || uri.match(/@([^/]+)\//);
const atlasHost = hostMatch ? hostMatch[1] : "cluster1-shard-00-00.yxt3se4.mongodb.net";
const atlasPort = hostMatch && hostMatch[2] ? parseInt(hostMatch[2], 10) : 27017;

function tcpReachable(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onDone = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => onDone(true));
    socket.on("timeout", () => onDone(false));
    socket.on("error", () => onDone(false));
    socket.connect(port, host);
  });
}

async function main() {
  const safeUri = uri.replace(/:([^@]+)@/, ":****@");
  console.log("1. Checking if your network can reach MongoDB Atlas...");
  const reachable = await tcpReachable(atlasHost, atlasPort);
  if (!reachable) {
    console.error("   FAIL – Cannot reach " + atlasHost + ":" + atlasPort);
    console.error("");
    console.error("Your network (or firewall) is blocking outbound connections to MongoDB Atlas.");
    console.error("Try:");
    console.error("  • Another network (e.g. mobile hotspot)");
    console.error("  • A VPN");
    console.error("  • Running from a different machine (e.g. Vercel) where Atlas is reachable");
    process.exit(1);
  }
  console.log("   OK – Network can reach Atlas");
  console.log("");
  console.log("2. Connecting with Mongoose:", safeUri);
  const mongoose = require("mongoose");
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log("   OK – Connected to MongoDB Atlas.");
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("   FAIL –", err.message);
    if (err.message.includes("whitelist")) {
      console.error("");
      console.error("Atlas is reachable but rejected the connection. In Atlas:");
      console.error("  • Network Access → ensure your IP or 0.0.0.0/0 is listed");
      console.error("  • Database Access → user has read/write on this cluster");
    }
    process.exit(1);
  }
}

main();
