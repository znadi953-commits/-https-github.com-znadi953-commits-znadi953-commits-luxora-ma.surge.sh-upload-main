'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BASE_SIZE,
  HEAD_CENTER,
  clamp,
  createDust,
  drawJmal,
  type DustParticle,
  type GazeReport,
  type GazeVector,
  type ZParticle,
} from '@/lib/jmal-draw';

export type { GazeReport, GazeVector } from '@/lib/jmal-draw';

/* =========================================================================
   1. محرك الحساب الرياضي للشوفان 360° (Gaze Engine)
   ========================================================================= */

/** عدد إطارات (قطاعات) دوران الراس — رقم فردي باش يكون وسط */
export const HEAD_TURN_FRAMES = 7;
const HEAD_ANCHOR = { x: 0.5, y: 0.44 };
const IDLE_SLEEP_MS = 7000;

function shortestDelta(current: number, target: number, count: number): number {
  if (count <= 0) return 0;
  const rawDiff = (target - current) % count;
  return ((rawDiff + count * 1.5) % count) - count * 0.5;
}

function stepToward(
  current: number,
  target: number,
  count: number,
  speed = 0.16
): { next: number; settled: boolean } {
  if (count <= 0) return { next: 0, settled: true };
  const delta = shortestDelta(current, target, count);
  if (Math.abs(delta) < 0.02) {
    return { next: target, settled: true };
  }
  let next = (current + delta * speed) % count;
  if (next < 0) next += count;
  return { next, settled: false };
}

function computeGazeVector(
  anchorRect: DOMRect,
  headOffsetPercent: { x: number; y: number },
  mouseX: number,
  mouseY: number,
  deadZoneRadius = 24
) {
  const headX = anchorRect.left + anchorRect.width * headOffsetPercent.x;
  const headY = anchorRect.top + anchorRect.height * headOffsetPercent.y;

  const dx = mouseX - headX;
  const dy = mouseY - headY;
  const distance = Math.hypot(dx, dy);

  if (distance < deadZoneRadius) {
    return {
      vector: { x: 0, y: 0 },
      angle: 0,
      distance,
      inDeadZone: true,
    };
  }

  const maxSpan = Math.max(window.innerWidth, window.innerHeight) * 0.7;
  const clampedDist = Math.min(distance / maxSpan, 1);
  const angle = Math.atan2(dy, dx);

  return {
    vector: {
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    },
    angle: Math.round((angle * 180) / Math.PI),
    distance: Math.round(distance),
    inDeadZone: false,
  };
}

/* =========================================================================
   2. كاس د أتاي مشحر بالنعناع (Custom Cursor)
   ========================================================================= */
export function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const headRef = useRef<HTMLDivElement>(null);
  const cupRef = useRef<HTMLDivElement>(null);

  // كلشي بالـ refs + RAF واحد: بلا re-render و بلا jank
  const posRef = useRef({ x: -100, y: -100 });
  const laggedRef = useRef({ x: -100, y: -100 });
  const tiltRef = useRef(0);
  const hoverRef = useRef(false);
  const clickRef = useRef(false);
  const prevXRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(hover: none) or (pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    document.body.classList.add('luxora-cursor-hidden');

    const onMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };

      const vx = e.clientX - prevXRef.current;
      prevXRef.current = e.clientX;
      tiltRef.current = clamp(vx * 1.2, -25, 25);

      const target = e.target as HTMLElement | null;
      hoverRef.current = Boolean(
        target?.closest('button, a, input, [role="button"], .interactive')
      );
    };

    const onMouseDown = () => {
      clickRef.current = true;
    };
    const onMouseUp = () => {
      clickRef.current = false;
    };
    const onLeave = () => {
      posRef.current = { x: -100, y: -100 };
      prevXRef.current = -100;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onLeave);

    let raf = 0;
    const follow = () => {
      raf = requestAnimationFrame(follow);

      const target = posRef.current;
      const lag = laggedRef.current;
      lag.x += (target.x - lag.x) * 0.18;
      lag.y += (target.y - lag.y) * 0.18;

      tiltRef.current *= 0.9;

      if (headRef.current) {
        headRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) scale(${
          clickRef.current ? 0.7 : hoverRef.current ? 1.4 : 1
        })`;
      }

      if (cupRef.current) {
        cupRef.current.style.transform = `translate3d(${lag.x + 14}px, ${lag.y + 14}px, 0) rotate(${
          tiltRef.current
        }deg) scale(${clickRef.current ? 0.9 : hoverRef.current ? 1.15 : 1})`;
      }
    };
    raf = requestAnimationFrame(follow);

    return () => {
      document.body.classList.remove('luxora-cursor-hidden');
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {/* رأس المؤشر */}
      <div
        ref={headRef}
        className="fixed top-0 left-0 -mt-1.5 -ml-1.5 h-3 w-3 rounded-full border border-amber-950/80 bg-amber-400 will-change-transform shadow-[0_0_12px_rgba(251,191,36,0.8)]"
      />

      {/* كاس أتاي المغربي مع رشة النعناع */}
      <div
        ref={cupRef}
        className="fixed top-0 left-0 will-change-transform"
        style={{ transition: 'transform 75ms cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" className="drop-shadow-xl">
          <path
            d="M5 4L9 44C9.2 45.1 10.1 46 11.2 46H24.8C25.9 46 26.8 45.1 27 44L31 4H5Z"
            fill="rgba(255, 255, 255, 0.22)"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1.5"
          />
          <path
            d="M7 16L9.5 42.5C9.6 43.3 10.3 44 11.1 44H24.9C25.7 44 26.4 43.3 26.5 42.5L29 16C25.5 17 20 15 18 16C16 17 10.5 15 7 16Z"
            fill="url(#teaGradSingle)"
          />
          {/* عريش النعناع */}
          <path d="M17 12C15 15 13 22 19 28" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 12C13 11 11 15 14 17C17 19 18 14 17 12Z" fill="#22c55e" />
          <path d="M18 20C21 19 23 23 20 25C17 27 16 22 18 20Z" fill="#16a34a" />
          {/* شريط الصقلي الذهبي */}
          <rect x="6.2" y="7" width="23.6" height="5" fill="#d97706" opacity="0.8" />
          <path d="M7 9.5H29M11 7V12M15 7V12M19 7V12M23 7V12M27 7V12" stroke="#fef08a" strokeWidth="0.8" />
          {/* بخار أتاي سخون */}
          <path d="M14 2C13 0 15 -2 14 -4" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M21 3C20 1 22 -1 21 -3" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
          <defs>
            <linearGradient id="teaGradSingle" x1="18" y1="16" x2="18" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f59e0b" />
              <stop offset="0.6" stopColor="#d97706" />
              <stop offset="1" stopColor="#78350f" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/* =========================================================================
   3. شخصية الجمل (Canvas 3D Jmal with Tarbouche Physics)
   ========================================================================= */
export function CharacterCanvas({ onGazeUpdate }: { onGazeUpdate?: (info: GazeReport) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gazeVectorRef = useRef<GazeVector>({ x: 0, y: 0 });
  const targetGazeRef = useRef<GazeVector>({ x: 0, y: 0 });
  const frameIndexRef = useRef<number>((HEAD_TURN_FRAMES - 1) / 2);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const isVisibleRef = useRef(true);
  const isSleepingRef = useRef(false);
  const isSettledRef = useRef(true);
  const clockRef = useRef(0);
  const lastActivityRef = useRef(0);
  const reportAtRef = useRef(0);
  const onGazeUpdateRef = useRef(onGazeUpdate);

  // فيزياء شوشية الطربوش
  const tasselPhysicsRef = useRef({ angle: 0, velocity: 0, targetAngle: 0, prevHeadAngle: 0 });
  const blinkRef = useRef({ progress: 0, isBlinking: false, nextBlinkAt: 1600 });
  const zParticlesRef = useRef<ZParticle[]>([]);
  const zSpawnRef = useRef(0);
  const dustRef = useRef<DustParticle[]>([]);
  if (dustRef.current.length === 0) dustRef.current = createDust(28);

  // باش الـ RAF ما يتعاودش يتصنع ملّي الـ parent يعاود يرندر
  useEffect(() => {
    onGazeUpdateRef.current = onGazeUpdate;
  }, [onGazeUpdate]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let canvasRect = canvas.getBoundingClientRect();

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(Math.round(rect.width), 320);
      height = Math.max(Math.round(rect.height), 320);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvasRect = canvas.getBoundingClientRect();
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const refreshRect = () => {
      canvasRect = canvas.getBoundingClientRect();
    };
    window.addEventListener('scroll', refreshRect, { passive: true });
    window.addEventListener('resize', refreshRect);

    lastActivityRef.current = performance.now();

    const wake = () => {
      lastActivityRef.current = performance.now();
      if (isSleepingRef.current) {
        isSleepingRef.current = false;
        blinkRef.current.isBlinking = false;
        blinkRef.current.progress = 0;
        zParticlesRef.current = [];
      }
    };

    const onPointerMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      wake();
    };
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) mousePosRef.current = { x: touch.clientX, y: touch.clientY };
      wake();
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.08 }
    );
    io.observe(container);

    let lastTs = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      const dtMs = Math.min(now - lastTs, 50);
      lastTs = now;
      const dt = dtMs / 16.6667; // 1 = 60fps

      if (!isVisibleRef.current) return;

      clockRef.current += dt;

      // ---------- النعاس من بعد 7 ثواني بلا حركة ----------
      if (!isSleepingRef.current && now - lastActivityRef.current > IDLE_SLEEP_MS) {
        isSleepingRef.current = true;
        zParticlesRef.current = [];
        zSpawnRef.current = 0;
      }

      // ---------- هدف النظر ----------
      const hasPointer = mousePosRef.current.x > -9000;
      let angle = 0;
      let distance = 0;

      if (hasPointer && !isSleepingRef.current) {
        const info = computeGazeVector(
          canvasRect,
          HEAD_ANCHOR,
          mousePosRef.current.x,
          mousePosRef.current.y
        );
        targetGazeRef.current = info.vector;
        angle = info.angle;
        distance = info.distance;
      } else {
        targetGazeRef.current = { x: 0, y: 0 };
      }

      // ---------- تنعيم الحركة ----------
      const g = gazeVectorRef.current;
      const target = targetGazeRef.current;
      const ease = isSleepingRef.current ? 0.045 : 0.13;
      g.x += (target.x - g.x) * clamp(ease * dt, 0, 1);
      g.y += (target.y - g.y) * clamp(ease * dt, 0, 1);

      // ---------- إطار (قطاع) دوران الراس ----------
      const half = (HEAD_TURN_FRAMES - 1) / 2;
      const targetFrame = Math.round(((g.x + 1) / 2) * (HEAD_TURN_FRAMES - 1));
      const step = stepToward(frameIndexRef.current, targetFrame, HEAD_TURN_FRAMES, 0.14);
      frameIndexRef.current = step.next;

      isSettledRef.current =
        step.settled && Math.abs(target.x - g.x) < 0.012 && Math.abs(target.y - g.y) < 0.012;

      // ---------- فيزياء شوشية الطربوش (نابض مخمّد) ----------
      const steer = clamp((frameIndexRef.current - half) / half, -1, 1);
      const headAngle = steer * 0.1 + g.x * 0.16;
      const physics = tasselPhysicsRef.current;
      const headVel = headAngle - physics.prevHeadAngle;
      physics.prevHeadAngle = headAngle;
      physics.velocity += headVel * 7.5;
      physics.targetAngle = -headAngle * 0.55;
      physics.velocity += (physics.targetAngle - physics.angle) * 0.08 * dt;
      physics.velocity *= Math.pow(0.9, dt);
      physics.angle = clamp(physics.angle + physics.velocity * dt, -0.95, 0.95);

      // ---------- الرمش ----------
      const blink = blinkRef.current;
      let blinkAmount = 0;
      if (isSleepingRef.current) {
        blinkAmount = 1;
      } else {
        blink.nextBlinkAt -= dtMs;
        if (!blink.isBlinking && blink.nextBlinkAt <= 0) {
          blink.isBlinking = true;
          blink.progress = 0;
        }
        if (blink.isBlinking) {
          blink.progress += 0.055 * dt;
          if (blink.progress >= 2) {
            blink.progress = 0;
            blink.isBlinking = false;
            blink.nextBlinkAt = 2200 + Math.random() * 3600;
          }
        }
        blinkAmount = clamp(blink.progress <= 1 ? blink.progress : 2 - blink.progress, 0, 1);
      }

      // ---------- Z ديال النعاس ----------
      if (isSleepingRef.current) {
        zSpawnRef.current -= dtMs;
        if (zSpawnRef.current <= 0) {
          zSpawnRef.current = 850 + Math.random() * 450;
          zParticlesRef.current.push({
            x: BASE_SIZE / 2 + 60 + Math.random() * 26,
            y: 150,
            age: 0,
            drift: -0.2 + Math.random() * 0.4,
          });
        }
        zParticlesRef.current = zParticlesRef.current
          .map((z) => ({ ...z, age: z.age + (dtMs / 1000) * 1.9 }))
          .filter((z) => z.age < 1);
      }

      // ---------- تقرير للـ HUD ----------
      if (now - reportAtRef.current > 110) {
        reportAtRef.current = now;
        onGazeUpdateRef.current?.({
          angle,
          frameIndex: Math.round(frameIndexRef.current),
          distance,
          isSettled: isSettledRef.current,
        });
      }

      drawJmal(ctx, width, height, {
        gaze: g,
        steer,
        sleeping: isSleepingRef.current,
        blinkAmount,
        clock: clockRef.current,
        tasselAngle: physics.angle,
        zParticles: zParticlesRef.current,
        dust: dustRef.current,
      });
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('scroll', refreshRect);
      window.removeEventListener('resize', refreshRect);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative aspect-square w-full max-w-[560px]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="جمل مغربي بالطربوش كايتبع الماوس"
      />
    </div>
  );
}

/** موضع مركز الراس داخل الـ canvas — بالنسبة (نسبة من الأبعاد) */
export const CHARACTER_HEAD_ANCHOR = { ...HEAD_CENTER };

export default CharacterCanvas;
