---
name: change
description: Implements scoped SmartReview prototype changes with component discovery, regression protection, interaction testing, and visual QA. Use for feature, behavior, content, layout, styling, or interaction changes in this repository.
---

# Scoped SmartReview Change

## 1. Frame

Restate the intended outcome, touched surface, and protected behavior in one sentence. Proceed without waiting when interpretation is clear; ask only for a material design fork.

Read:

- `docs/DESIGN_LANGUAGE.md` for visible changes.
- `docs/PATTERNS.md` for related established interactions.
- `docs/DECISIONS.md` for settled behavior.
- `PROTO_C3_REQUIREMENTS.md` for environment and prototype identity.

List the expected files before editing.

## 2. Choose the component

Use this order:

1. Existing SmartReview pattern with matching semantics.
2. IDS component used elsewhere in the repo.
3. Available IDS component after reading `.cursor/rules/components/<name>.mdc`.
4. Composition of IDS components.
5. Custom pattern only when there is a documented gap.

Evaluate semantics, keyboard behavior, state model, density, responsive behavior, and visual hierarchy—not appearance alone. Verify icons in `@design-systems/icons`. Import each IDS component's CSS.

## 3. Implement surgically

- Preserve behavior outside the stated outcome.
- Do not perform adjacent cleanup or broad file copying.
- Follow existing hooks for persistence and cross-tab state.
- Use CSS Modules and semantic tokens.
- For visible copy, follow `/text-hierarchy`: classify primary vs supporting vs meta, then apply size, weight, left alignment, 14px floor, and `--color-text-primary`.
- Update `docs/PATTERNS.md` only when creating a genuinely reusable pattern.

## 4. Verify

1. Review the complete diff and `git diff --stat`; remove scope leakage.
2. Run type-check/build and relevant tests.
3. Exercise the changed interaction and one neighboring regression path.
4. Run the `/visual-qa` workflow for visible changes.
5. Never claim visual verification if no browser/screenshot inspection was possible.

## 5. Hand off

Report:

- Outcome.
- Files/behaviors changed.
- What was intentionally preserved.
- Functional and visual verification performed.
- Any limitation or unresolved decision.

Deploy only when requested.
