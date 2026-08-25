export const ARTIFACT_FILES = [
  "human_review_packet.json",
  "claims_table.json",
  "evidence_snippets.json",
  "source_card.json",
  "action_candidates.json",
  "memory_candidates.json",
  "uncertainty_labels.json",
  "run_log.json",
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

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

function artifactList(artifact, key) {
  if (!artifact) return [];
  return asArray(artifact[key]);
}

export function assembleRun(meta, artifacts) {
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

  const sourceRunId = packet.run_id || sourceCard.run_id || meta.id;

  return {
    id: meta.instanceId || sourceRunId,
    sourceRunId,
    kind: meta.kind || "local",
    sessionId: meta.sessionId || "unsorted-runs",
    sessionLabel: meta.sessionLabel || "Unsorted runs",
    demoId: meta.id,
    label: meta.label || "Imported run",
    shortLabel: meta.shortLabel || sourceCard.source_title || packet.workflow_profile || "Imported run",
    description: meta.description || packet.workflow_profile || "Imported run folder",
    workflowProfile: packet.workflow_profile || sourceCard.workflow_profile || "unknown profile",
    sourceId: packet.source_id || sourceCard.source_id || "unknown source",
    sourceTitle: sourceCard.source_title || sourceCard.source_metadata?.title || "Untitled source",
    sourceSummary: sourceCard.source_summary || "No source summary was recorded.",
    sourceOrigin: sourceCard.source_origin || "Unknown origin",
    sourceMetadata: sourceCard.source_metadata || {},
    createdAt: sourceCard.created_at || runLog.created_at || null,
    claims,
    evidence,
    actions,
    memories,
    uncertainties,
    inferences: asArray(sourceCard.chaser_agent_inferences),
    packet,
    sourceCard,
    runLog,
    artifacts,
  };
}

async function loadDemoRun(meta) {
  const pairs = await Promise.all(
    ARTIFACT_FILES.map(async (name) => {
      const response = await fetch(`/demo-runs/${meta.id}/${name}`);
      if (!response.ok) return [name, null];
      return [name, await response.json()];
    }),
  );
  return assembleRun(meta, Object.fromEntries(pairs));
}

export async function loadDemoRuns() {
  return Promise.all(DEMO_META.map(loadDemoRun));
}

export async function parseRunFolderFiles(fileList) {
  const jsonFiles = Array.from(fileList).filter((file) => file.name.toLowerCase().endsWith(".json"));
  const folders = new Map();

  for (const file of jsonFiles) {
    const relative = file.webkitRelativePath || file.name;
    const parts = relative.split("/");
    const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "imported-run";
    if (!folders.has(folder)) folders.set(folder, {});
    try {
      folders.get(folder)[file.name] = JSON.parse(await file.text());
    } catch {
      // Invalid JSON is ignored here and reported through the missing-artifact summary.
    }
  }

  const importedAt = new Date();
  const sessionId = `import-${importedAt.toISOString().replace(/\D/g, "").slice(0, 17)}`;
  const sessionLabel = `Imported review — ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(importedAt)}`;

  return Array.from(folders.entries())
    .filter(([, artifacts]) => artifacts["source_card.json"] || artifacts["human_review_packet.json"])
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
    .map(([folder, artifacts], index) => {
      const profile = artifacts["human_review_packet.json"]?.workflow_profile
        || artifacts["source_card.json"]?.workflow_profile;
      const folderName = folder.split("/").at(-1) || `Imported ${index + 1}`;
      const label = folderName
        .replaceAll("-", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
      const sourceRunId = artifacts["human_review_packet.json"]?.run_id
        || artifacts["source_card.json"]?.run_id
        || `${folderName}-${index + 1}`;
      return assembleRun({
        id: `imported-${Date.now()}-${index}`,
        instanceId: `${sessionId}::${sourceRunId}`,
        sessionId,
        sessionLabel,
        label,
        shortLabel: profile ? profile.replaceAll("_", " ") : folder.split("/").at(-1),
        description: folder,
      }, artifacts);
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

export function emptyDraft() {
  return {
    ratings: {
      source_fidelity: null,
      inference_separation: null,
      uncertainty_handling: null,
      action_usefulness: null,
      memory_safety: null,
    },
    decision: "",
    notes: "",
    inspectedClaims: [],
    actionsChecked: false,
    memoryChecked: false,
    status: "draft",
    updatedAt: null,
  };
}

const DRAFT_KEY = "chaser-agent-review-drafts-v1";
const IMPORTED_RUNS_KEY = "chaser-agent-imported-runs-v1";

export function loadImportedRuns() {
  try {
    const saved = JSON.parse(localStorage.getItem(IMPORTED_RUNS_KEY) || "{}");
    if (!saved || typeof saved !== "object") return {};
    return Object.fromEntries(Object.entries(saved).map(([projectId, runs]) => [
      projectId,
      Array.isArray(runs) ? runs.map((run, index) => {
        if (run.sessionId && run.sessionLabel && run.sourceRunId) return run;
        const builtIn = String(run.demoId || "").startsWith("run-");
        const sessionId = builtIn ? "source-review-calibration-2026-08-25" : "legacy-imported-review";
        const sourceRunId = run.sourceRunId || run.id || `legacy-run-${index + 1}`;
        return {
          ...run,
          id: builtIn ? sourceRunId : `${sessionId}::${sourceRunId}`,
          sourceRunId,
          kind: builtIn ? "built-in" : "local",
          sessionId,
          sessionLabel: builtIn ? "Source Review Calibration — 25 Aug 2026" : "Earlier imported review",
        };
      }) : [],
    ]));
  } catch {
    return {};
  }
}

export function persistImportedRuns(projectRuns) {
  try {
    localStorage.setItem(IMPORTED_RUNS_KEY, JSON.stringify(projectRuns));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(runId) {
  try {
    const all = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    return { ...emptyDraft(), ...(all[runId] || {}) };
  } catch {
    return emptyDraft();
  }
}

export function persistDraft(runId, draft) {
  const all = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
  const saved = { ...draft, updatedAt: new Date().toISOString() };
  all[runId] = saved;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
  return saved;
}
