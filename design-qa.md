# Design QA — version 1.5.0 release candidate

Date: 3 September 2026

## Version 1.5 agent-agnostic first-run acceptance

- A fresh isolated browser origin opened with **zero workspaces**, **Not selected** agent/harness identity and no session.
- First launch opened the real workspace form and required the operator to provide a workspace name, agent/harness name and intended outcome before creation.
- Creating **Support Agent QA** produced a normal empty workspace without Chaser Agent identity, datasets or runs.
- Exact-name-confirmed deletion of that only workspace returned to the neutral **Create your first workspace** state instead of recreating a product default.
- The existing personal Chaser Agent browser record migrated into an ordinary workspace and displayed the same visible **Delete** action as Website QA Harness.
- Personal Chaser evaluation sessions remained available after migration; no source run or review was rewritten.
- The optional localhost execution mode displayed the agent-neutral `local_bridge` identifier in code and **Local runner bridge** in the interface.
- At 390 × 844, the empty state reflowed to one column with no horizontal overflow.

Evidence is stored in `E:\Visual QA\Agent Review Studio Visual QA\Current Reviews\2026-09-03-agent-agnostic-first-run`.

Automated acceptance after implementation:

- `npm test` — 37 passed, 0 failed.
- Production build and Sites bundle preparation — passed.
- `git diff --check` — passed.

## Top-bar workspace deletion acceptance

- Replaced the switch-only native Workspace select with a complete workspace manager.
- The opened menu shows every active workspace, its agent/harness identity and a plainly labelled **Delete** action beside every custom workspace.
- The built-in Chaser Agent example is labelled **Built-in** with a lock instead of presenting an action that cannot succeed.
- Selecting **Delete** opened the existing exact-name confirmation. The permanent button stayed disabled for an empty or mismatched value and enabled only after the full workspace name was entered.
- The example workspace was preserved after testing by choosing **Keep workspace**.
- At 390 × 844, the menu remained inside the viewport at 370 pixels wide with no horizontal overflow and the Delete label remained visible.
- The in-app browser console contained no errors or warnings; development-only Vite and React informational messages remained.

Evidence is stored in `E:\Visual QA\Agent Review Studio Visual QA\Current Reviews\2026-09-03-workspace-delete-control`.

Automated acceptance after implementation:

- `npm test` — 34 passed, 0 failed.
- Production build and Sites bundle preparation — passed.
- `git diff --check` — passed.

## Version 1.4 workspace accordion and sidebar acceptance

- Created a second real browser-local workspace, **Website QA Harness — Example**, alongside the built-in Chaser Agent workspace.
- Opening either workspace collapsed the other and moved the top-bar identity, page navigation and run data to the selected scope.
- Pages and Runs rendered inside the expanded workspace rather than in a duplicated global scope card.
- Chaser Agent's four immutable runs stayed grouped beneath two dated sessions; the second workspace remained visible below the capped inner panel.
- The three-dot menu exposed Rename, Edit details, Archive and Delete. Right-click opened the same menu.
- Rename changed only the workspace label. Guarded deletion opened with zero data implied and required the exact workspace name before enabling the permanent action.
- Keyboard resizing reset the sidebar to 320 pixels and moved it to 332 pixels with Arrow Right; the accepted state had no sidebar-level horizontal overflow.
- The full sidebar minimised to two labelled workspace icons and restored without changing the active page.
- At 1016 pixels and 390 × 844, Browse opened a 300-pixel drawer with no horizontal overflow. Both workspace headers remained visible, and either workspace could be expanded inside the drawer.
- The in-app browser console contained zero warnings and zero errors.

Evidence is stored in `E:\Visual QA\Agent Review Studio Visual QA\Current Reviews\2026-09-02-workspace-accordion-sidebar`.

Automated acceptance after implementation:

- `npm test` — 34 passed, 0 failed.
- Production build and Sites bundle preparation — passed.
- `git diff --check` — passed.

## Version 1.3.1 hierarchy, typography and responsive acceptance

- The header **Help & tour** information button opened onboarding from Overview at desktop and phone widths.
- Settings exposed a prominent **Start guided onboarding** action and explained the persistent header entry.
- The selected workspace owned a bordered Pages/Runs scope. Runs displayed only that workspace's dated sessions and immutable run rows.
- The desktop sidebar minimised to accessible labelled icons and restored without changing the active page.
- At 1016 × 743, the sidebar became a drawer and the top context reflowed to two columns without clipped controls.
- At 390 × 844, the workspace scope header and Pages/Runs tabs remained aligned and readable.
- The mobile run tree remained inside the workspace scope; the final run ended above the footer with zero overlap.
- All 19 onboarding scenes were reached. The new workspace-hierarchy scene opened the mobile drawer, and the first and final cards kept their controls visible.
- Page navigation reset the workspace scroll position instead of inheriting the previous page's scroll offset.

Evidence is stored in `E:\Visual QA\Agent Review Studio Visual QA\Current Reviews\2026-09-02-onboarding-navigation-typography`.

Automated acceptance after implementation:

- `npm test` — 33 passed, 0 failed.
- Production build and Sites bundle preparation — passed.
- In-app browser console — 0 errors and 0 warnings in the accepted final state.

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
