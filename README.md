# Agent Review Studio

Agent Review Studio helps you review an agent’s work, label what was good or wrong, save the correction, and use that trusted example to improve and re-test the agent. It is a local-first workspace for AI agents and agent harnesses: reviewers inspect complete run bundles, compare claims with source evidence, score quality and preserve a revision history without changing the original artifacts.

Chaser Agent is the built-in demonstration workspace. It is not the product identity; any agent, harness, workflow or service can have its own named workspace.

**Live application:** [agent-review-studio.chaseintech.chatgpt.site](https://agent-review-studio.chaseintech.chatgpt.site)

![Agent Review Studio evidence workspace](docs/media/agent-review-studio-light.png)

## What process is this?

This is **agent evaluation, human labelling, evidence curation and harness refinement**. It prepares trusted improvement data; it is not automatic model-weight fine-tuning.

The review output can improve:

- prompts and system instructions;
- workflow and orchestration logic;
- retrieval, evidence and provenance handling;
- tool-selection and approval policies;
- memory admission rules;
- golden cases, regression suites and future training datasets.

Model fine-tuning may later consume carefully selected review data, but this application currently changes neither model weights nor imported source artifacts.

## Working capabilities

- An operator overview with session progress, a deterministic run queue and a clear next-review action.
- Bundle diagnostics for canonical artifact presence, parse failures, identity consistency, unique IDs and resolvable claim/evidence/action/uncertainty links.
- Multiple agent-agnostic workspaces with editable project, agent and reviewer identities.
- Dated sessions and run groups for repeat reviews over time.
- Folder and loose-file import.
- A complete artifact browser with filtering, role detection, parse state, table preview, image/PDF preview where the browser supports it, raw text/JSON preview and download-copy actions.
- A canonical operator-review order for human packet, claims, evidence, source card, actions, memory, uncertainty and run log, with unknown files retained afterwards.
- Canonical review mapping for human packet, claims, evidence, source, actions, memory, uncertainty and trace artifacts.
- Retention of unfamiliar supporting files instead of silent discard.
- Paired claim/evidence review, action review, memory review and uncertainty review.
- Explicit operator confirmation for the review contract, source card, every claim/evidence pair, actions, memory, uncertainty and run log before completion.
- Five once-per-run quality ratings on a 0–3 scale, a final decision and correction notes.
- A complete rating rubric with dimension-specific 0–3 anchors; correction notes are required for Needs revision and Fail.
- Resumable drafts.
- Immutable review revisions, JSON export, linked re-review and score-change history.
- Session-level evaluation-pack export with diagnostics, latest operator revisions and an explicit completion summary.
- Exact isolation of development-QA seed records from genuine operator progress.
- A ten-step guided tour that navigates the real product and can be restarted from Settings.
- Persistent light and dark themes for extended evidence reading and focused operator sessions.
- IndexedDB storage for imported run bundles and binary attachments; local browser storage for identities, drafts and revision records.

## File compatibility

The current adapter registry supports:

| Group | Formats | Behaviour |
| --- | --- | --- |
| Structured data | JSON, JSONL, NDJSON, YAML, YML, TOML | JSON and JSON Lines are parsed; other structured text is previewed and retained. |
| Tables | CSV, TSV | Browser table preview plus raw retention. |
| Documents and logs | Markdown, TXT, LOG, XML, HTML | Safe text preview; HTML is not executed. |
| Source code | JS/TS, Python, SQL, shell, PowerShell and common language/config extensions | Read-only text preview. |
| Visual evidence | PNG, JPG, JPEG, WebP, GIF, SVG, PDF | Safe browser preview when supported; otherwise retained for download. |
| Other attachments | Any extension | Stored as an immutable binary attachment with metadata and download-copy access. |

The detailed adapter and normalization contract is in [docs/ARTIFACT_COMPATIBILITY.md](docs/ARTIFACT_COMPATIBILITY.md).

## Run locally

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Open the address printed by Vite. Data remains in the browser profile on this computer.

## Verification

```powershell
npm test
npm run build
```

The test suite covers adapter aliases, JSON Lines recovery, nested run grouping, deterministic diagnostics, operator/QA state separation, decision-note rules, session export, review-revision lineage and Sites packaging. Browser interaction, responsive checks, real Chaser Agent import proof and source/implementation comparisons are recorded in [design-qa.md](design-qa.md).

## Data and safety boundary

- Imported artifacts are read-only evidence.
- Finishing a review creates a new review revision and exports JSON; it never rewrites the imported bundle.
- Re-review links a new revision to its parent instead of overwriting the earlier judgement.
- No provider call, external tool action, memory promotion, training job or deployment is authorized by a review.
- Version 1.0.1 remains single-browser and local-first; multi-user collaboration and the governed HTTP/server layer are the next engineering boundary.

## Open-source release

Version 1.0 is licensed under Apache-2.0 and includes contribution and security policies. The source is public at [github.com/chasedndt/agent-review-studio](https://github.com/chasedndt/agent-review-studio), and the working application is deployed through OpenAI Sites. The package remains `private: true` to prevent accidental npm registry publication; that flag does not limit source-code use under the repository license.

## Engineering map

- [Artifact compatibility](docs/ARTIFACT_COMPATIBILITY.md)
- [Review revision model](docs/REVIEW_REVISION_MODEL.md)
- [Phase 2 implementation record](docs/PHASE2_IMPLEMENTATION.md)
- [Operator completion implementation record](docs/PHASE3_OPERATOR_COMPLETION.md)
- [Version 1.0 release record](docs/PHASE4_RELEASE.md)
- [Documentation index](docs/index.md)
