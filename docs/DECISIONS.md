# SmartReview Design Decisions

This is the durable record of settled decisions. Add a dated entry when designer feedback changes a reusable behavior or visual principle. Do not use it for temporary implementation details.

## 2026-09-17 — Text hierarchy

Style copy by importance, not by matching a nearby file. The most important line in a region is larger and/or heavier, left-aligned, and `--color-text-primary`. Default minimum size is 14px. 12px is only for timestamps, badges, dense table chrome, legal lines, and icon-adjacent counts. `--color-text-secondary` is rare and must stay WCAG AA; otherwise keep primary color and drop weight or size. Indent nested navigation, not body copy.

## 2026-09-17 — Review-level labels

Use L1, L2, and L3 rather than Preparer and Reviewer on form checks. Map preparer to L1, reviewer to L2, and manager to L3. Display the first checker's first name beneath/alongside the level label after ownership exists.

## 2026-09-17 — Multi-person document verification

Document verification is additive and attributed. Sarah's verification remains visible when Jake opens the same return, and Jake can add a separate verification stamp.

## 2026-09-17 — Compact approval presentation

Represent each document approval with a green check and actor initials. Put full attribution and timestamp in a tooltip. Use a single tab check for one approval and a double check for two approvals. Only the current actor's approval is removable; other approvals are read-only, with comments as the available response.

## 2026-09-17 — Document comments

Place Comment next to Verify at document level. Reuse the existing annotation criticality system. Save the document label as context and register the comment in the shared comments tray.

## 2026-09-17 — Handoff presentation

Use the large handoff modal. The AI summary is a concise, structured version of the reviewer summary and includes a heads-up section for unchecked, unresolved, or critical items. Summary and notes fields fill and align to the modal body.

## 2026-09-17 — Intuit Intelligence reopens on the last conversation

**Decision:** Once the panel has generated content, closing and reopening it returns to that
conversation in its finished state — no replayed reasoning, no welcome screen. Starting over is an
explicit act: the New chat button in the left rail. An explicit "get caught up" entry point still
generates that summary fresh.

**Reason:** Matches how every other assistant behaves; the welcome screen on every open made prior
work feel lost.

**Applies to:** The diagnostics, fix-processing, and catch-up steps. The welcome screen and the
workspace hand-off have nothing to restore.

## 2026-09-17 — Handoff modal structure

Notes come first; the AI summary sits below in a collapsed accordion inside the same container. Status is carried by round icon badges next to each section title, never by a colored container border.

## 2026-09-17 — Sign-off applies to every actor

Any assignee change, and any forward status move, opens the handoff modal so the person leaving the return can write a note and review what has been done. Backward status moves apply silently — there is nothing to hand over. The summary is cumulative: a preparer reports their own prep, and anyone downstream reports the whole return so far, with open items listed as "Still open on this return" when nobody is receiving it.

## 2026-07-24 — Preserve Summary context

After first use, opening diagnostics from a contextual popover must not unexpectedly hide the Summary.

## Decision template

### YYYY-MM-DD — Decision name

**Decision:** What is now settled.

**Reason:** User or workflow need.

**Applies to:** Surfaces and states.

**Supersedes:** Prior decision, if any.
