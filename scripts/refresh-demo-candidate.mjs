import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runBrowserDeterministicCase } from "../src/workbench.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "public", "demo-sources", "cloudflare-monetization-gateway-thesis.md");
const outputDir = path.join(root, "public", "demo-runs", "run-4");
const sourceText = await readFile(sourcePath, "utf8");
const createdAt = Date.parse("2026-09-01T12:00:00.000Z");

const run = runBrowserDeterministicCase({
  workspaceId: "chaser-agent",
  workspaceName: "Chaser Agent — Personal Evaluation",
  agentName: "Chaser Agent",
  dataset: { id: "dataset-chaser-cloudflare-v1", name: "Chaser Agent source-review calibration", version: 1 },
  testCase: {
    id: "case-cloudflare-monetization-gateway-v1",
    title: "Cloudflare Monetization Gateway thesis",
    sourceText,
    sourceUrl: "https://blog.cloudflare.com/monetization-gateway/",
    expectedBehavior: "Extract substantive, source-grounded claims; preserve provenance and surrounding context; separate inference; propose only relevant approval-gated actions.",
    tags: ["calibration", "ai_engineering_research_review"],
    privacyClass: "public",
  },
  harness: { id: "chaser-agent", name: "Chaser Agent" },
  version: {
    id: "candidate-relevance-v1",
    label: "Relevance and provenance candidate v1",
    commit: "local-audit-candidate",
    profile: "ai_engineering_research_review",
  },
  profile: "ai_engineering_research_review",
}, createdAt);

await mkdir(outputDir, { recursive: true });
for (const file of run.files.filter((item) => item.canonical)) {
  await writeFile(path.join(outputDir, file.name), `${JSON.stringify(file.parsed, null, 2)}\n`, "utf8");
}

const firstClaim = run.claims[0]?.claim_text || "";
if (/^status\s*:/i.test(firstClaim)) throw new Error("The candidate still exposes metadata as the first claim.");
if (!run.evidence.every((item) => item.context_before || item.context_after)) throw new Error("Every candidate must retain surrounding context.");

console.log(`Wrote ${run.files.filter((item) => item.canonical).length} canonical artifacts to ${outputDir}`);
console.log(`First claim: ${firstClaim}`);
