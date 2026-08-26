# Version 1.0 release record — 2026-08-26

## Repo-truth delta

Version 1.0 turns the operator-completion build into a visually complete, public-ready standalone application. The chosen Evidence Operations Console direction is implemented in both dark and light modes, the canonical review bundle is easier to navigate, and the real current Chaser Agent evaluation runs have been imported through the product rather than represented only by screenshots or fixtures.

## Release capabilities

- neutral Agent Review Studio product identity with per-workspace agent or harness naming;
- persistent light and dark themes;
- projects, dated sessions and chronological run queues;
- folder and loose-file import with loss-averse retention;
- canonical eight-artifact ordering and broad file adapters;
- paired claim/evidence inspection with linked actions and source provenance;
- deterministic diagnostics separated from human judgement;
- five once-per-run ratings, decision rules, resumable drafts and immutable review revisions;
- linked re-review, history and portable JSON exports;
- restartable 10-state onboarding through real application controls;
- responsive desktop, tablet and mobile navigation.

## Real-run acceptance

A fresh `Chaser Agent Harness Calibration` workspace imported `public/demo-runs` through the real folder chooser. The application created one dated session with three run bundles and 24 total source files. Each run exposed all eight canonical artifacts in this order:

1. human review packet;
2. claims table;
3. evidence snippets;
4. source card;
5. action candidates;
6. memory candidates;
7. uncertainty labels;
8. run log.

Reload acceptance confirmed that workspace identity, session identity, all three runs and the selected theme persist in the browser profile. The runs remain unreviewed because deterministic wiring proof must not masquerade as human judgement.

## Verification

- automated data and Sites worker suite: 20/20 passing before final documentation;
- production build and Sites packaging: passing before final documentation;
- desktop, 834 px and 390 px browser acceptance: passed;
- document-level overflow: 824/824 at tablet and 380/380 at mobile;
- guided onboarding: all 10 states passed;
- browser console: zero warnings and zero errors;
- source/implementation visual comparisons: no actionable P0, P1 or P2 findings.

Final command results, public repository, deployment and ChaseInTech integration are recorded in the release handover after publication.

## Untouched boundaries

- Chaser Agent source runs and core repository remain unchanged.
- Imported evidence is immutable.
- No review promotes memory, executes an external action or changes model weights.
- The HTTP/server, authentication, rate-limiting and multi-user layers remain future governed work.
