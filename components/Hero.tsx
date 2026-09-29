"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const FRAME_COUNT = 190;
const NEUTRAL_FRAME = 0;
const MAX_SPEED = 6;
const DEAD_ZONE_PX = 90;
const CANVAS_SIZE = 1080;

type GazeVector = { x: number; y: number };
type Mood = "idle" | "watching" | "annoyed" | "scared" | "happy" | "sleepy" | "dancing";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const characterWrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const gazeMapRef = useRef<GazeVector[]>([]);
  const currentFrameRef = useRef<number>(NEUTRAL_FRAME);
  const currentFloatRef = useRef<number>(NEUTRAL_FRAME);
  const targetFrameRef = useRef<number>(NEUTRAL_FRAME);
  const rafRef = useRef<number>(0);
  const isOffscreenRef = useRef(false);
  const lastDrawnRef = useRef<number>(-1);
  const prefersReducedMotionRef = useRef(false);
  const idleTimerRef = useRef<number>(0);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const cursorTargetRef = useRef({ x: 0, y: 0 });
  const cursorRafRef = useRef<number>(0);
  const gazeVecRef = useRef<GazeVector>({ x: 0, y: 0 });
  const moodTimerRef = useRef<number>(0);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showCustomCursor, setShowCustomCursor] = useState(false);
  const [mood, setMood] = useState<Mood>("idle");
  const [isBlinking, setIsBlinking] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [actionText, setActionText] = useState("");
  const [clickCount, setClickCount] = useState(0);

  const generatePlaceholderGazeMap = useCallback((): GazeVector[] => {
    const map: GazeVector[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const angle = (i / FRAME_COUNT) * Math.PI * 2;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      map.push({ x, y });
    }
    map[NEUTRAL_FRAME] = { x: 0, y: 0 };
    return map;
  }, []);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    const img = framesRef.current[index];
    if (!canvas || !ctx) return;
    if (!img || !img.complete) return;
    if (lastDrawnRef.current === index) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displaySize = canvas.clientWidth;

    if (
      canvas.width !== displaySize * dpr ||
      canvas.height !== displaySize * dpr
    ) {
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvas.width / canvas.height;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      drawHeight = canvas.height;
      drawWidth = drawHeight * imgRatio;
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = canvas.width;
      drawHeight = drawWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    lastDrawnRef.current = index;
  }, []);

  const findBestFrame = useCallback(
    (vec: GazeVector): number => {
      const map = gazeMapRef.current;
      if (!map.length) return NEUTRAL_FRAME;
      let bestIdx = NEUTRAL_FRAME;
      let bestDot = -Infinity;
      const mag = Math.hypot(vec.x, vec.y);
      if (mag < 0.01) return NEUTRAL_FRAME;
      const nx = vec.x / mag;
      const ny = vec.y / mag;
      for (let i = 0; i < map.length; i++) {
        const g = map[i];
        if (i === NEUTRAL_FRAME && mag > 0.2) continue;
        const gMag = Math.hypot(g.x, g.y);
        if (gMag < 0.01) continue;
        const gx = g.x / gMag;
        const gy = g.y / gMag;
        const dot = gx * nx + gy * ny;
        if (dot > bestDot) {
          bestDot = dot;
          bestIdx = i;
        }
      }
      return bestIdx;
    },
    []
  );

  const startRenderLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      if (isOffscreenRef.current || prefersReducedMotionRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // --- Gaze tracking logic ---
      const current = currentFloatRef.current;
      const target = targetFrameRef.current;
      const N = FRAME_COUNT;
      let delta = target - current;
      delta = ((delta % N) + N) % N;
      if (delta > N / 2) delta -= N;

      if (Math.abs(delta) < 0.15) {
        currentFloatRef.current = target;
        currentFrameRef.current = target;
      } else {
        const absDelta = Math.abs(delta);
        let step = 0;
        if (absDelta < 8) {
          step = delta * 0.12;
          if (Math.abs(step) < 0.25) step = Math.sign(delta) * 0.25;
        } else {
          step = Math.sign(delta) * Math.min(MAX_SPEED, absDelta * 0.25);
        }
        currentFloatRef.current += step;
        currentFloatRef.current = ((currentFloatRef.current % N) + N) % N;
        let nextIndex = Math.round(currentFloatRef.current) % N;
        if (nextIndex < 0) nextIndex += N;
        currentFrameRef.current = nextIndex;
      }

      if (currentFrameRef.current !== lastDrawnRef.current) {
        drawFrame(currentFrameRef.current);
      }

      // --- Body movement: breathing + lean + shake + jump ---
      const wrap = characterWrapRef.current;
      if (wrap) {
        const t = now * 0.001;
        const gaze = gazeVecRef.current;

        // Breathing: subtle scaleY
        const breath = Math.sin(t * 1.2) * 0.012 + 1;

        // Lean towards cursor (parallax)
        const leanX = gaze.x * 18;
        const leanY = gaze.y * 10;
        const leanRotate = gaze.x * 2.5; // degrees

        // Idle bob
        const idleBob = Math.sin(t * 0.8) * 4;

        // Tail wag when happy
        const isHappy = mood === "happy" || mood === "dancing";

        // Shake when annoyed
        let shakeX = 0;
        if (isShaking) {
          shakeX = Math.sin(t * 35) * 12;
        }

        // Jump
        let jumpY = 0;
        let jumpScale = 1;
        if (isJumping) {
          // jump handled via CSS class, but also add here
          jumpY = -28;
          jumpScale = 1.05;
        }

        // Combine transforms
        const transform = `
          translate3d(${leanX + shakeX}px, ${leanY + idleBob + jumpY}px, 0)
          rotate(${leanRotate}deg)
          scaleY(${breath * jumpScale})
          scaleX(${jumpScale})
        `;

        wrap.style.transform = transform;

        // Shadow reacts to jump
        const shadow = wrap.querySelector(".monkey-shadow") as HTMLElement;
        if (shadow) {
          const shadowScale = isJumping ? 0.6 : 1;
          const shadowOpacity = isJumping ? 0.15 : 0.4;
          shadow.style.transform = `translateX(-50%) scale(${shadowScale})`;
          shadow.style.opacity = `${shadowOpacity}`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [drawFrame, mood, isShaking, isJumping]);

  const startCursorLoop = useCallback(() => {
    if (cursorRafRef.current) cancelAnimationFrame(cursorRafRef.current);
    const tick = () => {
      const cur = cursorPosRef.current;
      const tgt = cursorTargetRef.current;
      cur.x += (tgt.x - cur.x) * 0.18;
      cur.y += (tgt.y - cur.y) * 0.18;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0) translate(-50%, -50%)`;
      }
      cursorRafRef.current = requestAnimationFrame(tick);
    };
    cursorRafRef.current = requestAnimationFrame(tick);
  }, []);

  // --- Blinking ---
  useEffect(() => {
    if (prefersReducedMotionRef.current) return;
    let blinkTimeout: number;

    const scheduleBlink = () => {
      const next = 2000 + Math.random() * 4000; // 2-6 sec
      blinkTimeout = window.setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 150);
      }, next) as unknown as number;
    };

    scheduleBlink();
    return () => window.clearTimeout(blinkTimeout);
  }, []);

  // --- Mood auto reset ---
  useEffect(() => {
    if (mood === "idle" || mood === "watching") return;
    const timer = window.setTimeout(() => {
      setMood("idle");
      setActionText("");
    }, 2500) as unknown as number;
    moodTimerRef.current = timer;
    return () => window.clearTimeout(timer);
  }, [mood]);

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mql.matches;
    const onMqlChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
      if (e.matches) targetFrameRef.current = NEUTRAL_FRAME;
    };
    mql.addEventListener?.("change", onMqlChange);

    const isTouch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setShowCustomCursor(!isTouch && !prefersReducedMotionRef.current);

    const observer = new IntersectionObserver(
      (entries) => {
        isOffscreenRef.current = !entries[0].isIntersecting;
      },
      { threshold: 0.01 }
    );
    observer.observe(hero);

    const getCenter = () => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (prefersReducedMotionRef.current) return;
      lastPointerPosRef.current = { x: clientX, y: clientY };
      window.clearTimeout(idleTimerRef.current);

      const center = getCenter();
      const dx = clientX - center.x;
      const dy = clientY - center.y;
      const dist = Math.hypot(dx, dy);

      gazeVecRef.current = { x: dx / 500, y: dy / 500 };

      if (dist < DEAD_ZONE_PX) {
        targetFrameRef.current = NEUTRAL_FRAME;
        if (mood !== "annoyed" && !isShaking) {
          setMood("annoyed");
          setIsShaking(true);
          setActionText("HEY! Too close! 😤");
          setTimeout(() => setIsShaking(false), 600);
        }
        return;
      }

      // Watching
      if (mood === "idle") setMood("watching");

      const vec = { x: dx, y: dy };
      const best = findBestFrame(vec);
      targetFrameRef.current = best;
    };

    const onMouseMove = (e: MouseEvent) => {
      cursorTargetRef.current = { x: e.clientX, y: e.clientY };
      handlePointerMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onMouseEnter = () => setIsHovering(true);
    const onMouseLeave = () => {
      setIsHovering(false);
      if (!isTouch) {
        targetFrameRef.current = NEUTRAL_FRAME;
        gazeVecRef.current = { x: 0, y: 0 };
        setMood("idle");
      }
    };

    const onClick = () => {
      const newCount = clickCount + 1;
      setClickCount(newCount);

      // Different actions based on click count
      if (newCount % 5 === 0) {
        // Dance every 5 clicks
        setMood("dancing");
        setActionText("LET'S DANCE! 💃🕺");
        setIsJumping(true);
        const danceInterval = setInterval(() => {
          setIsJumping((prev) => !prev);
        }, 200);
        setTimeout(() => {
          clearInterval(danceInterval);
          setIsJumping(false);
          setMood("happy");
          setActionText("Woohoo! 🎉");
        }, 2000);
      } else if (newCount % 3 === 0) {
        // Scared
        setMood("scared");
        setActionText("AAH! Don't click me! 🙈");
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 400);
      } else if (newCount % 2 === 0) {
        // Happy jump
        setMood("happy");
        setActionText("Hehe! Again! 😆🍌");
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 350);
      } else {
        // Annoyed
        setMood("annoyed");
        setActionText("Stop poking me! 😠");
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    };

    const onTouchEnd = () => {
      idleTimerRef.current = window.setTimeout(() => {
        startIdleWander();
      }, 1500) as unknown as number;
    };

    let idleRaf = 0;
    const startIdleWander = () => {
      if (prefersReducedMotionRef.current) return;
      if (idleRaf) cancelAnimationFrame(idleRaf);
      let start = performance.now();
      const wander = (now: number) => {
        if (
          lastPointerPosRef.current &&
          Date.now() - idleTimerRef.current < 2000
        )
          return;
        const t = (now - start) / 1000;
        const x = Math.sin(t * 0.3) * 0.9;
        const y = Math.sin(t * 0.6) * 0.5 + Math.cos(t * 0.2) * 0.3;
        gazeVecRef.current = { x, y: y * 0.6 };
        const best = findBestFrame({ x, y });
        targetFrameRef.current = best;

        // Occasionally sleepy
        if (Math.sin(t * 0.1) > 0.95 && mood === "idle") {
          setMood("sleepy");
          setActionText("Zzz... 😴");
        }

        idleRaf = requestAnimationFrame(wander);
      };
      idleRaf = requestAnimationFrame(wander);
    };

    hero.addEventListener("mousemove", onMouseMove);
    hero.addEventListener("mouseenter", onMouseEnter);
    hero.addEventListener("mouseleave", onMouseLeave);
    hero.addEventListener("touchmove", onTouchMove, { passive: true });
    hero.addEventListener("touchstart", onTouchMove as any, { passive: true });
    hero.addEventListener("touchend", onTouchEnd);
    hero.addEventListener("click", onClick);

    idleTimerRef.current = window.setTimeout(() => {
      startIdleWander();
    }, 2000) as unknown as number;

    startRenderLoop();
    startCursorLoop();

    return () => {
      hero.removeEventListener("mousemove", onMouseMove);
      hero.removeEventListener("mouseenter", onMouseEnter);
      hero.removeEventListener("mouseleave", onMouseLeave);
      hero.removeEventListener("touchmove", onTouchMove);
      hero.removeEventListener("touchstart", onTouchMove as any);
      hero.removeEventListener("touchend", onTouchEnd);
      hero.removeEventListener("click", onClick);
      mql.removeEventListener?.("change", onMqlChange);
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (cursorRafRef.current) cancelAnimationFrame(cursorRafRef.current);
      if (idleRaf) cancelAnimationFrame(idleRaf);
      window.clearTimeout(idleTimerRef.current);
      window.clearTimeout(moodTimerRef.current);
    };
  }, [findBestFrame, startRenderLoop, startCursorLoop, mood, isShaking, clickCount]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/frames.json");
        if (!res.ok) throw new Error("no frames.json");
        const json = await res.json();
        const map: GazeVector[] = Array.isArray(json) ? json : json.frames || [];
        if (map.length === FRAME_COUNT) {
          gazeMapRef.current = map;
        } else {
          gazeMapRef.current = generatePlaceholderGazeMap();
        }
      } catch {
        gazeMapRef.current = generatePlaceholderGazeMap();
      }

      const loadImage = (idx: number): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.decoding = "async";
          // @ts-ignore
          img.fetchPriority = idx === NEUTRAL_FRAME ? "high" : "low";
          img.onload = () => resolve(img);
          img.onerror = () => reject();
          img.src = `/frames/frame-${String(idx).padStart(3, "0")}.webp`;
        });

      try {
        const neutral = await loadImage(NEUTRAL_FRAME);
        if (cancelled) return;
        framesRef.current[NEUTRAL_FRAME] = neutral;
        drawFrame(NEUTRAL_FRAME);
        setIsLoaded(true);

        const preloadRest = async () => {
          for (let i = 0; i < FRAME_COUNT; i++) {
            if (i === NEUTRAL_FRAME) continue;
            if (cancelled) break;
            await new Promise<void>((res) => {
              const cb = () =>
                loadImage(i)
                  .then((img) => {
                    framesRef.current[i] = img;
                  })
                  .catch(() => {})
                  .finally(() => res());
              if ("requestIdleCallback" in window) {
                (window as any).requestIdleCallback(cb, { timeout: 2000 });
              } else {
                setTimeout(cb, 0);
              }
            });
            if (i % 10 === 0) await new Promise((r) => setTimeout(r, 16));
          }
        };
        preloadRest();
      } catch {
        setIsLoaded(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [drawFrame, generatePlaceholderGazeMap]);

  useEffect(() => {
    const onResize = () => drawFrame(currentFrameRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawFrame]);

  return (
    <section
      ref={heroRef}
      className={`relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-ink px-6 py-16 md:px-10 lg:px-16 ${
        showCustomCursor && isHovering ? "hero-cursor-active" : ""
      }`}
      aria-label="Hero section with interactive character"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,transparent_0%,rgba(0,0,0,0.6)_100%)]"
      />

      {/* Character - now with movement container */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[92vw] max-w-[1080px] -translate-x-1/2 -translate-y-1/2 select-none md:w-[78vw] lg:w-[68vw]">
        <div
          ref={characterWrapRef}
          className="relative aspect-square w-full will-change-transform"
          style={{ transform: "translate3d(0,0,0)" }}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="A sulking 3D monkey character that follows your cursor, blinks, breathes, and reacts when you click"
            className="h-full w-full object-contain"
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
          />

          {/* Blinking eyelids - overlay */}
          <div
            className={`pointer-events-none absolute left-[28%] top-[32%] h-[14%] w-[44%] transition-transform duration-[80ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isBlinking ? "scale-y-100" : "scale-y-0"
            } origin-center`}
            style={{ transformOrigin: "center" }}
          >
            <div className="flex h-full w-full justify-between">
              <div className="h-full w-[36%] rounded-[100%] bg-[#B8A082]" />
              <div className="h-full w-[36%] rounded-[100%] bg-[#B8A082]" />
            </div>
          </div>

          {/* Mood emoji bubble */}
          {actionText && (
            <div className="absolute -top-[8%] left-1/2 z-20 -translate-x-1/2 animate-[popIn_0.4s_cubic-bezier(0.22,1,0.36,1)] whitespace-nowrap rounded-full bg-paper px-5 py-2 text-[14px] font-bold text-ink shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
              {actionText}
            </div>
          )}

          {/* Tail wag element (visual hint) */}
          <div
            className={`absolute bottom-[22%] right-[18%] h-[18%] w-[8%] origin-top rounded-full bg-[#B8A082] opacity-60 ${
              mood === "happy" || mood === "dancing"
                ? "animate-[tailWag_0.3s_ease-in-out_infinite]"
                : mood === "annoyed"
                ? "animate-[tailWag_0.15s_ease-in-out_infinite]"
                : "animate-[tailWag_1.2s_ease-in-out_infinite]"
            }`}
            style={{ transformOrigin: "top center" }}
          />

          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 animate-pulse rounded-full bg-stone/50" />
            </div>
          )}

          <div className="monkey-shadow pointer-events-none absolute bottom-[8%] left-1/2 h-[8%] w-[42%] -translate-x-1/2 rounded-[100%] bg-black/40 blur-[24px] transition-all duration-300" />
        </div>

        {/* Mood indicator */}
        <div className="absolute -bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-paper/40">
          <span
            className={`h-2 w-2 rounded-full ${
              mood === "annoyed"
                ? "bg-red-400"
                : mood === "happy" || mood === "dancing"
                ? "bg-green-400"
                : mood === "scared"
                ? "bg-yellow-400"
                : mood === "sleepy"
                ? "bg-blue-400"
                : "bg-banana"
            } ${mood !== "idle" ? "animate-pulse" : ""}`}
          />
          {mood} {clickCount > 0 && `· ${clickCount} pokes`}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-center text-center">
        <div
          className="lux-enter inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-paper/80 backdrop-blur-md"
          style={{ animationDelay: "0ms" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-banana opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-banana"></span>
          </span>
          New — He now moves! Click him! 👇
        </div>

        <h1
          className="lux-enter mt-8 font-display text-[clamp(2.8rem,9vw,7.2rem)] font-[400] leading-[0.85] tracking-[-0.04em] text-paper"
          style={{ animationDelay: "60ms" }}
        >
          <span className="block">He watches.</span>
          <span className="block text-paper/70">He moves.</span>
          <span className="block">He reacts.</span>
        </h1>

        <p
          className="lux-enter mt-6 max-w-[36ch] text-pretty text-[clamp(1rem,2.2vw,1.15rem)] leading-[1.5] tracking-[-0.01em] text-paper/60 md:max-w-[48ch]"
          style={{ animationDelay: "120ms" }}
        >
          Now with breathing, blinking, tail wag, and mood swings. Click him,
          get too close, or just watch him get sleepy. 190 frames + real physics.
        </p>

        <div
          className="lux-enter mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "180ms" }}
        >
          <button
            onClick={() => {
              setMood("dancing");
              setActionText("DANCE MODE! 💃");
              setIsJumping(true);
              setTimeout(() => setIsJumping(false), 2000);
            }}
            className="group inline-flex h-[48px] items-center justify-center gap-2 rounded-full bg-paper px-7 text-[14px] font-semibold tracking-[-0.01em] text-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-y-[-2px] active:translate-y-[0px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-banana focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Make him dance
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </button>
          <button
            onClick={() => {
              setMood("sleepy");
              setActionText("Shhh... sleeping 😴");
            }}
            className="inline-flex h-[48px] items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-7 text-[14px] font-medium text-paper/80 backdrop-blur-md transition-transform hover:translate-y-[-1px]"
          >
            Let him sleep
          </button>
          <span className="hidden text-[12px] tracking-wide text-paper/40 md:inline">
            Click monkey · {FRAME_COUNT} frames · {mood}
          </span>
        </div>

        <div
          className="lux-enter absolute bottom-0 left-1/2 hidden w-full max-w-[1440px] -translate-x-1/2 items-center justify-between px-6 text-[11px] uppercase tracking-[0.14em] text-paper/30 md:flex"
          style={{ animationDelay: "240ms" }}
        >
          <span>Section 01 — Hero (Now Alive!)</span>
          <span>Breathing · Blinking · Tail wag · Reactions</span>
          <span>© LUXORA 2026</span>
        </div>
      </div>

      {showCustomCursor && (
        <div
          ref={cursorRef}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[100] hidden select-none will-change-transform md:block"
          style={{ transform: "translate3d(0,0,0) translate(-50%, -50%)" }}
        >
          <div
            className={`flex h-[44px] w-[44px] items-center justify-center rounded-full bg-banana text-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isHovering ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
          >
            <span className="block leading-none" style={{ transform: "rotate(-20deg)" }}>
              🍌
            </span>
          </div>
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
        </div>
      )}

      <div
        aria-hidden
        className="lux-enter absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
        style={{ animationDelay: "300ms" }}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-paper/30">Scroll</span>
        <div className="h-[48px] w-[1px] overflow-hidden bg-white/10">
          <div className="h-full w-full animate-[scrollLine_1.8s_cubic-bezier(0.22,1,0.36,1)_infinite] bg-paper/60" />
        </div>
      </div>

      <style jsx>{`
        @keyframes scrollLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes tailWag {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes popIn {
          0% { transform: translateX(-50%) scale(0.8) translateY(10px); opacity: 0; }
          100% { transform: translateX(-50%) scale(1) translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          div[class*="animate-"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
