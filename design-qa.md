# Design QA — version 1.3 release candidate

Date: 2 September 2026

## Version 1.3 navigation and onboarding acceptance

- Workspace creation retained the supplied workspace name, agent/harness name, intended outcome and primary evaluation goal.
- A temporary lifecycle workspace was created, archived, restored, archived again and permanently deleted only after the exact name was typed.
- The desktop sidebar minimised and restored without hiding the active page.
- The Learn workspace rendered the searchable terminology library, deterministic/probabilistic/human strategy split and the explicitly non-executing Python starter.
- Overview rendered a chronological append-only lineage node with harness version, dataset/source and review state.
- All 18 onboarding scenes completed on the desktop viewport. Step 6 kept Back and Next visible; the previous black-overlay failure did not recur.
- All 18 onboarding scenes also completed at 390 × 844. The Step 6 and final lifecycle cards remained inside the viewport with visible controls.
- At 390 × 844, Overview used the mobile top bar and the Browse drawer exposed every navigation page. The drawer itself scrolled instead of allowing footer controls to overlap session rows.
- No QA workspace or fabricated human review remains in the browser after lifecycle testing.

Evidence is stored in `E:\Visual QA\Agent Review Studio Visual QA\Current Reviews\2026-09-01-navigation-onboarding-repair`.

Automated acceptance after implementation:

- `npm test` — 33 passed, 0 failed.
- `npm run build` — passed; Sites bundle prepared.
- `git diff --check` — passed.

## Version 1.2 release-readiness acceptance

- The default Chaser Agent session is `Relevance Regression Candidate — 1 Sep 2026`; the first candidate is a substantive statement at source line 13 rather than document-status metadata.
- The original Run 1 remains available and immutable as regression evidence.
- The Overview distinguishes direct harness improvement from a separate model-training handoff.
- The Review surface exposes surrounding context, primary-source provenance, exact local source navigation, categorical labels and a direct jump to claim judgment.
- All 15 guided-tour steps were advanced through their actual product panels and the tour completed successfully.
- The integrated Run Console exposed local deterministic, localhost bridge and external-import boundaries, with four retained run bundles in the ledger.
- A control-size audit found no undersized interactive review controls except native radio inputs whose associated labels provide the click target.
- Desktop at 1440 × 1000 and mobile at 390 × 844 had zero document-level horizontal overflow; paired evidence collapsed to one column on mobile.
- Light and dark themes rendered successfully.
- Browser console inspection returned zero application warnings or errors.

Current evidence is stored in `E:\Visual QA\Agent Review Studio Visual QA\Current Reviews\2026-09-01-release-readiness-audit`.

## Current workbench acceptance

The version 1.1 implementation was exercised in the in-app browser against the real built-in Chaser Agent workspace.

- The prominent workspace switcher selected the Chaser Agent instance.
- A browser-local run created a fresh nine-file immutable bundle from the full Cloudflare source.
- Metadata status was excluded from claim candidates; the first substantive candidate started at source line 13.
- The paired review showed extraction confidence, surrounding context, primary URL, publication metadata and an exact local source-line action.
- Claim issue labels required a correction and updated classification progress without changing the source run.
- The Files view opened `original_source.md` with line numbers at the linked source location.
- The run log displayed five trace steps and explicit provider, external-action, memory and training boundaries.
- The localhost runner returned ready on `127.0.0.1:4318`; a bridge-created run recorded the localhost command in its trace.
- Baseline/candidate comparison, pairwise controls, dataset and harness-version registries, aggregate evaluators, configurable CI gate and System inspector all rendered and responded.
- A temporary QA workspace was created, archived, restored, archived again and safely removed while empty.
- The 15-step first-run guide opened and advanced to the prominent workspace switcher.
- Light and dark themes both rendered with document width contained at the 1280 CSS-pixel in-app viewport.
- Browser console inspection contained Vite/React development information and no application warning or error.

Current screenshots are stored outside the repository in `E:\Visual QA\Agent Review Studio Visual QA\Current Reviews\2026-09-01-industry-workbench`.

Compact viewport re-capture was not completed in this pass because the in-app browser’s URL security policy rejected the isolated responsive-frame QA surface. Existing 1.0.2 compact evidence remains below; the new workbench breakpoints were code-reviewed, but a new 390 px browser image remains an explicit verification item.

## Automated evidence

- `npm test` — 31 passed, 0 failed.
- `npm run build` — passed; Sites bundle prepared.
- Local runner `/health` — ready.

## Previous 1.0.2 visual target and responsive evidence

## Visual target

The selected source is logo Option 2, the Judgement Lens: an open teal hexagonal aperture, central teal point and separate off-white upper-right facet. The implemented header comparison is stored in `docs/media/logo-reference-vs-implementation.png`.

## Responsive audit

The current public version was captured before implementation at 1440×1024, 834×1194 and 390×844. The audit found:

- the generic stack mark did not match the selected identity;
- the dashboard hero and context content were visually clipped at narrower widths;
- mobile controls and long labels did not communicate a complete app frame;
- the Chaser workspace did not visibly prove that the full session was loaded.

## Implementation checks

The revised local build was checked in the in-app browser at the same viewport widths and in both themes.

- Document width matched viewport width at 1440, 834 and 390 CSS pixels.
- At 390 px, the top bar, overview, review layout, score panel and Understand panel all reported contained client and scroll widths.
- Mobile workspace drawer opened and closed through its visible controls.
- Overview displayed `3 runs loaded · 24/24 canonical artifacts available`.
- Files displayed all eight Run 1 artifacts in canonical review order.
- Run 1 opened at the real review workflow and the first operator step was reachable.
- Light and dark theme controls switched successfully; the readiness panel retained readable contrast.
- Browser console inspection returned zero warnings and zero errors.
- The visual comparison confirmed that the selected mark's aperture, centre point and off-white facet remain legible at header scale.

## Automated evidence

- `npm run build` — passed.
- `npm test` — 21 passed, 0 failed.
- `git diff --check` — passed.

## Remaining product boundary

No human judgement has been fabricated. The first Chaser Agent run remains unscored so the operator can perform the golden evaluation. Server-backed collaboration, governed remote persistence and the future Chaser Agent HTTP runtime are outside this release.

Final result: passed
