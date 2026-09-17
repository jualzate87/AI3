---
name: visual-qa
description: Reviews a touched SmartReview surface for hierarchy, spacing, layout, IDS component correctness, responsive behavior, states, motion, and visual regressions. Use after visible UI changes or when the user asks to improve visual quality.
---

# SmartReview Visual QA

Read `docs/DESIGN_LANGUAGE.md`, `docs/PATTERNS.md`, and the changed TSX/CSS files.

## Inspect the running UI

Start or reuse the ProtoC3 preview using the port in `PROTO_C3_REQUIREMENTS.md`. Use an available browser/computer/screenshot tool to inspect the affected route. If no such tool is available, say visual inspection is blocked and do not claim pixel or interaction verification.

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
