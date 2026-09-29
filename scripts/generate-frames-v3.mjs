#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const N = 190;
const SIZE = 1080;
const outDir = path.join(process.cwd(), "public", "frames");
fs.mkdirSync(outDir, { recursive: true });

function gazeForIndex(i) {
  if (i === 0) return { x: 0, y: 0 };
  const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

console.log(`Generating ${N} frames with basic ImageMagick...`);
const start = Date.now();

for (let i = 0; i < N; i++) {
  const gaze = gazeForIndex(i);
  const file = path.join(outDir, `frame-${String(i).padStart(3, "0")}.webp`);

  const headShiftX = gaze.x * 32;
  const headShiftY = gaze.y * 22;
  const pupilShiftX = gaze.x * 20;
  const pupilShiftY = gaze.y * 16;

  const cx = SIZE / 2 + headShiftX;
  const cy = SIZE / 2 + headShiftY - 20;

  const fur = "#D9C5A5";
  const furDark = "#B8A082";
  const faceLight = "#E8DCC6";
  const earInner = "#C9A68A";
  const eyeWhite = "#FAF9F6";
  const pupil = "#0F0F0F";
  const nose = "#8B7355";
  const mouth = "#5A4A3A";

  // Use single convert command with parentheses for layers? Simpler: sequential draws
  // Build a command that draws everything

  // For IM6, syntax: -fill color -draw "ellipse ..."
  // Use integers to avoid float issues? Floats ok.

  const cmds = [
    `-size ${SIZE}x${SIZE} xc:transparent`,

    // shadow
    `-fill "rgba(0,0,0,0.22)" -draw "ellipse ${SIZE/2},${SIZE*0.78} ${SIZE*0.18},${SIZE*0.04} 0,360"`,

    // ears outer
    `-fill "${furDark}" -stroke "${furDark}"`,
    `-draw "ellipse ${cx - SIZE*0.22},${cy - SIZE*0.05} ${SIZE*0.09},${SIZE*0.11} 0,360"`,
    `-draw "ellipse ${cx + SIZE*0.22},${cy - SIZE*0.05} ${SIZE*0.09},${SIZE*0.11} 0,360"`,

    // ears inner
    `-fill "${earInner}"`,
    `-draw "ellipse ${cx - SIZE*0.22},${cy - SIZE*0.05} ${SIZE*0.05},${SIZE*0.065} 0,360"`,
    `-draw "ellipse ${cx + SIZE*0.22},${cy - SIZE*0.05} ${SIZE*0.05},${SIZE*0.065} 0,360"`,

    // head base
    `-fill "${faceLight}" -stroke "${furDark}" -strokewidth 4`,
    `-draw "ellipse ${cx},${cy} ${SIZE*0.26},${SIZE*0.28} 0,360"`,

    // fur top - darker
    `-fill "${furDark}" -stroke none`,
    `-draw "ellipse ${cx},${cy - SIZE*0.18} ${SIZE*0.24},${SIZE*0.16} 0,360"`,

    // muzzle
    `-fill "${faceLight}" -stroke "${furDark}" -strokewidth 2`,
    `-draw "ellipse ${cx},${cy + SIZE*0.08} ${SIZE*0.16},${SIZE*0.13} 0,360"`,

    // eye whites
    `-fill "${eyeWhite}" -stroke "${furDark}" -strokewidth 2`,
    `-draw "ellipse ${cx - SIZE*0.09},${cy - SIZE*0.02} ${SIZE*0.075},${SIZE*0.068} 0,360"`,
    `-draw "ellipse ${cx + SIZE*0.09},${cy - SIZE*0.02} ${SIZE*0.075},${SIZE*0.068} 0,360"`,

    // pupils
    `-fill "${pupil}" -stroke none`,
    `-draw "circle ${cx - SIZE*0.09 + pupilShiftX},${cy - SIZE*0.02 + pupilShiftY} ${cx - SIZE*0.09 + pupilShiftX + SIZE*0.028},${cy - SIZE*0.02 + pupilShiftY}"`,
    `-draw "circle ${cx + SIZE*0.09 + pupilShiftX},${cy - SIZE*0.02 + pupilShiftY} ${cx + SIZE*0.09 + pupilShiftX + SIZE*0.028},${cy - SIZE*0.02 + pupilShiftY}"`,

    // highlights
    `-fill white`,
    `-draw "circle ${cx - SIZE*0.09 + pupilShiftX + SIZE*0.01},${cy - SIZE*0.02 + pupilShiftY - SIZE*0.01} ${cx - SIZE*0.09 + pupilShiftX + SIZE*0.01 + SIZE*0.008},${cy - SIZE*0.02 + pupilShiftY - SIZE*0.01}"`,
    `-draw "circle ${cx + SIZE*0.09 + pupilShiftX + SIZE*0.01},${cy - SIZE*0.02 + pupilShiftY - SIZE*0.01} ${cx + SIZE*0.09 + pupilShiftX + SIZE*0.01 + SIZE*0.008},${cy - SIZE*0.02 + pupilShiftY - SIZE*0.01}"`,

    // nose
    `-fill "${nose}" -stroke none`,
    `-draw "ellipse ${cx},${cy + SIZE*0.04} ${SIZE*0.018},${SIZE*0.014} 0,360"`,

    // mouth - two small lines forming sulk
    `-fill none -stroke "${mouth}" -strokewidth 8`,
    `-draw "line ${cx - SIZE*0.06},${cy + SIZE*0.13} ${cx},${cy + SIZE*0.11}"`,
    `-draw "line ${cx},${cy + SIZE*0.11} ${cx + SIZE*0.06},${cy + SIZE*0.13}"`,

    // eyebrows - simple lines
    `-strokewidth 10`,
    `-draw "line ${cx - SIZE*0.15},${cy - SIZE*0.09} ${cx - SIZE*0.03},${cy - SIZE*0.085}"`,
    `-draw "line ${cx + SIZE*0.03},${cy - SIZE*0.085} ${cx + SIZE*0.15},${cy - SIZE*0.09}"`,

    `-quality 85 "${file}"`
  ];

  const cmd = `convert ${cmds.join(" ")}`;

  try {
    execSync(cmd, { stdio: "pipe" });
  } catch (e) {
    console.error(`Failed frame ${i}`);
    console.error(e.stderr?.toString().slice(0,500));
    console.error(cmd.slice(0,800));
    process.exit(1);
  }

  if (i % 30 === 0) console.log(`  ${i}/${N} (${((Date.now()-start)/1000).toFixed(1)}s)`);
}

console.log(`Done ${N} frames in ${((Date.now()-start)/1000).toFixed(1)}s`);
