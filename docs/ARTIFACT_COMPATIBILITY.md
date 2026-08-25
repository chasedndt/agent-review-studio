# Artifact compatibility

## Principle

Import is loss-averse. A file does not have to match Agent Review Studio’s canonical review schema to remain part of a run. Known files are normalized into task-specific panels; every other file remains visible in the Files workspace with type, size, path, parse state, preview and download-copy access where possible.

## Canonical role mapping

| Canonical role | Primary filename | Accepted aliases | Product surface |
| --- | --- | --- | --- |
| Human review contract | `human_review_packet.json` | `review_packet.json` | Run requirements and review boundary |
| Claims | `claims_table.json` | `claim_table.json`, `claims.json` | Paired claim/evidence inspection |
| Evidence | `evidence_snippets.json` | `evidence.json`, `citations.json` | Exact source evidence |
| Source | `source_card.json` | `source.json`, `provenance.json` | Provenance and source summary |
| Actions | `action_candidates.json` | `actions.json`, `tool_candidates.json` | Action usefulness and approval review |
| Memory | `memory_candidates.json` | `memories.json`, `memory.json` | Durable-memory safety review |
| Uncertainty | `uncertainty_labels.json` | `uncertainties.json`, `limitations.json` | Unknowns and limitation review |
| Trace | `run_log.json` | `runlog.json`, `trace.json`, `trajectory.json` | Execution trace and raw evidence |

Matching is case-insensitive. The canonical normalized object is available to the review flow while the original filename and raw content remain in the file manifest.

## Adapter behaviour

- JSON: parsed into a structured preview. Invalid JSON remains visible with a parse warning.
- JSONL/NDJSON: parsed line by line. Valid rows remain available even when another line is invalid; the first parse errors are surfaced.
- CSV/TSV: first 250 non-empty rows are parsed for a safe table preview and the raw file remains attached.
- YAML/YML/TOML: retained and rendered as text in Phase 2. Semantic normalization is future adapter work.
- Markdown/TXT/LOG/XML/HTML/source code/config: rendered as read-only text. Imported HTML is never injected or executed.
- Raster images: previewed from a local Blob URL.
- PDF: previewed through the browser’s PDF surface when supported.
- SVG: treated as text rather than executed visual content.
- Unknown/binary: stored in IndexedDB as an attachment and exposed through Download copy.

Text previews are capped at 1 MB. Larger text files remain attached and clearly report that the visible preview is truncated.

## Folder grouping

When a selected directory contains `source_card.json` or `human_review_packet.json`, the directory containing that contract becomes a run root. Descendant files remain with that run. When no anchor exists, the importer uses the nearest stable folder grouping and still creates a browsable artifact bundle.

Each import receives a new dated session and each normalized run gets a separate review-instance identifier. A repeated import does not overwrite the prior review context.

## Adding an adapter

1. Add a canonical definition or alias in `src/data.js`.
2. Extend `detectArtifactProfile` for new MIME/extension behaviour.
3. Extend `parseStructuredText` only for safe deterministic parsing.
4. Preserve the raw file manifest entry and Blob even when normalization succeeds.
5. Add a focused fixture and a Node test.
6. Verify the preview and failure state in the browser.
