export const ARTIFACT_DEFINITIONS = [
  { canonical: "human_review_packet.json", aliases: ["human_review_packet.json", "review_packet.json"], role: "review-contract", label: "Human review packet", section: "Review contract" },
  { canonical: "claims_table.json", aliases: ["claims_table.json", "claim_table.json", "claims.json"], role: "claims", label: "Claims table", section: "Agent output" },
  { canonical: "evidence_snippets.json", aliases: ["evidence_snippets.json", "evidence.json", "citations.json"], role: "evidence", label: "Evidence snippets", section: "Source evidence" },
  { canonical: "source_card.json", aliases: ["source_card.json", "source.json", "provenance.json"], role: "source", label: "Source card", section: "Source evidence" },
  { canonical: "action_candidates.json", aliases: ["action_candidates.json", "actions.json", "tool_candidates.json"], role: "actions", label: "Action candidates", section: "Agent decisions" },
  { canonical: "memory_candidates.json", aliases: ["memory_candidates.json", "memories.json", "memory.json"], role: "memory", label: "Memory candidates", section: "Agent decisions" },
  { canonical: "uncertainty_labels.json", aliases: ["uncertainty_labels.json", "uncertainties.json", "limitations.json"], role: "uncertainty", label: "Uncertainty labels", section: "Agent decisions" },
  { canonical: "run_log.json", aliases: ["run_log.json", "runlog.json", "trace.json", "trajectory.json"], role: "trace", label: "Run log / trace", section: "Execution trace" },
];

export const ARTIFACT_FILES = ARTIFACT_DEFINITIONS.map((item) => item.canonical);

export const SUPPORTED_FILE_GROUPS = [
  { label: "Structured data", extensions: "JSON, JSONL, NDJSON, YAML, YML, TOML" },
  { label: "Tables", extensions: "CSV, TSV" },
  { label: "Documents and logs", extensions: "Markdown, TXT, LOG, XML, HTML" },
  { label: "Source code", extensions: "JS, JSX, TS, TSX, Python, SQL, shell, PowerShell and common config files" },
  { label: "Visual evidence", extensions: "PNG, JPG, JPEG, WebP, GIF, SVG, PDF" },
  { label: "Other attachments", extensions: "Retained with metadata and downloadable binary content" },
];

const DEMO_META = [
  {
    id: "run-1",
    kind: "built-in",
    sessionId: "source-review-calibration-2026-08-25",
    sessionLabel: "Source Review Calibration — 25 Aug 2026",
    label: "Run 1",
    shortLabel: "AI-engineering research",
    description: "Specialist research-review profile",
  },
  {
    id: "run-2",
    kind: "built-in",
    sessionId: "source-review-calibration-2026-08-25",
    sessionLabel: "Source Review Calibration — 25 Aug 2026",
    label: "Run 2",
    shortLabel: "General source review",
    description: "General profile on the same source",
  },
  {
    id: "run-3",
    kind: "built-in",
    sessionId: "source-review-calibration-2026-08-25",
    sessionLabel: "Source Review Calibration — 25 Aug 2026",
    label: "Run 3",
    shortLabel: "Website-design review",
    description: "Design profile on a public-safe toy note",
  },
];

const TEXT_EXTENSIONS = new Set([
  "json", "jsonl", "ndjson", "yaml", "yml", "toml", "md", "markdown", "txt", "log",
  "csv", "tsv", "xml", "html", "htm", "js", "jsx", "mjs", "cjs", "ts", "tsx", "py",
  "sql", "sh", "bash", "zsh", "ps1", "bat", "cmd", "ini", "cfg", "conf", "env", "css",
  "scss", "less", "java", "go", "rs", "rb", "php", "swift", "kt", "kts", "c", "h", "cpp",
  "hpp", "cs", "r", "lua", "svg", "dockerfile", "gitignore",
]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"]);
const MAX_TEXT_BYTES = 1_000_000;

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

function artifactList(artifact, key) {
  if (!artifact) return [];
  return asArray(artifact[key]);
}

function extensionOf(name) {
  const lower = String(name || "").toLowerCase();
  if (!lower.includes(".")) return lower;
  return lower.split(".").at(-1);
}

export function detectArtifactProfile(name, mime = "") {
  const lowerName = String(name || "").toLowerCase();
  const extension = extensionOf(lowerName);
  const definition = ARTIFACT_DEFINITIONS.find((item) => item.aliases.includes(lowerName));
  const textual = TEXT_EXTENSIONS.has(extension) || String(mime).startsWith("text/");
  const visual = IMAGE_EXTENSIONS.has(extension) || String(mime).startsWith("image/");
  const pdf = extension === "pdf" || mime === "application/pdf";
  let format = extension ? extension.toUpperCase() : "FILE";
  if (extension === "md" || extension === "markdown") format = "Markdown";
  if (extension === "jsonl" || extension === "ndjson") format = "JSON Lines";
  if (extension === "yaml" || extension === "yml") format = "YAML";
  if (visual) format = "Image";
  if (pdf) format = "PDF";

  return {
    canonical: definition?.canonical || null,
    role: definition?.role || (visual || pdf ? "visual-evidence" : textual ? "supporting-text" : "attachment"),
    roleLabel: definition?.label || (visual || pdf ? "Visual evidence" : textual ? "Supporting file" : "Attachment"),
    section: definition?.section || (visual || pdf ? "Visual evidence" : "Supporting context"),
    extension,
    format,
    kind: visual ? "image" : pdf ? "pdf" : textual ? "text" : "binary",
  };
}

export function parseStructuredText(name, text) {
  const extension = extensionOf(name);
  if (extension === "json") {
    try {
      return { parsed: JSON.parse(text), parseStatus: "Parsed", parseError: "" };
    } catch (error) {
      return { parsed: null, parseStatus: "Needs attention", parseError: error.message };
    }
  }

  if (extension === "jsonl" || extension === "ndjson") {
    const values = [];
    const errors = [];
    text.split(/\r?\n/).forEach((line, index) => {
      if (!line.trim()) return;
      try {
        values.push(JSON.parse(line));
      } catch (error) {
        errors.push(`Line ${index + 1}: ${error.message}`);
      }
    });
    return {
      parsed: values,
      parseStatus: errors.length ? "Partially parsed" : "Parsed",
      parseError: errors.slice(0, 3).join(" · "),
    };
  }

  if (extension === "csv" || extension === "tsv") {
    const delimiter = extension === "tsv" ? "\t" : ",";
    const rows = text.split(/\r?\n/).filter(Boolean).slice(0, 250).map((line) => line.split(delimiter));
    return { parsed: rows, parseStatus: "Preview ready", parseError: "" };
  }

  return { parsed: null, parseStatus: "Preview ready", parseError: "" };
}

function relativeDirectory(path) {
  const normalized = String(path || "").replaceAll("\\", "/");
  const segments = normalized.split("/");
  return segments.length > 1 ? segments.slice(0, -1).join("/") : "imported-run";
}

export function groupFileRecords(records) {
  if (!records.length) return [];
  const anchorDirectories = Array.from(new Set(records
    .filter((record) => detectArtifactProfile(record.name, record.type).canonical === "source_card.json"
      || detectArtifactProfile(record.name, record.type).canonical === "human_review_packet.json")
    .map((record) => relativeDirectory(record.relativePath))));

  const firstSegments = new Set(records.map((record) => record.relativePath.split("/")[0]));
  const sharedRoot = firstSegments.size === 1 ? Array.from(firstSegments)[0] : "";
  const groups = new Map();

  records.forEach((record) => {
    const directory = relativeDirectory(record.relativePath);
    const anchored = anchorDirectories
      .filter((candidate) => directory === candidate || directory.startsWith(`${candidate}/`))
      .sort((left, right) => right.length - left.length)[0];
    const parts = record.relativePath.split("/");
    const fallback = sharedRoot && parts.length > 2 ? parts.slice(0, 2).join("/") : directory;
    const group = anchored || fallback || "imported-run";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(record);
  });

  return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }));
}

async function readImportedFile(file) {
  const relativePath = file.webkitRelativePath || file.name;
  const profile = detectArtifactProfile(file.name, file.type);
  let content = "";
  let parsed = null;
  let parseStatus = profile.kind === "binary" ? "Stored" : "Preview ready";
  let parseError = "";
  const truncated = profile.kind === "text" && file.size > MAX_TEXT_BYTES;

  if (profile.kind === "text") {
    content = await file.slice(0, MAX_TEXT_BYTES).text();
    const result = parseStructuredText(file.name, content);
    parsed = result.parsed;
    parseStatus = truncated ? `${result.parseStatus} · preview truncated` : result.parseStatus;
    parseError = result.parseError;
  }

  return {
    id: `${relativePath}::${file.size}::${file.lastModified || 0}`,
    name: file.name,
    relativePath,
    directory: relativeDirectory(relativePath),
    mime: file.type || "application/octet-stream",
    size: file.size,
    lastModified: file.lastModified || null,
    content,
    parsed,
    parseStatus,
    parseError,
    truncated,
    blob: file.slice(0, file.size, file.type || "application/octet-stream"),
    ...profile,
  };
}

export function assembleRun(meta, artifacts, files = []) {
  const packet = artifacts["human_review_packet.json"] || {};
  const sourceCard = artifacts["source_card.json"] || {};
  const claims = artifactList(artifacts["claims_table.json"], "claims").length
    ? artifactList(artifacts["claims_table.json"], "claims")
    : asArray(sourceCard.source_claims);
  const evidence = artifactList(artifacts["evidence_snippets.json"], "evidence_snippets");
  const actions = artifactList(artifacts["action_candidates.json"], "action_candidates").length
    ? artifactList(artifacts["action_candidates.json"], "action_candidates")
    : asArray(sourceCard.action_candidates);
  const memories = artifactList(artifacts["memory_candidates.json"], "memory_candidates").length
    ? artifactList(artifacts["memory_candidates.json"], "memory_candidates")
    : asArray(sourceCard.memory_candidates);
  const uncertainties = artifactList(artifacts["uncertainty_labels.json"], "uncertainty_labels").length
    ? artifactList(artifacts["uncertainty_labels.json"], "uncertainty_labels")
    : asArray(sourceCard.uncertainty_labels);
  const runLog = artifacts["run_log.json"] || {};
  const sourceRunId = packet.run_id || sourceCard.run_id || meta.sourceRunId || meta.id;

  return {
    id: meta.instanceId || sourceRunId,
    sourceRunId,
    kind: meta.kind || "local",
    sessionId: meta.sessionId || "unsorted-runs",
    sessionLabel: meta.sessionLabel || "Unsorted runs",
    demoId: meta.id,
    label: meta.label || "Imported run",
    shortLabel: meta.shortLabel || sourceCard.source_title || packet.workflow_profile || "Imported artifact bundle",
    description: meta.description || packet.workflow_profile || "Imported folder",
    workflowProfile: packet.workflow_profile || sourceCard.workflow_profile || "unclassified workflow",
    sourceId: packet.source_id || sourceCard.source_id || "unknown source",
    sourceTitle: sourceCard.source_title || sourceCard.source_metadata?.title || meta.label || "Untitled source",
    sourceSummary: sourceCard.source_summary || "No source summary was recorded. Review the Files workspace for the complete imported bundle.",
    sourceOrigin: sourceCard.source_origin || "Unknown origin",
    sourceMetadata: sourceCard.source_metadata || {},
    createdAt: sourceCard.created_at || runLog.created_at || null,
    claims,
    evidence,
    actions,
    memories,
    uncertainties,
    inferences: asArray(sourceCard.agent_inferences || sourceCard.chaser_agent_inferences),
    packet,
    sourceCard,
    runLog,
    artifacts,
    files,
  };
}

async function loadDemoRun(meta) {
  const files = [];
  const artifacts = {};
  for (const name of ARTIFACT_FILES) {
    const response = await fetch(`/demo-runs/${meta.id}/${name}`);
    if (!response.ok) continue;
    const content = await response.text();
    const parsed = JSON.parse(content);
    const profile = detectArtifactProfile(name, "application/json");
    artifacts[name] = parsed;
    files.push({
      id: `${meta.id}::${name}`,
      name,
      relativePath: `${meta.id}/${name}`,
      directory: meta.id,
      mime: "application/json",
      size: new Blob([content]).size,
      lastModified: null,
      content,
      parsed,
      parseStatus: "Parsed",
      parseError: "",
      truncated: false,
      blob: null,
      ...profile,
    });
  }
  return assembleRun(meta, artifacts, files);
}

export async function loadDemoRuns() {
  return Promise.all(DEMO_META.map(loadDemoRun));
}

export async function parseRunFolderFiles(fileList) {
  const records = await Promise.all(Array.from(fileList).map(readImportedFile));
  const groups = groupFileRecords(records);
  const importedAt = new Date();
  const sessionId = `import-${importedAt.toISOString().replace(/\D/g, "").slice(0, 17)}`;
  const sessionLabel = `Imported review — ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(importedAt)}`;

  return groups.map(([folder, files], index) => {
    const artifacts = {};
    files.forEach((file) => {
      if (file.canonical && file.parsed !== null) artifacts[file.canonical] = file.parsed;
    });
    const profile = artifacts["human_review_packet.json"]?.workflow_profile
      || artifacts["source_card.json"]?.workflow_profile;
    const folderName = folder.split("/").at(-1) || `Imported ${index + 1}`;
    const label = folderName.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    const sourceRunId = artifacts["human_review_packet.json"]?.run_id
      || artifacts["source_card.json"]?.run_id
      || `${folderName}-${index + 1}`;
    return assembleRun({
      id: `imported-${Date.now()}-${index}`,
      instanceId: `${sessionId}::${sourceRunId}::${index}`,
      sourceRunId,
      sessionId,
      sessionLabel,
      label,
      shortLabel: profile ? String(profile).replaceAll("_", " ") : `${files.length} imported files`,
      description: folder,
    }, artifacts, files);
  });
}

export function findEvidence(run, claim) {
  if (!claim) return null;
  return run.evidence.find((item) => item.snippet_id === claim.evidence_snippet_id)
    || run.evidence.find((item) => {
      const linked = asArray(item.supports_claim_ids).flatMap((value) => String(value).split(" "));
      return linked.includes(claim.claim_id);
    })
    || null;
}

export function emptyDraft(seed = {}) {
  return {
    ratings: {
      source_fidelity: null,
      inference_separation: null,
      uncertainty_handling: null,
      action_usefulness: null,
      memory_safety: null,
      ...(seed.ratings || {}),
    },
    decision: seed.decision || "",
    notes: seed.notes || seed.corrections_or_notes || "",
    inspectedClaims: seed.inspectedClaims || seed.reviewed_claim_ids || [],
    actionsChecked: Boolean(seed.actionsChecked ?? seed.actions_checked),
    memoryChecked: Boolean(seed.memoryChecked ?? seed.memory_checked),
    status: seed.status || "draft",
    updatedAt: seed.updatedAt || null,
    parentRevisionId: seed.parentRevisionId || null,
  };
}

const DRAFT_KEY = "agent-review-studio-drafts-v2";
const LEGACY_DRAFT_KEY = "chaser-agent-review-drafts-v1";
const HISTORY_KEY = "agent-review-studio-history-v1";
const LEGACY_RUNS_KEY = "chaser-agent-imported-runs-v1";

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function loadDraft(runId) {
  const current = readJsonStorage(DRAFT_KEY, {});
  const legacy = readJsonStorage(LEGACY_DRAFT_KEY, {});
  return emptyDraft(current[runId] || legacy[runId] || {});
}

export function loadLegacyImportedRuns() {
  const saved = readJsonStorage(LEGACY_RUNS_KEY, {});
  if (!saved || typeof saved !== "object") return {};
  return Object.fromEntries(Object.entries(saved).map(([projectId, runs]) => [
    projectId,
    Array.isArray(runs) ? runs.map((run, index) => {
      if (run.sessionId && run.sessionLabel && run.sourceRunId) {
        return { ...run, files: Array.isArray(run.files) ? run.files : Object.entries(run.artifacts || {}).map(([name, parsed]) => ({
          id: `${run.id}::${name}`,
          name,
          relativePath: `${run.id}/${name}`,
          directory: run.id,
          mime: "application/json",
          size: new Blob([JSON.stringify(parsed)]).size,
          lastModified: null,
          content: JSON.stringify(parsed, null, 2),
          parsed,
          parseStatus: "Parsed",
          parseError: "",
          truncated: false,
          blob: null,
          ...detectArtifactProfile(name, "application/json"),
        })) };
      }
      const sourceRunId = run.sourceRunId || run.id || `legacy-run-${index + 1}`;
      return {
        ...run,
        id: `legacy-imported-review::${sourceRunId}`,
        sourceRunId,
        kind: "local",
        sessionId: "legacy-imported-review",
        sessionLabel: "Earlier imported review",
        files: [],
      };
    }) : [],
  ]));
}

export function persistDraft(runId, draft) {
  const all = readJsonStorage(DRAFT_KEY, {});
  const saved = { ...draft, updatedAt: new Date().toISOString() };
  all[runId] = saved;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
  return saved;
}

export function createReviewRevision({ projectId, workspaceName, agentName, reviewerName, run, draft, scoreTotal }) {
  const reviewedAt = new Date().toISOString();
  return {
    schema_version: "agent_review_studio.review.v2",
    revision_id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    parent_revision_id: draft.parentRevisionId || null,
    project_id: projectId,
    workspace_name: workspaceName,
    agent_name: agentName,
    reviewer_name: reviewerName || "Local operator",
    session_id: run.sessionId,
    session_label: run.sessionLabel,
    review_instance_id: run.id,
    run_id: run.sourceRunId || run.id,
    run_label: run.label,
    source_id: run.sourceId,
    workflow_profile: run.workflowProfile,
    ratings: draft.ratings,
    total: scoreTotal,
    decision: draft.decision,
    corrections_or_notes: draft.notes,
    reviewed_claim_ids: draft.inspectedClaims,
    actions_checked: draft.actionsChecked,
    memory_checked: draft.memoryChecked,
    reviewed_at: reviewedAt,
    source_artifacts_mutated: false,
  };
}

export function loadReviewHistory(projectId = null) {
  const records = readJsonStorage(HISTORY_KEY, []);
  const list = Array.isArray(records) ? records : [];
  return (projectId ? list.filter((record) => record.project_id === projectId) : list)
    .sort((left, right) => String(right.reviewed_at).localeCompare(String(left.reviewed_at)));
}

export function appendReviewRevision(record) {
  const records = loadReviewHistory();
  const next = [record, ...records.filter((item) => item.revision_id !== record.revision_id)];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return record;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** index);
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}
