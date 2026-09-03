import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ARTIFACT_FILES,
  archiveWorkspaceDefinition,
  assembleRun,
  createWorkspaceDefinition,
  createSessionEvaluationPack,
  createReviewRevision,
  detectArtifactProfile,
  groupFileRecords,
  hasDraftProgress,
  isDevelopmentQaReview,
  loadWorkspaceDefinitions,
  parseRunFolderFiles,
  parseStructuredText,
  persistWorkspaceDefinitions,
  reviewCompletionState,
  reviewStateForRun,
  validateRunBundle,
} from "../src/data.js";

async function loadDemoFixture(runName = "run-1") {
  const artifacts = {};
  const files = [];
  for (const name of ARTIFACT_FILES) {
    const content = await readFile(new URL(`../public/demo-runs/${runName}/${name}`, import.meta.url), "utf8");
    artifacts[name] = JSON.parse(content);
    files.push({ name, relativePath: `${runName}/${name}`, canonical: name, parseStatus: "Parsed", parseError: "" });
  }
  return assembleRun({ id: runName, instanceId: runName, sourceRunId: artifacts["source_card.json"].run_id, sessionId: "session-1", sessionLabel: "Session 1", label: "Run 1" }, artifacts, files);
}

function importedFile(content, name, relativePath, type = "application/json") {
  const file = new File([content], name, { type, lastModified: 1 });
  Object.defineProperty(file, "webkitRelativePath", { value: relativePath });
  return file;
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test("canonical aliases map to normalized review roles", () => {
  assert.equal(detectArtifactProfile("runlog.json").canonical, "run_log.json");
  assert.equal(detectArtifactProfile("claims.json").canonical, "claims_table.json");
  assert.equal(detectArtifactProfile("notes.md").role, "supporting-text");
  assert.equal(detectArtifactProfile("screen.png", "image/png").kind, "image");
  assert.equal(detectArtifactProfile("report.pdf", "application/pdf").kind, "pdf");
});

test("canonical array-shaped artifacts normalize without wrapper objects", () => {
  const run = assembleRun({ id: "array-run", label: "Array run" }, {
    "claims_table.json": [{ claim_id: "claim-1", evidence_snippet_id: "evidence-1", claim_text: "A claim" }],
    "evidence_snippets.json": [{ snippet_id: "evidence-1", supports_claim_ids: ["claim-1"], text: "Evidence" }],
  });
  assert.equal(run.claims.length, 1);
  assert.equal(run.evidence.length, 1);
});

test("the file adapter matrix keeps every supported family openable or downloadable", () => {
  assert.equal(detectArtifactProfile("config.yaml", "text/yaml").kind, "text");
  assert.equal(detectArtifactProfile("metrics.tsv", "text/tab-separated-values").kind, "text");
  assert.equal(detectArtifactProfile("operator-notes.md", "text/markdown").kind, "text");
  assert.equal(detectArtifactProfile("policy.ts", "text/plain").kind, "text");
  assert.equal(detectArtifactProfile("diagram.svg", "image/svg+xml").kind, "text");
  assert.equal(detectArtifactProfile("capture.webp", "image/webp").kind, "image");
  assert.equal(detectArtifactProfile("archive.zip", "application/zip").kind, "binary");
});

test("JSON Lines parsing retains valid rows and reports invalid rows", () => {
  const result = parseStructuredText("episode.jsonl", '{"sequence":1}\nnot-json\n{"sequence":2}');
  assert.equal(result.parsed.length, 2);
  assert.equal(result.parseStatus, "Partially parsed");
  assert.match(result.parseError, /Line 2/);
});

test("CSV preview preserves quoted delimiters, escaped quotes and embedded newlines", () => {
  const result = parseStructuredText("metrics.csv", 'name,notes\n"Run, one","Said ""ready""\nwith evidence"');
  assert.deepEqual(result.parsed, [["name", "notes"], ["Run, one", 'Said "ready"\nwith evidence']]);
});

test("nested run folders group around their contract anchors", () => {
  const records = [
    { name: "source_card.json", type: "application/json", relativePath: "suite/run-a/source_card.json" },
    { name: "notes.md", type: "text/markdown", relativePath: "suite/run-a/context/notes.md" },
    { name: "human_review_packet.json", type: "application/json", relativePath: "suite/run-b/human_review_packet.json" },
    { name: "trace.log", type: "text/plain", relativePath: "suite/run-b/logs/trace.log" },
  ];
  const grouped = groupFileRecords(records);
  assert.deepEqual(grouped.map(([name]) => name), ["suite/run-a", "suite/run-b"]);
  assert.deepEqual(grouped.map(([, files]) => files.length), [2, 2]);
});

test("folder import retains and normalizes a complete canonical run bundle", async () => {
  const selected = [];
  for (const name of ARTIFACT_FILES) {
    const content = await readFile(new URL(`../public/demo-runs/run-1/${name}`, import.meta.url), "utf8");
    selected.push(importedFile(content, name, `calibration/run-1/${name}`));
  }
  selected.push(importedFile("operator context", "notes.md", "calibration/run-1/context/notes.md", "text/markdown"));
  selected.push(importedFile(new Uint8Array([1, 2, 3]), "capture.bin", "calibration/run-1/evidence/capture.bin", "application/octet-stream"));
  const imported = await parseRunFolderFiles(selected);
  assert.equal(imported.length, 1);
  assert.equal(imported[0].files.length, 10);
  assert.equal(imported[0].files.find((file) => file.name === "notes.md").kind, "text");
  assert.equal(imported[0].files.find((file) => file.name === "capture.bin").kind, "binary");
  assert.equal(validateRunBundle(imported[0]).status, "ready");
});

test("fresh installs start without a hardwired agent workspace", () => {
  const storage = memoryStorage();
  assert.deepEqual(loadWorkspaceDefinitions(storage), []);
});

test("new agent workspaces persist without an injected product workspace", () => {
  const storage = memoryStorage();
  const created = createWorkspaceDefinition("Support Agent QA", "Returns assistant", 1234);
  persistWorkspaceDefinitions([created], storage);
  const loaded = loadWorkspaceDefinitions(storage);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, "workspace-1234");
  assert.equal(loaded[0].agentName, "Returns assistant");
  assert.throws(() => createWorkspaceDefinition("", "Agent", 1), /required/);
});

test("legacy built-in workspaces migrate into ordinary removable local workspaces", () => {
  const storage = memoryStorage();
  storage.setItem("agent-review-studio-workspaces-v2", JSON.stringify([{ id: "legacy-agent", name: "Personal agent", agentName: "Personal agent", kind: "built-in", archivedAt: null }]));
  const [migrated] = loadWorkspaceDefinitions(storage);
  assert.equal(migrated.kind, "local");
  assert.equal(migrated.migratedFromBuiltIn, true);
  assert.ok(archiveWorkspaceDefinition(migrated, 1).archivedAt);
});

test("workspace setup retains the harness purpose and primary evaluation goal", () => {
  const created = createWorkspaceDefinition("Research QA", "Evidence agent", {
    description: "Ground every research claim in an approved primary source.",
    evaluationGoal: "evidence",
  }, 4321);
  assert.equal(created.id, "workspace-4321");
  assert.equal(created.description, "Ground every research claim in an approved primary source.");
  assert.equal(created.evaluationGoal, "evidence");
});

test("the optional Chaser Agent case-study fixture contains four complete review runs", async () => {
  const runs = await Promise.all(["run-4", "run-1", "run-2", "run-3"].map((name) => loadDemoFixture(name)));
  const diagnostics = runs.map(validateRunBundle);
  assert.equal(runs.length, 4);
  assert.deepEqual(diagnostics.map((item) => item.status), ["ready", "ready", "ready", "ready"]);
  assert.equal(diagnostics.reduce((total, item) => total + item.presentArtifactCount, 0), 32);
  assert.equal(diagnostics.reduce((total, item) => total + item.requiredArtifactCount, 0), 32);
});

test("review revisions preserve lineage and immutable-source declaration", () => {
  const record = createReviewRevision({
    projectId: "project-1",
    workspaceName: "Example QA",
    agentName: "Example agent",
    reviewerName: "Operator",
    run: {
      id: "review-instance-1",
      sourceRunId: "run-1",
      label: "Run 1",
      sessionId: "session-1",
      sessionLabel: "Session 1",
      sourceId: "source-1",
      workflowProfile: "business_logic",
    },
    draft: {
      parentRevisionId: "review-parent",
      ratings: { source_fidelity: 3 },
      decision: "needs_revision",
      notes: "Tighten evidence mapping.",
      inspectedClaims: ["claim-1"],
      claimJudgments: { "claim-1": { labels: ["missing_context"], correction: "Preserve the source context." } },
      contractChecked: true,
      sourceChecked: true,
      actionsChecked: true,
      memoryChecked: true,
      uncertaintyChecked: true,
      traceChecked: true,
    },
    scoreTotal: 12,
  });
  assert.equal(record.parent_revision_id, "review-parent");
  assert.equal(record.source_artifacts_mutated, false);
  assert.equal(record.schema_version, "agent_review_studio.review.v5");
  assert.deepEqual(record.claim_judgments["claim-1"].labels, ["missing_context"]);
  assert.equal(record.run_log_checked, true);
  assert.equal(record.learning_handoff.artifact_type, "human_reviewed_agent_run");
  assert.equal(record.learning_handoff.automatic_training_authorized, false);
  assert.ok(record.learning_handoff.intended_uses.includes("golden_evaluation_case"));
});

test("canonical Chaser demonstration bundle passes deterministic diagnostics", async () => {
  for (const name of ["run-1", "run-2", "run-3"]) {
    const run = await loadDemoFixture(name);
    const result = validateRunBundle(run);
    assert.equal(result.status, "ready", `${name} should be ready`);
    assert.equal(result.errors, 0);
    assert.equal(result.presentArtifactCount, 8);
  }
});

test("diagnostics block missing files and unresolved evidence references", async () => {
  const run = await loadDemoFixture();
  const broken = {
    ...run,
    claims: [{ ...run.claims[0], evidence_snippet_id: "evidence-missing" }],
    artifacts: { ...run.artifacts, "evidence_snippets.json": undefined },
  };
  const result = validateRunBundle(broken);
  assert.equal(result.status, "blocked");
  assert.ok(result.issues.some((item) => item.code === "missing-canonical-artifacts"));
  assert.ok(result.issues.some((item) => item.code === "claim-evidence-links"));
});

test("diagnostics block ambiguous duplicate canonical files", async () => {
  const run = await loadDemoFixture();
  const duplicate = { ...run.files[0], id: "duplicate", relativePath: `nested/${run.files[0].name}` };
  const result = validateRunBundle({ ...run, files: [...run.files, duplicate] });
  assert.equal(result.status, "blocked");
  assert.ok(result.issues.some((item) => item.code === "duplicate-canonical-files"));
});

test("development QA records never masquerade as operator review progress", async () => {
  const run = await loadDemoFixture();
  const qaRecord = { reviewer_name: "Local operator", corrections_or_notes: "QA draft: evidence navigation and review state verified.", run_id: run.sourceRunId };
  assert.equal(isDevelopmentQaReview(qaRecord), true);
  assert.equal(hasDraftProgress({ notes: "QA draft: evidence navigation and review state verified." }), false);
  assert.equal(reviewStateForRun(run, [], { status: "unreviewed", ratings: {} }), "unreviewed");
  assert.equal(reviewStateForRun(run, [{ run_id: run.sourceRunId }], { status: "reviewed", notes: "Real review" }), "reviewed");
});

test("needs-revision and failed decisions require a correction note", async () => {
  const run = await loadDemoFixture();
  const completeBase = {
    ratings: { source_fidelity: 2, inference_separation: 2, uncertainty_handling: 2, action_usefulness: 2, memory_safety: 2 },
    inspectedClaims: run.claims.map((claim) => claim.claim_id),
    claimJudgments: Object.fromEntries(run.claims.map((claim) => [claim.claim_id, { labels: ["supported_relevant"], correction: "" }])),
    contractChecked: true,
    sourceChecked: true,
    actionsChecked: true,
    memoryChecked: true,
    uncertaintyChecked: true,
    traceChecked: true,
    decision: "needs_revision",
    notes: "",
  };
  assert.equal(reviewCompletionState(run, completeBase).complete, false);
  assert.equal(reviewCompletionState(run, { ...completeBase, notes: "Resolve the broken citation." }).complete, true);
  assert.equal(reviewCompletionState(run, { ...completeBase, decision: "pass" }).complete, true);
});

test("claim issue labels require a claim-level correction before completion", async () => {
  const run = await loadDemoFixture();
  const judgments = Object.fromEntries(run.claims.map((claim) => [claim.claim_id, { labels: ["supported_relevant"], correction: "" }]));
  judgments[run.claims[0].claim_id] = { labels: ["not_a_claim"], correction: "" };
  const draft = {
    ratings: { source_fidelity: 3, inference_separation: 3, uncertainty_handling: 3, action_usefulness: 3, memory_safety: 3 },
    inspectedClaims: run.claims.map((claim) => claim.claim_id),
    claimJudgments: judgments,
    contractChecked: true,
    sourceChecked: true,
    actionsChecked: true,
    memoryChecked: true,
    uncertaintyChecked: true,
    traceChecked: true,
    decision: "pass",
    notes: "",
  };
  assert.equal(reviewCompletionState(run, draft).complete, false);
  const corrected = { ...draft, claimJudgments: { ...judgments, [run.claims[0].claim_id]: { labels: ["not_a_claim"], correction: "Exclude the document-status row." } } };
  assert.equal(reviewCompletionState(run, corrected).complete, true);
});

test("review completion requires explicit confirmation of every canonical artifact group", async () => {
  const run = await loadDemoFixture();
  const draft = {
    ratings: { source_fidelity: 3, inference_separation: 3, uncertainty_handling: 3, action_usefulness: 3, memory_safety: 3 },
    inspectedClaims: run.claims.map((claim) => claim.claim_id),
    claimJudgments: Object.fromEntries(run.claims.map((claim) => [claim.claim_id, { labels: ["supported_relevant"], correction: "" }])),
    contractChecked: true,
    sourceChecked: true,
    actionsChecked: true,
    memoryChecked: true,
    uncertaintyChecked: true,
    traceChecked: false,
    decision: "pass",
    notes: "",
  };
  assert.equal(reviewCompletionState(run, draft).complete, false);
  assert.equal(reviewCompletionState(run, { ...draft, traceChecked: true }).complete, true);
});

test("session export includes diagnostics, review state and immutable boundary", async () => {
  const run = await loadDemoFixture();
  const pack = createSessionEvaluationPack({
    projectId: "project-1",
    workspaceName: "Agent QA",
    agentName: "Example agent",
    reviewerName: "Operator",
    session: { id: "session-1", label: "Session 1" },
    runs: [run],
    history: [],
    drafts: {},
  });
  assert.equal(pack.schema_version, "agent_review_studio.session_evaluation.v2");
  assert.equal(pack.summary.not_started_runs, 1);
  assert.equal(pack.summary.runs_without_finished_review, 1);
  assert.equal(pack.runs[0].diagnostics.status, "ready");
  assert.equal(pack.source_artifacts_mutated, false);
  assert.equal(pack.learning_handoff.artifact_type, "human_reviewed_agent_session");
  assert.equal(pack.learning_handoff.automatic_training_authorized, false);
  assert.match(pack.boundary, /governed training-data selection/);
});
