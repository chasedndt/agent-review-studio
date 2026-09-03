import { assembleRun, validateRunBundle } from "./data.js";

export const CLAIM_LABELS = [
  { id: "supported_relevant", label: "Supported & relevant", tone: "positive", needsCorrection: false },
  { id: "not_a_claim", label: "Not a claim", tone: "warning", needsCorrection: true },
  { id: "irrelevant", label: "Irrelevant", tone: "warning", needsCorrection: true },
  { id: "missing_context", label: "Missing context", tone: "warning", needsCorrection: true },
  { id: "unsupported", label: "Unsupported", tone: "danger", needsCorrection: true },
  { id: "misclassified", label: "Misclassified", tone: "warning", needsCorrection: true },
  { id: "duplicate", label: "Duplicate", tone: "warning", needsCorrection: true },
  { id: "needs_external_verification", label: "Needs external verification", tone: "neutral", needsCorrection: false },
  { id: "action_unrelated", label: "Linked action is unrelated", tone: "danger", needsCorrection: true },
];

export const RUNNER_MODES = [
  { id: "browser_deterministic", label: "Local deterministic baseline", detail: "Runs entirely in this browser and creates a new immutable artifact bundle." },
  { id: "local_bridge", label: "Local runner bridge", detail: "Calls the optional bounded localhost adapter for the selected harness and records its exact command and version." },
  { id: "import_only", label: "Import an external run", detail: "Keep execution separate and import the resulting folder without changing it." },
];

export const ALGORITHM_CATALOG = [
  {
    id: "source-normalisation",
    name: "Source normalisation",
    category: "Algorithms",
    implemented: true,
    complexity: "O(n) time · O(n) text storage",
    yearTwo: "String processing, regular expressions, defensive parsing",
    explanation: "Turns Markdown or text into stable lines, metadata and candidate statements while retaining line numbers.",
  },
  {
    id: "claim-ranking",
    name: "Claim relevance ranking",
    category: "Algorithms",
    implemented: true,
    complexity: "O(n log n) ranking · stable source-order output",
    yearTwo: "Sorting, scoring functions, feature engineering",
    explanation: "Scores complete statements for substance and penalises metadata, fragments and document-control language before selecting candidates.",
  },
  {
    id: "provenance-graph",
    name: "Provenance graph",
    category: "Data structures",
    implemented: true,
    complexity: "O(V + E) validation",
    yearTwo: "Graphs, adjacency relationships, referential integrity",
    explanation: "Stable IDs connect source → excerpt → claim → action → review. Broken references are surfaced before review.",
  },
  {
    id: "immutable-lineage",
    name: "Immutable revision lineage",
    category: "Data structures",
    implemented: true,
    complexity: "Append-only records · O(k) lineage traversal",
    yearTwo: "Linked structures, event sourcing, database normalisation",
    explanation: "A rerun or re-review creates a new node with a parent ID; historical artifacts and judgments are never overwritten.",
  },
  {
    id: "agreement",
    name: "Reviewer agreement",
    category: "Statistics",
    implemented: true,
    complexity: "O(r × d) for reviewers and dimensions",
    yearTwo: "Descriptive statistics, variance, inter-rater calibration",
    explanation: "Compares score vectors and decisions so disagreement becomes visible instead of being averaged away.",
  },
  {
    id: "regression-gate",
    name: "Regression gate",
    category: "Software engineering",
    implemented: true,
    complexity: "O(e) evaluator checks",
    yearTwo: "Testing, CI/CD, thresholds, state machines",
    explanation: "Combines deterministic checks and human-reviewed thresholds into a portable pass/block report for CI.",
  },
  {
    id: "backpropagation",
    name: "Backpropagation / weight updates",
    category: "Machine learning",
    implemented: false,
    complexity: "Future training system",
    yearTwo: "Calculus, gradients, optimisation, neural networks",
    explanation: "Not performed by the Studio. Reviewed examples may later be selected for a separately governed training pipeline.",
  },
];

const WORKBENCH_KEY = "agent-review-studio-workbench-v1";

function stableId(prefix, now = Date.now()) {
  return `${prefix}-${now}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createDatasetDefinition(name, description = "", now = Date.now()) {
  const safeName = String(name || "").trim();
  if (!safeName) throw new Error("Dataset name is required.");
  return { id: `dataset-${now}`, name: safeName, description: String(description || "").trim(), version: 1, cases: [], createdAt: new Date(now).toISOString() };
}

export function createTestCase({ title, sourceText, sourceUrl = "", expectedBehavior = "", tags = [], privacyClass = "public" }, now = Date.now()) {
  const safeTitle = String(title || "").trim();
  const safeText = String(sourceText || "").trim();
  if (!safeTitle || !safeText) throw new Error("A test-case title and source text are required.");
  return {
    id: `case-${now}`,
    title: safeTitle,
    sourceText: safeText,
    sourceUrl: String(sourceUrl || "").trim(),
    expectedBehavior: String(expectedBehavior || "").trim(),
    privacyClass,
    tags: Array.from(new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))),
    createdAt: new Date(now).toISOString(),
  };
}

export function createHarnessDefinition(name, now = Date.now()) {
  const safeName = String(name || "").trim();
  if (!safeName) throw new Error("Harness name is required.");
  return {
    id: `harness-${now}`,
    name: safeName,
    versions: [{ id: `version-${now}`, label: "Baseline v1", commit: "local-baseline", profile: "general_source_review", createdAt: new Date(now).toISOString() }],
  };
}

export function createStarterWorkbench(workspace, runs = []) {
  const now = Date.now();
  const sourceRun = runs[0];
  const dataset = createDatasetDefinition(`${workspace.agentName} calibration`, "Versioned test cases used for repeatable harness evaluation.", now);
  if (sourceRun) {
    const originalSource = sourceRun.files?.find((file) => file.name === "original_source.md" && file.content)?.content;
    dataset.cases.push(createTestCase({
      title: sourceRun.sourceTitle || "Imported source review",
      sourceText: originalSource || sourceRun.sourceSummary || sourceRun.claims.map((claim) => claim.claim_text).join("\n"),
      sourceUrl: sourceRun.sourceMetadata?.url || "",
      expectedBehavior: "Extract substantive, source-grounded claims; preserve provenance; separate inference; propose only relevant approval-gated actions.",
      tags: ["calibration", sourceRun.workflowProfile || "source-review"],
      privacyClass: sourceRun.sourceCard?.privacy_class || "public",
    }, now + 1));
  }
  const harness = createHarnessDefinition(workspace.agentName, now);
  if (sourceRun) {
    harness.versions[0] = {
      ...harness.versions[0],
      label: `${sourceRun.workflowProfile || "baseline"} · imported baseline`,
      commit: sourceRun.runLog?.repo_commit || "imported",
      profile: sourceRun.workflowProfile || "general_source_review",
    };
  }
  return {
    schemaVersion: "agent_review_studio.workbench.v1",
    datasets: [dataset],
    harnesses: [harness],
    experiments: [],
    pairwiseJudgments: [],
    reviewers: [{ id: "reviewer-local-operator", name: "Local operator", role: "Owner", active: true }],
    ciGates: [{ id: "gate-default", name: "Golden regression gate", minimumAutomatedScore: 80, maximumCriticalFailures: 0, requireHumanPass: true, enabled: true }],
  };
}

export function loadWorkbenchConfiguration(workspaceId, workspace, runs = [], storage = globalThis.localStorage) {
  try {
    const all = JSON.parse(storage?.getItem(WORKBENCH_KEY) || "{}");
    return all[workspaceId] || createStarterWorkbench(workspace, runs);
  } catch {
    return createStarterWorkbench(workspace, runs);
  }
}

export function persistWorkbenchConfiguration(workspaceId, value, storage = globalThis.localStorage) {
  let all = {};
  try { all = JSON.parse(storage?.getItem(WORKBENCH_KEY) || "{}"); } catch { all = {}; }
  all[workspaceId] = value;
  storage?.setItem(WORKBENCH_KEY, JSON.stringify(all));
  return value;
}

export function removeWorkbenchConfiguration(workspaceId, storage = globalThis.localStorage) {
  let all = {};
  try { all = JSON.parse(storage?.getItem(WORKBENCH_KEY) || "{}"); } catch { all = {}; }
  delete all[workspaceId];
  storage?.setItem(WORKBENCH_KEY, JSON.stringify(all));
  return all;
}

function sourceLines(text) {
  return String(text || "").split(/\r?\n/);
}

function metadataLine(line) {
  return /^(?:[-*]\s*)?(?:url|title|published|authors?|status|date|source|license|tags?)\s*:/i.test(line.trim());
}

function statementType(text) {
  const lowered = text.toLowerCase();
  if (/\b(must|should|needs?|required?)\b/.test(lowered)) return "requirement";
  if (/\b(may|might|could|unknown|uncertain)\b/.test(lowered)) return "uncertain_claim";
  if (/\b(recommend|best practice|prefer)\b/.test(lowered)) return "recommendation";
  if (/\b(cannot|can't|only|without|limited)\b/.test(lowered)) return "constraint";
  return "source_statement";
}

function relevanceScore(text) {
  const trimmed = text.trim();
  let score = Math.min(4, trimmed.length / 45);
  if (/[.!?]$/.test(trimmed)) score += 1;
  if (/\b(is|are|will|should|must|means|shows|found|reports?|positions?|implies?)\b/i.test(trimmed)) score += 2;
  if (/\b(agent|harness|evaluation|evidence|policy|payment|api|model|workflow|source|tool|memory)\b/i.test(trimmed)) score += 1;
  if (/^(status|title|author|published|url)\s*:/i.test(trimmed)) score -= 5;
  if (trimmed.length < 28 || /[:;]$/.test(trimmed)) score -= 2;
  return score;
}

export function extractRankedClaims(text, limit = 8) {
  const lines = sourceLines(text);
  const candidates = [];
  lines.forEach((raw, index) => {
    const line = raw.trim().replace(/^#{1,6}\s+/, "").replace(/^[-*+]\s+/, "").replace(/^\d+[.)]\s+/, "");
    if (!line || metadataLine(line) || /^https?:\/\//i.test(line)) return;
    const parts = line.split(/(?<=[.!?])\s+/).filter(Boolean);
    parts.forEach((part) => candidates.push({ text: part.trim(), line: index + 1, score: relevanceScore(part) }));
  });
  return candidates
    .filter((item) => item.score > 1)
    .sort((left, right) => right.score - left.score || left.line - right.line)
    .slice(0, limit)
    .sort((left, right) => left.line - right.line)
    .map((item, index) => ({ ...item, claimId: `claim-${String(index + 1).padStart(3, "0")}`, type: statementType(item.text) }));
}

function extractMetadata(text, fallbackUrl = "") {
  const metadata = {};
  sourceLines(text).forEach((raw) => {
    const match = raw.trim().replace(/^[-*]\s*/, "").match(/^(URL|Title|Published|Authors?)\s*:\s*(.+)$/i);
    if (match) {
      const key = match[1].toLowerCase().startsWith("author") ? "authors" : match[1].toLowerCase();
      metadata[key] = match[2].trim();
    }
  });
  if (!metadata.url && fallbackUrl) metadata.url = fallbackUrl;
  return metadata;
}

function buildSpecificActions(claims) {
  return claims.flatMap((claim, index) => {
    if (!/\b(should|must|need|recommend|implement|evaluate|review|verify|compare|policy|approval)\b/i.test(claim.text)) return [];
    return [{
      action_id: `action-${String(index + 1).padStart(3, "0")}`,
      action_text: `Verify and scope this statement before implementation: ${claim.text}`,
      rationale: "The statement implies an operator or engineering decision and needs a bounded verification step.",
      source_claim_ids: [claim.claimId],
      risk_level: "low",
      requires_approval: true,
      suggested_owner: "human_operator",
    }];
  });
}

export function runBrowserDeterministicCase({ workspaceId, workspaceName, agentName, dataset, testCase, harness, version, profile = "general_source_review" }, now = Date.now()) {
  const createdAt = new Date(now).toISOString();
  const sourceId = `source-${testCase.id}`;
  const runId = `run-${now}-${testCase.id}`;
  const ranked = extractRankedClaims(testCase.sourceText);
  const lines = sourceLines(testCase.sourceText);
  const claims = ranked.map((item) => ({
    claim_id: item.claimId,
    claim_text: item.text,
    claim_type: item.type,
    extraction_confidence: item.score >= 5 ? "high" : "medium",
    confidence: item.score >= 5 ? "high" : "medium",
    evidence_snippet_id: `evidence-${item.claimId.slice(-3)}`,
    source_location: `line ${item.line}`,
    review_note: "Ranked deterministic candidate; extraction confidence is not source-truth confidence.",
  }));
  const nearestContext = (start, direction) => {
    for (let index = start; index >= 0 && index < lines.length; index += direction) {
      const value = lines[index]?.trim();
      if (value && !/^#{1,6}\s+/.test(value) && !metadataLine(value)) return value;
    }
    return "";
  };
  const evidence = ranked.map((item) => ({
    snippet_id: `evidence-${item.claimId.slice(-3)}`,
    text: item.text,
    source_location: `line ${item.line}`,
    source_line: item.line,
    context_before: nearestContext(item.line - 2, -1),
    context_after: nearestContext(item.line, 1),
    supports_claim_ids: [item.claimId],
    privacy_class: testCase.privacyClass || "public",
    redaction_note: null,
  }));
  const actions = buildSpecificActions(ranked);
  const metadata = extractMetadata(testCase.sourceText, testCase.sourceUrl);
  const artifacts = {
    "human_review_packet.json": {
      run_id: runId, source_id: sourceId, workflow_profile: profile, operator_review_status: "pending_review",
      required_review_dimensions: ["source_fidelity", "inference_separation", "uncertainty_handling", "action_usefulness", "memory_safety"],
    },
    "claims_table.json": { run_id: runId, source_id: sourceId, claims },
    "evidence_snippets.json": { run_id: runId, source_id: sourceId, evidence_snippets: evidence },
    "source_card.json": {
      run_id: runId, source_id: sourceId, source_title: testCase.title, source_summary: ranked.slice(0, 3).map((item) => item.text).join(" "),
      source_origin: testCase.sourceUrl ? `primary_url:${testCase.sourceUrl}` : `dataset_case:${testCase.id}`, source_metadata: metadata,
      source_artifact: "original_source.md", privacy_class: testCase.privacyClass || "public", workflow_profile: profile,
      workflow_profile_version: version?.id || "local", trust_state: "unreviewed", review_status: "pending_review", promotion_status: "not_promoted", created_at: createdAt,
      chaser_agent_inferences: [{ inference_id: "inference-001", inference_text: "The extracted statements require human relevance and truth review before they can become a golden case.", based_on_claim_ids: claims.map((item) => item.claim_id), confidence: "medium" }],
    },
    "action_candidates.json": { run_id: runId, source_id: sourceId, action_candidates: actions },
    "memory_candidates.json": { run_id: runId, source_id: sourceId, memory_candidates: [] },
    "uncertainty_labels.json": { run_id: runId, source_id: sourceId, uncertainty_labels: [{ uncertainty_id: "uncertainty-001", label: "external_truth_not_verified", explanation: "The run verifies extraction and linkage, not the truth of the primary source.", related_claim_ids: claims.map((item) => item.claim_id) }] },
    "run_log.json": {
      run_id: runId, source_id: sourceId, created_at: createdAt, command: "browser://deterministic-source-review", provider_calls: "none", external_api_calls: "none", browser_or_computer_use: "none", fine_tuning_or_training: "none", review_required: true,
      harness_id: harness?.id || agentName, harness_version: version?.id || "local", dataset_id: dataset?.id, test_case_id: testCase.id,
      trace_steps: [
        { id: "step-1", name: "Normalise source", status: "passed", duration_ms: 1 },
        { id: "step-2", name: "Rank claim candidates", status: "passed", duration_ms: 2, output_count: claims.length },
        { id: "step-3", name: "Link source excerpts", status: "passed", duration_ms: 1, output_count: evidence.length },
        { id: "step-4", name: "Apply workflow policy", status: "passed", duration_ms: 1, output_count: actions.length },
        { id: "step-5", name: "Create immutable bundle", status: "passed", duration_ms: 1 },
      ],
      blocked_actions: ["No provider call.", "No external action.", "No memory promotion.", "No model training."],
    },
  };
  const files = Object.entries(artifacts).map(([name, parsed]) => ({
    id: `${runId}::${name}`, name, relativePath: `${runId}/${name}`, directory: runId, mime: "application/json", size: JSON.stringify(parsed).length,
    content: JSON.stringify(parsed, null, 2), parsed, parseStatus: "Parsed", parseError: "", truncated: false, blob: null, canonical: name,
  }));
  files.push({
    id: `${runId}::original_source.md`, name: "original_source.md", relativePath: `${runId}/original_source.md`, directory: runId,
    mime: "text/markdown", size: testCase.sourceText.length, content: testCase.sourceText, parsed: null, parseStatus: "Preview ready", parseError: "", truncated: false, blob: null,
    canonical: null, role: "supporting-text", roleLabel: "Original source", section: "Source evidence", kind: "text", format: "Markdown", extension: "md",
  });
  return assembleRun({
    id: runId, instanceId: `${workspaceId}::${runId}`, sourceRunId: runId, kind: "generated", sessionId: `experiment-${now}`,
    sessionLabel: `Experiment · ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(now))}`,
    label: `Run ${now}`, shortLabel: testCase.title, description: `${workspaceName} · ${version?.label || "local baseline"}`,
  }, artifacts, files);
}

export function runAutomatedEvaluators(run) {
  const diagnostics = validateRunBundle(run);
  const sourceUrl = run.sourceMetadata?.url || (String(run.sourceOrigin || "").startsWith("primary_url:") ? String(run.sourceOrigin).slice(12) : "");
  const notClaimCount = run.claims.filter((claim) => /^(status|title|author|published|url)\s*:/i.test(claim.claim_text || "")).length;
  const contextCount = run.evidence.filter((item) => item.context_before || item.context_after).length;
  const broadActions = run.actions.filter((item) => (item.source_claim_ids || []).length >= Math.max(2, run.claims.length)).length;
  const checks = [
    { id: "bundle", label: "Bundle integrity", score: diagnostics.status === "ready" ? 100 : diagnostics.status === "ready-with-warnings" ? 75 : 0, detail: `${diagnostics.errors} errors · ${diagnostics.warnings} warnings` },
    { id: "provenance", label: "Primary-source provenance", score: sourceUrl ? 100 : 25, detail: sourceUrl ? "Primary URL recorded" : "Primary URL missing" },
    { id: "relevance", label: "Claim relevance hygiene", score: run.claims.length ? Math.round(100 * (run.claims.length - notClaimCount) / run.claims.length) : 0, detail: `${notClaimCount} metadata-like claim candidates` },
    { id: "context", label: "Evidence context", score: run.evidence.length ? Math.round(100 * contextCount / run.evidence.length) : 0, detail: `${contextCount}/${run.evidence.length} excerpts include surrounding context` },
    { id: "actions", label: "Action-link specificity", score: run.actions.length ? Math.round(100 * (run.actions.length - broadActions) / run.actions.length) : 100, detail: `${broadActions} actions linked too broadly` },
    { id: "trace", label: "Execution trace", score: Array.isArray(run.runLog?.trace_steps) && run.runLog.trace_steps.length ? 100 : 40, detail: Array.isArray(run.runLog?.trace_steps) ? `${run.runLog.trace_steps.length} trace steps` : "Only a summary run log is available" },
  ];
  const score = Math.round(checks.reduce((sum, item) => sum + item.score, 0) / checks.length);
  return { score, status: checks.some((item) => item.score === 0) ? "blocked" : score >= 80 ? "passed" : "attention", checks, generatedAt: new Date().toISOString(), humanScoreSupplied: false };
}

export function compareRuns(baseline, candidate, baselineReview = null, candidateReview = null) {
  if (!baseline || !candidate) return null;
  const left = runAutomatedEvaluators(baseline);
  const right = runAutomatedEvaluators(candidate);
  return {
    baseline: { runId: baseline.id, automated: left.score, human: baselineReview?.total ?? null, claims: baseline.claims.length, actions: baseline.actions.length },
    candidate: { runId: candidate.id, automated: right.score, human: candidateReview?.total ?? null, claims: candidate.claims.length, actions: candidate.actions.length },
    delta: { automated: right.score - left.score, human: baselineReview && candidateReview ? candidateReview.total - baselineReview.total : null, claims: candidate.claims.length - baseline.claims.length, actions: candidate.actions.length - baseline.actions.length },
  };
}

export function calculateReviewerAgreement(revisions = []) {
  const groups = new Map();
  revisions.forEach((revision) => {
    const key = revision.review_instance_id || revision.run_id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(revision);
  });
  const comparable = Array.from(groups.values()).filter((items) => new Set(items.map((item) => item.reviewer_name)).size > 1);
  if (!comparable.length) return { status: "needs-calibration", agreementPercent: null, comparableRuns: 0, detail: "Add a second reviewer to the same run to measure agreement." };
  let matches = 0;
  let comparisons = 0;
  comparable.forEach((items) => {
    const reference = items[0];
    items.slice(1).forEach((item) => {
      comparisons += 1;
      if (item.decision === reference.decision && Math.abs((item.total || 0) - (reference.total || 0)) <= 2) matches += 1;
    });
  });
  return { status: "measured", agreementPercent: Math.round(100 * matches / Math.max(1, comparisons)), comparableRuns: comparable.length, detail: "Agreement requires the same decision and totals within two points." };
}

export function evaluateCiGate({ run, latestReview = null, gate }) {
  const automated = runAutomatedEvaluators(run);
  const criticalFailures = automated.checks.filter((check) => check.score === 0).length;
  const reasons = [];
  if (automated.score < gate.minimumAutomatedScore) reasons.push(`Automated score ${automated.score} is below ${gate.minimumAutomatedScore}.`);
  if (criticalFailures > gate.maximumCriticalFailures) reasons.push(`${criticalFailures} critical evaluator failures exceed ${gate.maximumCriticalFailures}.`);
  if (gate.requireHumanPass && latestReview?.decision !== "pass") reasons.push("A finished human Pass decision is required.");
  return { status: reasons.length ? "blocked" : "passed", automatedScore: automated.score, criticalFailures, humanDecision: latestReview?.decision || "missing", reasons };
}

export function createExperimentRecord({ datasetId, testCaseId, harnessId, versionId, runnerMode, run }) {
  return {
    id: stableId("experiment"), datasetId, testCaseId, harnessId, versionId, runnerMode,
    runId: run.id, sessionId: run.sessionId, createdAt: new Date().toISOString(), status: "completed", immutable: true,
  };
}
