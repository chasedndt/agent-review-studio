# Version 1.3 navigation, onboarding and lifecycle record

Date: 2 September 2026

## Repo-truth delta

The previous release candidate had the industry workbench, but workspace setup did not capture the operator's intended outcome, archived workspaces were split between sidebar and Settings, the sidebar could not minimise, terminology was spread across onboarding copy, run lineage was described rather than previewed, and guided-tour Step 6 could place its footer below the viewport while leaving the dimming overlay active.

Version 1.3 implements those missing operator surfaces locally. It does not publish, deploy, train a model, connect a probabilistic grader or convert the localhost runner into a hosted server.

## Implemented

- Workspace setup now stores workspace name, agent/harness name, purpose and primary evaluation goal.
- Settings keeps the same fields editable and owns the archive manager.
- Archive remains reversible. Permanent deletion is limited to archived local workspaces and requires typed-name confirmation before removing local runs, review revisions and workbench configuration.
- The desktop sidebar persists a minimised state; the mobile drawer remains complete and scrollable.
- Learn provides a searchable glossary and deterministic local strategy suggestions derived from the declared evaluation goal and purpose.
- Suggested evaluation plans explicitly separate deterministic checks, probabilistic/model-graded checks and human authority.
- The Python evaluator sample is labelled as a template and is not presented as running code.
- Overview previews append-only run lineage with time, harness version, dataset/source and review state.
- The guided tour contains 18 scenes and targets the actual Run evaluation button.
- Tour positioning measures the rendered card, clamps it to the viewport, uses immediate target scrolling and keeps its action footer visible.

## Verification

- Full build and automated tests pass.
- Workspace create, archive, restore and name-confirmed deletion were exercised in the local app.
- Desktop onboarding completed from Scene 1 to Scene 18.
- Mobile onboarding completed from Scene 1 to Scene 18 at 390 × 844.
- Desktop collapsed navigation and mobile drawer navigation were captured and inspected.

Visual evidence: `E:\Visual QA\Agent Review Studio Visual QA\Current Reviews\2026-09-01-navigation-onboarding-repair`

## Remaining boundary

The strategy builder recommends evaluator shapes but does not execute Python or a model grader. The browser-local deterministic runner remains the only integrated execution path besides the bounded localhost bridge and imported external runs. Publication, public-repository merge and social-media case-study work remain separate operator-authorized actions.
