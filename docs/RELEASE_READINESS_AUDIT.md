# Version 1.2 release-readiness audit

Date: 1 September 2026

## Audit target

The audit tested whether a first-time operator could identify the evaluation scope, understand claim provenance, label the corrected Chaser Agent candidate, complete a run-level score, navigate workspaces and understand the model-training boundary without relying on an external explanation.

## Corrected release blockers

- The Overview now defaults to a relevance-fixed candidate instead of the flawed legacy Run 1.
- The legacy run remains immutable and available as baseline regression evidence.
- A two-part capability map distinguishes in-Studio harness improvement from external model training.
- The Review surface has a prominent jump from evidence inspection to claim judgment.
- Primary evidence controls, claim labels, claim navigation, rating controls and tour controls meet the release accessibility sizing pass.
- Settings explains harness refinement, regression testing and the separate model-training handoff.
- The 15-step guided tour covers the actual workspace, dataset, runner, review, comparison, insight, file, history, system and lifecycle controls.
- The operator guide defines where claims come from, what each panel means and when the five scores are applied.
- A fixture regression test prevents document-status metadata from returning as the first built-in claim.

## Product boundary

The Studio is a complete local-first evaluation and improvement-data workbench. It can run a bounded deterministic adapter, import external runs, preserve evidence, collect human judgments, compare versions and enforce a configured regression gate. It does not perform provider-backed autonomous execution, hosted multi-user coordination or model-weight training.

## Verification contract

Release readiness requires all automated tests and the production build to pass, desktop and mobile core journeys to remain usable, the guided tour to reach every named surface, and the browser console to contain no application errors. Current commands and visual evidence are recorded in `design-qa.md`.

Current result: `npm test` passed 31 tests with 0 failures, including the production build and Sites packaging step.
