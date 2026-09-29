# LUXORA — Interactive Gaze Hero

Full-viewport hero section in Next.js (App Router) + Tailwind, no other libraries.
Centerpiece is a character that looks wherever the visitor's cursor goes.

**Live demo:** `npm run dev` → http://localhost:3000

## Concept

A sulking 3D monkey sits in the middle of the screen. Custom cursor is a banana 🍌.
The character's head follows the cursor in every direction, including diagonals,
by playing a pre-rendered frame sequence (190 WebP frames).

## How the Look-At Works (not faked with CSS rotation)

### Assets
- `N = 190` frames in `/public/frames/frame-000.webp` ... `frame-189.webp`
- `max 1080px` on long side, WebP, transparent background
- First frame preloaded with `fetchpriority="high"` in `app/layout.tsx`

### frames.json
Maps each frame index to gaze direction as unit vector `{x,y}` where:
- `x: -1` left to `1` right
- `y: -1` up to `1` down
- `frame 0` is neutral `{0,0}`

**Placeholder formula** (in `scripts/generate-frames-json.mjs`):

```js
// Evenly spaced angles around full circle
// Replace this with real values from your 3D tool
for (let i = 0; i < N; i++) {
  if (i === NEUTRAL) map.push({x:0, y:0});
  else {
    const angle = (i / N) * 2π - π/2; // start at top
    const x = cos(angle);
    const y = sin(angle);
    map.push({x, y}); // normalized
  }
}
```

**To replace with real data:**
1. Render your character in Blender/C4D looking around 360°
2. For each frame, measure where it looks in screen space
3. Normalize to unit vector and overwrite `public/frames.json`
4. Example real measurement: track head bone rotation, project to screen

### Runtime logic (`components/Hero.tsx`)

Every `pointermove`:
```js
// Vector from character centre to cursor
dx = cursorX - centerX
dy = cursorY - centerY
dist = hypot(dx, dy)
if (dist < DEAD_ZONE) target = NEUTRAL
else {
  // Normalize
  vec = {x: dx/dist, y: dy/dist}
  // Pick frame with highest dot product
  best = max_i dot(gazeMap[i], vec)
  target = best
}
```

**Travel short way round loop:**
```js
delta = ((target - current + N/2) mod N) - N/2
// delta in [-N/2, N/2)
// Step toward it inside requestAnimationFrame
// Capped speed 6 frames/tick, easing down near target
if (abs(delta) < 0.15) snap
else if (abs(delta) < 8) step = delta * 0.12
else step = sign(delta) * min(6, abs(delta)*0.25)
```

**Render:**
- Single `<canvas>` with `role="img"` and `aria-label`
- Draw only when frame index changes
- Preload progressively: neutral first, rest in idle time via `requestIdleCallback`
- Pause loop when hero off-screen via `IntersectionObserver`

## Layout (Section 01)

Full viewport (`100svh`), centered:
- Eyebrow pill: "New — 190 frames of pure gaze"
- H1 on three lines: "He watches. He judges. He follows."
- Supporting line at 60% opacity
- Primary button
- Character canvas centred behind/between text (absolute, z-0)
- Meta footer: Section 01 — Hero / Dot product · Short path · rAF

Palette:
- `ink: #0F0F0F` background
- `paper: #FAF9F6` foreground
- `banana: #FFD93D` accent / cursor
- `stone: #2A2A2A` secondary

Type:
- Display: Instrument Serif (via CDN, fallback Georgia)
- Body: Inter (via CDN, fallback system-ui)

## Motion Rules

- One easing curve site-wide: `cubic-bezier(0.22, 1, 0.36, 1)` → `--ease-lux`
- Entry: `y 16px → 0` over `750ms`, `60ms` stagger between children
- Animate `transform` only, never width/height/box-shadow
- H1 animates transform only, never opacity (LCP element never invisible)
- Wrapped in `prefers-reduced-motion`: with reduce, show neutral frame, no tracking, no entry animation

```css
@media (prefers-reduced-motion: reduce) {
  .lux-enter { animation: none !important; }
}
```

## Cursor

- Hide native cursor only over hero (`.hero-cursor-active { cursor: none }`)
- Draw banana following pointer with lagged `translate3d`, `pointer-events: none`
- Lerp 0.18 for light lag
- Touch devices: no custom cursor. Character follows last touch point, idles with slow scripted look-around (figure-8 sin/cos) when untouched

## Performance

- Frames WebP, max 1080px, first frame preloaded high priority
- Pause render loop when off-screen (IntersectionObserver)
- Canvas `imageSmoothingQuality: high`, DPR capped to 2
- Draw only on index change
- Progressive preload in idle time, chunked

## Accessibility

- Canvas `role="img"` + `aria-label`
- Visible focus ring: `2px solid #FFD93D` with `2px` offset
- Contrast: body 4.5:1, display 3:1 (paper on ink = 15:1)
- Reduced motion support
- All interactive elements keyboard focusable

## Folder Structure

```
app/
  layout.tsx      # preload neutral frame, fonts via CDN
  page.tsx        # imports Hero + Section 02
  globals.css     # easing, focus ring, reduced-motion
components/
  Hero.tsx        # full hero logic (canvas, tracking, cursor, idle, observer)
public/
  frames/
    frame-000.webp ... frame-189.webp (190 files)
    frames.json   # duplicate for convenience
  frames.json     # main gaze map
scripts/
  generate-frames-json.mjs  # placeholder formula, commented for replacement
  generate-frames-v3.mjs    # generates placeholder monkey frames via ImageMagick
  generate-frames.mjs       # older SVG attempt (fallback)
```

## How to Swap In Your Own Frames

1. **Render:**
   - In Blender, create 190-frame animation where character looks around full circle
   - Keep camera fixed, only head/eyes move
   - Export each frame as WebP 1080px long side, transparent background
   - Name `frame-000.webp` ... `frame-189.webp`

2. **Gaze map:**
   - For each frame, record where character looks as unit vector
   - You can automate: in Blender Python, get head bone forward vector, project to screen
   - Or manually estimate: left = {-1,0}, right = {1,0}, up = {0,-1}, down = {0,1}
   - Overwrite `public/frames.json`:
     ```json
     [
       {"x":0,"y":0},
       {"x":0.03,"y":-0.99},
       ...
     ]
     ```

3. **Regenerate (optional):**
   ```bash
   node scripts/generate-frames-json.mjs
   # then manually edit with real values
   ```

4. **Test:**
   ```bash
   npm run dev
   # Move cursor, check dot product picking feels right
   # Adjust dead-zone (DEAD_ZONE_PX) if needed
   ```

## Scripts

```bash
npm run dev          # start dev server
npm run build        # production build
npm run gen:frames-json  # regenerate placeholder frames.json
```

To regenerate placeholder monkey frames (requires ImageMagick):
```bash
node scripts/generate-frames-v3.mjs
```

## Notes

- No other libraries used (only Next.js + Tailwind + React)
- Canvas only, no CSS rotation trick
- Short path travel ensures character never spins the long way round
- Touch idle wander uses `sin(t*0.3)` + `sin(t*0.6)` for natural figure-8
