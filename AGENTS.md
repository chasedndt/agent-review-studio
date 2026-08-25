# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Chaser Agent evaluation-workspace decisions

- Product name is **Chaser Agent**. Evaluation and refinement are a workspace inside the product, not a separate product named Eval Studio or Evidence Desk.
- The selected visual target is the revised first concept generated on 2026-08-25: guided four-step review, paired claim/evidence, five once-per-run ratings, quiet automated checks, and persistent onboarding access.
- Optimise first for a new operator understanding what to do and why. Raw JSON remains available as evidence, but it is not the primary interface.
- Preserve source run artifacts as immutable. Phase 1 may save local drafts and export review records, but it must not mutate source JSON, promote memory, train a model, or authorize external actions.
- The workspace is intended to remain proprietary. Keep this prototype separate from the public MIT core until repository and licensing boundaries are explicitly decided.
- Support multiple projects, dated sessions, current run folders, and future compatible run folders without hard-coding the three initial cases.
