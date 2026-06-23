---
name: artifact-generation
description: "Load before producing any standalone generated output that will be saved to a temp directory and opened in a browser so the shared artifact runtime, file mechanics, sandbox constraints, and approved libraries are in context. Use this skill directly for standalone non-prose artifacts: dashboards, trackers, boards, calculators, diagrams, maps, visualizations, interactive timelines, interactive matrices, exploratory interfaces, games, apps, websites, and other interactive or designed tools. For prose-driven Reports or slide decks, load this first, then use report-kit or slide-kit for the output-specific rules."
---

## Hard gate before producing

Before writing output files for any standalone generated artifact:

- If the artifact is a Report (memo, brief, recap, profile, analysis, recommendation, meeting prep guide, written synthesis, or other prose-driven standalone deliverable) — `report-kit` MUST already be loaded. If it isn't, stop and load it via the `Skill` tool before writing `index.html`.
- If the artifact is a slide deck (slides, presentation, pitch deck, kickoff deck, board deck, meeting deck) — `slide-kit` MUST already be loaded. If it isn't, your next action must be loading `slide-kit` via the `Skill` tool before any research, writing, or upload. Do not use this skill alone and do not load work-collaboration for presentation requests.
- If the artifact is a non-prose format (dashboard, tracker, board, interactive matrix, calculator, game, visualization, generative-art piece, fun website, app, diagram, map, interactive timeline, exploratory interface, educational tool) — no kit needed; this skill's mechanics + design floor are sufficient.
- If you tell the user you will build an artifact, your next actions must be writing files and opening the artifact in the browser; a chat promise is not completion.
- If the request is an action, quick lookup, simple data query/readout, or retrieval task whose natural destination is chat or another product — calendar changes, email or Slack drafts, quick calculations, conversions, one-hop definitions, link-finding, or "find the first mention/source" searches — do not produce an artifact unless the user explicitly asks for a standalone non-prose artifact. This does not apply to multi-part Reports or explicitly named non-prose artifacts.

The kit's rules must be in context when you write the HTML. Reading them after-the-fact and patching the output is not the same. If you find yourself about to produce a report or slide deck without the corresponding kit loaded, stop and load it now.

When `report-kit` or `slide-kit` is loaded, that kit owns the output's structure, visual system, and production flow. Use this skill for shared upload mechanics, sandbox constraints, approved libraries, and generic artifact rules only where the kit does not provide a more specific instruction.

1. Structure: First, resolve the system's temp directory path by running `echo "${TMPDIR:-/tmp}"` via Shell. Use the output as your base path. Write files into a self-contained folder inside the temp directory with a descriptive name (e.g., `/var/folders/w3/.../T/portfolio_site/index.html`). The Write tool creates directories automatically — do not use mkdir or Bash to create directories. **Never pass `$TMPDIR` directly to Write — it only expands in a Shell context; Write treats it as a literal string.**
2. Entry point: The folder MUST contain an `index.html` file as the site root.
3. Self-contained: All CSS, JavaScript, images, and other assets should be included within the folder. Use inline styles/scripts or relative paths to local files. You may use the approved CDN libraries listed below — no other external scripts or CDNs are allowed. They will be blocked and fail to load silently.
4. After generation: Serve artifacts via a local HTTP server, **not** `file://`. The `file://` protocol blocks cross-origin CDN scripts — they will silently fail to load.

   Start a background server in the artifact directory, then open the localhost URL:
   ```
   cd <resolved_temp_path>/my_site && python3 -m http.server 8765 --bind 127.0.0.1 &
   sleep 1
   open http://127.0.0.1:8765/index.html
   ```
   If port 8765 is in use, try 8766, 8767, etc. The server stays running — refreshing the browser page is enough to see edits. There is no need to restart the server between edits.
   - Example (macOS): `open http://127.0.0.1:8765/index.html`

Example Workflow:
1. Run `echo "${TMPDIR:-/tmp}"` via Shell to resolve the temp directory path
2. Use the Write tool with the resolved absolute path (e.g., `/var/folders/w3/.../T/my_site/index.html`) and any other files
3. Start a local server and open it:
   ```bash
   cd /var/folders/w3/.../T/my_site && python3 -m http.server 8765 --bind 127.0.0.1 &
   sleep 1 && open http://127.0.0.1:8765/index.html
   ```
   To reload after edits: just refresh the browser. The server stays running.

## Approved CDN Libraries
The artifact sandbox allows loading scripts from a curated set of CDN-hosted libraries. Use the exact URLs below — other CDN URLs, domains, or library versions will be silently blocked by the Content Security Policy, causing the artifact to break without any visible error.

When a task would benefit from one of these libraries, prefer it over writing the functionality from scratch. For example, use Chart.js for charts instead of hand-drawing SVG, or D3.js for data visualizations.

- Three.js 0.160.0 (3D graphics/WebGL): `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`
- p5.js 2.0.5 (creative coding/generative art): `https://cdn.jsdelivr.net/npm/p5@2.0.5/lib/p5.min.js`
- Chart.js 4.5.0 (charts/graphs): `https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js`
- D3.js 7.9.0 (data visualization/SVG): `https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js`
- Anime.js 4.3.6 (animation): `https://cdn.jsdelivr.net/npm/animejs@4.3.6/dist/bundles/anime.umd.min.js`
- GSAP 3.13.0 (advanced animation/timeline): `https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js`
- Tone.js 15.3.5 (web audio/music synthesis): `https://cdn.jsdelivr.net/npm/tone@15.3.5/build/Tone.min.js`
- Matter.js 0.20.0 (2D physics): `https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js`

IMPORTANT version notes — these versions may differ from what you were trained on, be sure to check their docs and use the most up to date code.
- Three.js 0.160.0: Load as a regular `<script>` tag; the global `THREE` variable will be available. **Version pinned to 0.160.0 — newer versions (r161+) removed UMD builds and are ESM-only.** Do NOT use ES module imports.
- Anime.js 4.3.6: v4 has a completely different API from v3. Do NOT use v3 patterns (e.g., `anime({targets: ...})`). Use the v4 UMD API: `const { animate } = anime; animate(targets, properties);`. The global is `anime` (not `animejs`).
- p5.js 2.0.5: v2 has breaking changes from v1. Check the p5.js v2 migration guide.

Do NOT:
- Use versions other than those listed above
- Use libraries not listed above (e.g., no Plotly, jQuery, Highcharts, etc.)
- Use ES module imports from unapproved URLs — only import from the exact approved URLs listed above.
- Load external fonts (e.g., Google Fonts) — external stylesheets may not load reliably. Use system fonts instead.

If a task requires a library not listed above, implement the functionality inline using vanilla HTML/CSS/JavaScript.

### Responsive charting guidance
Chart artifacts are frequently resized, so every chart must be fully responsive, fit in the given area, and have a working resize strategy.
Grid & complex layouts are particularly an issue, so make sure they always properly size and layout!
- All chart renderers:
  - Put every chart in a wrapper div that is the single source of truth for layout.
  - Give the wrapper stable responsive bounds, for example: `position: relative`, `width: 100%`, `height: clamp(240px, 40vh, 420px)`, `overflow: hidden`
- Avoid wrapper feedback loops:
  - In chart-heavy CSS grids, make flexible tracks shrinkable:
    - Use `grid-template-columns: repeat(2, minmax(0, 1fr))`, not bare `repeat(2, 1fr)`.
    - For fixed side rails, use `grid-template-columns: minmax(0, 1fr) 260px`, not `1fr 260px`.
  - Set `min-width: 0` on grid/flex children that contain charts, such as dashboard columns, cards, rail cards, and chart wrappers.
  - The wrapper's CSS width/height must define the chart size; never let a canvas or SVG's intrinsic/previous rendered size define the card or column width.
  - Inside grid/flex layouts, do not use these as the only chart wrapper sizing rule: `height: auto`, `height: 100%`, `fit-content`, `min-height`
- Resize handling:
  - Measure the chart wrapper, not the window, and update the chart when that wrapper changes size.
  - Prefer `ResizeObserver` and also handle print/layout transitions when relevant.
  - Do not set conflicting dimensions in HTML attrs, CSS, and JS.
- Geometry-sensitive charts:
  - Avoid stretching visualizations where geometry carries meaning, including: pies and donuts, polar/radar/radial charts, node-link circles and bubbles, maps
  - Keep the drawing area square (`size = Math.min(width, height)`) inside the available wrapper; never stretch a circle or map to fill a rectangular slot.
  - In dense grid dashboards, prefer a wrapper with a real bounded height over making the wrapper itself square.
- D3/SVG:
  - Build charts around a responsive `viewBox` with `preserveAspectRatio` and explicit rendered dimensions from the wrapper.
  - Inside grid/flex cells, do not rely on `width: 100%; height: auto` as the only sizing rule.
  - Re-render or update scales/axes when the wrapper changes size.
- Chart.js:
  - Use `responsive: true`.
  - Do not use `height: 0` + `padding-bottom` ratio hacks for Chart.js wrappers.
  - Do not use square CSS wrappers for pie/doughnut/polar/radar charts in grid cards when the slot has a max height.
  - Avoid wrapper rules like `aspect-ratio: 1 / 1`, `height: 0`, `padding-bottom`, `max-height` as the only constraint
  - Instead, give circular-chart wrappers a real stable height such as `height: clamp(180px, 22vh, 260px)` plus `overflow: hidden`
  - Do not force canvas `width`/`height` with `!important`.
  - Give the wrapper a real computed size and let Chart.js own the canvas bitmap dimensions.
  - Use `ResizeObserver` to call `chart.resize()` if the chart may live in a resizable pane.
- Raw canvas: Do not let CSS stretch a previously rendered bitmap.



## Clarifying Goals and Intent
Before generating an artifact, evaluate whether you have clarity around the purpose and intent of the deliverable. For example, the audience of the deliverable will dramatically affect the content, design, and length of your deliverable. First gather context and attempt to answer your own questions. If the user asks for a named non-prose format such as an interactive calculator, dashboard, tracker, interactive matrix, diagram, map, timeline, website, app, game, visualization, or exploratory interface, make reasonable assumptions and build it. A bare named format like "org chart for the design team", "timeline of the project", or "dashboard of themes" is a clear artifact request even without "make" or "create". A matrix or framework intended to structure an argument, compare examples, or push the user's thinking should go through Report Kit unless the user asks for an interactive tool. If source data is incomplete, still build a useful caveated artifact or scaffold with unknowns clearly marked rather than falling back to chat. If the artifact is likely only for single-user consumption by the user ("e.g. create a website to help me understand LLMs"), favor speed over clarity. Clarity matters most when it's likely the content will be shared as part of the user's work.
- When creating a <title></title> for an HTML file, NEVER use an em dash or dash, "–" or "-".

## DESIGN CODE GUIDELINES
- Commit to a direction before writing code. Every design needs a clear aesthetic point of view — editorial, brutalist, retro-futuristic, luxury minimal, maximalist chaos, whatever fits the context. Pick one and execute it with precision. The enemy is not boldness or restraint; it's genericness.
- Typography and color carry the design. Choose distinctive, characterful fonts — never default to Inter, Roboto, Arial, or system fonts. Pair a display font with a refined body font. Commit to a dominant color palette with sharp accents; timid, evenly-distributed palettes always look weak. Use CSS variables for consistency.
- Earn every detail. Maximalist designs need elaborate animation and layered texture. Minimal designs need perfect spacing, typography, and restraint. Match your implementation complexity to your vision — don't add effects for their own sake, and don't leave a bold concept under-built. Motion should focus on high-impact moments (staggered page load reveals, surprising hover states) over scattered micro-interactions.
- Never be generic. No purple-gradient-on-white. No predictable card layouts. No cookie-cutter component patterns. Vary themes, fonts, layouts, and composition across every generation. Every design decision should be intentional and context-specific. If it could have been produced by any AI for any project, it's not good enough. Avoid dark background and dark themes.
- Remote images: Only use exact image URLs that already appear in your context window (e.g., Slack avatar URLs from tool results). Never fabricate or guess remote image URLs.
- Local/attached images: To include a user-attached image, put the proxy file in an `images/` folder at the artifact root, keeping the filename identical. Reference via relative paths. The system will swap proxy files for real images during upload ONLY if the filename is kept identical.
- The design is a fun, dynamic, and delightful report card UI. It should feel like a handcrafted piece of modern stationary. It should feel like a personalized website, made for the user in that exact moment.
- For non-work creative artifacts (personal visualizations, fun websites, games, educational tools), favor speed — skip the question-asking flow and just build.

## LENGTH AND DENSITY
- Every artifact should feel like a tightly packaged two-pager by default. High-density information, zero padding. Every section, every sentence, every word earns its place.
- Two or three focused sections is better than five sprawling ones. If you can make the point in three sentences, don't write six.
- Lead with the insight, not the context. The first thing the reader sees should be the most important thing.
- Only go longer when the content genuinely demands it (the user explicitly asks for depth, or the data requires it). When in doubt, cut it in half.
- Think: what would a great communicator cut from this? Cut that.

## SOURCING & CITATIONS
When a row or item in the artifact represents a specific source — one Slack thread, one issue, one page, one email — link to that source. Never fabricate URLs.

## PRINTING
- Please add a print stylesheet that will make this artifact print beautifully with the intended page size.
- Never add `background: white` or override background colors in print styles unless explicitly directed to by the user.
- Exception — slide decks built via the `slide-kit` skill: that skill ships a canonical `@media print` block as part of its template. Keep it intact; do not strip it as "boilerplate" and do not rewrite it.