#!/usr/bin/env -S deno run -A

// Simple test to check if dnt is accessible
try {
  console.log("Testing dnt import...");
  const { build } = await import("https://deno.land/x/dnt@0.40.0/mod.ts");
  console.log("✅ dnt imported successfully");
  console.log("Build function type:", typeof build);
} catch (error) {
  console.error("❌ Failed to import dnt:", error.message);
}