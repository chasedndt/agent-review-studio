import test from "node:test";
import assert from "node:assert/strict";
import {
  createReviewRevision,
  detectArtifactProfile,
  groupFileRecords,
  parseStructuredText,
} from "../src/data.js";

test("canonical aliases map to normalized review roles", () => {
  assert.equal(detectArtifactProfile("runlog.json").canonical, "run_log.json");
  assert.equal(detectArtifactProfile("claims.json").canonical, "claims_table.json");
  assert.equal(detectArtifactProfile("notes.md").role, "supporting-text");
  assert.equal(detectArtifactProfile("screen.png", "image/png").kind, "image");
  assert.equal(detectArtifactProfile("report.pdf", "application/pdf").kind, "pdf");
});

test("JSON Lines parsing retains valid rows and reports invalid rows", () => {
  const result = parseStructuredText("episode.jsonl", '{"sequence":1}\nnot-json\n{"sequence":2}');
  assert.equal(result.parsed.length, 2);
  assert.equal(result.parseStatus, "Partially parsed");
  assert.match(result.parseError, /Line 2/);
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
      actionsChecked: true,
      memoryChecked: true,
    },
    scoreTotal: 12,
  });
  assert.equal(record.parent_revision_id, "review-parent");
  assert.equal(record.source_artifacts_mutated, false);
  assert.equal(record.schema_version, "agent_review_studio.review.v2");
});
