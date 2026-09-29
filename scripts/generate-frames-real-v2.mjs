#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const N = 190;
const SIZE = 1080;
const outDir = path.join(process.cwd(), "public", "frames");
const basePng = "/tmp/monkey-transparent.png";

if (!fs.existsSync(basePng)) {
  console.error(`Base PNG not found: ${basePng}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

function gazeForIndex(i) {
  if (i === 0) return { x: 0, y: 0 };
  const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

console.log(`Generating ${N} realistic frames from reference monkey...`);
const start = Date.now();

const eyeLeft = { x: 380, y: 460 };
const eyeRight = { x: 700, y: 460 };
const eyeRx = 55;
const eyeRy = 42;
const pupilRadius = 25;
const highlightRadius = 8;
const eyeWhite = "#EDE8E3";

for (let i = 0; i < N; i++) {
  const gaze = gazeForIndex(i);
  const file = path.join(outDir, `frame-${String(i).padStart(3, "0")}.webp`);

  const headShiftX = gaze.x * 18;
  const headShiftY = gaze.y * 12;
  const pupilShiftX = gaze.x * 22;
  const pupilShiftY = gaze.y * 16;

  const isNeutral = i === 0;
  const finalHeadX = isNeutral ? 0 : Math.round(headShiftX);
  const finalHeadY = isNeutral ? 0 : Math.round(headShiftY);
  const finalPupilX = isNeutral ? 0 : Math.round(pupilShiftX);
  const finalPupilY = isNeutral ? 0 : Math.round(pupilShiftY);

  const eyeLeftX = eyeLeft.x + finalHeadX;
  const eyeLeftY = eyeLeft.y + finalHeadY;
  const eyeRightX = eyeRight.x + finalHeadX;
  const eyeRightY = eyeRight.y + finalHeadY;

  const pupilLeftX = eyeLeftX + finalPupilX;
  const pupilLeftY = eyeLeftY + finalPupilY;
  const pupilRightX = eyeRightX + finalPupilX;
  const pupilRightY = eyeRightY + finalPupilY;

  // Build command without parentheses
  const cmd = `convert -size ${SIZE}x${SIZE} xc:transparent ${basePng} -geometry +${finalHeadX}+${finalHeadY} -composite -fill "${eyeWhite}" -draw "ellipse ${eyeLeftX},${eyeLeftY} ${eyeRx},${eyeRy} 0,360" -fill "${eyeWhite}" -draw "ellipse ${eyeRightX},${eyeRightY} ${eyeRx},${eyeRy} 0,360" -fill "#0F0F0F" -draw "circle ${pupilLeftX},${pupilLeftY} ${pupilLeftX + pupilRadius},${pupilLeftY}" -fill "#0F0F0F" -draw "circle ${pupilRightX},${pupilRightY} ${pupilRightX + pupilRadius},${pupilRightY}" -fill white -draw "circle ${pupilLeftX + 10},${pupilLeftY - 8} ${pupilLeftX + 10 + highlightRadius},${pupilLeftY - 8}" -fill white -draw "circle ${pupilRightX + 10},${pupilRightY - 8} ${pupilRightX + 10 + highlightRadius},${pupilRightY - 8}" -quality 85 -define webp:method=4 "${file}"`;

  try {
    execSync(cmd, { stdio: "pipe" });
  } catch (e) {
    console.error(`Failed frame ${i}: ${e.message}`);
    console.error(e.stderr?.toString().slice(0, 1000));
    process.exit(1);
  }

  if (i % 20 === 0) console.log(`  ${i}/${N} (${((Date.now()-start)/1000).toFixed(1)}s)`);
}

console.log(`✓ Done ${N} frames in ${((Date.now()-start)/1000).toFixed(1)}s`);
const total = fs.readdirSync(outDir).filter(f=>f.endsWith(".webp")).reduce((acc,f)=>acc+fs.statSync(path.join(outDir,f)).size,0);
console.log(`  Total size: ${(total/1024/1024).toFixed(2)} MB`);
