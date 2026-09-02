# Version 1.3.1 hierarchy, typography and responsive repair

Date: 2 September 2026

## Operator problem

The sidebar showed workspaces, pages and sessions/runs as separate global blocks. At compact desktop widths the header and navigation compressed into a partially minimised state. Guided onboarding was technically available but not obvious enough to a first-time operator.

## Implemented product changes

- Added a persistent **Help & tour** information button to the header on every page.
- Promoted **Start guided onboarding** to a primary Settings action with a plain-language explanation.
- Wrapped Pages and Runs inside an **Inside this workspace** scope card.
- Added Pages/Runs tabs so the run tree cannot be mistaken for global data.
- Grouped every immutable run under its dated session, including a session run count and an explicit workspace-scope note.
- Added a workspace-hierarchy scene to the guided tour and expanded it to 19 scenes.
- Raised the type scale for headings, card copy, metadata, labels, controls and review text.
- Moved drawer navigation to the 1040 px breakpoint so tablet and compact desktop windows reflow instead of compressing.
- Restored accessible names for icon-only collapsed navigation.
- Reset workspace scroll position when changing pages.
- Prevented mobile run content from escaping its workspace card and overlapping footer controls.

## Verification boundary

The built-in Chaser Agent workspace was used as deterministic local QA data. No source run, human review, model weight, remote account, public deployment or production configuration was changed.

Visual evidence is stored in:

`E:\Visual QA\Agent Review Studio Visual QA\Current Reviews\2026-09-02-onboarding-navigation-typography`

The accepted states cover expanded Pages, workspace-scoped Sessions and Runs, minimised navigation, Settings onboarding access, 1016 × 743 reflow, 390 × 844 reflow, mobile workspace navigation and the first, hierarchy and final onboarding scenes.
