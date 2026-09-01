import { useEffect, useMemo, useState } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { ClockIcon } from "@phosphor-icons/react/Clock";
import { DownloadSimpleIcon } from "@phosphor-icons/react/DownloadSimple";
import { FileArrowUpIcon } from "@phosphor-icons/react/FileArrowUp";
import { FilesIcon } from "@phosphor-icons/react/Files";
import { GitBranchIcon } from "@phosphor-icons/react/GitBranch";
import { NotePencilIcon } from "@phosphor-icons/react/NotePencil";
import { RepeatIcon } from "@phosphor-icons/react/Repeat";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";
import { TagIcon } from "@phosphor-icons/react/Tag";
import { WrenchIcon } from "@phosphor-icons/react/Wrench";
import { WarningCircleIcon } from "@phosphor-icons/react/WarningCircle";
import { loadDraft, reviewStateForRun, validateRunBundle } from "./data.js";

function stateLabel(state) {
  return {
    unreviewed: "Not started",
    draft: "Draft saved",
    "re-review": "Re-review draft",
    reviewed: "Reviewed",
  }[state] || state;
}

function stateIcon(state) {
  if (state === "reviewed") return <CheckCircleIcon size={17} weight="fill" />;
  if (state === "draft" || state === "re-review") return <NotePencilIcon size={17} />;
  return <ClockIcon size={17} />;
}

export function OverviewWorkspace({ workspace, runs, history, onOpenRun, onImport, onExportSession }) {
  const sessions = useMemo(() => {
    const groups = new Map();
    runs.forEach((run, index) => {
      const id = run.sessionId || "unsorted-runs";
      if (!groups.has(id)) groups.set(id, { id, label: run.sessionLabel || "Unsorted runs", runs: [] });
      groups.get(id).runs.push({ run, index });
    });
    return Array.from(groups.values());
  }, [runs]);
  const [sessionId, setSessionId] = useState(sessions[0]?.id || "");
  const [expandedRunId, setExpandedRunId] = useState("");

  useEffect(() => {
    if (!sessions.some((session) => session.id === sessionId)) setSessionId(sessions[0]?.id || "");
  }, [sessions, sessionId]);

  const session = sessions.find((item) => item.id === sessionId) || sessions[0] || null;
  const rows = useMemo(() => (session?.runs || []).map(({ run, index }) => {
    const draft = loadDraft(run.id);
    const state = reviewStateForRun(run, history, draft);
    const diagnostics = validateRunBundle(run);
    const revisions = history
      .filter((record) => record.review_instance_id === run.id || record.run_id === run.sourceRunId)
      .sort((left, right) => String(right.reviewed_at).localeCompare(String(left.reviewed_at)));
    return { run, index, draft, state, diagnostics, latest: revisions[0] || null, revisionCount: revisions.length };
  }), [session, history]);

  const reviewedCount = rows.filter((row) => row.latest).length;
  const draftCount = rows.filter((row) => row.state === "draft" || row.state === "re-review").length;
  const blockedCount = rows.filter((row) => row.diagnostics.status === "blocked").length;
  const next = rows.find((row) => row.state === "draft" || row.state === "re-review")
    || rows.find((row) => row.state === "unreviewed")
    || rows[0];
  const completionPercent = rows.length ? Math.round((reviewedCount / rows.length) * 100) : 0;
  const canonicalArtifactCount = rows.reduce((total, row) => total + row.diagnostics.presentArtifactCount, 0);
  const canonicalArtifactTarget = rows.reduce((total, row) => total + row.diagnostics.requiredArtifactCount, 0);

  if (!runs.length) {
    return (
      <section className="overview-workspace" data-tour="overview-workspace">
        <div className="page-empty">
          <FilesIcon size={44} />
          <h1>Start an evaluation session</h1>
          <p>Import one run folder or a parent folder containing several run bundles. Agent Review Studio will retain every file, diagnose canonical links and build an operator queue.</p>
          <button type="button" className="primary-button" onClick={onImport}><FileArrowUpIcon size={18} /> Import run folder</button>
        </div>
      </section>
    );
  }

  return (
    <section className="overview-workspace" data-tour="overview-workspace">
      <header className="overview-hero">
        <div>
          <p className="eyebrow">Review · label · improve</p>
          <h1>{workspace.name}</h1>
          <p>Turn real runs from {workspace.agentName} into trusted examples that show what worked, what failed and what the agent should do better next time.</p>
          {workspace.id === "chaser-agent" && <div className="instance-status"><ShieldCheckIcon size={17} weight="fill" /><span><strong>Personal Chaser Agent instance ready</strong><small>{rows.length} runs loaded · {canonicalArtifactCount}/{canonicalArtifactTarget} canonical artifacts available</small></span></div>}
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={onImport}><FileArrowUpIcon size={17} /> Import session</button>
          <button type="button" className="secondary-button" data-tour="session-export" disabled={!session} onClick={() => onExportSession(session)}><DownloadSimpleIcon size={17} /> Export evaluation pack</button>
          {next && <button type="button" className="primary-button" onClick={() => onOpenRun(next.index)}>{next.state === "unreviewed" ? "Start next review" : next.state === "reviewed" ? "Open reviewed run" : "Continue review"} <ArrowRightIcon size={17} /></button>}
        </div>
      </header>

      <div className="overview-body">
        <section className="improvement-loop" aria-label="How reviewed runs improve an agent">
          <article><span>1</span><div><strong>Review</strong><p>Compare the complete run with its source evidence.</p></div></article>
          <article><span><TagIcon size={17} /></span><div><strong>Label</strong><p>Score quality and record the exact correction.</p></div></article>
          <article><span><WrenchIcon size={17} /></span><div><strong>Improve</strong><p>Update prompts, tools, retrieval, rules or workflow logic.</p></div></article>
          <article><span><RepeatIcon size={17} /></span><div><strong>Re-test</strong><p>Run the task again and compare the new result.</p></div></article>
        </section>
        <p className="improvement-boundary">The Studio creates reviewed improvement data. It never changes a source run, deploys an agent, or updates model weights by itself.</p>

        <section className="capability-map" aria-label="How Agent Review Studio improves an agent">
          <article>
            <span>Works directly in this Studio</span>
            <h2>Improve an agent harness</h2>
            <p>Use reviewed failures and corrections to update prompts, retrieval, tools, approval rules, memory policy and workflow orchestration. Run the same test again and compare it with the baseline.</p>
          </article>
          <article>
            <span>Requires a separate training system</span>
            <h2>Prepare data for model training</h2>
            <p>Export reviewed examples as governed training-data candidates. A separate trainer still needs an approved dataset, target outputs, model configuration, compute and a new evaluation pass.</p>
          </article>
        </section>

        <div className="session-control">
          <label>Evaluation session<select value={session?.id || ""} onChange={(event) => setSessionId(event.target.value)}>{sessions.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
          <div className="session-progress-copy"><span>{reviewedCount} of {rows.length} operator reviews finished</span><strong>{completionPercent}%</strong></div>
          <div className="session-progress-track" aria-label={`${completionPercent}% reviewed`}><i style={{ width: `${completionPercent}%` }} /></div>
        </div>

        <div className="overview-metrics">
          <article><span>Runs in session</span><strong>{rows.length}</strong><small>One judgement per complete run</small></article>
          <article className="success"><span>Finished reviews</span><strong>{reviewedCount}</strong><small>Immutable operator revisions</small></article>
          <article className={draftCount ? "attention" : ""}><span>Drafts in progress</span><strong>{draftCount}</strong><small>Safe to resume later</small></article>
          <article className={blockedCount ? "danger" : "success"}><span>Bundle diagnostics</span><strong>{blockedCount ? `${blockedCount} blocked` : "Ready"}</strong><small>{blockedCount ? "Resolve before relying on output" : "Canonical links resolve"}</small></article>
        </div>

        <section className="run-lineage-card" data-tour="run-lineage">
          <header><div><p className="eyebrow">Immutable run lineage</p><h2>What a chronological evaluation history looks like</h2></div><p>Every execution becomes a new node. Earlier runs and reviews stay readable, so an engineer can trace exactly which dataset, harness version and runner produced a result.</p></header>
          <div className="lineage-flow">{rows.map((row, index) => <article key={row.run.id}><span className="lineage-index">{index + 1}</span><div><strong>{row.run.label} · {row.run.shortLabel}</strong><small>{new Date(row.run.createdAt || Date.now()).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</small><dl><div><dt>Harness version</dt><dd>{row.run.runLog?.harness_version || row.run.workflowProfile || "imported"}</dd></div><div><dt>Dataset / source</dt><dd>{row.run.runLog?.dataset_id || row.run.sourceId}</dd></div><div><dt>Review state</dt><dd>{stateLabel(row.state)}</dd></div></dl></div><i><GitBranchIcon size={15} /> append-only</i></article>)}</div>
        </section>

        <section className="queue-card" data-tour="overview-queue">
          <header>
            <div><p className="eyebrow">Run queue</p><h2>Complete these in order</h2></div>
            <p>Open each run, inspect its eight canonical artifacts, score five dimensions once, choose a decision, and preserve a correction when revision is needed.</p>
          </header>
          <div className="queue-table" aria-label="Evaluation run queue">
            <div className="queue-head"><span>Run</span><span>Evidence bundle</span><span>Operator state</span><span>Latest result</span><span /></div>
            {rows.map((row) => (
              <article className="queue-row" key={row.run.id}>
                <div className="queue-run"><span>{row.run.label}</span><strong>{row.run.shortLabel}</strong><small>{String(row.run.workflowProfile).replaceAll("_", " ")}</small></div>
                <div className={`diagnostic-summary ${row.diagnostics.status}`}>
                  {row.diagnostics.status === "ready" ? <ShieldCheckIcon size={18} weight="fill" /> : <WarningCircleIcon size={18} />}
                  <span><strong>{row.diagnostics.presentArtifactCount}/{row.diagnostics.requiredArtifactCount} canonical files</strong><small>{row.diagnostics.status === "ready" ? `${row.run.claims.length} claim-evidence links ready` : `${row.diagnostics.errors} errors · ${row.diagnostics.warnings} warnings`}</small>{row.diagnostics.issues.length > 0 && <button type="button" className="diagnostic-toggle" onClick={() => setExpandedRunId(expandedRunId === row.run.id ? "" : row.run.id)}>{expandedRunId === row.run.id ? "Hide diagnostics" : "View diagnostics"}</button>}</span>
                </div>
                <div className={`operator-state ${row.state}`}>{stateIcon(row.state)}<span><strong>{stateLabel(row.state)}</strong><small>{row.revisionCount ? `${row.revisionCount} stored revision${row.revisionCount === 1 ? "" : "s"}` : "No operator judgement yet"}</small></span></div>
                <div className="latest-result">{row.latest ? <><strong>{row.latest.total}<small>/15</small></strong><span className={`decision-badge ${row.latest.decision}`}>{String(row.latest.decision).replaceAll("_", " ")}</span></> : <span className="no-result">Pending review</span>}</div>
                <button type="button" className="queue-action" onClick={() => onOpenRun(row.index)}>{row.state === "unreviewed" ? "Start" : row.state === "reviewed" ? "Open" : "Continue"} <ArrowRightIcon size={15} /></button>
                {expandedRunId === row.run.id && row.diagnostics.issues.length > 0 && <div className="diagnostic-details"><strong>Bundle issues to resolve</strong><ul>{row.diagnostics.issues.map((issue) => <li key={issue.code} className={issue.severity}><span>{issue.title}</span><small>{issue.detail}</small></li>)}</ul></div>}
              </article>
            ))}
          </div>
        </section>

        <aside className="operator-boundary"><ShieldCheckIcon size={22} /><div><strong>What this session produces</strong><p>A portable evaluation pack containing evidence, labels, corrections, scores and revision lineage. It is ready for harness improvement and golden regression testing; model training remains a separate governed pipeline.</p></div></aside>
      </div>
    </section>
  );
}
