#!/usr/bin/env node
/**
 * generate-frames.mjs
 * 
 * Generates 190 placeholder WebP frames in /public/frames/
 * Uses ImageMagick `convert` (available in this environment) to draw a
 * sulking monkey that looks in different directions.
 * 
 * Each frame:
 * - 1080x1080, transparent background, WebP
 * - Character centered, head slightly shifted by gaze vector to simulate turn
 * - Eyes with pupils offset by gaze vector
 * - Sulking mouth
 * 
 * This is a PLACEHOLDER for real 3D renders.
 * Replace these with your own renders: frame-000.webp ... frame-189.webp
 * Keep naming: zero-padded 3 digits.
 * 
 * Real workflow:
 * 1. Render your character in Blender / C4D looking around full circle
 * 2. Export frames as WebP 1080px long side
 * 3. Overwrite /public/frames/
 * 4. Regenerate frames.json with real gaze vectors
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const N = 190;
const SIZE = 1080;
const outDir = path.join(process.cwd(), "public", "frames");

fs.mkdirSync(outDir, { recursive: true });

// Precompute gaze map same as frames.json
function gazeForIndex(i) {
  if (i === 0) return { x: 0, y: 0 };
  const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

console.log(`Generating ${N} placeholder frames in ${outDir}...`);
console.log(`Using ImageMagick convert, size ${SIZE}x${SIZE} WebP`);

const start = Date.now();

for (let i = 0; i < N; i++) {
  const gaze = gazeForIndex(i);
  const file = path.join(outDir, `frame-${String(i).padStart(3, "0")}.webp`);

  // Skip if already exists and newer than script? For speed, check existence
  // But we want to regenerate all for consistency, so skip check unless --skip-existing
  if (process.argv.includes("--skip-existing") && fs.existsSync(file)) {
    continue;
  }

  // Compute offsets for head turn illusion
  const headShiftX = gaze.x * 28;
  const headShiftY = gaze.y * 20;
  const pupilShiftX = gaze.x * 18;
  const pupilShiftY = gaze.y * 14;
  const eyeSquint = Math.abs(gaze.x) * 2; // slight squint when looking side

  // Monkey colors
  const fur = "#D9C5A5"; // light fur
  const furDark = "#B8A082";
  const faceLight = "#E8DCC6";
  const earInner = "#C9A68A";
  const eyeWhite = "#FAF9F6";
  const pupil = "#0F0F0F";
  const nose = "#8B7355";
  const mouth = "#5A4A3A";

  // Center
  const cx = SIZE / 2 + headShiftX;
  const cy = SIZE / 2 + headShiftY - 20;

  // We will build a convert command with multiple draw operations
  // Using xc:transparent background
  // To keep quality, draw at high res then resize? We are already at 1080

  // Build draw commands
  // Note: ImageMagick coordinate system: 0,0 top-left
  // We'll use -fill and -draw

  // For simplicity, generate SVG first then convert to WebP? But we can use convert directly
  // Let's use a more readable approach: create an SVG string and convert it

  const svg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="faceGrad" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${faceLight}" />
      <stop offset="100%" stop-color="${fur}" />
    </radialGradient>
    <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.25)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0)" />
    </radialGradient>
  </defs>

  <!-- Shadow -->
  <ellipse cx="${SIZE/2}" cy="${SIZE*0.78}" rx="${SIZE*0.18}" ry="${SIZE*0.04}" fill="rgba(0,0,0,0.18)" />

  <!-- Ears -->
  <ellipse cx="${cx - SIZE*0.22}" cy="${cy - SIZE*0.05}" rx="${SIZE*0.09}" ry="${SIZE*0.11}" fill="${furDark}" />
  <ellipse cx="${cx + SIZE*0.22}" cy="${cy - SIZE*0.05}" rx="${SIZE*0.09}" ry="${SIZE*0.11}" fill="${furDark}" />
  <ellipse cx="${cx - SIZE*0.22}" cy="${cy - SIZE*0.05}" rx="${SIZE*0.05}" ry="${SIZE*0.065}" fill="${earInner}" />
  <ellipse cx="${cx + SIZE*0.22}" cy="${cy - SIZE*0.05}" rx="${SIZE*0.05}" ry="${SIZE*0.065}" fill="${earInner}" />

  <!-- Head base -->
  <ellipse cx="${cx}" cy="${cy}" rx="${SIZE*0.26}" ry="${SIZE*0.28}" fill="url(#faceGrad)" stroke="${furDark}" stroke-width="${SIZE*0.004}" />

  <!-- Fur top / 3D volume hint -->
  <path d="M ${cx - SIZE*0.26} ${cy - SIZE*0.08} Q ${cx} ${cy - SIZE*0.32} ${cx + SIZE*0.26} ${cy - SIZE*0.08} Q ${cx + SIZE*0.18} ${cy - SIZE*0.18} ${cx} ${cy - SIZE*0.22} Q ${cx - SIZE*0.18} ${cy - SIZE*0.18} ${cx - SIZE*0.26} ${cy - SIZE*0.08} Z" fill="${furDark}" opacity="0.9" />

  <!-- Muzzle area lighter -->
  <ellipse cx="${cx}" cy="${cy + SIZE*0.08}" rx="${SIZE*0.16}" ry="${SIZE*0.13}" fill="${faceLight}" />

  <!-- Eyes background -->
  <ellipse cx="${cx - SIZE*0.09}" cy="${cy - SIZE*0.02}" rx="${SIZE*0.075}" ry="${SIZE*0.068}" fill="${eyeWhite}" stroke="${furDark}" stroke-width="${SIZE*0.003}" />
  <ellipse cx="${cx + SIZE*0.09}" cy="${cy - SIZE*0.02}" rx="${SIZE*0.075}" ry="${SIZE*0.068}" fill="${eyeWhite}" stroke="${furDark}" stroke-width="${SIZE*0.003}" />

  <!-- Eyebrows - sulking, angled based on gaze -->
  <path d="M ${cx - SIZE*0.15} ${cy - SIZE*0.09 + gaze.y*4} Q ${cx - SIZE*0.09} ${cy - SIZE*0.11 + gaze.y*2} ${cx - SIZE*0.03} ${cy - SIZE*0.085}" stroke="${furDark}" stroke-width="${SIZE*0.012}" stroke-linecap="round" fill="none" />
  <path d="M ${cx + SIZE*0.03} ${cy - SIZE*0.085} Q ${cx + SIZE*0.09} ${cy - SIZE*0.11 + gaze.y*2} ${cx + SIZE*0.15} ${cy - SIZE*0.09 + gaze.y*4}" stroke="${furDark}" stroke-width="${SIZE*0.012}" stroke-linecap="round" fill="none" />

  <!-- Pupils - offset by gaze -->
  <circle cx="${cx - SIZE*0.09 + pupilShiftX}" cy="${cy - SIZE*0.02 + pupilShiftY}" r="${SIZE*0.028}" fill="${pupil}" />
  <circle cx="${cx + SIZE*0.09 + pupilShiftX}" cy="${cy - SIZE*0.02 + pupilShiftY}" r="${SIZE*0.028}" fill="${pupil}" />
  <!-- Pupil highlight -->
  <circle cx="${cx - SIZE*0.09 + pupilShiftX + SIZE*0.01}" cy="${cy - SIZE*0.02 + pupilShiftY - SIZE*0.01}" r="${SIZE*0.008}" fill="white" opacity="0.9" />
  <circle cx="${cx + SIZE*0.09 + pupilShiftX + SIZE*0.01}" cy="${cy - SIZE*0.02 + pupilShiftY - SIZE*0.01}" r="${SIZE*0.008}" fill="white" opacity="0.9" />

  <!-- Nose -->
  <ellipse cx="${cx}" cy="${cy + SIZE*0.04}" rx="${SIZE*0.018}" ry="${SIZE*0.014}" fill="${nose}" />
  <ellipse cx="${cx - SIZE*0.012}" cy="${cy + SIZE*0.042}" rx="${SIZE*0.004}" ry="${SIZE*0.003}" fill="#3A2F25" opacity="0.8" />
  <ellipse cx="${cx + SIZE*0.012}" cy="${cy + SIZE*0.042}" rx="${SIZE*0.004}" ry="${SIZE*0.003}" fill="#3A2F25" opacity="0.8" />

  <!-- Mouth - sulking -->
  <path d="M ${cx - SIZE*0.06} ${cy + SIZE*0.13} Q ${cx} ${cy + SIZE*0.11} ${cx + SIZE*0.06} ${cy + SIZE*0.13}" stroke="${mouth}" stroke-width="${SIZE*0.008}" stroke-linecap="round" fill="none" />
  <!-- Chin shadow -->
  <ellipse cx="${cx}" cy="${cy + SIZE*0.20}" rx="${SIZE*0.06}" ry="${SIZE*0.015}" fill="${furDark}" opacity="0.3" />

  <!-- Direction indicator for debug (small arrow at bottom, shows gaze) -->
  <!-- Removed for production, but keep as comment for debugging -->
  <!-- <circle cx="${SIZE/2 + gaze.x*40}" cy="${SIZE*0.88 + gaze.y*40}" r="4" fill="#FFD93D" /> -->
</svg>`.trim();

  const tmpSvg = path.join(outDir, `_tmp_${i}.svg`);
  fs.writeFileSync(tmpSvg, svg, "utf-8");

  try {
    // Convert SVG to WebP using ImageMagick
    // Use -background transparent, -density 150 for crisp, resize to 1080
    execSync(
      `convert -background transparent -density 200 "${tmpSvg}" -resize ${SIZE}x${SIZE} -quality 85 -define webp:method=4 "${file}"`,
      { stdio: "pipe" }
    );
  } catch (err) {
    console.error(`Failed to convert frame ${i}:`, err.message);
    // Fallback: try with rsvg or just copy svg as webp placeholder? Create empty webp via convert xc:transparent
    try {
      execSync(
        `convert -size ${SIZE}x${SIZE} xc:transparent -fill "${faceLight}" -draw "circle ${cx},${cy} ${cx + SIZE*0.2},${cy}" "${file}"`,
        { stdio: "pipe" }
      );
    } catch {}
  } finally {
    try {
      fs.unlinkSync(tmpSvg);
    } catch {}
  }

  if (i % 20 === 0) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ${i}/${N} frames (${elapsed}s)`);
  }
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`✓ Done ${N} frames in ${elapsed}s`);
console.log(`  Total size: ${(fs.readdirSync(outDir).reduce((acc, f) => { try { return acc + fs.statSync(path.join(outDir, f)).size; } catch { return acc; } }, 0) / 1024 / 1024).toFixed(2)} MB`);
