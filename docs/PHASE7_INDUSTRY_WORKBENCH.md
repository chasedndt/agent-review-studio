# Phase 7 — Industry evaluation workbench

Date: 1 September 2026

## Repo-truth delta

Before this phase, Agent Review Studio was a strong local review viewer: it imported artifacts, paired claims with evidence, collected five run-level scores and preserved review revisions. It did not execute a run, version a dataset or harness, classify individual claim failures, compare experiments, measure evaluator patterns or expose a CI gate.

This phase adds those missing workbench contracts without pretending that model training or a hosted multi-user service exists.

## Implemented product loop

1. Select or create an agent-agnostic workspace.
2. Define a versioned dataset and immutable test case with primary-source provenance.
3. Register an agent/harness version with a profile and commit or build reference.
4. Create a fresh run with the browser-local deterministic adapter, the bounded localhost bridge, or import an external bundle.
5. Preserve eight canonical JSON artifacts, the original source and a step-by-step trace.
6. Run structural automated evaluators without filling human judgment fields.
7. Classify every extracted claim candidate with categorical labels and required corrections.
8. Score the complete run once, create an immutable review revision and re-review through linked lineage.
9. Compare baseline and candidate runs, add a separate pairwise preference, inspect aggregate failure patterns and evaluate the configured CI gate.

## What the claims are

The runner normalises source text into stable lines, excludes recognised metadata and fragments, ranks substantive statement candidates, and preserves their line identity. These are **claim candidates**, not verified truths. “Extraction confidence” only describes the parser’s confidence that it copied a candidate cleanly.

Human reviewers assign one or more labels:

- Supported and relevant
- Not a claim
- Irrelevant
- Missing context
- Unsupported
- Misclassified
- Duplicate
- Needs external verification
- Linked action is unrelated

Failure labels require a correction before the run can be finished. This creates claim-level ground truth while leaving the source run immutable.

## Automated evaluation boundary

Implemented evaluators measure bundle integrity, primary-source provenance, metadata leakage into claims, surrounding evidence context, action-link specificity and trace presence. They are deterministic triage signals. They do not decide whether a statement is true, whether an action is strategically good, or what human 0–3 score to assign.

## Execution boundaries

- Browser-local adapter: deterministic text processing in the Studio; no provider call.
- Local runner bridge: localhost-only HTTP adapter on `127.0.0.1:4318`; no external action or training.
- Import-only: preserves external execution as a separate provenance boundary.

The current bridge is not the future Chaser Agent HTTP server. Authentication, queues, rate limits, remote persistence, network context transport and multi-tenant isolation remain later engineering phases.

## Computer-science map

| Workbench feature | Fundamental | Current use |
| --- | --- | --- |
| Source normalisation | String processing and defensive parsing | Stable text lines and metadata exclusion in O(n) time. |
| Claim ranking | Feature scoring and stable sorting | Candidate selection in O(n log n) time. |
| Provenance | Graphs and referential integrity | Source → excerpt → claim → action → review edges. |
| Immutable history | Append-only records and linked structures | Run, version and review lineage without overwrite. |
| Reviewer calibration | Descriptive statistics | Agreement only when independent judgments exist for the same run. |
| Regression gate | Testing, thresholds and state machines | Automated quality, critical failures and human-pass boundary. |
| Backpropagation | Calculus and optimisation | Not implemented; belongs to a later governed training pipeline. |

## Verification evidence

- `npm test`: 31 passed, 0 failed on 1 September 2026 after the Version 1.2 release-readiness regression was added.
- Production build: passed and Sites packaging was generated.
- Browser-local Chaser run: created eight ranked claim candidates from the full source with surrounding context and source metadata.
- Local runner bridge: health endpoint returned ready; a new immutable run recorded the localhost command and five trace steps.
- Workspace lifecycle: create, archive, restore and remove-empty flows executed in a QA workspace.
- Browser console: zero application warnings or errors; Vite and React development information only.

## Untouched boundaries

- No operator score or Pass/Fail decision was fabricated.
- No source artifact or previous review was rewritten.
- No model weight, memory store, provider, external action or deployment was changed.
- The user’s Chaser Agent repository and its unrelated dirty work were not modified.
- Nothing in this phase was pushed or deployed.
