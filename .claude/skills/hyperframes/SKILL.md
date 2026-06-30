---
name: hyperframes
description: >
  Generates a self-contained promotional video as a single vanilla HTML/CSS/JS file — auto-playing slides with animations, progress bar, and play/pause control. Use this skill whenever the user mentions "hyperframes", "promo video", "promotional video", "video promocional", "crear video", "pitch video", or wants to showcase the app to stakeholders, prospects, or new users. Always invoke this skill for any request that involves creating a visual presentation or demo of the Devitrak dashboard — even if the word "video" is not used.
---

## What this skill produces

A single `.html` file that plays like a video: timed slides auto-advance, CSS keyframe animations handle transitions, and JavaScript controls the timeline. No libraries. No CDN. No build step. The output is fully editable vanilla HTML/CSS/JS.

## Before writing anything

1. Read `design.md` (project root) — extract colors, fonts, and component patterns.
2. Read `CLAUDE.md` (project root) — extract domain list, feature names, and problems solved.
3. Read `src/assets/devitrak-logo-white.svg` and `src/assets/devitrak_name.svg` — embed inline.
4. Check `args` for overrides: `duration` (default 110s), `focus` (default: full overview).

## Slide structure (default, ≤ 2 min)

Design 7–9 slides. Each slide gets a time budget. Total must not exceed `duration` seconds.

| # | Title | Duration |
|---|-------|---------|
| 1 | Hero — brand + tagline | 10s |
| 2 | The Problem | 14s |
| 3 | Dashboard Overview | 16s |
| 4 | Inventory Management | 14s |
| 5 | Event Control | 14s |
| 6 | Consumer & Staff | 13s |
| 7 | Data & Analytics | 13s |
| 8 | Role-Based Access | 10s |
| 9 | CTA — Get Started | 10s |

Adjust timing proportionally if `duration` override is provided.

## HTML file structure

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Devitrak — Promo</title>
  <style>
    /* 1. CSS reset + variables */
    /* 2. Layout: fullscreen #video-container */
    /* 3. Per-slide styles + entrance animations */
    /* 4. Progress bar */
    /* 5. Controls (play/pause button) */
    /* 6. Slide-transition classes (.slide-enter, .slide-exit) */
  </style>
</head>
<body>
  <div id="video-container">
    <div id="progress-bar"><div id="progress-fill"></div></div>
    <button id="play-pause">⏸</button>
    <div id="slide-counter"></div>
    <!-- slides -->
    <div class="slide active" id="slide-1"> ... </div>
    <div class="slide" id="slide-2"> ... </div>
    ...
  </div>
  <script>
    // Timeline engine: array of {id, duration}
    // requestAnimationFrame loop for smooth progress bar
    // play / pause / keyboard (Space) support
  </script>
</body>
</html>
```

## Brand tokens (hardcoded — do not deviate)

```css
--blue:        #155EEF;   /* primary CTA */
--blue-nav:    #175CD3;   /* hero background */
--blue-dark:   #0040C1;   /* accents */
--blue-light:  #D1E0FF;   /* highlight backgrounds */
--gray-900:    #101828;   /* headings */
--gray-600:    #475467;   /* body text */
--gray-200:    #EAECF0;   /* dividers */
--bg:          #F9FAFB;   /* slide background */
--white:       #FFFFFF;
--success:     #027A48;
--font:        'Inter', system-ui, sans-serif;
```

Embed Inter via `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');` at the top of the `<style>` block. If the environment blocks external requests, fall back to `system-ui, -apple-system, sans-serif`.

## Slide design rules

- **Every slide fills the viewport** — `width: 100vw; height: 100vh; overflow: hidden`.
- **Hero slide (#1):** `background: var(--blue-nav)`. White logo SVG (inline) centered top. Large headline (48–56px, weight 900). Subtitle (20px, weight 400, opacity 0.85). Animate logo scale-in (0→1, 0.6s ease-out), headline slide-up (translateY 40px→0, 0.8s ease-out 0.3s).
- **Problem slide (#2):** White background. Three pain-point cards side by side. Each card: icon (emoji or SVG), bold short label, 2-line description. Cards stagger-animate in from bottom (0.2s delay each).
- **Feature slides (#3–#8):** Split layout — left 55% content (headline + bullets + badge), right 45% mockup (CSS-drawn UI components, no images). Use `border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1)` on mockup panels.
- **CTA slide (#9):** `background: var(--blue-nav)`. White text. Large CTA button (white bg, blue text). URL or contact info.
- **Transitions:** `opacity` + `transform: translateY(-20px)` for exit; `opacity` + `translateY(20px→0)` for entrance. Duration: 0.5s.

## JavaScript timeline engine

```js
const SLIDES = [
  { id: 'slide-1', duration: 10000 },
  { id: 'slide-2', duration: 14000 },
  // ...
];

let current = 0;
let startTime = null;
let elapsed = 0;
let paused = false;
let rafId = null;

const totalDuration = SLIDES.reduce((s, x) => s + x.duration, 0);

function showSlide(index) { /* swap .active class, trigger CSS animations */ }
function tick(ts) {
  if (paused) return;
  if (!startTime) startTime = ts;
  elapsed = ts - startTime;
  // update #progress-fill width
  // advance slide when elapsed > cumulative threshold
  rafId = requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

document.getElementById('play-pause').onclick = () => { paused = !paused; ... };
document.addEventListener('keydown', e => { if (e.code === 'Space') togglePause(); });
```

## Content to include (draw from CLAUDE.md / README.md)

**Problems solved:**
- Fragmented device tracking across locations and events
- Manual spreadsheet-based inventory with no real-time visibility
- No role-based access — everyone sees everything
- Lost devices and deposits left untracked

**Key features to showcase:**
- Dashboard with real-time inventory charts (ECharts)
- Inventory groups, locations, bulk upload, advanced search
- Event management with device assignment and check-in/out
- Consumer profiles with deposit and lost-fee tracking
- Staff management with role-based permissions
- PDF/Excel exports, QR codes, Stripe payments

## Output

Render the final HTML using the `Artifact` tool with `favicon: "🎬"`. Also save the file to `devitrak-promo.html` in the project root.

Tell the user:
- The video is `{N}` seconds long with `{M}` slides.
- Press **Space** or click the ⏸ button to pause/resume.
- All styles, slide content, and timing are in a single file — easy to edit.
- The file is saved as `devitrak-promo.html` in the project root.
