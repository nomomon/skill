---
name: slide-kit
description: "Use after artifact-generation for ANY request to create slides, decks, or presentations, OR to help the user prepare to present at a meeting. Trigger words include 'slides,' 'deck,' 'presentation,' 'pitch deck,' 'present,' 'presenting,' OR phrasings like 'I need to present at [meeting]', 'I'm presenting to [audience]', 'help me prepare for [all hands / board / kickoff / demo / review / town hall / leadership update]'. For presentation material — including work-related cases — load artifact-generation first, then this skill, and do not respond to the user or call any other tool before that sequence. Do NOT also load work-collaboration for these requests. This skill handles them end-to-end with its own discovery, research, and production flow. Never load this skill in parallel with `report-kit`; a request is one or the other."
---

## RULE: Do not produce slides without research, questions, and a clear story.

Do not produce output or write any files until you have done all three of the following, in order:

1. **Researched** with multiple tools — Slack, calendar, email, Notion, Drive, memory, web. A single tool call does not count. Aim to cover audience, occasion, source material, and stakes.

2. **Named the thing** — stated the single most important tension, decision, or insight buried in the request, in 2-3 sentences.

3. **Asked the user questions via `AskUserQuestion`** (load it via `ToolSearch` if its schema is deferred) and received answers. Cover both operational unknowns research could not surface and introspective provocations the user was not asking themselves.

Once you have the answers, build the deck. The arc is your call. Don't bounce a "here's the story arc, approve?" `AskUserQuestion` back at the user — the redirect-friction is worse than the risk of getting the shape slightly wrong, and the user can always say "rework it" after seeing the draft.

There are no exceptions. This rule still applies when:

- **The request looks complete.** Research tells you WHAT exists; the user tells you WHY it matters and WHAT TO DO with it. You always need both.

- **The deck looks low-stakes.** A Tuesday standup deck still has a story, an audience, and an outcome. Three sharp questions is fine; zero is not.

- **You think you can infer the deck from context.** Almost always you cannot. The questions exist to surface what the user had not articulated.

If you find yourself about to call a production tool without having satisfied all three steps, stop. Go back. The rest of this skill describes how to do each step well.

---

## Before producing — be a strategist, not a slide generator

A slide deck is a story performed for a specific room to land an outcome — a decision, alignment, comprehension, action, sign-off. It is not a document to be filled in. Your job is to sharpen the user's thinking before any slide exists. Content is downstream of audience and intent — not the other way around.

### Research deep — depth of research is depth of value

A few keyword searches makes you no better than any other slide tool. The questions you ask the user are only as sharp as the research underneath them.

**Understand the people.** Who is presenting? Who's in the room? Search Slack for their messages, check their role, understand what they care about. Preparing a deck for the CEO is fundamentally different from preparing one for a peer team.

**Understand the broader context.** Don't just search the topic keyword. Search for the surrounding strategy, related projects, recent decisions. How does this deck connect to the team's or company's current priorities? One narrow search gives you a narrow deck.

**Follow the threads.** When you find something relevant, go deeper. Read the full Slack thread. Fetch the linked Notion doc. Open past decks on similar topics. References are leads — chase them.

**Check multiple sources in parallel.** Slack has the real opinions. Notion has the structured thinking. Calendar tells you who is in the room. Email has external conversations. Past decks tell you the precedent and tone. Use all of them.

**Calibrate depth to stakes.** For high-stakes work (leadership, cross-team, fundraise, customer-facing), do 10+ tool calls before asking the user a single question. For a quick standup deck, three or four well-chosen calls is enough. Either way: research first, ask second.

You've researched enough when you can answer: Who is this for and what do they care about? What's actually contested? What source material is in play? What changes for the user if this deck lands?

The bar for asking the user is not "I'd like to confirm" — it's "research could not surface this, and I cannot reasonably infer it."

### Name the thing first

Identify the single most important tension, decision, or insight buried in what the user brought you. State it in 2-3 sentences. Make a call. Don't hedge with "there are several angles." This earns the right to probe — you've shown you understand before you ask.

### Ask only what research can't answer

Two flavors of question. Both are sometimes necessary. The second is where you actually matter.

**Operational unknowns** — concrete details research genuinely couldn't surface: timing, format, presenter, live vs. async, who's actually in the room, which source material to use. Ask these only when research came up empty. They're necessary, not differentiating. Every AI tool can ask these.

**Introspective provocations** — the questions the user wouldn't have asked themselves. The thing they're nervous to say out loud. The bolder version of the argument. The "why" under a load-bearing claim. The line someone in the room will quote afterward. The version with half the slides. The audience-knowledge gap they hadn't located. **This is where you win.** Almost no other tool will ask the user "what's the part of this story you're nervous to say out loud?" — and that's the question that produces a deck the room remembers.

Don't run a checklist. Adapt every question to what this deck actually is. Use AskUserQuestion, never plain text. Ask as many as the deck demands; every question must earn its place, but never stop short of the angles the user hadn't considered. A high-stakes deck often warrants a long question round; a quick standup deck might take three. The wrong move is to cap before you've found something the user hadn't thought about.

**Every option in an `AskUserQuestion` must be grounded in something specific from your research.** Options that are guesses make the round worthless — the user reads them, sees nothing matches, and loses faith. If you cannot ground the options in concrete research findings, you have not researched enough. Go back to research before asking. Recency is not relevance: the most recent Slack thread or email is not automatically the right grounding for a question — connect to the deck's actual topic.

**Bad questions, never ask these:**

- "Who is the audience?" — research should tell you. If it didn't, find them on the calendar invite first.

- "What's the format / how long should it be?" — your job to judge from context (live vs. async, meeting length, audience).

- "Should I include X?" — make a call. Don't ask permission for every decision.

- "What level of detail?" — your job to judge from stakes.

Good questions are short, specific to what you found in research, and force the user to pause and think.

Useful directions to probe (illustrative, not exhaustive — pick what cuts deepest, invent what's missing):

- **Outcome + audience as one.** Who's in the room, AND what does the user need them to walk away having decided, agreed to, understood, or done? Audience without intent is half-finished.

- **The one thing.** If the audience remembers a single sentence after the deck ends, what is it? That's the spine. Most decks fail because there isn't one.

- **The bolder version.** What does this argument look like at its largest — the version the user wouldn't have written without being asked? Most decks stop one iteration short.

- **The before / after.** If the deck lands and the audience does what the user wants, what changes — for them, the team, the project? If nothing meaningful changes, why is this deck happening?

- **The contested part.** What's the part of this story the user is nervous to say out loud? That's where the room feels something. Don't bury it.

- **The "why" under the bullet.** Pick a load-bearing claim and ask what's actually under it. Often a bullet exists because the slide needed text — not because the user had thought it through.

- **What the audience already knows vs. needs to know.** If they already buy the problem, don't spend slides on it. Spend them on what hasn't been earned yet.

- **The 30-second version.** If a non-expert had to walk away repeating the point, what's the deck in miniature? If it can't be written, the deck doesn't have a center yet.

- **The fresh-eyes test.** Read the argument as someone with no prior context. Does it assume too much? Is the why obvious before the what?

- **The cut.** What's the version with 50% fewer slides, fewer words, fewer steps? It's usually the better deck.

- **The retold line.** What's the one sentence someone will repeat in the hallway afterward? If it can't be written now, write toward it.

- **Where to zag.** What does every deck on this topic do by default? What happens if you do the opposite?

- **Twelve months from now.** Is the argument made for the situation today or the situation that's coming? What changes if the deck is read in a year?

- **The biggest counter-argument.** What's the strongest argument *against* this — and how does the deck answer it without ducking?

After the user answers, push toward the bolder, more honest, more clearly-told version. Most decks stop one iteration short of where they should.

### Pick the spine yourself and build

After the question round, decide the arc internally — audience, outcome, one thing, sequence — and start producing. Don't pre-confirm the arc with the user; the bounce-back is high-friction for what's usually a forgivable miss, and the user can redirect after seeing the draft. The voice rules below still apply: no em dashes, no decorative emojis.

**Emit a one-line acknowledgement before anything else.** The very first thing in the production turn — before any thinking, before any tool call, before drafting any HTML — output a single short sentence so the user has immediate feedback that you're starting. Something like "Got it: [one phrase summarizing what you heard]. Building now." or "Working on this: [arc verb], then [next beat]." Keep it under ~20 words. The model's planning + first slide draft can take a minute or more; without this one line the user sees nothing happen for the entire span. This is non-negotiable: never go silent into a long production turn.

### What every deck has to do

Every deck has to do something to the audience: persuade, align, inform, train, surface, escalate. A deck that doesn't is a document. Fewer slides, fewer words, fewer steps usually wins. Celebrate what you cut as much as what you keep.

Don't be sycophantic. Don't add caveats. Don't list five options when you have an opinion. Don't stop at "answering the request"; change how the user thinks about the deck.

### Voice rules (apply everywhere this skill produces text)

- **Never use em dashes (—).** Anywhere. Slide content, chat replies. Use periods, colons, parentheses, or natural sentence form instead.

- **No decorative emojis. Anywhere.** Slides, chat. The bar for using an emoji is: the emoji itself carries meaning (a literal status indicator like ✓ or ✗ in a checklist, a slide explicitly about an emoji, content the user provided with emojis intact). Default: no emojis. Visual hierarchy comes from size, position, and color, not decoration. ✨ 🚀 💡 📊 in headlines or cards cheapens the deck.

- Write the way a sharp colleague talks. Not robotic, not labeled, not bulleted-when-prose-would-do.

- No filler ("notably," "crucially," "leverage," "robust," "streamline").

---

## Generation — using the template

When the user asks for a **slide deck, presentation, pitch deck, or slides**, use this complete template. It produces an interactive deck with a sidebar of real slide thumbnails. Scroll/trackpad gestures and arrow keys both advance one slide at a time (Google Slides style); presenter view adds on-screen prev/next buttons.

**Architecture in one paragraph:** Each slide is a fixed **1280×720 pixel canvas** (`.slide-canvas`) wrapped in a 16:9 chrome (`.slide`). The canvas is scaled to fit the actual rendered size via CSS `transform: scale(calc(100cqi / 1280px))` — no JS measuring, no fluid typography, no `clamp()`/`vw`/`vh`. **Every dimension inside the canvas is authored at slide-pixel scale via design tokens** (H1 128px, H2 48px, body 24px, stat metric 80px, hero metric 140px, padding 48×53px), all weight 400. Layout is meta-top / body-fill: `app.js` wraps every canvas's children in a `.slide-body` flex column on load (no author action required). Canvas variants pick the layout: default (top-left title, content stacks below — most slides), `.slide-canvas--title` (Figma title slide: headline upper / subtitle anchored low, inner `.slide-title-stack`), `.slide-canvas--center` / legacy `.hero` (centered content in `.slide-center-fill`), `.slide-canvas--stage-center` (top-left headline + `.slide-stage` centered in the remainder).

**How to use:**

1. Copy the FULL template below into your artifact's `index.html` inside `{working_dir}/artifacts/<descriptive_name>/`

2. Replace the example slide content inside each `<div class="slide-canvas">` with your actual content. Every slide must follow the structure: `<div class="slide"><div class="slide-canvas [variant]">...</div></div>`. **Do not author a `<div class="slide-body">` yourself — `app.js` wraps the canvas's children at load time.**

3. Pick the canvas variant that fits the slide:

    - Default (no variant class) — content slides with the title (`<h2>`) at the top-left and content stacked below.

    - `slide-canvas--title` — the deck's title slide. Wrap `<h1>` + `<p class="subtitle">` in `<div class="slide-title-stack">`.

    - `slide-canvas--center` (or legacy `hero`) — pure quote / pure big-number / split-screen image slides. Wrap content in `<div class="slide-center-fill">` to center it horizontally and vertically.

    - `slide-canvas--stage-center` — when you want the headline pinned top-left but the supporting content (chart, big stat) optically centered in the lower area. Wrap the supporting content in `<div class="slide-stage">`.

4. Use the design tokens via the named utility classes (`<p class="body">`, `<p class="subtitle">`, `<p class="stat-value">`, etc.). Don't author your own `font-size` inside `.slide-canvas`; the token system handles the scale. Do **not** introduce `clamp()`, `vw`, `vh`, or relative font sizing inside slides — the canvas is fixed at 1280×720 and scales as a whole.

5. Hierarchy is size / color / spacing — `<strong>` and `<b>` no longer add visual weight (the design is uniform weight 400). Reach for `.accent`, a heading level, or a callout layout to add emphasis.

6. Add or remove `<div class="slide-wrap" id="slide-N" data-title="...">` blocks to match the arc you decided on. Length follows the story (a standup might be 3-5; a board deck might be 15+). Mix layouts; don't repeat the same one twice in a row. **Each slide-wrap MUST have `id="slide-N"` where N is its 1-based position in the deck** so annotations the user requests on a slide carry a stable selector to the agent.

7. **The `<title>` tag becomes the slide-meta center label on every slide.** Every slide gets a header row injected by `app.js` (date left, deck title center, "N / Total" right). The center text is pulled once from `document.title`, so set `<title>Your Deck Title</title>` to whatever you want shown on every slide. Keep it short — it's a chip label, not a headline (5-8 words max, no period). `data-title` on each slide-wrap is unrelated; it's just the thumbnail tooltip / chip label.

8. Leave `--accent` as the default `#000` black. Don't override it; don't pick custom palettes (see Color and style section).

9. **Copy the skill's runtime assets into your artifact directory.** Use the `Bash` tool with `cp -r` (the `-r` flag is required — `fonts/` is a directory):

```
cp -r .claude/skills/slide-kit/assets/* "$TMPDIR/<descriptive_folder>/"
```

This copies: `style.css` (deck shell, sidebar, canvas scaling), `app.js` (navigation, thumbnails, presenter mode), and `fonts/` (Exposure typeface). After copying, verify with `ls` that all three exist — if `fonts/` is missing, the deck renders but typography falls back to system fonts with no visible error.

Keep the `<link rel="stylesheet" href="style.css">` from the template. Also add `<script src="app.js"></script>` before `</body>` in your `index.html`.

10. You may add custom CSS classes for your slide content in an inline `<style>` block, but do NOT modify the shell/sidebar/thumbnail/slide-wrap/slide/slide-canvas CSS from `style.css`. Do NOT write your own copy of the framework CSS. An inline `<style>` is only for deck-specific custom classes you author for this deck's content. **Print styles are handled by the bundled `style.css` — do not add your own `@media print` block.** This carves out an explicit exception to the general artifact-generation rule about never overriding backgrounds in print: a slide deck's print mode is presenter-style and chrome-free by design.

11. After writing the file, save artifacts to the system's temp directory. Use `$TMPDIR` on macOS (which resolves to something like `/var/folders/.../T/`), or `/tmp` as fallback. After writing all files, run `open $TMPDIR/<descriptive_name>/index.html` (macOS), `xdg-open` (Linux), or `start` (Windows) to open the artifact in the browser. **You must re-open the file every time you edit it, not just on first create.**

12. **CRITICAL:** Keep the `<!-- slide-kit -->` HTML comment as the first thing inside `<body>`. This marker identifies the artifact as a slide deck. Do not remove it, do not move it.

## Full template

```html

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DECK_TITLE_HERE</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<!-- slide-kit -->
<div class="shell">
  <aside class="sidebar">
    <div class="thumb-list-wrap">
      <div class="thumb-list" id="thumbList" role="navigation"></div>
    </div>
    <div class="sidebar-actions">
      <button class="presenter-btn" id="presenterBtn" type="button">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        Present

        <span class="kbd-hint">P</span>
      </button>
      <div class="navigator">
        <div class="nav-arrows">
          <button class="nav-arrow" id="navPrev" type="button" aria-label="Previous slide">&larr;</button>
          <button class="nav-arrow" id="navNext" type="button" aria-label="Next slide">&rarr;</button>
        </div>
        <span class="nav-counter">
          <span class="nav-current" id="navCurrent">1</span>
          <span class="nav-of">of</span>
          <span class="nav-total" id="navTotal">1</span>
        </span>
        <button class="light-table-btn" id="lightTableBtn" type="button" aria-label="View all slides" title="View all slides">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        </button>
      </div>
    </div>
  </aside>
  <main>
    <div class="main-scroll" id="mainScroll">
      <!-- 1. Title slide -->
      <div class="slide-wrap" id="slide-1" data-title="Title">
        <div class="slide">
          <div class="slide-canvas slide-canvas--title">
            <div class="slide-title-stack">
              <h1>Headline with <span class="accent">accent word</span></h1>
              <p class="subtitle">Subtitle anchored near the bottom of the slide.</p>
            </div>
          </div>
        </div>
      </div>
      <!-- 2. Big number (centered) -->
      <div class="slide-wrap" id="slide-2" data-title="Big Number">
        <div class="slide">
          <div class="slide-canvas slide-canvas--center">
            <div class="slide-center-fill">
              <p class="big-number">73%</p>
              <p class="big-number-context">A single sentence of context that gives this number meaning.</p>
            </div>
          </div>
        </div>
      </div>
      <!-- 3. Stats row (stage-center) -->
      <div class="slide-wrap" id="slide-3" data-title="Stats Row">
        <div class="slide">
          <div class="slide-canvas slide-canvas--stage-center">
            <h2>Section heading</h2>
            <p class="body">Brief supporting text.</p>
            <div class="slide-stage">
              <div class="stats-row">
                <div class="stat"><p class="stat-value">73%</p><p class="stat-label">Metric label</p></div>
                <div class="stat"><p class="stat-value">4.2x</p><p class="stat-label">Metric label</p></div>
                <div class="stat"><p class="stat-value">89%</p><p class="stat-label">Metric label</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 4. Card grid (default) -->
      <div class="slide-wrap" id="slide-4" data-title="Card Grid">
        <div class="slide">
          <div class="slide-canvas">
            <h2>Three parallel concepts</h2>
            <div class="slide-card-grid">
              <div class="card"><h3>First concept</h3><p>Short description of the first concept.</p></div>
              <div class="card"><h3>Second concept</h3><p>Short description of the second concept.</p></div>
              <div class="card"><h3>Third concept</h3><p>Short description of the third concept.</p></div>
            </div>
          </div>
        </div>
      </div>
      <!-- 5. Numbered bullets (default) -->
      <div class="slide-wrap" id="slide-5" data-title="Numbered Bullets">
        <div class="slide">
          <div class="slide-canvas">
            <h2>Three things to remember</h2>
            <ol class="slide-bullets">
              <li>
                <strong>Anchor the audience</strong>
                <p class="slide-bullet-text">Lead with what they care about, not what you built.</p>
              </li>
              <li>
                <strong>Make one point per slide</strong>
                <p class="slide-bullet-text">If the slide tries to make three, the room remembers none.</p>
              </li>
              <li>
                <strong>Close with the ask</strong>
                <p class="slide-bullet-text">Tell them what to do next while they're still leaning in.</p>
              </li>
            </ol>
          </div>
        </div>
      </div>
      <!-- 6. Quote (centered) -->
      <div class="slide-wrap" id="slide-6" data-title="Quote">
        <div class="slide">
          <div class="slide-canvas slide-canvas--center">
            <div class="slide-center-fill">
              <p class="quote">"A pull quote that lands on its own."</p>
              <p class="quote-attribution">Attribution</p>
            </div>
          </div>
        </div>
      </div>
      <!-- 7. Before / After comparison -->
      <div class="slide-wrap" id="slide-7" data-title="Before and After">
        <div class="slide">
          <div class="slide-canvas">
            <h2>Before / after</h2>
            <div class="philosophy-grid">
              <div class="philosophy-card before">
                <p class="phi-label">Before</p>
                <p class="phi-title">The old way, framed honestly.</p>
                <p class="phi-body">One or two sentences describing the prior state.</p>
              </div>
              <div class="philosophy-card after">
                <p class="phi-label">After</p>
                <p class="phi-title">The new way, framed sharply.</p>
                <p class="phi-body">One or two sentences describing the new state.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
<!-- Presenter mode chrome -->
<div class="presenter-chrome" id="presenterChrome">
  <span class="counter" id="presenterCounter">1 of 1</span>
  <button class="exit-btn" id="presenterExit" type="button" title="Esc">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    Exit

  </button>
</div>
<!-- Light table overlay -->
<div class="light-table" id="lightTable">
  <div class="light-table-header">
    <div class="light-table-title">All Slides</div>
    <button class="light-table-close" id="lightTableClose" type="button" aria-label="Close (Esc)" title="Close (Esc)">
      <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="light-table-grid" id="lightTableGrid"></div>
</div>
<script src="app.js"></script>
</body>
</html>
```

## Slides are not web pages

The most common failure in this skill is producing slides that look like landing-page sections: titles stacked above body content, sub-headers inside slides, dense paragraphs, decorative emojis. Don’t do this.

Slides are a different medium from web pages. Draw on standard slide design tradition: Apple keynotes, McKinsey decks, magazine and editorial spreads, conference talks, designer-built decks. The vocabulary is rich and well-developed. Use your design judgment to pick what serves each slide; vary layouts and the relationship of title to content slide by slide.

## Color and style

One theme: white slides, black text, monochrome accent. The template’s :root --accent⁠ is set to #000⁠ so the deck takes on the visual identity of the subject rather than a tool’s brand. Don’t override it. Don’t pick custom palettes. Don’t invent multi-color schemes. Use the .accent⁠ class on key words you want to weight typographically; reach for size, weight, and whitespace before color.

Commit to a visual motif. Pick one distinctive element and repeat it on every slide: rounded image frames, icons in small black circles, thick single-side borders, a recurring shape, a numbered tag. The motif is what makes a deck feel designed rather than assembled.

## For each slide

Every slide needs a visual element. Image, chart, icon, or shape. Text-only slides are forgettable.

### Layout options to mix across the deck:

- Two-column (text on one side, visual on the other)

- Icon + text rows (icon in small black circle, bold header, description below)

- 2x2 or 2x3 grid (image on one side, grid of content blocks on the other)

- Half-bleed image (full left or right side) with content overlay

- Centered title with a single large supporting visual

- Big number with one sentence of context

### Data display patterns:

- Large stat callouts (big numbers with small labels below)

- Comparison columns (before/after, pros/cons, side-by-side)

- Timeline or process flow (numbered steps with connectors)

### Visual polish:

- Icons in small black circles next to section headers

- Italic accent text for key stats or taglines

- A single muted shape behind a stat to anchor it

Don’t repeat the same layout more than twice across the deck. The rhythm of varied formats is what keeps the eye engaged.

## Anti-patterns (specific tells of AI-generated slides)

These reliably mark a deck as AI-generated. Don’t ship any of them.

- Never use accent lines or thin underline bars under titles. The single most identifiable hallmark of AI-generated slides.

- No decorative full-width colored bars, ribbons, or stripes at the top or bottom of slides.

- Don’t default to cream or beige backgrounds. Background is white (#FFFFFF⁠).

- Don’t center body text. Left-align paragraphs, lists, and rows of bullets. Center only titles or single-line callouts.

- Don’t center titles on content slides. Real slide decks put titles top-left ~95% of the time.

- Don’t use low-contrast type or icons. No light-on-light, no dark-on-dark.

- Never author a rounded box with a thick colored left border for comparisons, pull quotes, or callouts. That accent-bar-on-a-card shape is an AI tell.

## Slide content guidelines

- Each slide should have one clear idea. Length follows the story and the time slot.

- Use the full 16:9 canvas — center content vertically and horizontally.

- The template’s --accent⁠ is preset to #000⁠ (black). Don’t override it.

- Let the story drive the format. Each slide is making a point. Choose the visual format that makes that point land.

## Slide sizing and readability (IMPORTANT)

CRITICAL: Content must NEVER overflow or get clipped by the slide. The .slide-canvas⁠ is a fixed 1280×720 pixel canvas. Content authored within it must fit. If content overflows, it will be clipped (the outer .slide⁠ has overflow: hidden⁠). Cut content rather than ship a clipped slide.

The slide-meta is the only top-of-slide chrome — don’t author your own. app.js⁠ auto-injects a .slide-meta⁠ row at the top of every .slide-canvas⁠.

Budget the slide-meta into your vertical math. The meta chrome reserves roughly ~10px for the meta row plus a 60px stack gap below it before your content starts. With the canvas’s 48px top + 48px bottom padding, your usable body height is roughly:

- 720 (canvas) − 48 (top pad) − 10 (meta) − 60 (gap below meta) − 48 (bottom pad) ≈ ~554px for slide body

Then subtract the headline (h2 ≈ 54px, h1 ≈ 134px) and the headline-to-content rhythm margin (≈ 89px when no subtitle is present) — most content slides have roughly ~300–400px of real estate below the headline for stats, cards, bullets, etc.

Density discipline — slides are not pages. Concrete budget at the design’s type scale:

- A content slide has room for one <h2>⁠ plus roughly 4–6 short lines of body text, OR one component (stats row / card grid / two-column / quote / bullets) with a brief lede. Not both at once.

- A <p class="body">⁠ should be one sentence, two at most.

- Bullets max 3–5 items per slide, each one short.

- Card grids max 3 cards with one short sentence each.

- If the slide spine for this beat is “explain X, then Y, then Z,” that’s three slides, not one.

The bottom of the canvas is a hard wall, not a soft target. When in doubt, cut.

## Editable text tags (required for in-place edits)

The artifact-edit harness stamps these tags for inline editing — and ONLY these tags: <p>⁠, <h1>⁠–<h6>⁠, <li>⁠, <blockquote>⁠, <dt>⁠, <dd>⁠, <caption>⁠, <figcaption>⁠, <td>⁠, <th>⁠, <pre>⁠. Text wrapped in plain <div>⁠ cannot be clicked into for editing. Default to <p>⁠ for every slide-content text block.

## Typography reference (tokenized, authored at 1280×720 canvas)

| Element | Class / Tag | Size |
| --- | --- | --- |
| Title slide headline | `<h1>` inside `.slide-title-stack` | 128px |
| Subtitle (under headline) | `<p class="subtitle">` | 48px |
| Content slide title | `<h2>` | 48px |
| Section accent / sub-title | `<h3>` | 24px solid black |
| Body / lede paragraph | `<p class="body">` | 24px |
| Big number callout | `.big-number` | 140px |
| Big number context | `.big-number-context` | 24px |
| Stat value | `.stat-value` | 80px |
| Stat label | `.stat-label` | 20px muted |
| Card heading | `.card h3` | 24px solid black |
| Card body | `.card p` | 24px muted |
| Quote text | `.quote` | 52px |
| Bullet title row | `.slide-bullets li <strong>` | 24px |
| Bullet body row | `.slide-bullets li .slide-bullet-text` | 24px muted |
| Caption | `.type-caption` | 20px |
| Tag / eyebrow | `.type-tag` or `.phi-tag` | 12px uppercase |
| Meta header | `.slide-meta` | 15px uppercase |
| Footnote | `.type-footnote` | 14px |
| Pull-quote / promo | `.philosophy-card .phi-title` | 34px |

Stat consistency rule: When you have multiple peer stats on one slide, they MUST all use the same .stat-value⁠ size.

## Layout

- Padding inside .slide-canvas⁠ is 48px 53px⁠ by default (tokens --slide-pad-y⁠ / --slide-pad-x⁠). Don’t override.

- Don’t author <div class="slide-body">⁠ — app.js⁠ wraps the canvas’s children for you on load.

- Pick a canvas variant that fits the slide.

- The canvas scales to fit the actual rendered slide via CSS transform.

## Data visualization guidance

When a deck involves data, metrics, or analysis, the choice of visualization should follow from what the data is saying.

Match the visualization to the data’s story:

- Change over time: Line chart.

- Before vs. after, or comparing categories: Horizontal or vertical bar chart.

- Parts of a whole: Stacked bar or doughnut chart.

- Correlation or distribution: Scatter plot.

- Ranking or league table: Horizontal bar chart sorted by value.

- A single headline metric: Big number with a short sentence of context.

- Comparison to a goal or threshold: Bar or line chart with a reference line.

- Showing density or patterns across two dimensions: Heatmap.

### Presentation principles:

- Every chart should have a clear takeaway in the slide heading.

- Label axes clearly but minimally. Remove grid lines when they add noise. Use beginAtZero: true⁠ for bar charts.

- Use your --accent⁠ color for the primary data series and muted grays for secondary/comparison series.

- A chart with 3–7 data points is ideal.

- When you have the data, prefer a chart over a stat callout.

- For data readout or metrics decks, aim for roughly half the slides to include a visualization.

## Images and avatars

For people/team slides, use the avatar URLs already in your context from research. Real verified avatars are the goal. Initials are a fallback only for people who didn’t appear anywhere in your research.

### Where avatar URLs come from

Every Slack tool response includes an <authorAvatarURL>⁠ field for the author of every message. By the time you’re producing a team slide, your research has almost certainly surfaced messages authored by the people on the team — their avatar URLs are already in your context. Use them.

### Default flow for a team slide

For each person on the slide:

- Scan your existing research results for messages where <authorDisplayName>⁠ or <authorFirstName>⁠ matches that person. Grab the <authorAvatarURL>⁠ from any such message.

- Use that real avatar URL.

- Only if the person genuinely never appeared in research, do one targeted search_slack⁠ for their name.

- If still nothing, fall back to the .initial-avatar⁠ CSS class with their initials.

### Never

- Use a URL you can’t trace to a specific message authored by that exact person.

- Reuse one URL across multiple people.

- Default to initials for everyone when avatar URLs are sitting in your context.

### Local/attached images

Put the proxy file in images/⁠ at the artifact root with the filename unchanged, and reference via relative path.

## Approved CDN Libraries

The artifact sandbox allows loading scripts from a curated set of CDN-hosted libraries. Use the exact URLs below — other CDN URLs will be silently blocked by the Content Security Policy.

- Chart.js 4.5.0: https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js⁠

- D3.js 7.9.0: https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js⁠

- Three.js 0.180.0: https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js⁠

- p5.js 2.0.5: https://cdn.jsdelivr.net/npm/p5@2.0.5/lib/p5.min.js⁠

- Anime.js 4.3.6: https://cdn.jsdelivr.net/npm/animejs@4.3.6/lib/anime.min.js⁠

- GSAP 3.13.0: https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js⁠

- Tone.js 15.3.5: https://cdn.jsdelivr.net/npm/tone@15.3.5/build/Tone.min.js⁠

- Matter.js 0.20.0: https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js⁠

Version notes: Three.js loads as a regular script (global `THREE`). Anime.js is v4 API only. p5.js v2 has breaking changes from v1.

Do NOT: use versions other than those listed above, use unlisted libraries, or load external fonts. Implement unlisted functionality inline with vanilla HTML/CSS/JavaScript.

## Title tag

When creating a <title>⁠, NEVER use an em dash or dash, “–” or “-”.

