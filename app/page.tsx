import Hero from "@/components/Hero";

export default function Page() {
  return (
    <main className="min-h-screen bg-ink">
      <Hero />

      {/* Section 02 - placeholder to test offscreen pause */}
      <section
        id="collection"
        className="relative flex min-h-[80vh] items-center justify-center border-t border-white/5 bg-[#0A0A0A] px-6 py-24"
      >
        <div className="max-w-3xl text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-paper/40">
            Section 02 — How it works
          </p>
          <h2 className="mt-6 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] tracking-[-0.03em] text-paper">
            Dot product.
            <br />
            Short path.
            <br />
            <span className="text-paper/60">requestAnimationFrame.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[50ch] text-[15px] leading-relaxed text-paper/60">
            No CSS rotation tricks. 190 pre-rendered frames, each mapped to a
            gaze vector. Every pointermove we compute the cursor vector, pick
            the frame with the highest dot product, and travel the short way
            round the loop at 6 frames per tick.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            {[
              {
                k: "frames.json",
                v: "Evenly spaced angles → {x,y} unit vectors. Replace with real gaze data from your 3D tool.",
              },
              {
                k: "dead-zone",
                v: "If cursor < 90px from center, return to neutral frame 0 via same short path.",
              },
              {
                k: "perf",
                v: "Single canvas, draw only on index change. Neutral preload high priority, rest idle. Paused off-screen via IntersectionObserver.",
              },
            ].map((item) => (
              <div
                key={item.k}
                className="rounded-[16px] border border-white/5 bg-white/[0.03] p-5"
              >
                <div className="text-[11px] uppercase tracking-[0.15em] text-banana">
                  {item.k}
                </div>
                <div className="mt-3 text-[13px] leading-[1.5] text-paper/70">
                  {item.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-ink px-6 py-8 text-center text-[11px] uppercase tracking-[0.15em] text-paper/30">
        LUXORA — Built with Next.js App Router + Tailwind · No other libraries
      </footer>
    </main>
  );
}
