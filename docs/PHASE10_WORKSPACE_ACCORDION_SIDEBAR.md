# Version 1.4 workspace accordion and resizable sidebar

Date: 3 September 2026

## Repo-truth delta

Version 1.3.1 displayed a workspace list and then repeated the selected workspace in a separate scope card. That implied two navigation layers and did not demonstrate how multiple workspaces coexist. Version 1.4 replaces both with one workspace-owned accordion.

## Implemented behaviour

- The sidebar is a stack of independent workspace rows.
- Expanding one row selects that workspace and collapses the previously open row.
- The expanded row contains its own Pages/Runs switch, page routes, dated sessions and immutable run list.
- Pages/Runs choice is remembered per workspace for the current browser session.
- A three-dot menu and right-click expose the same rename, detail, archive and guarded-delete actions.
- The top-bar Workspace control opens a full manager rather than a switch-only native select. Every custom workspace has a visible **Delete** action in this menu; the built-in example is clearly marked as protected.
- Rename preserves the workspace ID and therefore keeps every dataset, run, review and imported artifact linked.
- Permanent deletion remains blocked for the built-in example and requires exact-name confirmation for local workspaces.
- The desktop sidebar width is browser-local state clamped from 248 to 390 pixels. Pointer drag, Arrow Left/Right and Home are supported; double-click resets to 320 pixels.
- The entire sidebar can still minimise to workspace icons. Compact and phone breakpoints use the same hierarchy inside the Browse drawer.
- Expanded panels have their own bounded scroll region so another workspace row remains reachable instead of being pushed below a long run tree.

## Architecture decision

Pages are shared application routes, but every rendered page reads from the selected workspace ID. The product does not duplicate page implementations for each workspace. The accordion represents scope ownership while the shared route layer avoids divergent copies of the same tool.

## Verification

- `npm test`: 34 passed, 0 failed.
- Production build and Sites packaging: passed.
- In-app browser: two-workspace selection, per-workspace Pages/Runs, rename, right-click, guarded deletion entry, minimise/restore, keyboard resize, compact drawer and phone drawer passed.
- Console: zero warnings and zero errors.
- Visual evidence: `E:\Visual QA\Agent Review Studio Visual QA\Current Reviews\2026-09-02-workspace-accordion-sidebar`.

## Untouched boundaries

- Imported source artifacts and completed review revisions remain immutable.
- The built-in Chaser Agent example remains protected from archive and deletion.
- No hosted backend, model provider, training job, publication, deployment, push or merge was performed.
