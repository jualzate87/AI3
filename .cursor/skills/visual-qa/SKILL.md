---
name: visual-qa
description: Reviews a touched SmartReview surface for hierarchy, spacing, layout, IDS component correctness, responsive behavior, states, motion, and visual regressions. Use after visible UI changes or when the user asks to improve visual quality.
---

# SmartReview Visual QA

Read `docs/DESIGN_LANGUAGE.md`, `docs/PATTERNS.md`, and the changed TSX/CSS files.

## Inspect the running UI

Playwright is available in this repo (`node_modules/.bin/playwright`, Chromium installed). There is no excuse for skipping visual inspection — drive the UI and read the screenshots.

Write a short ESM script under `scripts/` and run it with `node`:

```js
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5175/#/ai-review', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'qa-shots/name.png' })
```

Notes:

- Routes are hash-based. Real paths include `/smart-return`, `/data-review`, `/check-return`, `/ai-review`. Confirm against `src/App.tsx` before assuming a route name.
- Target controls by their real copy from `agentIntelligenceCopy.ts`, not a guess.
- Test against the local preview (port in `PROTO_C3_REQUIREMENTS.md`) or the live Pages URL.
- Assert state transitions by comparing `innerText` length/markers across steps, then read the screenshots to judge craft.
- Ignore `assets.intuitcdn.net` font CORS errors on the Pages origin; they are environmental and do not affect layout logic.

Only claim visual verification for what you actually screenshotted.

Inspect at:

- Narrow: about 320–390px or the smallest supported pane.
- Typical: common laptop viewport/pane.
- Wide: large viewport or fully expanded resizable pane.

Capture before/after evidence when practical.

## Review

### Hierarchy

- Task, status, and next action are clear within three seconds.
- One dominant heading and one primary action per decision region.
- Secondary actions do not compete with content.
- Run `/text-hierarchy` on touched copy: the most important line is larger/heavier and on the left; supporting copy is quieter; titles/labels/nav are ≥ 14px; 12px is only meta; `--color-text-primary` unless secondary is rare and still AA; nested nav is indented.

### Spacing and layout

- Related elements are closer than unrelated elements.
- Shared edges, headers, rows, fields, and controls align.
- Containers use width intentionally; no accidental narrow boxes or empty halves.
- Labels may truncate safely; financial values, statuses, and actions remain readable.
- Resize panes and check overflow, scroll, wrapping, and sticky regions.

### Components

- Each control matches its semantic job and expected keyboard interaction.
- Existing SmartReview patterns are reused.
- IDS component rules and CSS imports are respected.
- Custom UI exists only for a documented IDS gap.

### States and motion

- Test relevant default, hover, focus, disabled/locked, loading, empty, error, complete, and role states.
- Motion explains state change, uses tokens, avoids target movement, and honors reduced motion.

### Regression

- Compare untouched neighboring UI with its pre-change behavior.
- Test one adjacent route or interaction likely to share state/layout.

## Fix policy

Fix issues only on the requested/touched surface. Do not broaden into a page redesign. Re-run inspection after fixes.

Report issues found, fixes made, viewport/states checked, and any inspection limitation.
