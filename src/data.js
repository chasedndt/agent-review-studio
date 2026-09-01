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

export const RATING_DEFINITIONS = [
  {
    key: "source_fidelity",
    label: "Source fidelity",
    help: "How well does the run preserve the supplied evidence?",
    anchors: [
      "Fabricates, contradicts or loses the source.",
      "Contains material gaps or weak traceability.",
      "Mostly traceable with only minor omissions.",
      "Faithful, complete and directly traceable.",
    ],
  },
  {
    key: "inference_separation",
    label: "Inference separation",
    help: "Are agent conclusions visibly separate from source statements?",
    anchors: [
      "Presents inference as source fact.",
      "Mixes facts and conclusions in risky places.",
      "Separates most inference with small ambiguities.",
      "Consistently labels and grounds every inference.",
    ],
  },
  {
    key: "uncertainty_handling",
    label: "Uncertainty handling",
    help: "Are important unknowns and limitations made explicit?",
    anchors: [
      "Hides decisive unknowns or overstates certainty.",
      "Mentions uncertainty but misses material limits.",
      "Captures the important unknowns adequately.",
      "Makes limits, confidence and verification needs precise.",
    ],
  },
  {
    key: "action_usefulness",
    label: "Action usefulness",
    help: "Could an operator act or decide without unnecessary guesswork?",
    anchors: [
      "Unsafe, irrelevant or impossible to execute.",
      "Directionally useful but vague or poorly bounded.",
      "Actionable with minor clarification required.",
      "Specific, bounded, prioritized and approval-aware.",
    ],
  },
  {
    key: "memory_safety",
    label: "Memory safety",
    help: "Are durable-memory proposals safe, complete and appropriately scoped?",
    anchors: [
      "Promotes unsafe, private or unverified material.",
      "Has material scope, provenance or durability gaps.",
      "Safe enough with minor metadata improvements.",
      "Explicitly bounded, sourced, durable and review-gated.",
    ],
  },
];

export const SCORE_SCALE = [[0, "Unusable"], [1, "Weak"], [2, "Acceptable"], [3, "Strong"]];

export const DEVELOPMENT_QA_NOTE = "QA draft: evidence navigation and review state verified.";

export const BUILT_IN_WORKSPACE = {
  id: "chaser-agent",
  name: "Chaser Agent — Personal Evaluation",
  agentName: "Chaser Agent",
  description: "Personal workspace for Chaser Agent golden evaluations, harness refinement and reviewed improvement examples.",
  evaluationGoal: "evidence",
  kind: "built-in",
  archivedAt: null,
  harnessId: "chaser-agent",
};

export function createWorkspaceDefinition(name, agentName, optionsOrNow = {}, now = Date.now()) {
  const safeName = String(name || "").trim();
  if (!safeName) throw new Error("Workspace name is required.");
  const legacyNow = typeof optionsOrNow === "number" ? optionsOrNow : now;
  const options = typeof optionsOrNow === "object" && optionsOrNow !== null ? optionsOrNow : {};
  return {
    id: `workspace-${legacyNow}`,
    name: safeName,
    agentName: String(agentName || "").trim() || safeName,
    description: String(options.description || "").trim() || "Local agent evaluation workspace",
    evaluationGoal: String(options.evaluationGoal || "custom"),
    kind: "local",
    archivedAt: null,
    harnessId: `harness-${legacyNow}`,
  };
}

export function archiveWorkspaceDefinition(workspace, now = Date.now()) {
  if (!workspace || workspace.kind === "built-in") throw new Error("The built-in example workspace cannot be archived.");
  return { ...workspace, archivedAt: new Date(now).toISOString() };
}

export function restoreWorkspaceDefinition(workspace) {
  if (!workspace) throw new Error("Workspace is required.");
  return { ...workspace, archivedAt: null };
}

export function canDeleteWorkspace(workspace, runCount = 0, reviewCount = 0) {
  return Boolean(workspace && workspace.kind !== "built-in" && workspace.archivedAt && runCount === 0 && reviewCount === 0);
}

export function loadWorkspaceDefinitions(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem("agent-review-studio-workspaces-v2") || "[]");
    if (Array.isArray(saved) && saved.length) {
      const withoutBuiltIn = saved.filter((workspace) => workspace.id !== BUILT_IN_WORKSPACE.id);
      const storedBuiltIn = saved.find((workspace) => workspace.id === BUILT_IN_WORKSPACE.id);
      return [{ ...BUILT_IN_WORKSPACE, ...(storedBuiltIn || {}) }, ...withoutBuiltIn];
    }
    const legacy = JSON.parse(storage?.getItem("chaser-agent-projects-v1") || "[]");
    return [BUILT_IN_WORKSPACE, ...legacy.map((project) => ({ ...project, agentName: project.name, description: "Migrated Phase 1 workspace" }))];
  } catch {
    return [BUILT_IN_WORKSPACE];
  }
}

export function persistWorkspaceDefinitions(workspaces, storage = globalThis.localStorage) {
  storage?.setItem("agent-review-studio-workspaces-v2", JSON.stringify(workspaces));
  return workspaces;
}

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
    id: "run-4",
    kind: "built-in",
    sessionId: "relevance-regression-2026-09-01",
    sessionLabel: "Relevance Regression Candidate — 1 Sep 2026",
    label: "Candidate 1",
    shortLabel: "Relevance-fixed source review",
    description: "Current deterministic candidate with metadata filtering, context and specific action links",
  },
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

const DEMO_SOURCE_FILES = {
  "run-4": "/demo-sources/cloudflare-monetization-gateway-thesis.md",
  "run-1": "/demo-sources/cloudflare-monetization-gateway-thesis.md",
  "run-2": "/demo-sources/cloudflare-monetization-gateway-thesis.md",
};

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
  if (Array.isArray(artifact)) return artifact;
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
  const visual = extension !== "svg" && (IMAGE_EXTENSIONS.has(extension) || String(mime).startsWith("image/"));
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
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let index = 0; index < text.length && rows.length < 250; index += 1) {
      const character = text[index];
      if (character === '"') {
        if (quoted && text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === delimiter && !quoted) {
        row.push(field);
        field = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(field);
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
        field = "";
      } else {
        field += character;
      }
    }
    if (rows.length < 250 && (field !== "" || row.length)) {
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
    }
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
  const sourcePath = DEMO_SOURCE_FILES[meta.id];
  if (sourcePath) {
    const response = await fetch(sourcePath);
    if (response.ok) {
      const content = await response.text();
      const name = "original_source.md";
      files.push({
        id: `${meta.id}::${name}`,
        name,
        relativePath: `${meta.id}/${name}`,
        directory: meta.id,
        mime: "text/markdown",
        size: new Blob([content]).size,
        lastModified: null,
        content,
        parsed: null,
        parseStatus: "Preview ready",
        parseError: "",
        truncated: false,
        blob: null,
        ...detectArtifactProfile(name, "text/markdown"),
      });
    }
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

function referencedIds(value) {
  return asArray(value)
    .flatMap((item) => String(item || "").split(/\s+/))
    .map((item) => item.trim())
    .filter(Boolean);
}

function duplicateIds(items, key) {
  const ids = items.map((item) => item?.[key]).filter(Boolean);
  return Array.from(new Set(ids.filter((id, index) => ids.indexOf(id) !== index)));
}

export function validateRunBundle(run) {
  if (!run) {
    return {
      status: "blocked",
      errors: 1,
      warnings: 0,
      checksPassed: 0,
      issues: [{ code: "no-run", severity: "error", title: "No run loaded", detail: "Select or import a run bundle before review." }],
      artifactCount: 0,
      requiredArtifactCount: ARTIFACT_FILES.length,
      presentArtifactCount: 0,
    };
  }

  const issues = [];
  const addIssue = (code, severity, title, detail) => issues.push({ code, severity, title, detail });
  const presentArtifacts = ARTIFACT_FILES.filter((name) => Boolean(run.artifacts?.[name]));
  const missingArtifacts = ARTIFACT_FILES.filter((name) => !run.artifacts?.[name]);
  if (missingArtifacts.length) {
    addIssue(
      "missing-canonical-artifacts",
      "error",
      `${missingArtifacts.length} canonical artifact${missingArtifacts.length === 1 ? " is" : "s are"} missing`,
      missingArtifacts.join(", "),
    );
  }

  const parseFailures = (run.files || []).filter((file) => file.parseError || /attention|partially/i.test(file.parseStatus || ""));
  if (parseFailures.length) {
    addIssue(
      "parse-failures",
      parseFailures.some((file) => file.canonical) ? "error" : "warning",
      `${parseFailures.length} file${parseFailures.length === 1 ? " needs" : "s need"} parse attention`,
      parseFailures.map((file) => file.relativePath || file.name).join(", "),
    );
  }

  const duplicateCanonicalFiles = ARTIFACT_FILES.filter((name) => (run.files || []).filter((file) => file.canonical === name).length > 1);
  if (duplicateCanonicalFiles.length) {
    addIssue(
      "duplicate-canonical-files",
      "error",
      "Multiple files compete for one canonical role",
      duplicateCanonicalFiles.map((name) => `${name}: ${(run.files || []).filter((file) => file.canonical === name).map((file) => file.relativePath || file.name).join(" | ")}`).join("; "),
    );
  }

  const claimIds = new Set(run.claims.map((item) => item?.claim_id).filter(Boolean));
  const evidenceIds = new Set(run.evidence.map((item) => item?.snippet_id).filter(Boolean));
  const missingClaimIds = run.claims.filter((item) => !item?.claim_id).length;
  const duplicateClaimIds = duplicateIds(run.claims, "claim_id");
  const missingEvidenceIds = run.evidence.filter((item) => !item?.snippet_id).length;
  const duplicateEvidenceIds = duplicateIds(run.evidence, "snippet_id");

  if (!run.claims.length) addIssue("no-claims", "error", "No claims detected", "A review-ready bundle needs a normalized claims table or source-card claims.");
  if (missingClaimIds || duplicateClaimIds.length) addIssue("claim-identities", "error", "Claim IDs are incomplete or duplicated", `${missingClaimIds} missing; duplicates: ${duplicateClaimIds.join(", ") || "none"}.`);
  if (!run.evidence.length) addIssue("no-evidence", "error", "No evidence snippets detected", "Claims cannot be checked against source evidence until snippets are present.");
  if (missingEvidenceIds || duplicateEvidenceIds.length) addIssue("evidence-identities", "error", "Evidence IDs are incomplete or duplicated", `${missingEvidenceIds} missing; duplicates: ${duplicateEvidenceIds.join(", ") || "none"}.`);

  const unresolvedClaimEvidence = run.claims.filter((claim) => {
    const linked = claim?.evidence_snippet_id;
    return !linked || !evidenceIds.has(linked);
  });
  if (unresolvedClaimEvidence.length) addIssue("claim-evidence-links", "error", `${unresolvedClaimEvidence.length} claim${unresolvedClaimEvidence.length === 1 ? " has" : "s have"} no resolvable evidence`, unresolvedClaimEvidence.map((item) => item.claim_id || "missing claim ID").join(", "));

  const unresolvedEvidenceClaims = run.evidence.flatMap((item) => referencedIds(item?.supports_claim_ids).filter((id) => !claimIds.has(id)));
  if (unresolvedEvidenceClaims.length) addIssue("evidence-claim-links", "warning", "Evidence points to unknown claims", Array.from(new Set(unresolvedEvidenceClaims)).join(", "));

  const unresolvedActionClaims = run.actions.flatMap((item) => referencedIds(item?.source_claim_ids).filter((id) => !claimIds.has(id)));
  if (unresolvedActionClaims.length) addIssue("action-claim-links", "warning", "Actions point to unknown claims", Array.from(new Set(unresolvedActionClaims)).join(", "));

  const unresolvedUncertaintyClaims = run.uncertainties.flatMap((item) => referencedIds(item?.related_claim_ids).filter((id) => !claimIds.has(id)));
  if (unresolvedUncertaintyClaims.length) addIssue("uncertainty-claim-links", "warning", "Uncertainty labels point to unknown claims", Array.from(new Set(unresolvedUncertaintyClaims)).join(", "));

  const explicitRunIds = Object.values(run.artifacts || {}).map((artifact) => artifact?.run_id).filter(Boolean);
  const explicitSourceIds = Object.values(run.artifacts || {}).map((artifact) => artifact?.source_id).filter(Boolean);
  if (!explicitRunIds.length || !explicitSourceIds.length) addIssue("missing-explicit-identities", "error", "Explicit run/source identity is incomplete", "Canonical artifacts must carry stable run_id and source_id values.");
  if (new Set(explicitRunIds).size > 1) addIssue("run-id-mismatch", "error", "Canonical artifacts disagree on run ID", Array.from(new Set(explicitRunIds)).join(", "));
  if (new Set(explicitSourceIds).size > 1) addIssue("source-id-mismatch", "error", "Canonical artifacts disagree on source ID", Array.from(new Set(explicitSourceIds)).join(", "));

  const errors = issues.filter((item) => item.severity === "error").length;
  const warnings = issues.filter((item) => item.severity === "warning").length;
  const totalChecks = 8;
  const checksPassed = Math.max(0, totalChecks - errors - warnings);
  return {
    status: errors ? "blocked" : warnings ? "ready-with-warnings" : "ready",
    errors,
    warnings,
    checksPassed,
    totalChecks,
    issues,
    artifactCount: run.files?.length || 0,
    requiredArtifactCount: ARTIFACT_FILES.length,
    presentArtifactCount: presentArtifacts.length,
  };
}

export function isDevelopmentQaReview(value) {
  return value?.reviewer_name === "Local operator"
    && value?.corrections_or_notes === DEVELOPMENT_QA_NOTE;
}

export function isDevelopmentQaDraft(value) {
  return value?.notes === DEVELOPMENT_QA_NOTE;
}

export function hasDraftProgress(draft) {
  if (!draft || isDevelopmentQaDraft(draft)) return false;
  return Boolean(
    draft.decision
    || String(draft.notes || "").trim()
    || draft.contractChecked
    || draft.sourceChecked
    || draft.actionsChecked
    || draft.memoryChecked
    || draft.uncertaintyChecked
    || draft.traceChecked
    || draft.parentRevisionId
    || Object.keys(draft.claimJudgments || {}).length
    || asArray(draft.inspectedClaims).length
    || Object.values(draft.ratings || {}).some((value) => Number.isInteger(value)),
  );
}

export function reviewStateForRun(run, history = [], draft = null) {
  const revisions = history.filter((record) => record.review_instance_id === run.id || record.run_id === run.sourceRunId);
  if (draft?.status === "reviewed" && revisions.length) return "reviewed";
  if (hasDraftProgress(draft)) return draft?.parentRevisionId ? "re-review" : "draft";
  if (revisions.length) return "reviewed";
  return "unreviewed";
}

export function reviewCompletionState(run, draft) {
  const inspected = new Set(draft?.inspectedClaims || []);
  const claimJudgments = draft?.claimJudgments || {};
  const correctionRequired = new Set(["not_a_claim", "irrelevant", "missing_context", "unsupported", "misclassified", "duplicate", "action_unrelated"]);
  const ratingsComplete = RATING_DEFINITIONS.every(({ key }) => Number.isInteger(draft?.ratings?.[key]));
  const claimsComplete = Boolean(run) && run.claims.every((item) => {
    const judgment = claimJudgments[item.claim_id];
    const labels = Array.isArray(judgment?.labels) ? judgment.labels : [];
    const needsCorrection = labels.some((label) => correctionRequired.has(label));
    return inspected.has(item.claim_id) && labels.length > 0 && (!needsCorrection || Boolean(String(judgment?.correction || "").trim()));
  });
  const decisionComplete = Boolean(draft?.decision);
  const notesComplete = draft?.decision === "pass" || Boolean(String(draft?.notes || "").trim());
  const contractComplete = Boolean(draft?.contractChecked);
  const sourceComplete = Boolean(draft?.sourceChecked);
  const actionsComplete = Boolean(draft?.actionsChecked);
  const memoryComplete = Boolean(draft?.memoryChecked);
  const uncertaintyComplete = Boolean(draft?.uncertaintyChecked);
  const traceComplete = Boolean(draft?.traceChecked);
  const artifactsComplete = Boolean(contractComplete && claimsComplete && sourceComplete && actionsComplete && memoryComplete && uncertaintyComplete && traceComplete);
  return {
    contractComplete,
    claimsComplete,
    sourceComplete,
    ratingsComplete,
    actionsComplete,
    memoryComplete,
    uncertaintyComplete,
    traceComplete,
    artifactsComplete,
    decisionComplete,
    notesComplete,
    complete: Boolean(run && artifactsComplete && ratingsComplete && decisionComplete && notesComplete),
  };
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
    claimJudgments: seed.claimJudgments || seed.claim_judgments || {},
    contractChecked: Boolean(seed.contractChecked ?? seed.review_contract_checked),
    sourceChecked: Boolean(seed.sourceChecked ?? seed.source_card_checked),
    actionsChecked: Boolean(seed.actionsChecked ?? seed.actions_checked),
    memoryChecked: Boolean(seed.memoryChecked ?? seed.memory_checked),
    uncertaintyChecked: Boolean(seed.uncertaintyChecked ?? seed.uncertainty_checked),
    traceChecked: Boolean(seed.traceChecked ?? seed.run_log_checked),
    status: seed.status || "unreviewed",
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
  const saved = current[runId] || legacy[runId] || {};
  return emptyDraft(isDevelopmentQaDraft(saved) ? {} : saved);
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
    schema_version: "agent_review_studio.review.v5",
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
    claim_judgments: draft.claimJudgments || {},
    review_contract_checked: draft.contractChecked,
    source_card_checked: draft.sourceChecked,
    actions_checked: draft.actionsChecked,
    memory_checked: draft.memoryChecked,
    uncertainty_checked: draft.uncertaintyChecked,
    run_log_checked: draft.traceChecked,
    reviewed_at: reviewedAt,
    source_artifacts_mutated: false,
    learning_handoff: {
      artifact_type: "human_reviewed_agent_run",
      purpose: "Use this reviewed run to improve and re-test the agent or harness.",
      intended_uses: ["agent_harness_refinement", "golden_evaluation_case", "training_data_selection_candidate"],
      improvement_targets: ["prompts", "retrieval", "tool_selection", "workflow_orchestration", "approval_policy", "memory_rules"],
      training_status: "candidate_only_requires_dataset_governance",
      automatic_training_authorized: false,
    },
  };
}

export function loadReviewHistory(projectId = null) {
  const records = readJsonStorage(HISTORY_KEY, []);
  const list = Array.isArray(records) ? records : [];
  return (projectId ? list.filter((record) => record.project_id === projectId) : list)
    .filter((record) => !isDevelopmentQaReview(record))
    .sort((left, right) => String(right.reviewed_at).localeCompare(String(left.reviewed_at)));
}

export function appendReviewRevision(record) {
  const saved = readJsonStorage(HISTORY_KEY, []);
  const records = Array.isArray(saved) ? saved : [];
  const next = [record, ...records.filter((item) => item.revision_id !== record.revision_id)];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return record;
}

export function removeReviewHistoryForProject(projectId, storage = globalThis.localStorage) {
  const saved = readJsonStorage(HISTORY_KEY, []);
  const records = Array.isArray(saved) ? saved : [];
  const next = records.filter((record) => record.project_id !== projectId);
  storage?.setItem(HISTORY_KEY, JSON.stringify(next));
  return records.length - next.length;
}

export function createSessionEvaluationPack({ projectId, workspaceName, agentName, reviewerName, session, runs, history, drafts = {} }) {
  const operatorHistory = history.filter((record) => !isDevelopmentQaReview(record));
  const runRecords = runs.map((run) => {
    const revisions = operatorHistory
      .filter((record) => record.review_instance_id === run.id || record.run_id === run.sourceRunId)
      .sort((left, right) => String(right.reviewed_at).localeCompare(String(left.reviewed_at)));
    const latest = revisions[0] || null;
    const draft = drafts[run.id] || emptyDraft();
    const diagnostics = validateRunBundle(run);
    return {
      review_instance_id: run.id,
      run_id: run.sourceRunId,
      run_label: run.label,
      workflow_profile: run.workflowProfile,
      source_id: run.sourceId,
      source_title: run.sourceTitle,
      review_state: reviewStateForRun(run, operatorHistory, draft),
      diagnostics: {
        status: diagnostics.status,
        errors: diagnostics.errors,
        warnings: diagnostics.warnings,
        present_canonical_artifacts: diagnostics.presentArtifactCount,
        required_canonical_artifacts: diagnostics.requiredArtifactCount,
        issues: diagnostics.issues,
      },
      latest_review_revision: latest,
      revision_count: revisions.length,
      draft_present: hasDraftProgress(draft),
    };
  });
  const reviewed = runRecords.filter((record) => Boolean(record.latest_review_revision)).length;
  const draftsCount = runRecords.filter((record) => record.draft_present).length;
  const notStarted = runRecords.filter((record) => record.review_state === "unreviewed").length;
  const diagnosticsBlocked = runRecords.filter((record) => record.diagnostics.status === "blocked").length;

  return {
    schema_version: "agent_review_studio.session_evaluation.v2",
    generated_at: new Date().toISOString(),
    project_id: projectId,
    workspace_name: workspaceName,
    agent_name: agentName,
    reviewer_name: reviewerName || "Local operator",
    session_id: session.id,
    session_label: session.label,
    summary: {
      total_runs: runRecords.length,
      reviewed_runs: reviewed,
      runs_with_drafts: draftsCount,
      not_started_runs: notStarted,
      runs_without_finished_review: runRecords.length - reviewed,
      diagnostics_blocked_runs: diagnosticsBlocked,
      operator_complete: reviewed === runRecords.length && draftsCount === 0 && diagnosticsBlocked === 0,
    },
    runs: runRecords,
    source_artifacts_mutated: false,
    learning_handoff: {
      artifact_type: "human_reviewed_agent_session",
      purpose: "Use finished reviews to improve the agent or harness, then run the evaluation again and compare results.",
      intended_uses: ["agent_harness_refinement", "golden_evaluation_suite", "training_data_selection_candidate"],
      training_status: "candidate_only_requires_dataset_governance",
      automatic_training_authorized: false,
    },
    boundary: "This pack records local human evaluation. It can inform harness improvements and governed training-data selection, but it does not train a model, promote memory, execute actions or modify source artifacts.",
  };
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** index);
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}
