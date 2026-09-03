# Changelog

## 1.5.0 — 2026-09-03

- Removed the product-level Chaser Agent workspace and automatic demo-run seeding from fresh installations.
- Added a true empty first-run state that asks each operator to name their own agent, harness, workflow or service.
- Migrated existing personal Chaser Agent installations into ordinary local workspaces and preserved their runs in browser storage.
- Made every workspace renameable, archivable and exact-name-confirmed deletable, including the former personal example.
- Renamed the optional execution adapter from `chaser_bridge` to the agent-neutral `local_bridge`.
- Replaced the top-bar native selector with a complete workspace menu that exposes an obvious Delete action beside every workspace.

## 1.4.0 — 2026-09-03

- Replaced the duplicated workspace list and selected-scope card with one accordion-style workspace stack.
- Each workspace now expands into its own Pages or Runs tree; opening another workspace collapses the previous one and preserves its chosen view.
- Added a visible three-dot menu and matching right-click menu for direct rename, detail editing, archive and guarded deletion.
- Added a keyboard-accessible drag rail for resizing the desktop sidebar from 248 to 390 pixels, with a 320-pixel reset point and browser-local persistence.
- Capped each expanded workspace panel so another workspace remains visible at desktop, compact and phone sizes.
- Updated onboarding and operator documentation to teach the workspace stack and direct lifecycle controls.
- Verified two live local workspaces, workspace switching, run grouping, renaming, guarded deletion entry, minimising, resizing, compact drawer and phone drawer.

## 1.3.1 — 2026-09-02

- Added a persistent header information button and a prominent Settings entry for restarting guided onboarding.
- Grouped Pages and Runs inside the selected workspace so dated sessions and immutable runs no longer appear to be global.
- Added a workspace-hierarchy onboarding scene and expanded the complete walkthrough to 19 scenes.
- Raised the operator typography scale and strengthened heading, label, metadata and control readability.
- Moved compact-window navigation to the mobile drawer at 1040 px to prevent the partially minimised header and content state.
- Fixed collapsed-sidebar accessible names, mobile workspace-tab reflow, page-change scroll position and run-tree/footer overlap.
- Verified desktop, 1016 × 743 and 390 × 844 layouts plus the complete onboarding sequence.

## 1.3.0 — 2026-09-02

- Expanded workspace setup with agent/harness purpose and a primary evaluation goal.
- Added a minimisable desktop sidebar and repaired mobile drawer scrolling around the expanded navigation.
- Added a searchable Agent Harness Field Guide, transparent deterministic/probabilistic/human strategy suggestions and a labelled Python evaluator template.
- Added visible chronological, append-only run lineage to Overview.
- Added a Settings archive manager with one-click restore and name-confirmed permanent deletion for archived local workspaces.
- Expanded onboarding to 18 real controls, targeted the actual Run evaluation button and fixed the Step 6 viewport overflow/black-overlay failure.
- Verified all onboarding scenes at desktop and 390 × 844 mobile viewports.

## 1.2.0 — 2026-09-01

- Added a relevance-fixed Chaser Agent candidate while preserving the flawed legacy run as immutable regression evidence.
- Added explicit in-product boundaries between harness refinement, training-data preparation and separate model-weight training.
- Added a beginner operator guide that reconciles the panel order, claim provenance, categorical labels and once-per-run scores.
- Improved review discoverability, control sizing and mobile readability across the core operator journey.
- Re-verified all 15 onboarding steps, desktop/mobile layouts, light/dark themes and the integrated Run Console.
- Added fixture regression coverage for metadata leakage, evidence context, action specificity and trace lineage.

## 1.1.0 — 2026-09-01

- Added the integrated dataset → harness version → run → review → compare evaluation loop.
- Added browser-local and localhost deterministic runners with immutable nine-file bundles and full trace steps.
- Added per-claim categorical issue labels, required corrections, source context, primary-source links and local source-line navigation.
- Added dataset and harness-version registries, automated evaluators, pairwise comparison, aggregate failure metrics, reviewer calibration and configurable CI gates.
- Added a prominent workspace switcher plus create, archive, restore and constrained empty-workspace removal.
- Expanded onboarding to 15 real product steps and added a computer-science System inspector.
- Added Chaser Agent case-study redaction and marketing-proof boundaries.

## 1.0.2 — 2026-08-28

- Applied the operator-selected Judgement Lens logo to the app header and favicon.
- Reworked the dashboard, header context and mobile controls for contained desktop, tablet and phone layouts.
- Added visible readiness proof for the personal Chaser Agent instance: three runs and 24/24 canonical artifacts.
- Added a regression test for the complete built-in review session and refreshed release screenshots.

## 0.2.0 — 2026-08-25

- Renamed the standalone product to Agent Review Studio.
- Made workspace and agent identity editable and product-neutral.
- Added broad file adapters, full artifact browsing and IndexedDB run persistence.
- Added immutable review history, exports and linked re-review.
- Replaced static onboarding with a nine-step guided tour.
- Added Settings, adapter documentation, mixed-format fixtures and data-model tests.

## 0.1.0 — 2026-08-25

- Built the local-first Chaser Agent evaluation workspace foundation.
