'use client';

import { useCallback, useState } from 'react';
import { CharacterCanvas, HEAD_TURN_FRAMES, type GazeReport } from '@/components/luxora-jmal';

const INITIAL: GazeReport = {
  angle: 0,
  frameIndex: (HEAD_TURN_FRAMES - 1) / 2,
  distance: 0,
  isSettled: true,
};

function Hud({ gaze }: { gaze: GazeReport }) {
  const radius = Math.min(gaze.distance / 620, 1) * 30;
  const rad = (gaze.angle * Math.PI) / 180;

  return (
    <div className="interactive w-full max-w-[560px] rounded-2xl border border-amber-400/20 bg-[#0b0f1c]/80 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.35em] text-amber-400/70">GAZE ENGINE</p>
          <p className="mt-1 text-sm text-amber-100/80">
            {gaze.isSettled ? 'الراس واقف · العين على الماوس' : 'كايتبع حركة الماوس...'}
          </p>
        </div>

        <div className="relative h-[76px] w-[76px] shrink-0 rounded-full border border-amber-400/25">
          <span className="absolute inset-1/2 h-px w-[70%] -translate-x-1/2 bg-amber-400/20" />
          <span className="absolute top-1/2 left-1/2 h-[70%] w-px -translate-y-1/2 bg-amber-400/20" />
          <span
            className="absolute top-1/2 left-1/2 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]"
            style={{
              transform: `translate(-50%, -50%) translate(${Math.cos(rad) * radius}px, ${
                Math.sin(rad) * radius
              }px)`,
            }}
          />
          <span className="absolute right-0 bottom-1 left-0 text-center text-[10px] text-amber-200/60">
            {gaze.angle}°
          </span>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          { k: 'الزاوية', v: `${gaze.angle}°` },
          { k: 'المسافة', v: `${gaze.distance}px` },
          { k: 'الإطار', v: `#${gaze.frameIndex + 1}` },
        ].map((item) => (
          <div
            key={item.k}
            className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] py-2"
          >
            <dt className="text-[10px] tracking-widest text-amber-200/50">{item.k}</dt>
            <dd className="font-mono text-sm text-amber-100">{item.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * الجمل + لوحة GAZE.
 * الـ state محصور هنا باش كل تحديث (≈9/ثانية) يعاود يرندر غير هاد البانيل،
 * ماشي الصفحة كاملة.
 */
export default function GazePanel() {
  const [gaze, setGaze] = useState<GazeReport>(INITIAL);
  const handleGaze = useCallback((info: GazeReport) => setGaze(info), []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="animate-luxora-float">
          <CharacterCanvas onGazeUpdate={handleGaze} />
        </div>
      </div>
      <Hud gaze={gaze} />
    </div>
  );
}
