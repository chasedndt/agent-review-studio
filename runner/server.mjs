import { createServer } from "node:http";
import { runBrowserDeterministicCase } from "../src/workbench.js";

const HOST = process.env.AGENT_REVIEW_RUNNER_HOST || "127.0.0.1";
const PORT = Number(process.env.AGENT_REVIEW_RUNNER_PORT || 4318);
const MAX_BODY_BYTES = 1_000_000;

function allowedOrigin(origin = "") {
  return /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin);
}

function writeJson(response, status, value, origin = "") {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...(allowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error("Request body exceeds the 1 MB local-runner limit.");
  }
  return JSON.parse(body || "{}");
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin || "";
  if (origin && !allowedOrigin(origin)) return writeJson(response, 403, { error: "Only localhost Studio origins are allowed." });
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
    });
    return response.end();
  }
  if (request.method === "GET" && request.url === "/health") {
    return writeJson(response, 200, { status: "ready", runner: "agent-review-studio-local", version: 1, executionAdapters: ["deterministic_source_review"] }, origin);
  }
  if (request.method === "GET" && request.url === "/v1/catalog") {
    return writeJson(response, 200, { adapters: [{ id: "deterministic_source_review", providerCalls: false, externalActions: false, modelTraining: false }] }, origin);
  }
  if (request.method === "POST" && request.url === "/v1/runs") {
    try {
      const body = await readJson(request);
      const { workspaceId, workspace, dataset, testCase, harness, version } = body;
      if (!workspaceId || !workspace?.name || !testCase?.sourceText || !harness?.id || !version?.id) {
        return writeJson(response, 400, { error: "workspaceId, workspace, testCase source text, harness and version are required." }, origin);
      }
      const run = runBrowserDeterministicCase({
        workspaceId,
        workspaceName: workspace.name,
        agentName: workspace.agentName,
        dataset,
        testCase,
        harness,
        version,
        profile: version.profile,
      });
      run.runLog.command = "localhost://agent-review-studio-runner/deterministic_source_review";
      run.runLog.runner_boundary = "localhost-only; no provider calls; no external actions; no training";
      return writeJson(response, 201, run, origin);
    } catch (error) {
      return writeJson(response, 400, { error: error.message || "The local run could not be created." }, origin);
    }
  }
  return writeJson(response, 404, { error: "Not found" }, origin);
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`Agent Review Studio runner ready at http://${HOST}:${PORT}\n`);
});

