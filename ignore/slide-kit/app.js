/**
 * Slide-Kit App
 *
 * Owns deck navigation, sidebar thumbnails, navigator (← N of M →),
 * light-table overview, presenter mode chrome, native-fullscreen toggle,
 * wheel + keyboard navigation, per-slide selection with the floating
 * "Request edits" affordance, and the structural-edit UX on the thumb
 * list: Cmd/Shift+click multi-select and pointer-driven drag-to-reorder
 * with a single rewriting hidden annotation that the artifact-edit
 * harness picks up via `extractPendingEdits`.
 *
 * Authored deck content is just the `<div class="slide-wrap" data-title="…">`
 * blocks; this file binds the surrounding shell, sidebar, presenter-chrome,
 * and light-table HTML.
 *
 * Mounted by SlideKitPostProcessor as a `<script src="app.js">` injected
 * just before `</body>` — so by the time this script parses, every
 * `.slide-wrap` and chrome node already exists in the DOM. The template
 * is responsible for providing the chrome elements this script queries
 * by id (thumbList, mainScroll, navPrev, navNext, navCurrent, navTotal,
 * presenterBtn, presenterChrome, presenterExit, presenterCounter,
 * lightTable, lightTableGrid, lightTableClose, lightTableBtn).
 *
 * `slideWraps` is a STATIC NodeList captured at script start; its indices
 * are the original-source slide indices and never change. Display order
 * is tracked separately in `slideOrder` (where slideOrder[displayPos]
 * yields the original index). Reordering moves thumb-btn elements within
 * `thumbList` and rewrites `slideOrder`; slide-wrap DOM order is left
 * untouched because the CSS only shows the one with `.current`.
 */

(function () {
  const slideWraps = document.querySelectorAll('.slide-wrap');
  const thumbList = document.getElementById('thumbList');
  const mainScroll = document.getElementById('mainScroll');
  // Display-order → original-index. Reordering rewrites this; slideWraps stays
  // pinned to original indices so `slideWraps[origIdx]` is always the same node.
  const slideOrder = Array.from(slideWraps, (_, i) => i);
  // `current` is the DISPLAY position of the in-view slide, not the original index.
  let current = 0;
  // Anchor for shift-click range selection (display position of the last plain click).
  let selectionAnchorDisplay = 0;
  // Multi-selection set keyed by ORIGINAL index so it survives reorders.
  const multiSelected = new Set();
  // Pending deletes (original indices). Slides stay in place / navigable so
  // the user can see what they marked; the apply step is what actually removes
  // them. Toggle via the × affordance on thumbs/light-table cards or via
  // Backspace/Delete on the multi-selection.
  const pendingDelete = new Set();

  // Inject `.slide-meta` per slide: date (left), deck title (center, from
  // `document.title`), and "N / Total" index (right). Authored HTML stays
  // free of dates and counters — the deck author only provides `<title>`
  // for the deck and `data-title` on each `.slide-wrap` (used by the
  // thumbnail tooltip / chip label, not the in-slide meta header).
  function formatSlideMetaDate(d) {
    return d
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      .toUpperCase();
  }
  function injectSlideMeta() {
    const total = slideWraps.length;
    const dateStr = formatSlideMetaDate(new Date());
    // Deck-wide title — same on every slide. Comes from <title> so the
    // LLM controls it from one place, and it stays in sync with the
    // browser-tab title automatically. data-title on each slide-wrap
    // is unrelated (it's the thumbnail tooltip / chip label).
    const deckTitle = (document.title || '').trim();
    slideWraps.forEach((wrap, i) => {
      const canvas = wrap.querySelector('.slide-canvas');
      if (!canvas || canvas.querySelector('.slide-meta')) return;
      const meta = document.createElement('header');
      meta.className = 'slide-meta';
      meta.setAttribute('aria-label', 'Slide info');
      const dateSpan = document.createElement('span');
      dateSpan.className = 'slide-meta-date';
      dateSpan.textContent = dateStr;
      const titleSpan = document.createElement('span');
      titleSpan.className = 'slide-meta-title';
      titleSpan.textContent = deckTitle;
      const indexSpan = document.createElement('span');
      indexSpan.className = 'slide-meta-index';
      indexSpan.textContent = (i + 1) + ' / ' + total;
      meta.appendChild(dateSpan);
      meta.appendChild(titleSpan);
      meta.appendChild(indexSpan);
      canvas.insertBefore(meta, canvas.firstChild);
    });
  }
  injectSlideMeta();

  // Re-stamp the on-slide "N / Total" header for every slide based on its
  // current display position. injectSlideMeta only runs once at startup, so
  // anything that changes display order (drag-reorder via applyOrder) must
  // call this to keep the in-canvas counter aligned with the navigator and
  // light-table labels.
  function refreshSlideMetaIndices() {
    const total = slideWraps.length;
    slideOrder.forEach((origIdx, displayPos) => {
      const wrap = slideWraps[origIdx];
      if (!wrap) return;
      const indexSpan = wrap.querySelector('.slide-meta-index');
      if (!indexSpan) return;
      indexSpan.textContent = (displayPos + 1) + ' / ' + total;
    });
  }

  // Auto-fit a slide's stack-gap. Default is generous (60px) so tight slides
  // breathe; when content would overflow the fixed 720px canvas, binary-search
  // the largest gap that fits, down to FIT_MIN_GAP. Synchronous so the slide
  // never paints in the overflowing state (no flicker). ~4 layout reflows in
  // the worst case; negligible cost per slide change.
  const FIT_PREFERRED_GAP = 60;
  const FIT_MIN_GAP = 6;
  function fitSlideToCanvas(wrap) {
    if (!wrap) return;
    const canvas = wrap.querySelector('.slide-canvas');
    if (!canvas) return;
    canvas.style.setProperty('--slide-body-stack-gap', FIT_PREFERRED_GAP + 'px');
    // Measure overflow on `.slide-body`, not the canvas. The canvas is a
    // fixed-720px flex column; `.slide-body` is a `flex: 1 1 auto;
    // min-height: 0` child, so when its content exceeds the allocated flex
    // space the body's box is shrunk to fit and its content overflows the
    // body. The canvas's own scrollHeight only sees the shrunken body box,
    // so it stays equal to its 720 clientHeight even when content is
    // visibly clipping — measuring the body itself is the only reliable
    // signal.
    const body = canvas.querySelector('.slide-body');
    const isOverflowing = () => body
      ? body.scrollHeight > body.clientHeight
      : canvas.scrollHeight > canvas.clientHeight;
    if (!isOverflowing()) return;
    let lo = FIT_MIN_GAP, hi = FIT_PREFERRED_GAP;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      canvas.style.setProperty('--slide-body-stack-gap', mid + 'px');
      if (isOverflowing()) hi = mid;
      else lo = mid;
    }
    canvas.style.setProperty('--slide-body-stack-gap', lo + 'px');
  }
  function fitCurrentSlide() { fitSlideToCanvas(wrapAt(current)); }

  // Match the slide-meta color to the first visible text element on the
  // active slide. Contrast for free across light/dark themes — wherever
  // the body text reads, the meta reads.
  function applySlideMetaColor() {
    if (!slideWraps.length) return;
    const wrap = wrapAt(current);
    if (!wrap) return;
    const meta = wrap.querySelector('.slide-meta');
    if (!meta) return;
    const scope = wrap.querySelector('.slide-body') || wrap.querySelector('.slide-canvas');
    if (!scope) return;
    const candidates = scope.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd');
    for (const el of candidates) {
      if (el.closest('.slide-meta')) continue;
      if (!el.textContent || !el.textContent.trim()) continue;
      meta.style.color = getComputedStyle(el).color;
      return;
    }
    meta.style.removeProperty('color');
  }

  // Wrap every `.slide-canvas`'s children in `.slide-body` so the design's
  // meta-top / body-fill layout rules apply. With `.slide-meta` injected
  // above, the wrap starts from the sibling after the meta. Idempotent
  // (skips canvases that already wrap).
  function wrapSlideBody() {
    slideWraps.forEach((wrap) => {
      const canvas = wrap.querySelector('.slide-canvas');
      if (!canvas || canvas.querySelector('.slide-body')) return;
      const meta = canvas.querySelector('.slide-meta');
      let node = meta ? meta.nextSibling : canvas.firstChild;
      if (!node) return;
      const body = document.createElement('div');
      body.className = 'slide-body';
      while (node) {
        const next = node.nextSibling;
        body.appendChild(node);
        node = next;
      }
      canvas.appendChild(body);
    });
  }
  wrapSlideBody();

  // Permalinks: canonical `#slide-<N>` (1-based, matches the on-screen
  // counter). `replaceState` so reloads and shared links reopen the same
  // slide without flooding history per step.
  function parseHashToSlideIndex() {
    const total = slideWraps.length;
    if (!total) return null;
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw) return null;
    let n = NaN;
    const mSlide = /^slide-(\d+)$/i.exec(raw);
    if (mSlide) n = parseInt(mSlide[1], 10);
    else if (/^\d+$/.test(raw)) n = parseInt(raw, 10);
    else return null;
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.min(n, total) - 1;
  }
  function replaceUrlForSlide(displayIdx) {
    if (displayIdx < 0 || displayIdx >= slideOrder.length) return;
    const path = window.location.pathname + window.location.search + '#slide-' + (displayIdx + 1);
    try { history.replaceState(null, '', path); } catch (e) { /* ignore */ }
  }

  // outerHTML doesn't preserve a <canvas> drawing buffer, so chart slides
  // would otherwise show blank thumbnails. Copy painted pixels from each
  // original canvas into the matching cloned canvas.
  function snapshotCanvases(originalSlide, clonedSlide) {
    const orig = originalSlide.querySelectorAll('canvas');
    const clone = clonedSlide.querySelectorAll('canvas');
    for (let j = 0; j < Math.min(orig.length, clone.length); j++) {
      if (orig[j].width === 0 || orig[j].height === 0) continue;
      try { clone[j].getContext('2d').drawImage(orig[j], 0, 0); } catch (e) { /* drawImage can throw on tainted/cross-origin canvases; a blank thumb is fine */ }
    }
  }
  function refreshThumbnailCanvases() {
    thumbList.querySelectorAll('.thumb-btn').forEach((btn) => {
      const origIdx = parseInt(btn.dataset.origIdx, 10);
      const cs = btn.querySelector('.slide');
      if (cs && Number.isFinite(origIdx) && slideWraps[origIdx]) {
        snapshotCanvases(slideWraps[origIdx].querySelector('.slide'), cs);
      }
    });
  }

  // .thumb-clone-wrap is 1067×600 (matches the natural slide size); the
  // .thumb-card it lives in is 160×90. Pick the smaller scale so the
  // clone fits without overflow.
  const thumbScale = Math.min(160 / 1067, 90 / 600);
  // Replace the clone's children with a fresh copy of the live slide.
  // Used both on initial build and inside a MutationObserver so the
  // thumbnail tracks edits to the source slide. We strip the artifact-edit
  // harness's transient decoration from the clone (the yellow active-edit
  // highlight, floating annotation badges/popovers, overlay highlights,
  // and the contenteditable attribute) so the thumbnail shows the slide's
  // content state, not the in-flight editing chrome.
  function syncThumbClone(cloneWrap, sourceSlide) {
    const clone = sourceSlide.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('.dia-direct-edit-active').forEach((el) => el.classList.remove('dia-direct-edit-active'));
    // Floating chrome (badges, popovers, overlay highlights) have no content
    // worth preserving — drop the whole element.
    clone.querySelectorAll('.dia-annotation-badge, .dia-annotation-popover, .dia-annotation-highlight-overlay').forEach((el) => el.remove());
    // Inline `.dia-annotation-highlight` is a span wrapped AROUND slide content
    // via surroundContents; removing it would take the wrapped children with it
    // and blank the thumbnail. Unwrap instead so the children stay in place.
    clone.querySelectorAll('.dia-annotation-highlight').forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    });
    cloneWrap.replaceChildren(clone);
    snapshotCanvases(sourceSlide, clone);
  }

  // Build thumbnails by cloning actual slide content (scaled down), and
  // append the floating "Request edits" action button to each slide-wrap.
  // The action button is hidden by default and revealed via the .selected
  // class on the slide-wrap (see CSS).
  slideWraps.forEach((wrap, origIdx) => {
    // Stable per-slide id so harness annotations resolve to a meaningful
    // CSS selector ("#slide-3 ...") and the agent can reference slides by
    // their display number. We only assign when missing so a deck author
    // can override.
    if (!wrap.id) wrap.id = 'slide-' + (origIdx + 1);
    const title = wrap.dataset.title || 'Slide ' + (origIdx + 1);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb-btn' + (origIdx === 0 ? ' active' : '');
    btn.title = title;
    btn.dataset.origIdx = String(origIdx);
    const card = document.createElement('div');
    card.className = 'thumb-card';
    const cloneWrap = document.createElement('div');
    cloneWrap.className = 'thumb-clone-wrap';
    cloneWrap.style.transform = 'scale(' + thumbScale + ')';
    const sourceSlide = wrap.querySelector('.slide');
    syncThumbClone(cloneWrap, sourceSlide);
    // Re-clone whenever the source slide mutates. Keeps the thumbnail in
    // sync with the live slide automatically — no manual rebuild calls.
    new MutationObserver(() => syncThumbClone(cloneWrap, sourceSlide))
      .observe(sourceSlide, { childList: true, subtree: true, attributes: true, characterData: true });
    card.appendChild(cloneWrap);
    // × affordance for pending-deletion. Hover-revealed (also shown while the
    // thumb is multi-selected or already marked). pointerdown.stopPropagation
    // prevents the parent thumb-btn's drag tracker from treating the press
    // on the delete affordance as the start of a drag.
    const deleteBtn = makeDeleteAffordance(() => togglePendingDelete(origIdx), 'thumb-delete-btn');
    card.appendChild(deleteBtn);
    const label = document.createElement('span');
    label.className = 'thumb-label';
    label.textContent = origIdx + 1;
    btn.appendChild(card);
    btn.appendChild(label);
    // Pointer-driven interaction: a plain click navigates, Cmd/Shift+click
    // updates the multi-selection, and a press-and-drag past DRAG_THRESHOLD
    // promotes the gesture to a drag-to-reorder. Installed in installThumbInteraction
    // so the threshold logic is shared and we never double-fire on click.
    installThumbInteraction(btn);
    thumbList.appendChild(btn);

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'slide-action-btn';
    actionBtn.setAttribute('aria-label', 'Request edit for this slide');
    actionBtn.textContent = 'Request edit';
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      enterEditModeForSlide(wrap, actionBtn);
    });
    wrap.appendChild(actionBtn);
  });

  // Build the small × button shared by thumb-btns and lt-slide-btns. The
  // pointerdown.stopPropagation prevents the parent's drag tracker (or any
  // ancestor click handler) from treating the press on × as a drag-start
  // or a navigation gesture.
  function makeDeleteAffordance(onToggle, className) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.setAttribute('aria-label', 'Mark slide for deletion');
    b.textContent = '×';
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      onToggle();
    });
    return b;
  }

  // ── "Request edit" → open the harness's annotation popover ──
  // Same behavior as selecting text inside a report and clicking the
  // floating "Request edit" pill: the harness creates an annotation
  // anchored to a range, drops a highlight on it, and opens a popover
  // textarea for free-form edit instructions. The annotation spans the
  // entire `.slide-canvas` so the agent receives the full slide content
  // as context. `surroundContents` will fail on this multi-block range,
  // and the harness falls back to an overlay highlight sized to the
  // canvas's bounding rect.
  function enterEditModeForSlide(wrap, fromEl) {
    // The harness lives in an isolated content world (separate `window`
    // globals); we can't call into it directly. Dispatch a DOM event on
    // `document` — events cross worlds via the shared DOM. The harness's
    // _installSlideKitBridge listener picks this up and opens the
    // annotation popover anchored to the slide. We pass the clicked
    // button's rect so the popover's reveal-from animation starts at the
    // button instead of the slide's huge bounding box.
    if (!wrap.id) return;
    const detail = { slideId: wrap.id };
    if (fromEl && typeof fromEl.getBoundingClientRect === 'function') {
      const r = fromEl.getBoundingClientRect();
      detail.fromRect = { left: r.left, top: r.top, width: r.width, height: r.height,
        right: r.right, bottom: r.bottom };
    }
    document.dispatchEvent(new CustomEvent('dia-slide-kit:request-edit', { detail }));
  }

  // Charts may render sync, on DOMContentLoaded, or async via animation —
  // snapshot at multiple points to catch all three. Idempotent.
  requestAnimationFrame(refreshThumbnailCanvases);
  window.addEventListener('load', refreshThumbnailCanvases);
  setTimeout(refreshThumbnailCanvases, 1500);

  // Drop the fade mask once the thumb list is fully scrolled to its end —
  // otherwise the last thumb fades under the mask edge forever.
  function updateThumbListMask() {
    const vMaxed = thumbList.scrollTop + thumbList.clientHeight >= thumbList.scrollHeight - 1;
    const hMaxed = thumbList.scrollLeft + thumbList.clientWidth >= thumbList.scrollWidth - 1;
    thumbList.classList.toggle('at-end', vMaxed && hMaxed);
  }
  thumbList.addEventListener('scroll', updateThumbListMask, { passive: true });
  window.addEventListener('resize', updateThumbListMask);
  requestAnimationFrame(updateThumbListMask);

  function updateCounters() {
    const pc = document.getElementById('presenterCounter');
    if (pc) pc.textContent = (current + 1) + ' of ' + slideWraps.length;
    const nc = document.getElementById('navCurrent');
    if (nc) nc.textContent = current + 1;
    const np = document.getElementById('navPrev');
    const nn = document.getElementById('navNext');
    if (np) np.disabled = current === 0;
    if (nn) nn.disabled = current === slideWraps.length - 1;
  }

  // Translate a display position to the original-index slide-wrap.
  function wrapAt(displayPos) { return slideWraps[slideOrder[displayPos]]; }

  function setCurrent(displayIdx) {
    if (displayIdx < 0 || displayIdx >= slideOrder.length) return;
    if (displayIdx !== current) {
      clearSelection();
      thumbList.children[current].classList.remove('active');
      wrapAt(current).classList.remove('current');
      current = displayIdx;
      thumbList.children[current].classList.add('active');
      wrapAt(current).classList.add('current');
    }
    updateCounters();
    fitCurrentSlide();
    applySlideMetaColor();
  }

  function goTo(displayIdx) {
    if (displayIdx < 0 || displayIdx >= slideOrder.length) return;
    setCurrent(displayIdx);
    thumbList.children[current].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    replaceUrlForSlide(current);
  }

  // ── Multi-selection ──
  // `multiSelected` is keyed by original index so the set survives reorders.
  // Both the sidebar thumbs and the light-table cards mirror the same set.
  function renderMultiSelection() {
    Array.from(thumbList.children).forEach((btn) => {
      const orig = parseInt(btn.dataset.origIdx, 10);
      if (!Number.isFinite(orig)) return;
      btn.classList.toggle('multi-selected', multiSelected.has(orig));
    });
    if (lightTableBuilt) {
      Array.from(lightTableGrid.children).forEach((btn) => {
        const orig = parseInt(btn.dataset.origIdx, 10);
        if (!Number.isFinite(orig)) return;
        btn.classList.toggle('multi-selected', multiSelected.has(orig));
      });
    }
  }

  function clearMultiSelection() {
    if (!multiSelected.size) return;
    multiSelected.clear();
    renderMultiSelection();
  }

  // ── Pending delete ──
  function renderPendingDelete() {
    Array.from(thumbList.children).forEach((btn) => {
      const o = parseInt(btn.dataset.origIdx, 10);
      btn.classList.toggle('pending-delete', pendingDelete.has(o));
    });
    if (lightTableBuilt) {
      lightTableGrid.querySelectorAll('.lt-slide-btn').forEach((btn) => {
        const o = parseInt(btn.dataset.origIdx, 10);
        btn.classList.toggle('pending-delete', pendingDelete.has(o));
      });
    }
    slideWraps.forEach((wrap, i) => {
      wrap.classList.toggle('pending-delete', pendingDelete.has(i));
    });
  }

  function togglePendingDelete(origIdx) {
    if (pendingDelete.has(origIdx)) pendingDelete.delete(origIdx);
    else pendingDelete.add(origIdx);
    renderPendingDelete();
    updateStructuralAnnotation();
  }

  // Bulk variant for Backspace/Delete on the multi-selection. If everything
  // in `origIndices` is already marked, the second press unmarks; otherwise
  // it marks anything not yet marked. This matches Finder-style semantics
  // where Delete on a mixed selection completes the action rather than
  // toggling each item independently.
  function bulkTogglePendingDelete(origIndices) {
    const arr = Array.from(origIndices);
    if (arr.length === 0) return;
    const allMarked = arr.every((i) => pendingDelete.has(i));
    if (allMarked) arr.forEach((i) => pendingDelete.delete(i));
    else arr.forEach((i) => pendingDelete.add(i));
    renderPendingDelete();
    updateStructuralAnnotation();
  }

  function selectRangeByDisplay(fromDisplay, toDisplay) {
    const lo = Math.min(fromDisplay, toDisplay);
    const hi = Math.max(fromDisplay, toDisplay);
    for (let d = lo; d <= hi; d++) multiSelected.add(slideOrder[d]);
    renderMultiSelection();
  }

  // ── Pointer-driven thumb / light-table interaction ──
  // (click / Cmd-click / Shift-click / drag, shared across both surfaces)
  //
  // We use pointerdown + pointermove + pointerup rather than `click` so that we
  // can distinguish a click from a drag by movement threshold. A separate `click`
  // listener with stopPropagation would race with the drag system and either
  // double-fire navigation on a successful drop or eat the click on a quick
  // press-release cycle. Pointer events let us decide based on movement.
  //
  // The same installer powers both the vertical thumb-list (layout: 'list',
  // horizontal drop indicator, vertical drop math) and the light-table grid
  // (layout: 'grid', vertical drop indicator, reading-order drop math). The
  // call site picks layout; drop-math and indicator-render branches inside.
  const DRAG_THRESHOLD = 4;
  let dragState = null;

  function installPointerInteraction(btn, container, layout, opts) {
    opts = opts || {};
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const displayPos = Array.prototype.indexOf.call(container.children, btn);
      if (displayPos < 0) return;
      dragState = {
        phase: 'tracking',
        startX: e.clientX,
        startY: e.clientY,
        btn,
        displayPos,
        modifiers: { shift: e.shiftKey, mod: e.metaKey || e.ctrlKey },
        pointerId: e.pointerId,
        container,
        layout,
        onClickAfter: opts.onClickAfter || null,
      };
      try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      e.preventDefault();
    });

    btn.addEventListener('pointermove', (e) => {
      if (!dragState || dragState.btn !== btn) return;
      if (dragState.phase === 'tracking') {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) enterDrag(e);
        return;
      }
      if (dragState.phase === 'dragging') {
        moveGhost(e);
        updateDropIndicator(e);
      }
    });

    btn.addEventListener('pointerup', (e) => {
      if (!dragState || dragState.btn !== btn) return;
      if (dragState.phase === 'tracking') {
        const afterPlain = dragState.onClickAfter;
        handleThumbClick(dragState.displayPos, dragState.modifiers, { afterPlainClick: afterPlain });
        endTracking();
        return;
      }
      if (dragState.phase === 'dragging') performDrop(e);
      endDrag();
    });

    btn.addEventListener('pointercancel', () => {
      if (!dragState) return;
      if (dragState.phase === 'dragging') endDrag();
      else endTracking();
    });
  }

  // Convenience wrapper for the thumb-list installation site.
  function installThumbInteraction(btn) {
    installPointerInteraction(btn, thumbList, 'list');
  }

  function endTracking() {
    if (!dragState) return;
    try { dragState.btn.releasePointerCapture(dragState.pointerId); } catch (err) { /* ok */ }
    dragState = null;
  }

  // ── Click handling (post-threshold-pass) ──
  // `afterPlainClick` only fires on the plain-click branch (navigate). The
  // multi-select branches (Shift / Cmd) intentionally don't trigger it so
  // the light-table caller can use this to close itself after a "go to that
  // slide" tap, while leaving the overlay open while the user builds up a
  // multi-selection.
  function handleThumbClick(displayPos, mods, opts) {
    opts = opts || {};
    const origIdx = slideOrder[displayPos];
    if (mods.shift) {
      selectRangeByDisplay(selectionAnchorDisplay, displayPos);
      return;
    }
    if (mods.mod) {
      if (multiSelected.has(origIdx)) multiSelected.delete(origIdx);
      else multiSelected.add(origIdx);
      renderMultiSelection();
      return;
    }
    clearMultiSelection();
    selectionAnchorDisplay = displayPos;
    goTo(displayPos);
    if (typeof opts.afterPlainClick === 'function') opts.afterPlainClick();
  }

  // ── Drag ──
  // `dragSet` is built from `multiSelected` if the dragged thumb is part of
  // it, otherwise it's just the dragged thumb on its own. Either way we end
  // up with a set of original indices; the live btn elements are looked up
  // by `data-orig-idx` from `dragState.container.children` (so reorder
  // writes never go through stale references).
  //
  // The drag system is surface-agnostic: `dragState.container` is either
  // `thumbList` (vertical list) or `lightTableGrid` (grid). `dragState.layout`
  // is 'list' or 'grid' and switches the drop-math and indicator render.
  function enterDrag(e) {
    const origIdx = slideOrder[dragState.displayPos];
    let dragSet;
    if (multiSelected.has(origIdx) && multiSelected.size > 1) {
      dragSet = new Set(multiSelected);
    } else {
      // The drag-source class (applied just below) ghosts the dragged thumb
      // in place — that's the only visual cue we need. Don't sync the
      // multi-selection set here, because that would add the "selected"
      // outline to a thumb the user never asked to select, which the user
      // reads as "you changed the selected slide just because I dragged".
      dragSet = new Set([origIdx]);
    }
    dragState.phase = 'dragging';
    dragState.dragSet = dragSet;
    // Drop math + indicator render branch on direction. For grid it's always
    // reading-order. For list we read the live flex-direction because the
    // narrow-viewport @media flips thumb-list from column to row.
    if (dragState.layout === 'grid') {
      dragState.direction = 'grid';
    } else {
      const fd = getComputedStyle(dragState.container).flexDirection;
      dragState.direction = (fd === 'row' || fd === 'row-reverse') ? 'row' : 'column';
    }
    Array.from(dragState.container.children).forEach((btn) => {
      const o = parseInt(btn.dataset.origIdx, 10);
      btn.classList.toggle('drag-source', dragSet.has(o));
    });
    document.body.classList.add('thumb-dragging');
    createGhost(e);
    updateDropIndicator(e);
  }

  function createGhost(e) {
    const ghost = document.createElement('div');
    ghost.className = 'thumb-drag-ghost';
    // The ghost always renders at thumb dimensions (160×90) regardless of
    // source surface, so the floating cue stays consistent whether the
    // drag started in the sidebar or the light-table. The visual mass we
    // care about is "you're moving N slides", not "the dragged size".
    const dragOrigs = Array.from(dragState.dragSet);
    const pressedOrig = slideOrder[dragState.displayPos];
    dragOrigs.sort((a, b) => {
      if (a === pressedOrig) return 1;
      if (b === pressedOrig) return -1;
      return slideOrder.indexOf(a) - slideOrder.indexOf(b);
    });
    const stack = dragOrigs.slice(-3);
    const cardSelector = dragState.layout === 'list' ? '.thumb-card' : '.lt-slide-card';
    stack.forEach((orig, i) => {
      const srcBtn = Array.from(dragState.container.children)
        .find((c) => parseInt(c.dataset.origIdx, 10) === orig);
      if (!srcBtn) return;
      const srcCard = srcBtn.querySelector(cardSelector);
      if (!srcCard) return;
      const card = srcCard.cloneNode(true);
      card.classList.add('thumb-drag-ghost-card');
      card.style.setProperty('--stack-depth', String(stack.length - 1 - i));
      ghost.appendChild(card);
    });
    if (dragOrigs.length > 1) {
      const count = document.createElement('div');
      count.className = 'thumb-drag-ghost-count';
      count.textContent = String(dragOrigs.length);
      ghost.appendChild(count);
    }
    document.body.appendChild(ghost);
    dragState.ghost = ghost;
    moveGhost(e);
  }

  function moveGhost(e) {
    if (!dragState.ghost) return;
    dragState.ghost.style.left = e.clientX + 'px';
    dragState.ghost.style.top = e.clientY + 'px';
  }

  // Drop-math branches by direction. If the pointer wanders outside the
  // container (plus a `slack` cushion) we mark dropIdx = -1 and hide the
  // indicator so the drop becomes a cancel instead of a wild "drop at
  // wherever the candidate math happens to fall through to".
  function updateDropIndicator(e) {
    const ar = dragState.container.getBoundingClientRect();
    const slack = 40;
    const outside = e.clientX < ar.left - slack || e.clientX > ar.right + slack
      || e.clientY < ar.top - slack || e.clientY > ar.bottom + slack;
    const indId = dragState.layout === 'list' ? 'thumbDropIndicator' : 'ltDropIndicator';
    if (outside) {
      const ind = document.getElementById(indId);
      if (ind) ind.style.display = 'none';
      dragState.dropIdx = -1;
      return;
    }
    const candidates = Array.from(dragState.container.children)
      .filter((c) => Number.isFinite(parseInt(c.dataset.origIdx, 10))
        && !c.classList.contains('drag-source'));
    let dropIdx = candidates.length;
    const dir = dragState.direction;
    if (dir === 'column') {
      for (let i = 0; i < candidates.length; i++) {
        const r = candidates[i].getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) { dropIdx = i; break; }
      }
    } else if (dir === 'row') {
      for (let i = 0; i < candidates.length; i++) {
        const r = candidates[i].getBoundingClientRect();
        if (e.clientX < r.left + r.width / 2) { dropIdx = i; break; }
      }
    } else {
      for (let i = 0; i < candidates.length; i++) {
        const r = candidates[i].getBoundingClientRect();
        if (e.clientY < r.top) { dropIdx = i; break; }
        if (e.clientY < r.bottom && e.clientX < r.left + r.width / 2) { dropIdx = i; break; }
      }
    }
    dragState.dropIdx = dropIdx;
    renderDropIndicator(dropIdx, candidates);
  }

  function renderDropIndicator(dropIdx, candidates) {
    const isList = dragState.layout === 'list';
    const id = isList ? 'thumbDropIndicator' : 'ltDropIndicator';
    const cls = isList ? 'thumb-drop-indicator' : 'lt-drop-indicator';
    let line = document.getElementById(id);
    if (!line) {
      line = document.createElement('div');
      line.id = id;
      line.className = cls;
      dragState.container.appendChild(line);
    }
    if (candidates.length === 0) { line.style.display = 'none'; return; }
    line.style.display = 'block';
    const dir = dragState.direction;
    if (dir === 'column') {
      // Horizontal line spanning width, varying top.
      line.style.left = '8px';
      line.style.right = '8px';
      line.style.width = '';
      line.style.height = '2px';
      line.style.bottom = '';
      let y;
      if (dropIdx === 0) y = candidates[0].offsetTop - 4;
      else if (dropIdx >= candidates.length) {
        const last = candidates[candidates.length - 1];
        y = last.offsetTop + last.offsetHeight + 2;
      } else {
        const above = candidates[dropIdx - 1];
        const below = candidates[dropIdx];
        y = (above.offsetTop + above.offsetHeight + below.offsetTop) / 2 - 1;
      }
      line.style.top = y + 'px';
    } else if (dir === 'row') {
      // Vertical line spanning height of the strip, varying left.
      line.style.top = '4px';
      line.style.bottom = '4px';
      line.style.height = '';
      line.style.width = '2px';
      line.style.right = '';
      let x;
      if (dropIdx === 0) x = candidates[0].offsetLeft - 4;
      else if (dropIdx >= candidates.length) {
        const last = candidates[candidates.length - 1];
        x = last.offsetLeft + last.offsetWidth + 2;
      } else {
        const left = candidates[dropIdx - 1];
        const right = candidates[dropIdx];
        x = (left.offsetLeft + left.offsetWidth + right.offsetLeft) / 2 - 1;
      }
      line.style.left = x + 'px';
    } else {
      // Grid: vertical line at the target card's leading edge.
      let x, y, h;
      if (dropIdx >= candidates.length) {
        const last = candidates[candidates.length - 1];
        x = last.offsetLeft + last.offsetWidth + 4;
        y = last.offsetTop;
        h = last.offsetHeight;
      } else {
        const c = candidates[dropIdx];
        x = c.offsetLeft - 4;
        y = c.offsetTop;
        h = c.offsetHeight;
      }
      line.style.left = x + 'px';
      line.style.top = y + 'px';
      line.style.height = h + 'px';
      line.style.right = '';
      line.style.bottom = '';
      line.style.width = '3px';
    }
  }

  function performDrop() {
    // dropIdx = -1 is the "released outside the container" sentinel set by
    // updateDropIndicator; the drag dismisses with the source thumb back
    // where it started and no reorder.
    if (dragState.dropIdx < 0) return;
    const dragSet = dragState.dragSet;
    const dropIdx = dragState.dropIdx;
    const dragged = [];
    const remaining = [];
    for (let i = 0; i < slideOrder.length; i++) {
      const orig = slideOrder[i];
      if (dragSet.has(orig)) dragged.push(orig);
      else remaining.push(orig);
    }
    const newOrder = remaining.slice(0, dropIdx).concat(dragged, remaining.slice(dropIdx));
    applyOrder(newOrder);
    updateStructuralAnnotation();
  }

  // Mirror a re-order into a container by re-appending children in newOrder.
  // Non-btn children (drop indicators) get re-appended at the end so they
  // stay on top of the list / grid. Idempotent — calling with no-op order
  // is harmless.
  function reorderContainerByOrigIdx(container, newOrder) {
    const byOrig = {};
    const extras = [];
    Array.from(container.children).forEach((btn) => {
      const o = parseInt(btn.dataset.origIdx, 10);
      if (Number.isFinite(o)) byOrig[o] = btn;
      else extras.push(btn);
    });
    newOrder.forEach((orig) => {
      const b = byOrig[orig];
      if (b) container.appendChild(b);
    });
    extras.forEach((n) => container.appendChild(n));
  }

  function applyOrder(newOrder) {
    const currentOrigBefore = slideOrder[current];
    slideOrder.length = 0;
    newOrder.forEach((v) => slideOrder.push(v));
    reorderContainerByOrigIdx(thumbList, newOrder);
    if (lightTableBuilt) {
      reorderContainerByOrigIdx(lightTableGrid, newOrder);
      // Refresh "Slide N" labels — they reflect display position, which
      // shifts with reorder. The card content itself stays bound to its
      // original-index source via the MutationObserver set up at build time.
      Array.from(lightTableGrid.children).forEach((btn, i) => {
        const num = btn.querySelector ? btn.querySelector('.lt-num') : null;
        if (num) num.textContent = 'Slide ' + (i + 1);
      });
    }
    current = slideOrder.indexOf(currentOrigBefore);
    if (current < 0) current = 0;
    Array.from(thumbList.children).forEach((btn, i) => {
      const o = parseInt(btn.dataset.origIdx, 10);
      if (!Number.isFinite(o)) return;
      btn.classList.toggle('active', i === current);
    });
    if (lightTableBuilt) {
      Array.from(lightTableGrid.children).forEach((btn, i) => {
        const o = parseInt(btn.dataset.origIdx, 10);
        if (!Number.isFinite(o)) return;
        btn.classList.toggle('current', i === current);
      });
    }
    refreshSlideMetaIndices();
    renderMultiSelection();
    updateCounters();
    replaceUrlForSlide(current);
  }

  function endDrag() {
    if (!dragState) return;
    document.body.classList.remove('thumb-dragging');
    Array.from(dragState.container.children).forEach((b) => b.classList.remove('drag-source'));
    if (dragState.ghost) dragState.ghost.remove();
    const ind1 = document.getElementById('thumbDropIndicator');
    if (ind1) ind1.remove();
    const ind2 = document.getElementById('ltDropIndicator');
    if (ind2) ind2.remove();
    try { dragState.btn.releasePointerCapture(dragState.pointerId); } catch (err) { /* ok */ }
    dragState = null;
  }

  // Hidden structural-changes annotation: one annotation, rewritten in place,
  // always last in editIdsInOrder. Harness owns the badge + popover (in its
  // isolated world) via the bridge events below.
  const STRUCTURAL_ANNOT_ID = 'slide-kit-structural-changes';

  function structuralAnnotationBody() {
    const reordered = !(slideOrder.length === slideWraps.length
      && slideOrder.every((v, i) => v === i));
    const hasDeletes = pendingDelete.size > 0;
    if (!reordered && !hasDeletes) return '';
    const lines = ['Pending structural changes to the deck:'];
    if (reordered) {
      const ids = slideOrder.map((origIdx) => '#slide-' + (origIdx + 1)).join(', ');
      lines.push('- New slide order: ' + ids);
    }
    if (hasDeletes) {
      const ids = Array.from(pendingDelete).sort((a, b) => a - b)
        .map((i) => '#slide-' + (i + 1)).join(', ');
      lines.push('- Delete slides: ' + ids);
    }
    return lines.join('\n');
  }

  function updateStructuralAnnotation() {
    const body = structuralAnnotationBody();
    if (!body) {
      document.dispatchEvent(new CustomEvent('dia-slide-kit:clear-structural', {
        detail: { id: STRUCTURAL_ANNOT_ID },
      }));
      return;
    }
    document.dispatchEvent(new CustomEvent('dia-slide-kit:set-structural', {
      detail: { id: STRUCTURAL_ANNOT_ID, body },
    }));
  }

  // Presenter mode (viewport takeover + browser fullscreen request)
  const presenterBtn = document.getElementById('presenterBtn');
  const presenterChrome = document.getElementById('presenterChrome');
  const presenterExit = document.getElementById('presenterExit');

  // Show chrome on mouse activity; fade after 1s of idle.
  // mouseOverChrome guards against a flicker loop: when the timer fires while
  // the cursor is parked on chrome, removing .visible flips pointer-events to
  // none, which dispatches mouseleave → showChrome → re-adds .visible. Skipping
  // the timer while hovering breaks that cycle entirely.
  let chromeIdleTimer = null;
  let mouseOverChrome = false;
  function showChrome() {
    if (!document.body.classList.contains('presenter-mode')) return;
    presenterChrome.classList.add('visible');
    clearTimeout(chromeIdleTimer);
    if (mouseOverChrome) return;
    chromeIdleTimer = setTimeout(() => { presenterChrome.classList.remove('visible'); }, 1000);
  }
  document.addEventListener('mousemove', () => { if (document.body.classList.contains('presenter-mode')) showChrome(); });
  presenterChrome.addEventListener('mouseenter', () => { mouseOverChrome = true; clearTimeout(chromeIdleTimer); });
  presenterChrome.addEventListener('mouseleave', () => { mouseOverChrome = false; showChrome(); });

  function requestFs() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!req) return;
    try {
      const p = req.call(el);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }
  function exitFs() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (!fsEl) return;
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (!exit) return;
    try {
      const p = exit.call(document);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }

  function enterPresenter() {
    clearSelection();
    document.body.classList.add('presenter-mode');
    wrapAt(current).classList.add('current');
    updateCounters();
    requestAnimationFrame(showChrome);
    requestFs();
  }
  function exitPresenter() {
    document.body.classList.remove('presenter-mode');
    presenterChrome.classList.remove('visible');
    clearTimeout(chromeIdleTimer);
    mouseOverChrome = false;
    // While in presenter mode the sidebar and non-current slide-wraps were
    // display:none, so scrollIntoView calls on them were no-ops. Re-sync both
    // panes to the current slide now that they're rendered again.
    wrapAt(current).scrollIntoView({ behavior: 'instant', block: 'start' });
    thumbList.children[current].scrollIntoView({ behavior: 'instant', block: 'nearest' });
    exitFs();
  }

  // If the user exits fullscreen via the OS (Esc, browser chrome, etc.) without
  // going through exitPresenter, route through the same teardown so the sidebar
  // and main pane scroll back to the current slide. `exitPresenter` calls
  // `exitFs` at the end; that's a no-op once fullscreen is already gone.
  function onFsChange() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (!fsEl && document.body.classList.contains('presenter-mode')) {
      exitPresenter();
    }
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
  presenterBtn.addEventListener('click', enterPresenter);
  presenterExit.addEventListener('click', exitPresenter);

  const navPrev = document.getElementById('navPrev');
  const navNext = document.getElementById('navNext');
  if (navPrev) navPrev.addEventListener('click', () => goTo(current - 1));
  if (navNext) navNext.addEventListener('click', () => goTo(current + 1));
  const navTotal = document.getElementById('navTotal');
  if (navTotal) navTotal.textContent = slideWraps.length;

  // Light table
  const lightTable = document.getElementById('lightTable');
  const lightTableGrid = document.getElementById('lightTableGrid');
  const lightTableClose = document.getElementById('lightTableClose');
  let lightTableBuilt = false;
  function rescaleLightTableClones() {
    lightTableGrid.querySelectorAll('.lt-slide-card').forEach((card) => {
      const cw = card.getBoundingClientRect().width;
      const clone = card.querySelector('.lt-clone-wrap');
      if (cw > 0 && clone) clone.style.transform = 'scale(' + (cw / 1067) + ')';
    });
  }
  function buildLightTable() {
    if (lightTableBuilt) { updateLightTableCurrent(); return; }
    slideOrder.forEach((origIdx, displayIdx) => {
      const wrap = slideWraps[origIdx];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lt-slide-btn' + (displayIdx === current ? ' current' : '');
      btn.dataset.origIdx = String(origIdx);
      const card = document.createElement('div');
      card.className = 'lt-slide-card';
      const cloneWrap = document.createElement('div');
      cloneWrap.className = 'lt-clone-wrap';
      const sourceSlide = wrap.querySelector('.slide');
      syncThumbClone(cloneWrap, sourceSlide);
      // Keep light-table thumbnail in sync with the source slide.
      // syncThumbClone re-runs snapshotCanvases so chart thumbnails survive
      // re-clones — plain cloneNode() yields blank <canvas> elements.
      new MutationObserver(() => syncThumbClone(cloneWrap, sourceSlide))
        .observe(sourceSlide, { childList: true, subtree: true, attributes: true, characterData: true });
      card.appendChild(cloneWrap);
      // × delete affordance — mirrors the thumb-btn one, scoped to this orig idx.
      const deleteBtn = makeDeleteAffordance(() => togglePendingDelete(origIdx), 'lt-delete-btn');
      card.appendChild(deleteBtn);
      const label = document.createElement('div');
      label.className = 'lt-slide-label';
      const num = document.createElement('span');
      num.className = 'lt-num';
      num.textContent = 'Slide ' + (displayIdx + 1);
      label.appendChild(num);
      btn.appendChild(card);
      btn.appendChild(label);
      // Click navigates and closes the overlay; Cmd/Shift+click builds the
      // multi-selection in place without leaving light-table; drag-and-drop
      // reorders within the grid (same `applyOrder` mechanism as sidebar).
      installPointerInteraction(btn, lightTableGrid, 'grid', { onClickAfter: closeLightTable });
      // Mirror the current multi-selection / pending-delete state onto this
      // freshly-built card so opening the overlay with prior state looks right.
      if (multiSelected.has(origIdx)) btn.classList.add('multi-selected');
      if (pendingDelete.has(origIdx)) btn.classList.add('pending-delete');
      lightTableGrid.appendChild(btn);
    });
    requestAnimationFrame(() => {
      rescaleLightTableClones();
      lightTableGrid.querySelectorAll('.lt-slide-card').forEach((card) => {
        const parentBtn = card.closest('.lt-slide-btn');
        const orig = parentBtn ? parseInt(parentBtn.dataset.origIdx, 10) : NaN;
        const cs = card.querySelector('.slide');
        if (cs && Number.isFinite(orig) && slideWraps[orig]) {
          snapshotCanvases(slideWraps[orig].querySelector('.slide'), cs);
        }
      });
    });
    lightTableBuilt = true;
  }
  window.addEventListener('resize', () => {
    if (lightTableBuilt && document.body.classList.contains('light-table-mode')) {
      requestAnimationFrame(rescaleLightTableClones);
    }
  });
  function updateLightTableCurrent() {
    lightTableGrid.querySelectorAll('.lt-slide-btn').forEach((btn, i) => { btn.classList.toggle('current', i === current); });
  }
  function openLightTable() {
    clearSelection();
    if (document.body.classList.contains('presenter-mode')) exitPresenter();
    buildLightTable();
    updateLightTableCurrent();
    document.body.classList.add('light-table-mode');
    // The grid uses responsive auto-fill columns, so card widths can change
    // while the overlay is closed (window resize, sidebar in/out of narrow
    // mode). The resize handler only rescales while the overlay is open, so
    // re-rescale on every reopen to avoid stale clone transforms.
    requestAnimationFrame(rescaleLightTableClones);
  }
  function closeLightTable() { document.body.classList.remove('light-table-mode'); }
  lightTableClose.addEventListener('click', closeLightTable);
  lightTable.addEventListener('click', (e) => {
    if (!e.target.closest('.lt-slide-btn, .light-table-close')) closeLightTable();
  });
  const lightTableBtn = document.getElementById('lightTableBtn');
  if (lightTableBtn) lightTableBtn.addEventListener('click', openLightTable);

  // Wheel/trackpad navigation: advance one slide per gesture (Google Slides style)
  // in both spine view and presenter mode. In presenter mode, goTo() toggles the
  // .current class so the visible slide-wrap swaps in place — no scroll motion.
  // Lock during a gesture so a single swipe doesn't skip multiple slides; unlock
  // after wheel events stop. The unlock delay is a tuning value: macOS trackpad
  // inertia can have gaps >150ms in its tail, so 250ms covers most momentum
  // without making rapid back-to-back swipes feel sluggish.
  let wheelLock = false;
  let wheelUnlockTimer = null;
  mainScroll.addEventListener('wheel', (e) => {
    e.preventDefault();
    clearTimeout(wheelUnlockTimer);
    wheelUnlockTimer = setTimeout(() => { wheelLock = false; }, 250);
    if (wheelLock) return;
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta === 0) return;
    wheelLock = true;
    goTo(current + (delta > 0 ? 1 : -1));
  }, { passive: false });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'Escape') {
      if (dragState && dragState.phase === 'dragging') { e.preventDefault(); endDrag(); return; }
      if (document.body.classList.contains('light-table-mode')) { e.preventDefault(); closeLightTable(); return; }
      if (document.body.classList.contains('presenter-mode')) { e.preventDefault(); exitPresenter(); return; }
      if (multiSelected.size) { e.preventDefault(); clearMultiSelection(); return; }
    }
    if (e.key === 'p' || e.key === 'P') {
      if (!document.body.classList.contains('presenter-mode')) { e.preventDefault(); enterPresenter(); return; }
    }
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      if (document.body.classList.contains('light-table-mode')) closeLightTable();
      else openLightTable();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (!multiSelected.size) return;
      e.preventDefault();
      bulkTogglePendingDelete(multiSelected);
    }
  });

  // Safety net for drags that end outside any thumb-btn / lt-slide-btn —
  // e.g. the pointer is released over the OS chrome and the per-btn
  // pointerup never fires. The window-level handlers ensure ghost / drop
  // indicator / drag-source classes get cleaned up no matter where the
  // gesture ends. When the per-btn handler already drained dragState
  // these guards short-circuit, so we don't double-process.
  window.addEventListener('pointerup', (e) => {
    if (!dragState) return;
    if (dragState.phase === 'dragging') { performDrop(e); endDrag(); }
    else endTracking();
  });
  window.addEventListener('pointercancel', () => {
    if (!dragState) return;
    if (dragState.phase === 'dragging') endDrag();
    else endTracking();
  });

  function clearSelection() {
    slideWraps.forEach((w) => w.classList.remove('selected'));
  }

  // The .slide can be narrower/shorter than its .slide-wrap (the wrap centers
  // the slide and its aspect ratio is fixed at 16/9). Compute the slide's
  // bottom-right offset within the current wrap and expose it as CSS vars so
  // the floating action button hugs the slide's edge instead of the wrap's.
  function updateSlideActionOffsets() {
    const wrap = wrapAt(current);
    if (!wrap) return;
    const slide = wrap.querySelector(':scope > .slide');
    if (!slide) return;
    const wRect = wrap.getBoundingClientRect();
    const sRect = slide.getBoundingClientRect();
    if (wRect.width === 0 || sRect.width === 0) return;
    const right = Math.max(0, wRect.right - sRect.right) + 12;
    const bottom = Math.max(0, wRect.bottom - sRect.bottom) + 12;
    document.documentElement.style.setProperty('--slide-action-right', right + 'px');
    document.documentElement.style.setProperty('--slide-action-bottom', bottom + 'px');
  }

  // Click-to-select the current slide; click outside the slide to deselect.
  // Selection draws a 2px outline and reveals the floating "Request edits"
  // button anchored to the slide's bottom-right.
  mainScroll.addEventListener('click', (e) => {
    if (document.body.classList.contains('presenter-mode')) return;
    if (document.body.classList.contains('light-table-mode')) return;
    if (e.target.closest('.slide-action-btn')) return;
    const slideEl = e.target.closest('.slide');
    if (!slideEl) return;
    const wrap = slideEl.closest('.slide-wrap');
    if (!wrap || !wrap.classList.contains('current')) return;
    if (wrap.classList.contains('selected')) return;
    clearSelection();
    updateSlideActionOffsets();
    wrap.classList.add('selected');
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.slide, .slide-action-btn')) return;
    clearSelection();
  });

  window.addEventListener('resize', updateSlideActionOffsets);
  requestAnimationFrame(updateSlideActionOffsets);

  // External hash changes (back/forward, share-link paste) route to setCurrent
  // so the deck syncs without a reload. Same-slide hashes just renormalize.
  window.addEventListener('hashchange', () => {
    const idx = parseHashToSlideIndex();
    if (idx === null) return;
    if (idx === current) { replaceUrlForSlide(current); return; }
    setCurrent(idx);
    thumbList.children[current].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    replaceUrlForSlide(current);
  });

  // Initial state: mark slide 0 current, then honor `#slide-N` if present.
  if (slideWraps.length > 0) {
    slideWraps[0].classList.add('current');
    const initialFromHash = parseHashToSlideIndex();
    if (initialFromHash !== null) {
      setCurrent(initialFromHash);
      thumbList.children[current].scrollIntoView({ behavior: 'instant', block: 'nearest' });
      replaceUrlForSlide(current);
    }
  }
  updateCounters();
  fitCurrentSlide();
  applySlideMetaColor();

  // Webfont swap can shift text metrics enough to push a borderline slide
  // over the canvas edge. Refit once fonts settle.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => fitCurrentSlide());
  }
})();
