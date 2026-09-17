# SmartReview Change Protocol

Most requests only need one sentence:

> Change [surface/interaction] so [user outcome]. Preserve [anything especially sensitive]. Deploy when verified.

You do not need to repeat IDS, token, accessibility, responsive, scope, or visual-QA instructions; the project rules and `/change` skill own them.

## Agent workflow

1. Restate the outcome and scope in one sentence. Proceed without waiting when there is one clear interpretation.
2. Ask only when choices materially change the experience or blast radius.
3. Identify expected files and protected neighboring behavior.
4. Find the correct IDS component and existing SmartReview pattern.
5. Implement the smallest coherent change.
6. Review the complete diff for scope leakage.
7. Build/type-check and test the affected interaction.
8. Run the visual-QA checklist at narrow, normal, and wide sizes.
9. Report changed files, preserved behavior, verification, and live URL when deployed.

## Designer shortcuts

- `/change [request]` — scoped implementation plus component discovery and visual QA.
- `/visual-qa [surface]` — inspect and fix visual/component issues only on that surface.
- `/capture [correction]` — save durable feedback into decisions, patterns, or craft guidance.
- `/deploy` — verify, commit, deploy, and confirm the live bundle.

## Scope rule

If a request does not mention a behavior, preserve it. If a necessary dependency would alter another surface, explain the dependency before editing that surface.
