---
name: text-hierarchy
description: Classifies on-screen copy by importance and applies SmartReview text hierarchy — size, weight, left alignment, 14px floor, rare 12px, primary color, and indent only for sub-navigation. Use when adding or restyling visible text, lists, navigation, summaries, or captions.
---

# SmartReview Text Hierarchy

Read `docs/DESIGN_LANGUAGE.md` (Text hierarchy). Then classify every visible string on the touched surface before writing CSS.

## Classify

For each string, pick one role:

| Role | What it is | Style |
| --- | --- | --- |
| Primary | Title, decision, amount, or label the user must read to act | Larger and/or heavier than siblings; left edge; `--color-text-primary`; ≥ 14px |
| Supporting | Sentence that explains or qualifies the primary | Same or smaller size, lighter weight; still ≥ 14px; usually primary color |
| Meta | Timestamp, count, legal, ownership, badge label | Quieter; 12px allowed only here |

If two lines in the same region feel equally loud, the less important one is wrong. Fix it.

## Rules

1. **Importance → treatment.** Do not pick a font size because a nearby file used it. Pick it because of the role.
2. **Left edge.** Primary text starts on the region's left reading edge. Supporting text follows it; it does not float right unless it is a status/action.
3. **14px floor.** Use `--font-size-body-3` or `--font-size-component-small` (and action/component small) as the default minimum. 12px tokens (`body-4`, `component-x-small`, `action-x-small`) only for timestamps, badges, dense table chrome, legal disclaimers, and icon-adjacent counts.
4. **Color.** Default `--color-text-primary`. `--color-text-secondary` is rare, supporting/meta only, and must remain WCAG AA on that background. If contrast is doubtful, keep primary color and drop weight or size.
5. **Indent.** Indent nested nav and tree children. Do not indent paragraphs, field labels, or cards to create hierarchy.

## Check before finishing

- Can you name the most important sentence in the region in one glance?
- Is that sentence bigger/heavier/left-most?
- Is any title, label, list item, or nav item 12px? If yes, bump it to 14px.
- Is secondary color used on a tinted or colored surface? If yes, switch to primary.