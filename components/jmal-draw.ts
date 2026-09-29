/* =========================================================================
   محرك رسم الجمل المغربي — دالة نقية (pure) بلا React
   كاتخرج من الـ lifecycle باش تبقى قابلة للاختبار و للإعادة الاستعمال
   (حتى في Node بلا متصفح: @napi-rs/canvas)
   ========================================================================= */

export interface GazeVector {
  x: number; // -1 (اليسار) ... 1 (اليمين)
  y: number; // -1 (الفوق)  ... 1 (التحت)
}

export interface GazeReport {
  angle: number;
  frameIndex: number;
  distance: number;
  isSettled: boolean;
}

export interface DustParticle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
}

export interface ZParticle {
  x: number;
  y: number;
  age: number;
  drift: number;
}

export interface JmalFrame {
  /** اتجاه النظر المتنعّم (-1..1) */
  gaze: GazeVector;
  /** دوران الجسم و الرقبة مستخرج من إطار (قطاع) الراس (-1..1) */
  steer: number;
  /** واش الجمل ناعس */
  sleeping: boolean;
  /** 0 = عين محلولة، 1 = عين مسدودة (الرمش) */
  blinkAmount: number;
  /** ساعة داخلية بالفرامات (1 = 60fps) */
  clock: number;
  /** زاوية الشوشية بالراديان من محرك الفيزياء */
  tasselAngle: number;
  zParticles: ZParticle[];
  dust: DustParticle[];
}

/** الفضاء الداخلي للرسم (480×480) */
export const BASE_SIZE = 480;
export const HEAD_CENTER = { x: 240, y: 190 };
export const TARBOUCHE = { brimY: -70, topY: -152, baseHalf: 53, topHalf: 43 };

/** سياق الرسم — متوافق مع CanvasRenderingContext2D و مع node-canvas / @napi-rs */
type Ctx2D = CanvasRenderingContext2D;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function createDust(count = 28): DustParticle[] {
  const dust: DustParticle[] = [];
  for (let i = 0; i < count; i += 1) {
    dust.push({
      x: Math.random() * BASE_SIZE,
      y: Math.random() * BASE_SIZE,
      r: 0.6 + Math.random() * 1.9,
      vx: -0.12 - Math.random() * 0.28,
      vy: -0.06 - Math.random() * 0.2,
      a: 0.08 + Math.random() * 0.28,
    });
  }
  return dust;
}

/**
 * كايرسم الجمل كامل في السياق المعطى.
 * الدالة كاتبدل غير الـ particles (dust / Z) — الباقي stateless.
 */
export function drawJmal(ctx: Ctx2D, width: number, height: number, frame: JmalFrame): void {
  ctx.clearRect(0, 0, width, height);

  const scale = Math.min(width, height) / BASE_SIZE;
  const offsetX = (width - BASE_SIZE * scale) / 2;
  const offsetY = (height - BASE_SIZE * scale) / 2;

  const g = frame.gaze;
  const steer = frame.steer;
  const sleeping = frame.sleeping;
  const blinkAmount = frame.blinkAmount;
  const t = frame.clock;
  const tasselAngle = frame.tasselAngle;

  const breath = Math.sin(t * (sleeping ? 0.032 : 0.055)) * (sleeping ? 5 : 3.2);

  /* ---------- رمل الصحراء في الخلفية ---------- */
  ctx.save();
  ctx.translate(offsetX, offsetY);
  frame.dust.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -10) p.x = BASE_SIZE + 10;
    if (p.y < -10) p.y = BASE_SIZE + 10;
    ctx.fillStyle = `rgba(242, 193, 78, ${p.a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  ctx.save();
  ctx.translate(offsetX, offsetY + breath * 0.6);
  ctx.scale(scale, scale);

  const CX = HEAD_CENTER.x;
  const localCX = CX;
  const localCY = HEAD_CENTER.y;

  const lookX = g.x * 32;
  const lookY = g.y * 22;

  // ظل الأرضية
  const shadowGrad = ctx.createRadialGradient(CX, 432, 12, CX, 432, 150);
  shadowGrad.addColorStop(0, 'rgba(4, 7, 16, 0.7)');
  shadowGrad.addColorStop(0.55, 'rgba(4, 7, 16, 0.3)');
  shadowGrad.addColorStop(1, 'rgba(4, 7, 16, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(CX, 432, 144, 34 - breath * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  /* ---------- الجسم: السنام + الجلابة + الزواقة الأمازيغية ---------- */
  ctx.save();
  ctx.translate(localCX + steer * 7, 352 + breath * 0.35);
  ctx.rotate(steer * 0.035);

  // السنام (ظهر الجمل) — داخل نفس المجموعة باش يتحرك مع الجسم بلا شقوق
  const humpGrad = ctx.createLinearGradient(-116, -110, 116, 52);
  humpGrad.addColorStop(0, '#c08654');
  humpGrad.addColorStop(0.55, '#a2683a');
  humpGrad.addColorStop(1, '#824d21');
  ctx.fillStyle = humpGrad;
  ctx.beginPath();
  ctx.moveTo(-114, 54);
  ctx.quadraticCurveTo(-106, -92, -8, -114);
  ctx.quadraticCurveTo(94, -98, 112, 54);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(84, 46, 14, 0.32)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // ضو خفيف على قمة السنام
  ctx.strokeStyle = 'rgba(255, 226, 168, 0.16)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-64, -52);
  ctx.quadraticCurveTo(-10, -96, 52, -64);
  ctx.stroke();

  const cloakGrad = ctx.createLinearGradient(-120, -104, 120, 96);
  cloakGrad.addColorStop(0, '#dc9d51');
  cloakGrad.addColorStop(0.45, '#b87333');
  cloakGrad.addColorStop(1, '#7d4a1c');
  ctx.fillStyle = cloakGrad;
  ctx.beginPath();
  ctx.moveTo(-104, 62);
  ctx.quadraticCurveTo(-130, -30, -68, -78);
  ctx.quadraticCurveTo(-26, -106, 26, -106);
  ctx.quadraticCurveTo(78, -106, 114, -62);
  ctx.quadraticCurveTo(142, -18, 108, 68);
  ctx.quadraticCurveTo(42, 98, -42, 94);
  ctx.closePath();
  ctx.fill();

  // خط القفص ديال الجلابة
  ctx.strokeStyle = 'rgba(90, 48, 12, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -100);
  ctx.quadraticCurveTo(14, -10, -4, 92);
  ctx.stroke();

  // الصدرية
  const bibGrad = ctx.createLinearGradient(0, -30, 0, 92);
  bibGrad.addColorStop(0, '#f0b458');
  bibGrad.addColorStop(1, '#c07a24');
  ctx.fillStyle = bibGrad;
  ctx.beginPath();
  ctx.moveTo(-74, -34);
  ctx.quadraticCurveTo(0, 26, 74, -34);
  ctx.quadraticCurveTo(66, 74, 0, 92);
  ctx.quadraticCurveTo(-66, 74, -74, -34);
  ctx.closePath();
  ctx.fill();

  // الزواقة الأمازيغية: معينات بالصقلي و النعناع
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-74, -30);
  ctx.quadraticCurveTo(0, 30, 74, -30);
  ctx.quadraticCurveTo(66, 76, 0, 92);
  ctx.quadraticCurveTo(-66, 76, -74, -30);
  ctx.closePath();
  ctx.clip();

  for (let row = 0; row < 3; row += 1) {
    const y = 14 + row * 24;
    const count = row === 0 ? 3 : row === 1 ? 4 : 5;
    for (let i = 0; i < count; i += 1) {
      const x = (i - (count - 1) / 2) * 22;
      const size = 8 - row * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fillStyle = (row + i) % 2 === 0 ? '#f6d27a' : '#2f9e6f';
      ctx.fill();
      ctx.strokeStyle = 'rgba(60, 30, 6, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.restore();

  // حاشية ذهبية
  ctx.strokeStyle = 'rgba(246, 210, 122, 0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-74, -30);
  ctx.quadraticCurveTo(0, 30, 74, -30);
  ctx.stroke();
  ctx.restore();

  /* ---------- العنق (مربوط مع حركة الراس باش ما يبانش خارج الراس) ---------- */
  const headShiftX = steer * 13 + lookX * 0.6;
  const headShiftY = lookY * 0.8 + (sleeping ? 7 : 0);
  const neckTopY = 206 + headShiftY * 0.35;

  const neckGrad = ctx.createLinearGradient(CX - 46, 200, CX + 46, 300);
  neckGrad.addColorStop(0, '#b36f37');
  neckGrad.addColorStop(0.55, '#c68446');
  neckGrad.addColorStop(1, '#9e5b23');
  ctx.fillStyle = neckGrad;
  ctx.beginPath();
  ctx.moveTo(localCX - 54, 304);
  ctx.quadraticCurveTo(localCX - 50, 248, localCX - 37 + headShiftX, neckTopY);
  ctx.quadraticCurveTo(localCX + headShiftX, neckTopY - 8, localCX + 37 + headShiftX, neckTopY);
  ctx.quadraticCurveTo(localCX + 50, 248, localCX + 54, 304);
  ctx.closePath();
  ctx.fill();

  /* ---------- الراس ---------- */
  ctx.save();
  ctx.translate(localCX + headShiftX, localCY + headShiftY);
  ctx.rotate(steer * 0.1 + g.x * 0.16 + (sleeping ? 0.045 : 0));

  // الودنين (ملزوقين مزيان مع الراس)
  const earWiggle = Math.sin(t * 0.05) * 3;
  [-1, 1].forEach((side) => {
    const wig = side === 1 ? -earWiggle : earWiggle;
    ctx.fillStyle = '#b36f37';
    ctx.beginPath();
    ctx.ellipse(side * 56, -48 + wig, 13, 27, side * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e89e7a';
    ctx.beginPath();
    ctx.ellipse(side * 56, -48 + wig, 6.5, 16, side * 0.62, 0, Math.PI * 2);
    ctx.fill();
  });

  // الرأس
  const headGrad = ctx.createLinearGradient(-50, -80, 50, 60);
  headGrad.addColorStop(0, '#d99455');
  headGrad.addColorStop(0.7, '#c68446');
  headGrad.addColorStop(1, '#9e5b23');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(0, -10, 66, 75, 0, 0, Math.PI * 2);
  ctx.fill();

  // ظل خفيف تحت الشدق باش الراس ما تبانش ملزوقة
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -10, 66, 75, 0, 0, Math.PI * 2);
  ctx.clip();
  const chinGrad = ctx.createRadialGradient(0, 52, 8, 0, 52, 62);
  chinGrad.addColorStop(0, 'rgba(112, 62, 20, 0.32)');
  chinGrad.addColorStop(1, 'rgba(112, 62, 20, 0)');
  ctx.fillStyle = chinGrad;
  ctx.beginPath();
  ctx.ellipse(0, 52, 62, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // كموشة النيف و الشدق
  const snoutGrad = ctx.createLinearGradient(0, 0, 0, 70);
  snoutGrad.addColorStop(0, '#e5a56d');
  snoutGrad.addColorStop(1, '#be7b3f');
  ctx.fillStyle = snoutGrad;
  ctx.beginPath();
  ctx.ellipse(0, 36, 52, 42, 0, 0, Math.PI * 2);
  ctx.fill();

  // النواخر
  ctx.fillStyle = '#5c2d12';
  ctx.beginPath();
  ctx.ellipse(-16 + g.x * 3, 30 + g.y * 2, 4.5, 9, 0.35, 0, Math.PI * 2);
  ctx.ellipse(16 + g.x * 3, 30 + g.y * 2, 4.5, 9, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // الشفة السفلية (كتبان قبل الفم باش يكون الخط فوقها)
  ctx.fillStyle = '#c77842';
  ctx.beginPath();
  ctx.ellipse(0, 60, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // الفم المخنز — بسمة خفيفة، و كايهبط زيادة ملّي ناعس
  ctx.strokeStyle = '#4a240e';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-25, 52);
  ctx.quadraticCurveTo(0, 70 + (sleeping ? 6 : 0), 25, 52);
  ctx.stroke();

  // الحواجب
  [-1, 1].forEach((side) => {
    ctx.strokeStyle = 'rgba(92, 45, 18, 0.7)';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(side * 20, -36 - g.y * 3);
    ctx.quadraticCurveTo(side * 36, -44 - g.y * 4, side * 52, -34 - g.y * 3);
    ctx.stroke();
  });

  // العينين لي كايتبعو الماوس
  [-1, 1].forEach((side) => {
    const eyeX = side * 36;
    const eyeY = -12;

    ctx.fillStyle = '#fbf8ee';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 17, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    const pupilX = eyeX + clamp(g.x, -1, 1) * 7.5;
    const pupilY = eyeY + clamp(g.y, -1, 1) * 5.2;

    ctx.fillStyle = '#613613';
    ctx.beginPath();
    ctx.ellipse(pupilX, pupilY, 9, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f0904';
    ctx.beginPath();
    ctx.ellipse(pupilX, pupilY, 6, 3.5, 0.05 * side, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.ellipse(pupilX - 2.5, pupilY - 2.5, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // خط الرمش الفوقي
    ctx.strokeStyle = '#4a240e';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 17.5, 15.5, 0, Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();

    // الجفون: كاتسد العين من الفوق حسب قياس الرمش
    if (blinkAmount > 0.001) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, 18, 16, 0, 0, Math.PI * 2);
      ctx.clip();

      const lidTop = eyeY - 18;
      const lidY = lidTop + blinkAmount * 34;
      const lidGrad = ctx.createLinearGradient(0, lidTop, 0, lidY + 6);
      lidGrad.addColorStop(0, '#b36f37');
      lidGrad.addColorStop(1, '#d99455');
      ctx.fillStyle = lidGrad;
      ctx.fillRect(eyeX - 20, lidTop, 40, Math.max(0, lidY - lidTop));

      ctx.strokeStyle = '#4a240e';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(eyeX - 18, lidY);
      ctx.quadraticCurveTo(eyeX, lidY + 4.5, eyeX + 18, lidY);
      ctx.stroke();
      ctx.restore();
    }
  });

  /* ---------- الطربوش (الفاسي الأحمر) + الشوشية ---------- */

  // الجسم: مخروط مقطوع
  const fezGrad = ctx.createLinearGradient(-TARBOUCHE.baseHalf, TARBOUCHE.topY, TARBOUCHE.baseHalf, 0);
  fezGrad.addColorStop(0, '#e04b4b');
  fezGrad.addColorStop(0.45, '#b91c1c');
  fezGrad.addColorStop(1, '#7f1010');
  ctx.fillStyle = fezGrad;
  ctx.beginPath();
  ctx.moveTo(-TARBOUCHE.baseHalf, TARBOUCHE.brimY);
  ctx.quadraticCurveTo(-TARBOUCHE.baseHalf * 0.82, TARBOUCHE.topY + 18, -TARBOUCHE.topHalf, TARBOUCHE.topY);
  ctx.quadraticCurveTo(0, TARBOUCHE.topY - 10, TARBOUCHE.topHalf, TARBOUCHE.topY);
  ctx.quadraticCurveTo(TARBOUCHE.baseHalf * 0.82, TARBOUCHE.topY + 18, TARBOUCHE.baseHalf, TARBOUCHE.brimY);
  ctx.closePath();
  ctx.fill();

  // لمعة الضو
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath();
  ctx.moveTo(-TARBOUCHE.baseHalf * 0.62, TARBOUCHE.brimY - 4);
  ctx.quadraticCurveTo(-TARBOUCHE.baseHalf * 0.5, TARBOUCHE.topY + 26, -TARBOUCHE.topHalf * 0.5, TARBOUCHE.topY + 8);
  ctx.quadraticCurveTo(-TARBOUCHE.baseHalf * 0.42, TARBOUCHE.topY + 40, -TARBOUCHE.baseHalf * 0.3, TARBOUCHE.brimY - 4);
  ctx.closePath();
  ctx.fill();

  // الحاشية + الشريط الصقلي
  ctx.fillStyle = '#0f0d12';
  ctx.beginPath();
  ctx.ellipse(0, TARBOUCHE.brimY, TARBOUCHE.baseHalf + 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.ellipse(0, TARBOUCHE.brimY - 2, TARBOUCHE.baseHalf - 1, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // عقدة الطربوش
  ctx.fillStyle = '#8a1111';
  ctx.beginPath();
  ctx.ellipse(0, TARBOUCHE.topY + 2, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // الشوشية: كاتدور على محور العقدة حسب فيزياء النابض، و كاتدلّى على الحد
  ctx.save();
  ctx.translate(0, TARBOUCHE.topY);
  ctx.rotate(tasselAngle);

  ctx.strokeStyle = '#f0c14b';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(32, 28, 48, 84);
  ctx.stroke();

  const bobGrad = ctx.createLinearGradient(38, 76, 60, 100);
  bobGrad.addColorStop(0, '#ffe9a8');
  bobGrad.addColorStop(1, '#c9922b');
  ctx.fillStyle = bobGrad;
  ctx.beginPath();
  ctx.ellipse(50, 88, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#e6b53c';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(50 + i * 1.6, 95);
    ctx.quadraticCurveTo(50 + i * 3.4, 104, 50 + i * 4.6 - tasselAngle * 6, 112);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore(); // الراس
  ctx.restore(); // السكال

  /* ---------- النعاس: Z كايطيرو ---------- */
  if (sleeping) {
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    frame.zParticles.forEach((z) => {
      const life = z.age;
      ctx.globalAlpha = clamp(1 - life, 0, 1) * 0.85;
      ctx.fillStyle = '#f6d27a';
      ctx.font = `700 ${Math.round(20 + life * 12)}px 'Tajawal', system-ui, sans-serif`;
      ctx.fillText('Z', z.x + z.drift * life * 26, z.y - life * 74);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
