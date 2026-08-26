# Contributing to Agent Review Studio

Thank you for improving the evidence-review workflow for AI agents and agent harnesses.

## Development

1. Create a focused branch from the default branch.
2. Install dependencies with `npm install`.
3. Run the application with `npm run dev -- --host 127.0.0.1 --port 4173`.
4. Keep imported artifacts immutable and preserve unfamiliar files.
5. Add or update tests for data, review, export or hosting-contract changes.
6. Run `npm test`, `npm run build` and `git diff --check` before opening a pull request.

For product changes, include browser evidence for the primary path, desktop and compact layouts, and the console. Do not describe deterministic diagnostics or development fixtures as completed human review.

## Pull requests

Explain the user problem, the repo-truth delta, the safety boundary, verification commands and remaining unknowns. Keep unrelated changes out of the pull request.

By contributing, you agree that your contribution is licensed under Apache-2.0.
