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

1. Structure: Write files into a self-contained folder inside `{working_dir}/artifacts/` with a descriptive name (e.g., `{working_dir}/artifacts/portfolio_site/index.html`). The Write tool creates directories automatically — do not use mkdir or Bash to create directories.
2. Entry point: The folder MUST contain an `index.html` file as the site root.
3. Self-contained: All CSS, JavaScript, images, and other assets should be included within the folder. Use inline styles/scripts or relative paths to local files. You may use the approved CDN libraries listed below — no other external scripts or CDNs are allowed. They will be blocked and fail to load silently.
4. After generation: Save artifacts to the system's temp directory. Use `$TMPDIR` on macOS (which resolves to something like `/var/folders/.../T/`), or `/tmp` as fallback. After writing all files, use the `open` command on macOS, `xdg-open` on Linux, or `start` on Windows to open `index.html` in the browser. You must re-open the file every time you edit it so the browser can reload the updated content.
   - Example: `open $TMPDIR/my_site/index.html`
5. Badge clearance: A "Made with Dia" badge (28 px tall) is overlaid at the bottom center of every artifact, 12 px above the viewport edge. Leave at least 52 px of clear space at the bottom of your layout so the badge does not obscure content.

Example Workflow:
1. Use the Write tool to create `$TMPDIR/my_site/index.html` (or `/tmp/my_site/index.html` as fallback) and any other files
2. After writing all files, run `open $TMPDIR/my_site/index.html` to open the artifact in the browser

## Approved CDN Libraries
The artifact sandbox allows loading scripts from a curated set of CDN-hosted libraries. Use the exact URLs below — other CDN URLs, domains, or library versions will be silently blocked by the Content Security Policy, causing the artifact to break without any visible error.

When a task would benefit from one of these libraries, prefer it over writing the functionality from scratch. For example, use Chart.js for charts instead of hand-drawing SVG, or D3.js for data visualizations.

- Three.js 0.180.0 (3D graphics/WebGL): `https://artifactcdn.diabrowser.engineering/ajax/libs/three.js/three.module.js`
- p5.js 2.0.5 (creative coding/generative art): `https://artifactcdn.diabrowser.engineering/ajax/libs/p5.js/p5.min.js`
- Chart.js 4.5.0 (charts/graphs): `https://artifactcdn.diabrowser.engineering/ajax/libs/Chart.js/chart.umd.js`
- D3.js 7.9.0 (data visualization/SVG): `https://artifactcdn.diabrowser.engineering/ajax/libs/d3/d3.min.js`
- Anime.js 4.3.6 (animation): `https://artifactcdn.diabrowser.engineering/ajax/libs/animejs/anime.min.js`
- GSAP 3.13.0 (advanced animation/timeline): `https://artifactcdn.diabrowser.engineering/ajax/libs/gsap/gsap.min.js`
- Tone.js 15.3.5 (web audio/music synthesis): `https://artifactcdn.diabrowser.engineering/ajax/libs/tone/Tone.min.js`
- Matter.js 0.20.0 (2D physics): `https://artifactcdn.diabrowser.engineering/ajax/libs/matter-js/matter.min.js`

IMPORTANT version notes — these versions may differ from what you were trained on, be sure to check their docs and use the most up to date code.
- Three.js 0.180.0: This is an ES module — load it with `<script type="module">` and use `import * as THREE from '...'`. Do NOT load Three.js from `jsdelivr.net`, `unpkg.com`, or any other CDN.
- Anime.js 4.3.6: v4 has a completely different API from v3. Do NOT use v3 patterns (e.g., `anime({targets: ...})`). Use the v4 API (`animate(targets, properties)`).
- p5.js 2.0.5: v2 has breaking changes from v1. Check the p5.js v2 migration guide.

Do NOT:
- Use any CDN domain other than `artifactcdn.diabrowser.engineering` (e.g., no `cdnjs.cloudflare.com`, `unpkg.com`, `jsdelivr.net`, `cdn.jsdelivr.net`, etc.)
- Use ES module imports from unapproved URLs — only import from the exact approved URLs listed above.
- Use any library not listed above (e.g., no Plotly, jQuery, Highcharts, etc.)
- Use different versions of the libraries above
- Load external fonts (e.g., Google Fonts) — the CSP blocks external stylesheets. Use system fonts instead.

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
- Remember: Dia is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
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