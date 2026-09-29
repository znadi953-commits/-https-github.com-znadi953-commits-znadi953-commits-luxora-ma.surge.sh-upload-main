#!/usr/bin/env node
/**
 * generate-frames-json.mjs
 * 
 * Generates frames.json - maps each frame index to a gaze direction unit vector {x,y}
 * x: -1 left to 1 right, y: -1 up to 1 down
 * 
 * PLACEHOLDER FORMULA (evenly spaced angles around a circle):
 *   angle = (i / N) * 2π
 *   x = cos(angle)
 *   y = sin(angle)
 *   neutral frame 0 = {x:0, y:0} looking straight
 * 
 * REPLACE THIS with real values from your 3D tool:
 * - In Blender, track your character's head bone rotation
 * - For each frame, compute where the character looks in screen space
 * - Normalize to unit vector and write to JSON
 * 
 * Example real data workflow:
 *   1. Render 190 frames where monkey looks around full 360°
 *   2. For each frame, manually or via script note gaze direction
 *   3. Replace array entries with measured {x,y}
 */

import fs from "fs";
import path from "path";

const N = 190;
const NEUTRAL = 0;
const outPath = path.join(process.cwd(), "public", "frames.json");

function generatePlaceholderMap() {
  const map = [];
  for (let i = 0; i < N; i++) {
    if (i === NEUTRAL) {
      // Neutral - looking straight ahead
      map.push({ x: 0, y: 0 });
      continue;
    }
    // Evenly spaced angles around full circle
    // We start at angle 0 = right, go clockwise
    // To make 0 = top (12 o'clock) feel more natural for look-around, offset by -PI/2
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    // Already unit length, but normalize to be safe
    const len = Math.hypot(x, y) || 1;
    map.push({
      x: Number((x / len).toFixed(4)),
      y: Number((y / len).toFixed(4)),
    });
  }
  return map;
}

const map = generatePlaceholderMap();

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(map, null, 2), "utf-8");

console.log(`✓ Generated ${outPath} with ${N} entries`);
console.log(`  Example: frame 0 =`, map[0]);
console.log(`  Example: frame 47 (≈ right) =`, map[47]);
console.log(`  Example: frame 95 (≈ down) =`, map[95]);
console.log(`  Example: frame 142 (≈ left) =`, map[142]);

// Also generate a version inside public/frames for convenience
const outPath2 = path.join(process.cwd(), "public", "frames", "frames.json");
fs.mkdirSync(path.dirname(outPath2), { recursive: true });
fs.writeFileSync(outPath2, JSON.stringify(map, null, 2), "utf-8");
console.log(`✓ Also wrote ${outPath2}`);
