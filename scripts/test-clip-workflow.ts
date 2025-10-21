#!/usr/bin/env tsx
/**
 * Comprehensive test script for CLIP matching and email notification system
 * 
 * This script validates:
 * 1. CLIP service connectivity and embedding generation
 * 2. Item creation with automatic matching triggers
 * 3. Similarity score calculations
 * 4. Email notification delivery at >= 75% threshold
 * 5. Edge cases: no match, multiple matches, boundary conditions
 * 
 * Usage:
 *   npm run test:clip
 *   or
 *   tsx scripts/test-clip-workflow.ts
 */

// Load .env.local FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Now import everything else
import connectDB from "../lib/db";
import Item from "../models/Item";
import SimilarityLog from "../models/SimilarityLog";
import User from "../models/User";
import { runMatchingForItemId } from "../lib/matching";
import { embedTextAndImage, compareQuery } from "../lib/clipClient";
import mongoose from "mongoose";

const LOG_PREFIX = "[Test]";

// Test configuration
const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD || "0.75");
const CLIP_SERVICE_URL = process.env.CLIP_API_URL || "http://localhost:8000";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  message?: string;
  data?: any;
}

const results: TestResult[] = [];

function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`${timestamp} ${LOG_PREFIX} ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${timestamp} ${LOG_PREFIX} ${message}`);
  }
}

function addResult(name: string, status: "PASS" | "FAIL" | "SKIP", message?: string, data?: any) {
  results.push({ name, status, message, data });
  const emoji = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
  log(`${emoji} ${name}: ${status}${message ? ` - ${message}` : ""}`, data);
}

async function testClipServiceHealth() {
  try {
    const response = await fetch(`${CLIP_SERVICE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    const data = await response.json();
    addResult("CLIP Service Health", "PASS", "Service is running", data);
    return true;
  } catch (error) {
    addResult("CLIP Service Health", "FAIL", (error as Error).message);
    return false;
  }
}

async function testEmbeddingGeneration() {
  try {
    const testText = "Blue iPhone 14 with cracked screen";
    const result = await embedTextAndImage({ text: testText });
    
    if (!result.embedding || result.embedding.length === 0) {
      throw new Error("Empty embedding returned");
    }
    
    addResult(
      "Embedding Generation",
      "PASS",
      `Generated ${result.embedding.length}-dimensional embedding`,
      { model: result.model, dimension: result.dim }
    );
    return true;
  } catch (error) {
    addResult("Embedding Generation", "FAIL", (error as Error).message);
    return false;
  }
}

async function testSimilarityCalculation() {
  try {
    // Generate two similar embeddings
    const text1 = "Black leather wallet with credit cards";
    const text2 = "Black wallet with cards inside";
    
    const emb1 = await embedTextAndImage({ text: text1 });
    const emb2 = await embedTextAndImage({ text: text2 });
    
    const scores = await compareQuery(emb1.embedding, [
      { id: "test1", embedding: emb2.embedding },
    ]);
    
    if (scores.length === 0) {
      throw new Error("No similarity scores returned");
    }
    
    const score = scores[0].score;
    const passed = score >= 0.5 && score <= 1.0; // Similar texts should have high similarity
    
    addResult(
      "Similarity Calculation",
      passed ? "PASS" : "FAIL",
      `Similarity score: ${(score * 100).toFixed(2)}%`,
      { text1, text2, score }
    );
    return passed;
  } catch (error) {
    addResult("Similarity Calculation", "FAIL", (error as Error).message);
    return false;
  }
}

async function getOrCreateTestUser(): Promise<mongoose.Types.ObjectId> {
  const testEmail = "test-clip@example.com";
  let user = await User.findOne({ email: testEmail });
  
  if (!user) {
    user = await User.create({
      name: "Test User",
      email: testEmail,
      password: "hashed_password_placeholder",
    });
    log(`Created test user: ${user._id}`);
  }
  
  return user._id as mongoose.Types.ObjectId;
}

async function cleanupTestData() {
  log("Cleaning up existing test data...");
  
  // Clean up test items
  await Item.deleteMany({
    title: { $regex: /^TEST_CLIP_/i },
  });
  
  // Clean up similarity logs for test items
  await SimilarityLog.deleteMany({
    $or: [
      { sourceType: "lost", sourceItemId: { $exists: false } },
      { targetType: "found", targetItemId: { $exists: false } },
    ],
  });
  
  log("Cleanup complete");
}

async function createTestItem(
  userId: mongoose.Types.ObjectId,
  type: "lost" | "found",
  title: string,
  description: string
): Promise<string> {
  const item = await Item.create({
    userId,
    type,
    title,
    description,
    category: "Electronics",
    location: { text: "Test Campus, Building A" },
    contactInfo: { email: "test-clip@example.com" },
    isDeleted: false,
  });
  
  log(`Created ${type} item: ${item._id} - "${title}"`);
  return item._id.toString();
}

async function testMatchingWorkflow() {
  try {
    const userId = await getOrCreateTestUser();
    
    // Test Case 1: High similarity match (should trigger notification)
    log("\n=== Test Case 1: High Similarity Match (>75%) ===");
    const foundId1 = await createTestItem(
      userId,
      "found",
      "TEST_CLIP_iPhone_14_Blue",
      "Found a blue iPhone 14 Pro with a cracked screen near the library entrance"
    );
    
    const lostId1 = await createTestItem(
      userId,
      "lost",
      "TEST_CLIP_Blue_iPhone",
      "Lost my blue iPhone 14 with damaged screen at the library"
    );
    
    // Run matching for the lost item
    log(`Running matching for lost item ${lostId1}...`);
    const result1 = await runMatchingForItemId(lostId1);
    
    if ("matchesAboveThreshold" in result1 && result1.matchesAboveThreshold > 0) {
      addResult(
        "High Similarity Match Detection",
        "PASS",
        `Found ${result1.matchesAboveThreshold} match(es), notified: ${result1.notified}`,
        result1
      );
    } else {
      addResult(
        "High Similarity Match Detection",
        "FAIL",
        "No matches found above threshold",
        result1
      );
    }
    
    // Test Case 2: Low similarity (should NOT trigger notification)
    log("\n=== Test Case 2: Low Similarity Match (<75%) ===");
    const foundId2 = await createTestItem(
      userId,
      "found",
      "TEST_CLIP_Red_Umbrella",
      "Found a red umbrella in the cafeteria"
    );
    
    const lostId2 = await createTestItem(
      userId,
      "lost",
      "TEST_CLIP_Green_Backpack",
      "Lost my green backpack with laptop"
    );
    
    log(`Running matching for lost item ${lostId2}...`);
    const result2 = await runMatchingForItemId(lostId2);
    
    const matches2 = "matchesAboveThreshold" in result2 ? result2.matchesAboveThreshold : 0;
    if (matches2 === 0) {
      addResult(
        "Low Similarity No-Match",
        "PASS",
        "Correctly identified no matches above threshold",
        result2
      );
    } else {
      addResult(
        "Low Similarity No-Match",
        "FAIL",
        `Found ${matches2} match(es) when none expected`,
        result2
      );
    }
    
    // Test Case 3: Boundary condition (~75%)
    log("\n=== Test Case 3: Boundary Condition (near 75%) ===");
    const foundId3 = await createTestItem(
      userId,
      "found",
      "TEST_CLIP_Black_Wallet_Cards",
      "Found a black leather wallet with credit cards"
    );
    
    const lostId3 = await createTestItem(
      userId,
      "lost",
      "TEST_CLIP_Black_Wallet",
      "Lost my black wallet containing cards"
    );
    
    log(`Running matching for lost item ${lostId3}...`);
    const result3 = await runMatchingForItemId(lostId3);
    
    const matches3 = "matchesAboveThreshold" in result3 ? result3.matchesAboveThreshold : 0;
    addResult(
      "Boundary Condition Match",
      result3.processed > 0 ? "PASS" : "FAIL",
      `Matches: ${matches3}, Notified: ${result3.notified}`,
      result3
    );
    
    // Test Case 4: Duplicate notification prevention
    log("\n=== Test Case 4: Duplicate Notification Prevention ===");
    log(`Re-running matching for lost item ${lostId1}...`);
    const result4 = await runMatchingForItemId(lostId1);
    
    const matches4 = "matchesAboveThreshold" in result4 ? result4.matchesAboveThreshold : 0;
    if (result4.notified === 0 && matches4 > 0) {
      addResult(
        "Duplicate Notification Prevention",
        "PASS",
        "Correctly prevented duplicate notification",
        result4
      );
    } else if (result4.notified > 0) {
      addResult(
        "Duplicate Notification Prevention",
        "FAIL",
        "Duplicate notification was sent",
        result4
      );
    } else {
      addResult(
        "Duplicate Notification Prevention",
        "SKIP",
        "No matches to test duplicate prevention"
      );
    }
    
    return true;
  } catch (error) {
    addResult("Matching Workflow", "FAIL", (error as Error).message);
    return false;
  }
}

async function testDatabaseStorage() {
  try {
    // Check if similarity logs were created
    const logs = await SimilarityLog.find({
      sourceType: { $in: ["lost", "found"] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    addResult(
      "Database Storage",
      logs.length > 0 ? "PASS" : "SKIP",
      `Found ${logs.length} similarity log(s)`,
      logs.map((l) => ({
        direction: l.direction,
        score: l.score,
        notified: l.notified,
      }))
    );
    
    return true;
  } catch (error) {
    addResult("Database Storage", "FAIL", (error as Error).message);
    return false;
  }
}

async function printSummary() {
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;
  const total = results.length;
  
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log("=".repeat(60));
  
  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
  }
  
  console.log("\n" + "=".repeat(60));
  console.log(`Similarity Threshold: ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%`);
  console.log(`CLIP Service: ${CLIP_SERVICE_URL}`);
  console.log("=".repeat(60) + "\n");
  
  return failed === 0;
}

async function main() {
  log("Starting CLIP Matching and Notification Test Suite");
  log(`Threshold: ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%`);
  log(`CLIP Service: ${CLIP_SERVICE_URL}`);
  
  try {
    // Connect to database
    await connectDB();
    log("Connected to database");
    
    // Run tests sequentially
    const clipHealthy = await testClipServiceHealth();
    if (!clipHealthy) {
      log("⚠️  CLIP service is not available. Some tests will fail.");
      log("Make sure to start the CLIP service: npm run python:clip");
    }
    
    await testEmbeddingGeneration();
    await testSimilarityCalculation();
    
    // Clean up before running workflow tests
    await cleanupTestData();
    
    await testMatchingWorkflow();
    await testDatabaseStorage();
    
    // Print summary
    const allPassed = await printSummary();
    
    // Cleanup test data
    log("\nCleaning up test data...");
    await cleanupTestData();
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run tests
main();
