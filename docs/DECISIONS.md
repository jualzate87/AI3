# SmartReview Design Decisions

This is the durable record of settled decisions. Add a dated entry when designer feedback changes a reusable behavior or visual principle. Do not use it for temporary implementation details.

## 2026-09-17 — Review-level labels

Use L1, L2, and L3 rather than Preparer and Reviewer on form checks. Map preparer to L1, reviewer to L2, and manager to L3. Display the first checker's first name beneath/alongside the level label after ownership exists.

## 2026-09-17 — Multi-person document verification

Document verification is additive and attributed. Sarah's verification remains visible when Jake opens the same return, and Jake can add a separate verification stamp.

## 2026-09-17 — Document comments

Place Comment next to Verify at document level. Reuse the existing annotation criticality system. Save the document label as context and register the comment in the shared comments tray.

## 2026-09-17 — Handoff presentation

Use the large handoff modal. The AI summary is a concise, structured version of the reviewer summary and includes a heads-up section for unchecked, unresolved, or critical items. Summary and notes fields fill and align to the modal body.

## 2026-07-24 — Preserve Summary context

After first use, opening diagnostics from a contextual popover must not unexpectedly hide the Summary.

## Decision template

### YYYY-MM-DD — Decision name

**Decision:** What is now settled.

**Reason:** User or workflow need.

**Applies to:** Surfaces and states.

**Supersedes:** Prior decision, if any.
