# Agent Review Studio

Agent Review Studio is a local-first workspace for evaluating, curating and improving AI-agent and agent-harness runs. It gives human reviewers one place to inspect complete run bundles, compare claims with source evidence, score product quality, preserve corrections and create a revision history without changing the source artifacts.

Chaser Agent is the built-in demonstration workspace. It is not the product identity; any agent, harness, workflow or service can have its own named workspace.

## What process is this?

This is **agent evaluation, evidence curation and harness refinement**. It is not model-weight fine-tuning.

The review output can improve:

- prompts and system instructions;
- workflow and orchestration logic;
- retrieval, evidence and provenance handling;
- tool-selection and approval policies;
- memory admission rules;
- golden cases, regression suites and future training datasets.

Model fine-tuning may later consume carefully selected review data, but this application currently changes neither model weights nor imported source artifacts.

## Working capabilities

- Multiple agent-agnostic workspaces with editable project, agent and reviewer identities.
- Dated sessions and run groups for repeat reviews over time.
- Folder and loose-file import.
- A complete artifact browser with filtering, role detection, parse state, table preview, image/PDF preview where the browser supports it, raw text/JSON preview and download-copy actions.
- Canonical review mapping for human packet, claims, evidence, source, actions, memory, uncertainty and trace artifacts.
- Retention of unfamiliar supporting files instead of silent discard.
- Paired claim/evidence review, action review, memory review and uncertainty review.
- Five once-per-run quality ratings on a 0–3 scale, a final decision and correction notes.
- Resumable drafts.
- Immutable review revisions, JSON export, linked re-review and score-change history.
- A nine-step guided tour that navigates the real product and can be restarted from Settings.
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

The test suite covers adapter aliases, JSON Lines recovery, nested run grouping, review-revision lineage and Sites packaging. Browser interaction and visual evidence are recorded in [design-qa.md](design-qa.md).

## Data and safety boundary

- Imported artifacts are read-only evidence.
- Finishing a review creates a new review revision and exports JSON; it never rewrites the imported bundle.
- Re-review links a new revision to its parent instead of overwriting the earlier judgement.
- No provider call, external tool action, memory promotion, training job or deployment is authorized by a review.
- Phase 2 is single-browser and local-first; multi-user collaboration and server-backed sync are future work.

## Open-source status

This standalone repository is being prepared for open-source publication, but it has not been pushed, published or deployed. A final `LICENSE`, public repository name and contribution policy still require the operator’s explicit selection before public release. The package remains `private: true` to prevent accidental npm publication during development.

## Engineering map

- [Artifact compatibility](docs/ARTIFACT_COMPATIBILITY.md)
- [Review revision model](docs/REVIEW_REVISION_MODEL.md)
- [Phase 2 implementation record](docs/PHASE2_IMPLEMENTATION.md)
- [Documentation index](docs/index.md)
