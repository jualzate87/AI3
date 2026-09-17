# SmartReview Design Language

This is the default visual direction when a request does not provide a Figma frame. It supplements IDS: IDS defines valid components and tokens; this file defines how SmartReview composes them.

## Product character

- Expert-facing, calm, precise, and information-dense.
- Optimize for scanning, comparison, verification, and confident handoff.
- Prefer progressive disclosure over showing every detail at once.
- Make system status and ownership visible without dominating task content.

## Hierarchy

1. Make the current task and its state obvious.
2. Keep the return/document content as the visual center of gravity.
3. Place guidance near the decision it supports.
4. Separate metadata and history from primary content.
5. Use color for meaning—status, severity, selection—not decoration.

Use one dominant heading and one primary action per decision region. Avoid competing cards, oversized headings, repeated banners, and multiple blue actions at the same level.

## Spacing and alignment

- Tight spacing: icon/label pairs, metadata, row content, related inline actions.
- Medium spacing: fields in a group, card internals, related sections.
- Large spacing: major page regions and changes of task context.
- Align related headings, fields, cards, and actions to shared edges.
- Dialog fields and summary boxes should fill the usable body width.
- On wide layouts, distribute useful content rather than leaving accidental empty regions.
- On narrow layouts, preserve meaning before density: protect amounts and statuses, then truncate labels, then stack controls.

Use IDS semantic spacing tokens. Choose the token by relationship, not by matching an isolated pixel value.

## Layout

- Treat tax forms and summaries as stable grids. Shared columns must align across headers and rows.
- Let descriptive content flex; give financial values and verification controls stable readable widths.
- Prefer container-aware behavior for resizable panes.
- Do not solve overflow by shrinking every column. Use deliberate scrolling, truncation, wrapping, or responsive stacking.
- Large modals are appropriate for structured summaries, comparisons, and reviewer-authored notes.

## Components: Find → Reuse → Compose → Create

Before adding visible UI:

1. Search existing SmartReview patterns and `docs/PATTERNS.md`.
2. Read the rule for the relevant `@ids-ts/*` component.
3. Confirm the package API and existing local usage.
4. Reuse an established pattern if its semantics match.
5. Compose IDS components when no single component covers the interaction.
6. Create custom behavior only when IDS and project patterns have a real gap; document the gap.

Do not choose a component by appearance alone. Match semantics, keyboard behavior, state model, density, and accessibility.

For new product controls, default to the approved `@ids-ts/*` component documented in `.cursor/rules/components/`. Preserve established GenUX/CGDS usage in existing AI-specific patterns, but do not introduce, replace, or migrate a design-system family incidentally. A design-system migration is a separate scoped decision.

Common semantic choices:

- Commit or advance work: IDS Button with priority matching action hierarchy.
- Navigate to another destination: IDS Link or link action, not a button styled as a link.
- Short status/count: IDS Badge; do not make custom pills.
- Contextual explanation: IDS Tooltip for brief help; popover/panel for interactive or structured content.
- Destructive/irreversible confirmation: IDS ModalDialog with explicit action copy.
- Form values: IDS field components with visible labels and validation behavior.
- Selection among known options: choose radio, checkbox, dropdown, or segmented control based on cardinality and whether the result is immediate.
- Annotation, document verification, level checks, and handoff: use the canonical SmartReview patterns in `docs/PATTERNS.md`.

## Interaction

- Keep actions adjacent to the object they affect.
- Primary buttons advance or commit the task; tertiary actions annotate, inspect, or reveal.
- Preserve user context when opening and closing panels.
- Multi-person actions are additive and attributed.
- Criticality must be visible in both the authoring interaction and its destination tray/history.
- Disabled or locked states explain what unlocks them.

## Motion

- Use motion to explain panel entry/exit, processing progress, focus movement, and successful state change.
- Prefer short ease-out transitions for appearing UI and ease-in for exits.
- Avoid decorative motion in dense forms and tables.
- Do not animate layout in a way that moves the user's active target.
- Honor `prefers-reduced-motion`.

## Visual QA bar

For each touched surface, inspect:

- Hierarchy: can the user identify task, status, and next action in three seconds?
- Rhythm: are related things closer than unrelated things?
- Alignment: do shared edges and columns line up?
- Width: are controls using space intentionally at narrow, normal, and wide sizes?
- Components: is each control semantically correct and consistent with IDS/local patterns?
- States: default, hover, focus, disabled/locked, loading, empty, error, complete, and relevant roles.
- Motion: does it explain state without distraction?
- Regression: compare untouched neighboring UI with the pre-change state.

Compilation and token compliance do not substitute for this inspection.
