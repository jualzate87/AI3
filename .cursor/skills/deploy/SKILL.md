---
name: deploy
description: Safely verifies, commits, deploys, and confirms the live SmartReview ProtoC3 GitHub Pages bundle. Use when the user says deploy, publish, push live, or wants to see the latest prototype.
disable-model-invocation: true
---

# Deploy SmartReview ProtoC3

Read `PROTO_C3_REQUIREMENTS.md` and `deploy.sh`. Never reuse a sibling prototype's URL, base path, remote, port, or storage prefix.

## Preflight

1. Confirm the repository root and current branch.
2. Review `git status`, `git diff --stat`, and the complete diff.
3. Do not include unrelated user changes in the commit.
4. Run type-check/build and relevant tests.
5. For visible changes, confirm `/visual-qa` was completed or clearly report why it was not.

## Publish

1. Create a concise commit describing the user-facing outcome if changes are uncommitted.
2. Run the repository's `deploy.sh`; do not reconstruct deployment manually unless the script fails.
3. Request required approval for remote writes.
4. Wait for Pages propagation.
5. Fetch the live page and confirm HTTP success and that its hashed JS/CSS bundle matches the deployment output.

## Report

Return the clickable live URL, commit identifier, verification result, and any build warning that materially affects the experience.
