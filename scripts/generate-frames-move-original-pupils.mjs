#!/usr/bin/env node
// Move ORIGINAL pupils (not fake) - keep original eye texture
// Steps:
// 1. Crop original pupils from reference
// 2. For each frame, place base at head shift
// 3. Cover old pupil positions with eye white (sampled)
// 4. Composite original pupil crops at new gaze-shifted positions

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const N = 190;
const SIZE = 1080;
const outDir = path.join(process.cwd(), "public", "frames");
const basePng = "/tmp/monkey-transparent.png";

fs.mkdirSync(outDir, { recursive: true });

function gazeForIndex(i) {
  if (i === 0) return { x: 0, y: 0 };
  const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

// Eye positions in 1080 image
const eyeLeft = { x: 380, y: 460 };
const eyeRight = { x: 700, y: 460 };
const pupilSize = 50; // crop size
const eyeWhite = "#E8E0D8";

console.log("Preparing pupil crops from original...");

// Crop pupils from base
const leftPupilCrop = "/tmp/pupil-left.png";
const rightPupilCrop = "/tmp/pupil-right.png";

try {
  // Crop left pupil - centered at eye position
  execSync(`convert ${basePng} -crop ${pupilSize}x${pupilSize}+${eyeLeft.x - pupilSize/2}+${eyeLeft.y - pupilSize/2} +repage -resize 50x50 ${leftPupilCrop}`, { stdio: "pipe" });
  execSync(`convert ${basePng} -crop ${pupilSize}x${pupilSize}+${eyeRight.x - pupilSize/2}+${eyeRight.y - pupilSize/2} +repage -resize 50x50 ${rightPupilCrop}`, { stdio: "pipe" });
  console.log("✓ Pupil crops ready");
} catch (e) {
  console.error("Failed to crop pupils", e.message);
  process.exit(1);
}

console.log(`Generating ${N} frames moving ORIGINAL pupils...`);
const start = Date.now();

for (let i = 0; i < N; i++) {
  const gaze = gazeForIndex(i);
  const file = path.join(outDir, `frame-${String(i).padStart(3, "0")}.webp`);

  const headShiftX = gaze.x * 20;
  const headShiftY = gaze.y * 12;
  const pupilShiftX = gaze.x * 14;
  const pupilShiftY = gaze.y * 10;

  const finalHeadX = Math.round(headShiftX);
  const finalHeadY = Math.round(headShiftY);
  const finalPupilX = Math.round(pupilShiftX);
  const finalPupilY = Math.round(pupilShiftY);

  const eyeLeftX = eyeLeft.x + finalHeadX;
  const eyeLeftY = eyeLeft.y + finalHeadY;
  const eyeRightX = eyeRight.x + finalHeadX;
  const eyeRightY = eyeRight.y + finalHeadY;

  const pupilLeftX = eyeLeftX + finalPupilX;
  const pupilLeftY = eyeLeftY + finalPupilY;
  const pupilRightX = eyeRightX + finalPupilX;
  const pupilRightY = eyeRightY + finalPupilY;

  // For neutral, just use base without pupil move
  if (i === 0) {
    const cmdNeutral = `convert -size ${SIZE}x${SIZE} xc:transparent ${basePng} -geometry +0+0 -composite -quality 90 -define webp:method=4 "${file}"`;
    execSync(cmdNeutral, { stdio: "pipe" });
  } else {
    // For others: base at head shift, then cover old pupil positions with eye white, then place original pupils at new positions
    const cmd = `convert -size ${SIZE}x${SIZE} xc:transparent ${basePng} -geometry +${finalHeadX}+${finalHeadY} -composite -fill "${eyeWhite}" -draw "ellipse ${eyeLeftX},${eyeLeftY} 28,22 0,360" -fill "${eyeWhite}" -draw "ellipse ${eyeRightX},${eyeRightY} 28,22 0,360" ${leftPupilCrop} -geometry +${pupilLeftX - pupilSize/2}+${pupilLeftY - pupilSize/2} -composite ${rightPupilCrop} -geometry +${pupilRightX - pupilSize/2}+${pupilRightY - pupilSize/2} -composite -quality 90 -define webp:method=4 "${file}"`;
    try {
      execSync(cmd, { stdio: "pipe" });
    } catch (e) {
      console.error(`Failed ${i}: ${e.message}`);
      console.error(e.stderr?.toString().slice(0,1000));
      process.exit(1);
    }
  }

  if (i % 30 === 0) console.log(`  ${i}/${N} (${((Date.now()-start)/1000).toFixed(1)}s)`);
}

console.log(`✓ Done ${N} frames`);
