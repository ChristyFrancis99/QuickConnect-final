# QuickConnect homepage animation notes

## Scroll architecture

- Uses native browser scrolling with Framer Motion `useScroll` / motion values for scroll-linked effects.
- No Lenis instance and no GSAP ScrollTrigger timeline remain in the homepage.
- IntersectionObserver is reserved for section reveals, mobile carousel visibility, and globe visibility; it does not drive continuous animation.
- Scroll-linked values are reversible: scrolling upward reassembles the globe, reverses the solution notes and paths, unwinds the platform stack, and rewinds the handover timeline.

## Layer scale

Defined in `:root` in `src/styles.css`:

| Token | Value | Use |
|---|---:|---|
| `--qc-z-background` | 0 | Decorative backgrounds and paths |
| `--qc-z-content` | 10 | Normal section content and interactive content |
| `--qc-z-sticky` | 20 | Sticky details and the base of the platform stack |
| `--qc-z-nav` | 50 | Fixed navigation |
| `--qc-z-modal` | 100 | Modal/dialog layer reserved for overlays |

Platform cards use `calc(var(--qc-z-sticky) + cardIndex)` to keep all eight sticky layers uniquely ordered. Local `z-index: -1` values are retained only for decorative elements inside isolated component stacking contexts.

## Scroll ranges and behavior

| Section | Target / range | Behavior |
|---|---|---|
| Hero globe | `.hero-scroll-stage`, `start start` → `end end`. The stage is 175svh on desktop (about 75svh of scroll at a 100svh viewport) and 160svh on mobile (about 60svh). | Progress 0 is fully assembled. Progress 1 is dispersed and faded. Panel position, rotation, opacity, and camera field-of-view (40° → 100°, eased with panel separation) are derived from the same progress value. Auto-rotation pauses while dragging and rendering pauses outside the viewport. |
| Solution story | `.qc-solution-scroll`, `start start` → `end end`; wrapper height 260svh (about 160svh of scroll at a 100svh viewport). | Four note cards and three dotted path segments reveal in sequence. The sticky stage releases at the wrapper end. Mobile and reduced-motion layouts are static and fully visible. |
| Problem accordion | No scroll-linked range. | Three cards use a 4-second optional auto-cycle. Hover pauses it; a click or keyboard selection stops it. Arrow keys navigate. Mobile uses a vertical accordion. Reduced motion disables auto-cycle and collapses animation durations. |
| Platform stack | `.qcp__stack`, `start start` → `end end`. Eight slots use 70svh card heights, 30svh spacing, and 30svh trailing stack space; the approximate target height is 800svh (about 700svh of scroll at a 100svh viewport). | As the next card enters, the previous card scales toward 0.93, tilts toward 5° on X, dims to 0.88 brightness, and shifts up 8px. Each slot has a unique ascending z-index. Mobile and reduced-motion layouts are non-sticky and static. |
| Handover timeline | Section progress from `start center` → `end center`. Four desktop steps are each 48svh tall, reducing the vertical distance between cards by 36%. | A scaleY gold line tracks progress. The active step gets `aria-current="step"`; upcoming steps are faded, completed nodes remain filled. The heading is sticky on desktop and static on mobile/reduced-motion. |

## Implementation notes and assumptions

- The hero camera field-of-view interpolates from 40° to 100° as panels disperse. This keeps outward-moving panels within the camera frustum; the canvas itself also has 10% visual overflow room.
- Deterministic panel displacement and camera framing math live in `src/lib/globe-motion.ts`, separate from the Three.js renderer as required by `AGENTS.md`.
- The globe uses React Three Fiber's lifecycle cleanup for its scene objects and renderer. Textures loaded with `useLoader` are shared/cached and are not manually disposed. Its render pixel ratio is capped at 1.25 for lower GPU cost.
- The Continuity cards' `View` action uses the optional `onViewClick` callback when provided; otherwise it scrolls to the existing `#how-it-works` timeline because there is no separate detail route in the current homepage.
- The mobile hero uses content first and the globe below it. Desktop and tablet retain the left-content/right-globe 45/55 split.
- The existing seven globe PNGs are approximately 1.1–1.6 MB each, and the logo PNG is approximately 1.1 MB. They were preserved unchanged to avoid altering visual assets; image-format/size optimization remains a separate asset task.
- No new dependencies, routes, copy, fonts, or brand colors were added.
