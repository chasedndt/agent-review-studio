# Chaser Agent — Evaluation Workspace

A local-first human evaluation and data-curation workspace for refining agent harnesses. It helps an operator inspect run artifacts against source evidence, record repeatable scores and corrections, preserve resumable drafts, and export review records without changing the source artifacts.

This is **not model-weight fine-tuning**. Phase 1 supports:

- human evaluation;
- evidence-grounded data curation;
- benchmark and golden-case construction;
- regression capture;
- prompt, workflow, retrieval, memory, and tool-policy refinement.

## Repository boundary

This directory is its own repository. It is not a branch, package, or subdirectory of the existing public Chaser Agent repository. The product is related to Chaser Agent by name and purpose, while source history, licensing, release decisions, and any future remote repository remain independent.

**Current distribution status:** private, local prototype. All rights reserved. No open-source licence is granted.

## Phase 1 acceptance criteria

The prototype is usable when an operator can:

1. open the three current demonstration runs or import a compatible run-artifact folder as a dated review session;
2. move among projects, dated sessions, runs, artifacts, claims, evidence, actions, memory, and uncertainty;
3. inspect every claim and record five run-level ratings from 0–3;
4. select a final decision and add correction notes;
5. save and restore a local draft after reload;
6. export a review JSON while leaving source JSON unchanged;
7. understand the process through beginner onboarding;
8. complete the main workflow without console errors or broken layouts at desktop and compact widths.

## Run locally

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Open the local address printed by Vite. Data and drafts remain in the browser on this computer.

## Compatible inputs

Use **Import run folders** and select either one run folder or a parent folder containing several runs. Each import becomes a new dated session under the selected project, so reviews from today, tomorrow, and later refinement passes remain separate. A compatible run must contain `source_card.json` or `human_review_packet.json`; the workspace reads the remaining known JSON artifacts when present and degrades safely when optional artifacts are absent.

The current recognized artifact set is defined in `src/data.js`.

## Verification

```powershell
npm run build
npm run test:sites
```

Visual and interaction evidence is recorded in `design-qa.md`. QA screenshots under `qa/` are reproducible local artifacts and are intentionally ignored by Git unless deliberately selected later.
