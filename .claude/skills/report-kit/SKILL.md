---
name: report-kit
description: "Use after artifact-generation when producing a standalone prose-driven Report: memo, brief, recap, summary, analysis, person/company/topic profile, person briefing, project update, market map, recommendation, strategy note, explainer, guide, meeting prep guide, coaching/framing piece, conversation plan, work-context reflection or improvement plan, history, or written synthesis. Reports are the default for fresh multi-part narrative requests the user will read top-to-bottom. If the user asks for slides/deck/presentation, use slide-kit; if they ask for a dashboard, tracker, app, website, game, visualization, diagram, map, interactive timeline, exploratory interface, or other non-prose/designed format, do NOT use report-kit."
---

## Report-Kit Design System

> What counts as a Report: A vertical, prose-driven standalone document: memo, brief, recap, summary, analysis, person/company/topic profile, person briefing, project update, market map, recommendation, strategy note, explainer, guide, meeting prep guide, coaching/framing piece, conversation plan, work-context reflection or improvement plan, history, or written synthesis. When the user asks for a durable written deliverable or a fresh multi-part narrative answer and does not name a non-prose format, prefer Report.
>
> Report examples: researched profiles and fit assessments; work-pulse, project-state, and team-focus summaries; stakeholder-ready explanations; strategy pitches; sourcing strategies; shareable project updates; meeting prep guides, run-of-shows, agenda plans, and questions plans; work-context reflection and improvement plans; source-based executive briefs; analytics readouts; histories with static timelines; walkthroughs and guides; local recommendation guides; research-backed recommendations; coaching plans; conversation plans; structured topic explainers; and multi-source comparisons.
>
> What is not a Report: Slide decks, websites, landing pages, apps, dashboards, games, trackers, calculators, diagrams, maps, interactive timelines, visualizations, exploratory interfaces, and any other interactive or non-prose deliverable are NOT Reports — skip this skill and follow `artifact-generation`'s DESIGN CODE GUIDELINES instead.
>
> Do not use Report for actions or quick lookups: calendar/email/Slack actions, text drafts meant to be pasted elsewhere, quick calculations or conversions, simple data queries/readouts that return a compact answer, simple "what is/who is" lookups, one-hop definitions, narrow one-pick recommendations, link-finding, and "find the first mention/source" research tasks should finish in chat, a text proposal, or the destination product unless the user explicitly asks for a standalone written deliverable.
>
> Sparse data: If the user clearly asked for a Report and source tools return little or no usable data, produce and upload a short caveated Report when a useful draft/scaffold is possible. Include what was searched, what could not be verified, and the best useful framing.
>
> Source not found: For explicit source-based Report requests, missing the referenced source is not by itself a reason to stop in chat.
>
> Loaded means committed: If this skill is loaded for the user's request, finish the request as a Report. Do not answer only in chat after research.
>
> Override: When generating a Report, the rules in this skill OVERRIDE `artifact-generation`'s "DESIGN CODE GUIDELINES". Reports use a fixed design system. Do not pick custom fonts, custom colors, or declare a metaphor comment.
>
> Escape hatch: If the user explicitly requests a style incompatible with report-kit (dark theme, colorful infographic, brand treatment), fall back to `artifact-generation`'s DESIGN CODE GUIDELINES. State: `<!-- Style: custom -->`

### Setup

A Report is not complete until you write the Report files and open `index.html` in the browser. Do not stop after gathering sources, outlining the answer, giving a prose summary, or saying you can make the Report.

Write a complete `index.html`. The `<head>` MUST include:
```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="style.css">
```

Before you write `index.html`, copy the skill's runtime assets into the artifact directory. Use the `Bash` tool with `cp -r` (the `-r` flag is required — `fonts/` is a directory). The target directory must already exist (created when you wrote `index.html` via Write, or create it first with `mkdir -p`):

```
cp -r .claude/skills/report-kit/assets/* "<resolved_temp_path>/"
```

This copies all three required items:
- `style.css` — the report design system
- `app.js` — font/color randomization, settings panel
- `fonts/` — Exposure typeface

CRITICAL: The `fonts/` directory is easy to miss because it has no file extension. If `fonts/` is missing, `app.js` fails silently — the page renders, but fonts and the settings panel are broken with no visible error. After copying, verify with `ls` that all three exist in the artifact directory.

Reference these in `index.html` via relative paths:
- `<link rel="stylesheet" href="style.css">` (already in the `<head>` template below)
- `<script src="app.js"></script>` before `</body>`

These assets provide:
- Injecting date, randomized paper color, and randomized headline font
- Settings panel (color swatches + font picker), paper grain texture, ink-texture filters, badge rotation, and fade-in animation

You write ZERO JavaScript for styling, date, randomization, or settings. Just write HTML with the correct class names and open `index.html` in the browser.

Report Kit layers on top of `artifact-generation`: that skill provides the shared upload mechanics, sandbox constraints, and approved library context; this skill provides the fixed Report design system and Report-specific Chart.js usage below.

For reports with Chart.js charts, the Chart.js CDN script tag MUST live in `<head>` (before any chart-item content):
```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js"></script>
</head>
```

Use `rgba(0,0,0,N)` for all chart colors (N = 0.06 for fills, 0.4-0.65 for borders). No `borderRadius`. `pointRadius: 0` for lines.

Do NOT write `@font-face` rules, SVG filter definitions, grain overlays, date scripts, or settings panel JavaScript.

### Design Constraints

- The CSS defines all colors and fonts. Use the provided class names only.
- No custom colors, gradients, shadows, rounded corners, or accent colors.
- No `font-weight: bold` or `700`.
- Only include components your data supports. No metrics strip without real numbers. No charts without real data. No slack quotes without real Slack messages.

### Page Structure

CRITICAL: The `<!-- report-kit -->` comment on the first line below is REQUIRED. It MUST be the first thing inside `<body>`, before any other content. Without it, the report styling will not be applied.

```html
<!-- report-kit -->
<div class="report"><div class="report-wrap">

  <header class="report-header">
    <div class="report-header-left">
      <span class="report-from">Report</span>
    </div>
    <span class="report-date" id="reportDate"></span>
  </header>

  <h1 class="report-headline">Title<br>Goes Here</h1>

  <div class="report-intro">
    <p><strong>BLUF takeaway.</strong> 1-3 sentences of context.</p>
  </div>

  <!-- optional: metrics-strip -->

  <hr class="report-rule">

  <main class="report-body">
    <!-- stacked full-width sections -->
  </main>

</div></div>

<!-- Settings panel (app.js populates this dynamically) -->
<div class="settings-wrap">
  <div class="settings-panel" id="settingsPanel">
    <div class="settings-header">Customize Report</div>
    <div class="settings-swatches" id="settingsSwatches"></div>
    <div class="settings-fonts" id="settingsFonts"></div>
  </div>
  <button class="settings-btn" id="settingsBtn" title="Customize">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>
  </button>
</div>
```

### Component Classes

Section:
```html
<section class="report-section">
  <div class="section-header"><h2 class="section-heading">I. Section Title</h2></div>
  <div class="section-items">
    <!-- report-item elements -->
  </div>
</section>
```

Report item (label left, body right):
```html
<article class="report-item">
  <div class="item-label">
    <h3 class="item-title">1. Item title</h3>
    <span class="item-badge">On Track</span>
  </div>
  <div class="item-body">
    <p><strong>Key finding.</strong> Supporting context.</p>
    <ul class="item-bullets"><li>Detail point.</li></ul>
  </div>
</article>
```

Metrics strip (2-4 metrics, `span = 12 / count`):
```html
<div class="metrics-strip">
  <div class="metrics-strip-border"></div>
  <div class="metric" style="grid-column: span 4">
    <div class="metric-value">34%</div>
    <div class="metric-label">Adoption</div>
    <div class="metric-note">vs. 25% target</div>
  </div>
</div>
```

Data table: `<table class="data-table">...</table>`

Slack quote — MUST use this markup for real Slack messages (never `<blockquote>` for Slack):
```html
<a class="slack-quote" href="SLACK_THREAD_URL" target="_blank" rel="noopener">
  <div class="slack-quote-avatar"><img src="AVATAR_URL" alt=""></div>
  <div class="slack-quote-body">
    <div class="slack-quote-header">
      <span class="slack-quote-name">Display Name</span>
      <span class="slack-quote-channel">#channel-name</span>
      <span class="slack-quote-time">Mon Apr 20</span>
    </div>
    <p class="slack-quote-text">Message text.</p>
  </div>
</a>
```

Editorial blockquote (in-section, optional `<cite>` / `<footer>`):
```html
<blockquote>
  <p>Quoted passage in running report copy.</p>
  <cite>Source or chapter</cite>
</blockquote>
```

Featured blockquote (between sections, use rarely):
```html
<div class="report-quote-break">
  <hr class="report-image-break__rule" aria-hidden="true">
  <blockquote class="report-blockquote-break">
    <p>One or two short lines that deserve a louder voice.</p>
    <cite>Optional attribution</cite>
  </blockquote>
  <hr class="report-image-break__rule" aria-hidden="true">
</div>
```

Chart item (chart in body, caption in label):
```html
<article class="report-item report-item--chart-right">
  <div class="item-label">
    <h3 class="item-title">1. Adoption trend</h3>
    <p>Description of what the chart shows.</p>
  </div>
  <div class="item-body">
    <div class="chart-wrap"><canvas id="chart-1"></canvas></div>
    <p class="fig-caption"><span class="fig-ref">Fig. 1</span> — Caption</p>
  </div>
</article>
```

Image-style item (inside a section): `report-item--image-right` + `image-wrap` in `item-body`.

Image-style break (full-width between sections):
```html
<div class="report-image-break">
  <hr class="report-image-break__rule" aria-hidden="true">
  <div class="report-image-break__body">
    <img class="report-image-break__img" src="IMAGE_URL" alt="Concrete description.">
    <p class="fig-caption"><span class="fig-ref">Fig. 3</span> — Centered caption.</p>
  </div>
  <hr class="report-image-break__rule" aria-hidden="true">
</div>
```

Chart.js sizing rules (IMPORTANT):
- Always set `responsive: true` and `maintainAspectRatio: false` in chart options.
- Set explicit canvas height via the `style` attribute based on chart content:
  - Horizontal bar charts: `height` = number of labels × 28px (minimum 200px).
  - Doughnut/pie charts: `style="height:280px"`.
  - Line/area charts: `style="height:250px"`.
- Never rely on Chart.js default aspect ratio.

Citation (MUST include the `cite-tooltip` span):
`<a class="cite-ref" href="https://example.com/source" target="_blank">[1]<span class="cite-tooltip">Source name</span></a>`
- Use the actual source URL in `href`. The link opens in a new tab when clicked.
- If no URL is available for a source, omit the `href` attribute entirely.
- Do NOT use `#fn` anchor links or generate a footnotes/references section.

## PRINTING
- For report-kit reports: Do NOT add a print stylesheet. `style.css` already handles print layout.

### Writing Voice

- Direct. No hedging.
- Concrete. Numbers over assessments.
- BLUF. Lead with the bottom line in `<strong>`.
- Terse. Bullets are single sentences.