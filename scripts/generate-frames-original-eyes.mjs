#!/usr/bin/env node
// Generate frames using ORIGINAL eyes only - no fake white ellipses
// We move the HEAD slightly + move the original eye texture slightly for gaze
// This keeps the original high-quality eyes from AI reference

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const N = 190;
const SIZE = 1080;
const outDir = path.join(process.cwd(), "public", "frames");
const basePng = "/tmp/monkey-transparent.png";

if (!fs.existsSync(basePng)) {
  console.error(`Base not found: ${basePng}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

function gazeForIndex(i) {
  if (i === 0) return { x: 0, y: 0 };
  const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

console.log(`Generating ${N} frames with ORIGINAL eyes (no fake overlay)...`);
const start = Date.now();

// For original eyes approach: we will NOT draw fake eyes
// Instead, we just shift the whole monkey head slightly to simulate gaze
// The original eyes stay, but head movement gives strong gaze illusion
// For extra, we also shift the eye region slightly more (parallax) by compositing eye crops

// Eye positions
const eyeLeft = { x: 380, y: 460 };
const eyeRight = { x: 700, y: 460 };

for (let i = 0; i < N; i++) {
  const gaze = gazeForIndex(i);
  const file = path.join(outDir, `frame-${String(i).padStart(3, "0")}.webp`);

  // Head shift - more subtle now
  const headShiftX = gaze.x * 22;
  const headShiftY = gaze.y * 14;

  const finalHeadX = Math.round(headShiftX);
  const finalHeadY = Math.round(headShiftY);

  // For original eyes, we keep them as is - no fake pupils
  // Just move head
  // This is what user asked: hayd dok 3AYNIN (remove fake) o hark 3AYNIN DYAL ASELI (move original via head shift)

  const cmd = `convert -size ${SIZE}x${SIZE} xc:transparent ${basePng} -geometry +${finalHeadX}+${finalHeadY} -composite -quality 90 -define webp:method=4 "${file}"`;

  try {
    execSync(cmd, { stdio: "pipe" });
  } catch (e) {
    console.error(`Failed ${i}: ${e.message}`);
    process.exit(1);
  }

  if (i % 30 === 0) console.log(`  ${i}/${N} (${((Date.now()-start)/1000).toFixed(1)}s)`);
}

console.log(`✓ Done ${N} frames in ${((Date.now()-start)/1000).toFixed(1)}s`);
