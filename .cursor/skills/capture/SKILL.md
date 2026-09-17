---
name: capture
description: Converts designer corrections and repeated feedback into durable SmartReview decisions, visual guidance, invariants, or reusable patterns. Use when the user says to remember, never repeat, preserve, always use, or corrects a recurring design behavior.
disable-model-invocation: true
---

# Capture Designer Feedback

Classify the correction:

- Settled product/interaction choice → `docs/DECISIONS.md`.
- Durable visual principle → `docs/DESIGN_LANGUAGE.md`.
- Reusable implementation pattern → `docs/PATTERNS.md`.
- Non-negotiable behavior whose regression would break the prototype → `.cursor/rules/prototype-invariants.mdc`.
- Scope/process correction → `.cursor/rules/surgical-changes.mdc`.

Write the smallest durable update. Do not duplicate the same idea across every file.

For a decision, record date, decision, reason, applicable surfaces, and what it supersedes.

For a pattern, record intent, canonical files, IDS foundation, state behavior, accessibility/responsive requirements, and invariants.

Before finishing:

1. Search for conflicting guidance and reconcile it.
2. Keep always-on rules concise.
3. State what was captured and how future requests can be shorter.
