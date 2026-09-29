/**
 * أداة تطوير: كاترندر الجمل في Node بلا متصفح (@napi-rs/canvas)
 * كاتستعمل نفس محرك الرسم `lib/jmal-draw.ts` — حتى الرسم ديل الموقع.
 *
 *   npm i --no-save @napi-rs/canvas
 *   node tools/render-preview.mjs out.png
 */
import { createCanvas } from '@napi-rs/canvas';
import { createDust, drawJmal } from '../lib/jmal-draw.ts';

const SIZE = 480;
const output = process.argv[2] ?? '/tmp/jmal-preview.png';

const dust = createDust(28);
// كنثبتو الرمل باش تكون النتيجة قابلة للإعادة
dust.forEach((p, i) => {
  p.x = (i * 97) % SIZE;
  p.y = (i * 53) % SIZE;
});

const scenes = [
  { label: 'centre (0, 0)', gaze: { x: 0, y: 0 }, steer: 0, tassel: 0 },
  { label: 'gauche (-0.9, 0.1)', gaze: { x: -0.9, y: 0.1 }, steer: -0.75, tassel: 0.22 },
  { label: 'droite (0.95, -0.4)', gaze: { x: 0.95, y: -0.4 }, steer: 0.9, tassel: -0.3 },
  {
    label: 'sommeil (Z)',
    gaze: { x: 0, y: 0.2 },
    steer: 0,
    tassel: 0.08,
    sleeping: true,
    blinkAmount: 1,
    zParticles: [
      { x: 300, y: 150, age: 0.15, drift: 0.2 },
      { x: 316, y: 150, age: 0.5, drift: -0.15 },
      { x: 296, y: 150, age: 0.8, drift: 0.1 },
    ],
  },
];

const COLS = 2;
const PAD = 12;
const sheet = createCanvas(COLS * SIZE + PAD * (COLS + 1), 2 * SIZE + PAD * 3);
const sctx = sheet.getContext('2d');
sctx.fillStyle = '#070a14';
sctx.fillRect(0, 0, sheet.width, sheet.height);

scenes.forEach((scene, i) => {
  const cell = createCanvas(SIZE, SIZE);
  const ctx = cell.getContext('2d');
  drawJmal(ctx, SIZE, SIZE, {
    gaze: scene.gaze,
    steer: scene.steer,
    sleeping: Boolean(scene.sleeping),
    blinkAmount: scene.blinkAmount ?? 0,
    clock: 40,
    tasselAngle: scene.tassel,
    zParticles: scene.zParticles ?? [],
    dust,
  });

  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = PAD + col * (SIZE + PAD);
  const y = PAD + row * (SIZE + PAD);

  sctx.fillStyle = '#0b0f1c';
  sctx.fillRect(x, y, SIZE, SIZE);
  sctx.drawImage(cell, x, y);

  sctx.fillStyle = '#f2c14e';
  sctx.font = '600 16px sans-serif';
  sctx.fillText(scene.label, x + 16, y + 28);
});

const out = await import('node:fs').then((fs) => fs.writeFileSync(output, sheet.toBuffer('image/png')));
void out;
console.log(`✓ ${output} (${sheet.width}×${sheet.height})`);
