# Prototype C3 — Input Return Pre-Review Flow

## Overview

Prototype C3 extends **ProtoC2** (source-document review with import confirmation) with a dedicated **Input return** experience — manual data entry before the review/check phases.

**C3 = C2 + Input return page + wiring from import confirmation.**

## What's New in C3

1. **`/input-return` route** — left nav menu + right form panel for entering/editing return data (W-2, 1099-INT/DIV/R/NEC).
2. **Import confirmation CTA** — secondary "Enter return data" button routes to `/input-return`.
3. **SmartReturn header** — Input tab links to `/input-return`.
4. **Input form variant** — `DetailFields*` components accept `variant="input"` to hide doc-verify header actions (plain editable fields).

## Deferred (not in this PR)

- **Check return** tab/route — `/check-return` left as-is; not wired from Input flow yet.

## Technical Notes

| Item | Value |
|------|-------|
| Dev server port | **5176** |
| GitHub Pages base | `/SmartReview-AIc3/` |
| Package name | `smartreview-proto-c3` |
| Session keys | `protoc3-*` (localStorage via `useSyncedReviewState`) |

## Related Prototypes

- **ProtoC** (5175) — Sequential two-phase review (import → diagnostics)
- **ProtoC2** (5175/5176 sibling) — Source-doc review + import confirmation gate
- **ProtoC3** (5176) — C2 + Input return pre-review flow
