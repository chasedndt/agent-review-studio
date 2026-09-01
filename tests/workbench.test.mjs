import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  calculateReviewerAgreement,
  CLAIM_LABELS,
  compareRuns,
  createStarterWorkbench,
  createDatasetDefinition,
  createHarnessDefinition,
  createTestCase,
  evaluateCiGate,
  extractRankedClaims,
  runAutomatedEvaluators,
  runBrowserDeterministicCase,
} from "../src/workbench.js";

const SOURCE = `# Source\n\n- URL: https://example.com/article\n- Status: research intake only\n\nThe article says agent harnesses need auditable evidence and explicit approval.\n\nA future runtime should preserve provenance before acting.\n\n- machine-readable policy;\n- bounded action gates;\n`;

function generatedRun(now = 1_700_000_000_000) {
  const dataset = createDatasetDefinition("Calibration", "Repeatable cases", now);
  const testCase = createTestCase({ title: "Evidence policy", sourceText: SOURCE, sourceUrl: "https://example.com/article" }, now + 1);
  dataset.cases.push(testCase);
  const harness = createHarnessDefinition("Example harness", now);
  return runBrowserDeterministicCase({ workspaceId: "workspace-1", workspaceName: "QA", agentName: "Example harness", dataset, testCase, harness, version: harness.versions[0] }, now + 2);
}

test("claim labels distinguish supported output from specific failure categories", () => {
  assert.ok(CLAIM_LABELS.some((item) => item.id === "not_a_claim"));
  assert.ok(CLAIM_LABELS.some((item) => item.id === "action_unrelated"));
  assert.equal(CLAIM_LABELS.find((item) => item.id === "not_a_claim").needsCorrection, true);
});

test("ranked extraction excludes document status and keeps substantive statements", () => {
  const claims = extractRankedClaims(SOURCE);
  assert.equal(claims.some((item) => /^Status:/i.test(item.text)), false);
  assert.ok(claims.some((item) => /auditable evidence/i.test(item.text)));
  assert.ok(claims.every((item) => item.line > 0));
});

test("starter workbenches prefer the retained original source over a flattened summary", () => {
  const workspace = { id: "workspace-1", name: "QA", agentName: "Example harness" };
  const sourceRun = generatedRun();
  sourceRun.sourceSummary = "Status in Chaser Agent: research intake only Substantive statement flattened beside metadata.";
  const configuration = createStarterWorkbench(workspace, [sourceRun]);
  assert.equal(configuration.datasets[0].cases[0].sourceText, SOURCE.trim());
  assert.match(configuration.datasets[0].cases[0].sourceText, /\n- Status:/);
});

test("the browser runner creates a new immutable review-ready bundle with source context", () => {
  const run = generatedRun();
  assert.equal(run.kind, "generated");
  assert.equal(run.files.length, 9);
  assert.ok(run.files.some((file) => file.name === "original_source.md"));
  assert.ok(run.evidence.every((item) => Object.hasOwn(item, "context_before")));
  assert.ok(run.runLog.trace_steps.length >= 5);
});

test("the built-in candidate rejects metadata leakage and preserves review lineage", async () => {
  const fixture = async (name) => JSON.parse(await readFile(new URL(`../public/demo-runs/run-4/${name}`, import.meta.url), "utf8"));
  const [claims, evidence, actions, runLog] = await Promise.all([
    fixture("claims_table.json"),
    fixture("evidence_snippets.json"),
    fixture("action_candidates.json"),
    fixture("run_log.json"),
  ]);

  assert.ok(claims.claims.length > 0);
  assert.doesNotMatch(claims.claims[0].claim_text, /status|research intake|implementation-prep/i);
  assert.ok(evidence.evidence_snippets.every((item) => item.context_before || item.context_after));
  assert.ok(actions.action_candidates.every((item) => item.source_claim_ids.length === 1));
  assert.ok(runLog.trace_steps.length >= 5);
});

test("automated evaluators stay separate from human scores", () => {
  const result = runAutomatedEvaluators(generatedRun());
  assert.ok(result.score >= 80);
  assert.equal(result.humanScoreSupplied, false);
  assert.ok(result.checks.some((item) => item.id === "provenance"));
});

test("baseline comparison reports deltas without overwriting either run", () => {
  const baseline = generatedRun(1_700_000_000_000);
  const candidate = generatedRun(1_700_000_001_000);
  const comparison = compareRuns(baseline, candidate);
  assert.equal(comparison.delta.automated, 0);
  assert.equal(comparison.baseline.runId, baseline.id);
  assert.equal(comparison.candidate.runId, candidate.id);
});

test("reviewer agreement needs comparable independent judgments", () => {
  assert.equal(calculateReviewerAgreement([]).status, "needs-calibration");
  const measured = calculateReviewerAgreement([
    { review_instance_id: "run-1", reviewer_name: "A", decision: "pass", total: 12 },
    { review_instance_id: "run-1", reviewer_name: "B", decision: "pass", total: 13 },
  ]);
  assert.equal(measured.agreementPercent, 100);
});

test("CI gates require deterministic quality and the configured human boundary", () => {
  const run = generatedRun();
  const gate = { minimumAutomatedScore: 80, maximumCriticalFailures: 0, requireHumanPass: true };
  assert.equal(evaluateCiGate({ run, gate }).status, "blocked");
  assert.equal(evaluateCiGate({ run, gate, latestReview: { decision: "pass" } }).status, "passed");
});
