# SmartReview Pattern Registry

Use these patterns before creating new variants. Read the named files and preserve their state, accessibility, and persistence behavior.

## Annotation and criticality

Use `src/pages/data-review/AnnotationPopover.tsx` with `src/styles/data-review/AnnotationPopover.module.css`.

- Supports note-like annotations and criticality formatting.
- Save through `useReturnNotes`; do not create separate comment storage.
- Document-level annotations include the document label as context.
- Saved comments appear in the shared comments tray and synchronize across tabs.

## Document verification

Use `src/pages/data-review/DocVerifyHeaderActions.tsx`.

- Verification is additive across actors and displays attribution.
- Place document Comment next to Verify.
- Never replace one actor's verification with another actor's state.

## L1/L2/L3 form checks

Use `src/pages/data-review/AttestColumns.tsx`.

- L1 = preparer, L2 = reviewer, L3 = manager.
- Each actor can toggle only their current level.
- After the first check, the actor's first name appears in the level header.
- Tooltips explain ownership and timestamp.

## Handoff

Use `src/pages/handoff/HandoffAssistModal.tsx` with its CSS module.

- Use the IDS large modal.
- Structure the AI summary for scanning; do not present one long paragraph.
- Include a heads-up section for unresolved, unchecked, and critical items.
- AI summary and reviewer notes align and fill the available body width.

## Shared review state

Use `src/hooks/useSyncedReviewState.ts` for review/check/verification state and `src/hooks/useReturnNotes.ts` for annotations.

- Preserve localStorage schema versioning and hydration.
- Preserve cross-tab/window synchronization.
- Update state immutably.
- New role-based state needs hydration, sanitization, migration, and reset behavior.

## Adding a pattern

Add an entry when a new interaction becomes reusable. Record:

- User intent and semantic role.
- Canonical component and style files.
- IDS components used.
- State/persistence behavior.
- Accessibility and responsive requirements.
- Variations that are allowed and invariants that are not.
