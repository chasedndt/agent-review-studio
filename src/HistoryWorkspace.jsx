import { useEffect, useMemo, useState } from "react";
import { ArrowClockwiseIcon } from "@phosphor-icons/react/ArrowClockwise";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/ClockCounterClockwise";
import { DownloadSimpleIcon } from "@phosphor-icons/react/DownloadSimple";
import { GitDiffIcon } from "@phosphor-icons/react/GitDiff";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";

const RATING_LABELS = {
  source_fidelity: "Source fidelity",
  inference_separation: "Inference separation",
  uncertainty_handling: "Uncertainty handling",
  action_usefulness: "Action usefulness",
  memory_safety: "Memory safety",
};

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function exportRevision(record) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${record.run_label || record.run_id}-review-${record.revision_id}.json`.toLowerCase().replaceAll(" ", "-");
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function HistoryWorkspace({ history, onReReview }) {
  const [selectedId, setSelectedId] = useState(history[0]?.revision_id || "");
  const [runFilter, setRunFilter] = useState("all");

  useEffect(() => {
    if (!history.some((record) => record.revision_id === selectedId)) setSelectedId(history[0]?.revision_id || "");
  }, [history, selectedId]);

  const runOptions = useMemo(() => Array.from(new Map(history.map((record) => [record.run_id, record.run_label || record.run_id])).entries()), [history]);
  const visible = runFilter === "all" ? history : history.filter((record) => record.run_id === runFilter);
  const selected = visible.find((record) => record.revision_id === selectedId) || visible[0] || null;
  const previous = selected?.parent_revision_id ? history.find((record) => record.revision_id === selected.parent_revision_id) : null;

  return (
    <section className="history-workspace" data-tour="history-workspace">
      <header className="page-header">
        <div>
          <p className="eyebrow">Reusable improvement examples</p>
          <h1>Review history</h1>
          <p>Each finished review records what the agent did, how you labelled it, and what should improve. Re-reviewing compares a new result without erasing the earlier one.</p>
        </div>
        <label className="history-filter">Run<select value={runFilter} onChange={(event) => setRunFilter(event.target.value)}><option value="all">All runs</option>{runOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </header>

      {!history.length ? (
        <div className="page-empty compact"><ClockCounterClockwiseIcon size={42} /><h2>No reviewed examples yet</h2><p>Complete the checklist, label the run and save the reviewed example. It will appear here for improvement work and comparison.</p></div>
      ) : (
        <div className="history-layout">
          <aside className="revision-list">
            {visible.map((record) => (
              <button type="button" key={record.revision_id} className={record.revision_id === selected?.revision_id ? "active" : ""} onClick={() => setSelectedId(record.revision_id)}>
                <span className={`decision-badge ${record.decision}`}>{String(record.decision).replaceAll("_", " ")}</span>
                <strong>{record.run_label || record.run_id}</strong>
                <small>{formatDate(record.reviewed_at)}</small>
                <span className="revision-total">{record.total}<small>/15</small></span>
              </button>
            ))}
          </aside>

          {selected && (
            <article className="revision-detail">
              <header>
                <div><p className="eyebrow">Revision {selected.revision_id}</p><h2>{selected.run_label || selected.run_id}</h2><p>{selected.session_label}</p></div>
                <div className="page-actions">
                  <button type="button" className="secondary-button" onClick={() => exportRevision(selected)}><DownloadSimpleIcon size={17} /> Export</button>
                  <button type="button" className="primary-button" onClick={() => onReReview(selected)}><ArrowClockwiseIcon size={17} /> Re-review</button>
                </div>
              </header>
              <div className="revision-summary">
                <div><span>Decision</span><strong>{String(selected.decision).replaceAll("_", " ")}</strong></div>
                <div><span>Total</span><strong>{selected.total}/15</strong></div>
                <div><span>Reviewer</span><strong>{selected.reviewer_name || "Local operator"}</strong></div>
                <div><span>Reviewed</span><strong>{formatDate(selected.reviewed_at)}</strong></div>
              </div>
              <div className="revision-ratings">
                {Object.entries(RATING_LABELS).map(([key, label]) => <div key={key}><span>{label}</span><strong>{selected.ratings?.[key] ?? "—"}<small>/3</small></strong></div>)}
              </div>
              <section className="revision-notes"><h3>Corrections and notes</h3><p>{selected.corrections_or_notes || "No correction note was recorded."}</p></section>
              <div className="revision-integrity"><ShieldCheckIcon size={21} /><div><strong>Source bundle remained immutable</strong><span>This revision records judgement only; imported agent artifacts were not changed.</span></div></div>
              {previous ? (
                <section className="revision-compare"><GitDiffIcon size={20} /><div><strong>Linked to an earlier review</strong><p>Total moved from {previous.total}/15 to {selected.total}/15. Decision moved from {String(previous.decision).replaceAll("_", " ")} to {String(selected.decision).replaceAll("_", " ")}.</p></div></section>
              ) : <p className="first-revision">This is the first stored judgement in this review chain.</p>}
            </article>
          )}
        </div>
      )}
    </section>
  );
}
