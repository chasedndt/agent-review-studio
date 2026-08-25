import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { BookOpenIcon } from "@phosphor-icons/react/BookOpen";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { CheckIcon } from "@phosphor-icons/react/Check";
import { ClockIcon } from "@phosphor-icons/react/Clock";
import { CodeIcon } from "@phosphor-icons/react/Code";
import { DatabaseIcon } from "@phosphor-icons/react/Database";
import { FileArrowUpIcon } from "@phosphor-icons/react/FileArrowUp";
import { FileTextIcon } from "@phosphor-icons/react/FileText";
import { FloppyDiskIcon } from "@phosphor-icons/react/FloppyDisk";
import { FolderIcon } from "@phosphor-icons/react/Folder";
import { FolderOpenIcon } from "@phosphor-icons/react/FolderOpen";
import { InfoIcon } from "@phosphor-icons/react/Info";
import { ListIcon } from "@phosphor-icons/react/List";
import { LockIcon } from "@phosphor-icons/react/Lock";
import { PlusIcon } from "@phosphor-icons/react/Plus";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";
import { XIcon } from "@phosphor-icons/react/X";
import {
  ARTIFACT_FILES,
  emptyDraft,
  findEvidence,
  loadDemoRuns,
  loadDraft,
  loadImportedRuns,
  parseRunFolderFiles,
  persistDraft,
  persistImportedRuns,
} from "./data.js";

const RATING_ROWS = [
  ["source_fidelity", "Source fidelity", "How well does the run preserve the supplied evidence?"],
  ["inference_separation", "Inference separation", "Are agent conclusions visibly separate from source statements?"],
  ["uncertainty_handling", "Uncertainty handling", "Are important unknowns and limitations made explicit?"],
  ["action_usefulness", "Action usefulness", "Could an operator act or decide without unnecessary guesswork?"],
  ["memory_safety", "Memory safety", "Are durable-memory proposals safe, complete and appropriately scoped?"],
];

const SCALE = [
  [0, "Unusable"],
  [1, "Weak"],
  [2, "Acceptable"],
  [3, "Strong"],
];

const INSPECT_TABS = [
  ["claims", "Claims"],
  ["source", "Source card"],
  ["actions", "Actions"],
  ["memory", "Memory"],
  ["uncertainty", "Uncertainty"],
];

function formatDate(value) {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function compactProfile(value) {
  return String(value || "unknown profile").replaceAll("_", " ");
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <XIcon size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Onboarding({ onClose }) {
  return (
    <Modal title="How review works" onClose={onClose} wide>
      <div className="onboarding-intro">
        <img src="/assets/chaser-agent-guide-avatar.png" alt="Chaser Agent guide" />
        <div>
          <p className="eyebrow">Evaluation and data curation</p>
          <h3>You are teaching the harness what good work looks like.</h3>
          <p>You are not changing model weights. You are checking outputs, recording defects, and creating evidence that can improve prompts, workflows, retrieval, memory, tools and later training datasets.</p>
        </div>
      </div>
      <ol className="onboarding-steps">
        <li><strong>Understand the run.</strong><span>Read its purpose, source, profile and safety boundary.</span></li>
        <li><strong>Inspect the evidence.</strong><span>Check every claim, then inspect actions, memory and uncertainty.</span></li>
        <li><strong>Score once per run.</strong><span>Give five overall ratings from 0 to 3 and choose a decision.</span></li>
        <li><strong>Save the review.</strong><span>Your draft stays in this browser; source JSON remains unchanged.</span></li>
      </ol>
      <div className="modal-actions">
        <button type="button" className="primary-button" onClick={onClose}>Start reviewing</button>
      </div>
    </Modal>
  );
}

function RawArtifact({ run, artifactName, setArtifactName, onClose }) {
  return (
    <Modal title="Raw immutable artifact" onClose={onClose} wide>
      <div className="raw-toolbar">
        <label>
          Artifact
          <select value={artifactName} onChange={(event) => setArtifactName(event.target.value)}>
            {ARTIFACT_FILES.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <span><LockIcon size={15} /> Read-only source evidence</span>
      </div>
      <pre className="raw-json">{JSON.stringify(run.artifacts[artifactName], null, 2)}</pre>
    </Modal>
  );
}

function ProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <Modal title="Create evaluation project" onClose={onClose}>
      <div className="project-form">
        <p>Projects keep different harnesses, services and review histories separate.</p>
        <label>Project name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Customer support harness" /></label>
      </div>
      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
        <button type="button" className="primary-button" disabled={!name.trim()} onClick={() => onCreate(name.trim())}>Create project</button>
      </div>
    </Modal>
  );
}

function RatingControl({ value, onChange, name }) {
  return (
    <div className="rating-control" role="radiogroup" aria-label={name}>
      {SCALE.map(([score, label]) => (
        <button
          key={score}
          type="button"
          className={value === score ? "selected" : ""}
          onClick={() => onChange(score)}
          title={`${score} — ${label}`}
          aria-pressed={value === score}
        >
          {score}
        </button>
      ))}
    </div>
  );
}

function EmptyProject({ onImport, inputRef }) {
  return (
    <div className="empty-state">
      <FolderOpenIcon size={42} />
      <h2>This project has no runs yet</h2>
      <p>Select a run folder—or a parent folder containing several runs. The files stay on this computer.</p>
      <button type="button" className="primary-button" onClick={() => inputRef.current?.click()}>
        <FileArrowUpIcon size={18} /> Import run folders
      </button>
      <input ref={inputRef} type="file" multiple webkitdirectory="true" directory="true" hidden onChange={onImport} />
    </div>
  );
}

export function App() {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("chaser-agent-projects-v1") || "[]");
      return [{ id: "chaser-agent", name: "Chaser Agent", kind: "built-in" }, ...saved];
    } catch {
      return [{ id: "chaser-agent", name: "Chaser Agent", kind: "built-in" }];
    }
  });
  const [selectedProjectId, setSelectedProjectId] = useState("chaser-agent");
  const [projectRuns, setProjectRuns] = useState(() => ({ "chaser-agent": [], ...loadImportedRuns() }));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [runIndex, setRunIndex] = useState(0);
  const [section, setSection] = useState("inspect");
  const [inspectTab, setInspectTab] = useState("claims");
  const [claimIndex, setClaimIndex] = useState(0);
  const [draft, setDraft] = useState(emptyDraft());
  const [saveMessage, setSaveMessage] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem("chaser-agent-onboarding-seen") !== "yes");
  const [showRaw, setShowRaw] = useState(false);
  const [rawArtifact, setRawArtifact] = useState("source_card.json");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const importInputRef = useRef(null);

  useEffect(() => {
    loadDemoRuns()
      .then((demoRuns) => setProjectRuns((current) => {
        const savedRuns = current["chaser-agent"] || [];
        const hasBuiltInRuns = savedRuns.some((item) => item.kind === "built-in" || String(item.demoId || "").startsWith("run-"));
        return hasBuiltInRuns ? current : { ...current, "chaser-agent": [...demoRuns, ...savedRuns] };
      }))
      .catch((error) => setLoadError(error.message || "The demonstration runs could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  const runs = projectRuns[selectedProjectId] || [];
  const run = runs[runIndex] || null;
  const runGroups = useMemo(() => {
    const groups = new Map();
    runs.forEach((item, index) => {
      const key = item.sessionId || "unsorted-runs";
      if (!groups.has(key)) groups.set(key, { id: key, label: item.sessionLabel || "Unsorted runs", items: [] });
      groups.get(key).items.push({ item, index });
    });
    return Array.from(groups.values());
  }, [runs]);
  const activeSessionRuns = run ? runs.filter((item) => item.sessionId === run.sessionId) : [];
  const activeSessionRunIndex = run ? activeSessionRuns.findIndex((item) => item.id === run.id) : -1;

  useEffect(() => {
    setRunIndex(0);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!run) return;
    setDraft(loadDraft(run.id));
    setClaimIndex(0);
    setSection("inspect");
    setInspectTab("claims");
    setSaveMessage("");
  }, [run?.id]);

  const claim = run?.claims[claimIndex] || null;
  const evidence = run && claim ? findEvidence(run, claim) : null;
  const inspected = new Set(draft.inspectedClaims || []);
  const ratingsComplete = RATING_ROWS.every(([key]) => draft.ratings[key] !== null && draft.ratings[key] !== undefined);
  const claimsComplete = run ? run.claims.every((item) => inspected.has(item.claim_id)) : false;
  const reviewComplete = Boolean(ratingsComplete && claimsComplete && draft.actionsChecked && draft.memoryChecked && draft.decision);
  const structuralCheck = useMemo(() => {
    if (!run) return { passed: false, detail: "No run is loaded." };
    const issues = [];
    const claimIds = run.claims.map((item) => item?.claim_id).filter(Boolean);
    if (!run.artifacts?.["source_card.json"] && !run.artifacts?.["human_review_packet.json"]) issues.push("source artifact");
    if (!run.claims.length) issues.push("claims");
    if (claimIds.length !== run.claims.length || new Set(claimIds).size !== claimIds.length) issues.push("unique claim IDs");
    if (!run.id || !run.sourceId || run.sourceId === "unknown source") issues.push("run/source IDs");
    return issues.length
      ? { passed: false, detail: `Check ${issues.join(", ")} before relying on this run.` }
      : { passed: true, detail: `${run.claims.length} claims and required run/source IDs were detected.` };
  }, [run]);

  const scoreTotal = useMemo(
    () => RATING_ROWS.reduce((sum, [key]) => sum + (Number.isInteger(draft.ratings[key]) ? draft.ratings[key] : 0), 0),
    [draft.ratings],
  );

  function updateDraft(patch) {
    setDraft((current) => ({ ...current, ...patch }));
    setSaveMessage("");
  }

  function updateRating(key, value) {
    updateDraft({ ratings: { ...draft.ratings, [key]: value } });
  }

  function markClaim(item) {
    if (!item) return;
    updateDraft({ inspectedClaims: Array.from(new Set([...(draft.inspectedClaims || []), item.claim_id])) });
  }

  function goToClaim(nextIndex) {
    markClaim(claim);
    setClaimIndex(Math.max(0, Math.min(nextIndex, run.claims.length - 1)));
  }

  function changeInspectTab(next) {
    setInspectTab(next);
    setSection("inspect");
    if (next === "actions") updateDraft({ actionsChecked: true });
    if (next === "memory") updateDraft({ memoryChecked: true });
  }

  function saveDraft(status = "draft") {
    if (!run) return;
    const saved = persistDraft(run.id, { ...draft, status });
    setDraft(saved);
    setSaveMessage(status === "reviewed" ? "Review finished and saved locally." : "Draft saved locally.");
  }

  function finishReview() {
    if (!reviewComplete) return;
    saveDraft("reviewed");
    const record = {
      schema_version: "chaser_agent_operator_review.v1",
      project_id: selectedProjectId,
      session_id: run.sessionId,
      session_label: run.sessionLabel,
      review_instance_id: run.id,
      run_id: run.sourceRunId || run.id,
      source_id: run.sourceId,
      workflow_profile: run.workflowProfile,
      ratings: draft.ratings,
      total: scoreTotal,
      decision: draft.decision,
      corrections_or_notes: draft.notes,
      reviewed_claim_ids: draft.inspectedClaims,
      reviewed_at: new Date().toISOString(),
      source_artifacts_mutated: false,
    };
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${run.label.toLowerCase().replaceAll(" ", "-")}-operator-review.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importFolders(event) {
    const imported = await parseRunFolderFiles(event.target.files);
    if (!imported.length) {
      setSaveMessage("No compatible run folders were found. Include source_card.json or human_review_packet.json.");
      return;
    }
    const existingRuns = projectRuns[selectedProjectId] || [];
    const nextProjectRuns = { ...projectRuns, [selectedProjectId]: [...existingRuns, ...imported] };
    const persisted = persistImportedRuns(nextProjectRuns);
    setProjectRuns(nextProjectRuns);
    setRunIndex(existingRuns.length);
    setSaveMessage(persisted
      ? `New dated session saved with ${imported.length} compatible run${imported.length === 1 ? "" : "s"}.`
      : `New session loaded with ${imported.length} compatible run${imported.length === 1 ? "" : "s"}; browser storage is full.`);
    setMobileNavOpen(false);
    event.target.value = "";
  }

  function createProject(name) {
    const project = { id: `project-${Date.now()}`, name, kind: "local" };
    const custom = [...projects.filter((item) => item.id !== "chaser-agent"), project];
    localStorage.setItem("chaser-agent-projects-v1", JSON.stringify(custom));
    setProjects([{ id: "chaser-agent", name: "Chaser Agent", kind: "built-in" }, ...custom]);
    setProjectRuns((current) => {
      const next = { ...current, [project.id]: [] };
      persistImportedRuns(next);
      return next;
    });
    setSelectedProjectId(project.id);
    setShowProjectModal(false);
  }

  function closeOnboarding() {
    localStorage.setItem("chaser-agent-onboarding-seen", "yes");
    setShowOnboarding(false);
  }

  if (loading) {
    return <main className="loading-screen"><img src="/assets/chaser-agent-guide-avatar.png" alt="" /><p>Preparing the evaluation workspace…</p></main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src="/assets/chaser-agent-guide-avatar.png" alt="Chaser Agent" />
          <strong><span>CHASER</span> AGENT</strong>
        </div>
        <div className="top-context">
          <div><span>Project</span><strong>{projects.find((item) => item.id === selectedProjectId)?.name}</strong></div>
          <div><span>Session</span><strong>{run?.sessionLabel || "No session selected"}</strong></div>
          {run && <div className="run-progress"><span>Run {activeSessionRunIndex + 1} of {activeSessionRuns.length}</span><div>{activeSessionRuns.map((item, index) => <i key={item.id} className={index === activeSessionRunIndex ? "active" : ""} />)}</div></div>}
        </div>
        <button type="button" className="mobile-nav-button" aria-label="Browse projects and runs" onClick={() => setMobileNavOpen(true)}><ListIcon size={19} /><span>Browse</span></button>
        <button type="button" className="guide-button" aria-label="Open onboarding guide" onClick={() => setShowOnboarding(true)}><BookOpenIcon size={18} /><span>Open onboarding guide</span></button>
      </header>

      {mobileNavOpen && <button type="button" className="sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close project and run navigation" />}
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-mobile-header"><strong>Browse workspace</strong><button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close project and run navigation"><XIcon size={19} /></button></div>
        <section>
          <div className="sidebar-heading"><span>Projects</span><button type="button" onClick={() => { setShowProjectModal(true); setMobileNavOpen(false); }} aria-label="New project"><PlusIcon size={16} /></button></div>
          <nav className="project-list" aria-label="Projects">
            {projects.map((project) => (
              <button type="button" key={project.id} className={project.id === selectedProjectId ? "active" : ""} onClick={() => { setSelectedProjectId(project.id); setMobileNavOpen(false); }}>
                <FolderIcon size={17} weight={project.id === selectedProjectId ? "fill" : "regular"} />
                <span>{project.name}</span>
              </button>
            ))}
          </nav>
        </section>
        <section className="session-section">
          <div className="sidebar-heading"><span>Sessions & runs</span><button type="button" onClick={() => importInputRef.current?.click()} aria-label="Import run folders"><FileArrowUpIcon size={16} /></button></div>
          <input ref={importInputRef} type="file" multiple webkitdirectory="true" directory="true" hidden onChange={importFolders} />
          <nav className="run-list" aria-label="Runs">
            {runGroups.map((group) => (
              <section className="run-group" key={group.id}>
                <strong className="session-label">{group.label}</strong>
                {group.items.map(({ item, index }) => {
                  const saved = loadDraft(item.id);
                  return (
                    <button type="button" key={item.id} className={index === runIndex ? "active" : ""} onClick={() => { setRunIndex(index); setMobileNavOpen(false); }}>
                      <span className={`status-dot ${saved.status}`} />
                      <span><strong>{item.label}</strong><small>{item.shortLabel}</small></span>
                    </button>
                  );
                })}
              </section>
            ))}
          </nav>
        </section>
        <div className="sidebar-footer">
          <button type="button" onClick={() => importInputRef.current?.click()}><FileArrowUpIcon size={17} /> Import run folders</button>
          <p><LockIcon size={14} /> Files stay on this computer</p>
        </div>
      </aside>

      {!run ? (
        <section className="workspace"><EmptyProject onImport={importFolders} inputRef={importInputRef} /></section>
      ) : (
        <section className="workspace">
          {loadError && <div className="error-banner">{loadError}</div>}
          <div className="explain-strip">
            <img src="/assets/chaser-agent-guide-avatar.png" alt="" />
            <div><strong>What am I doing?</strong><p>Check whether this run preserved its source, separated its own reasoning, handled uncertainty, proposed useful actions and avoided unsafe memory.</p></div>
            <div><strong>Why this matters</strong><p>Your corrections become regression evidence and reviewed benchmark data. This is evaluation and data curation—not model training.</p></div>
          </div>

          <nav className="workflow-steps" aria-label="Review progress">
            {[
              ["understand", "Understand the run", "Review purpose and provenance"],
              ["inspect", "Check outputs against evidence", "Inspect every artifact"],
              ["decide", "Score overall quality", "Rate once per run"],
              ["save", "Save review", "Preserve your judgement"],
            ].map(([id, title, subtitle], index) => (
              <button type="button" key={id} className={section === id ? "active" : (id === "save" && draft.status === "reviewed" ? "complete" : "")} onClick={() => id === "save" ? saveDraft(draft.status === "reviewed" ? "reviewed" : "draft") : setSection(id)}>
                <span>{index + 1}</span><div><strong>{title}</strong><small>{subtitle}</small></div>
              </button>
            ))}
          </nav>

          <div className="review-layout">
            <section className="review-main">
              <nav className="section-tabs">
                <button type="button" className={section === "understand" ? "active" : ""} onClick={() => setSection("understand")}>Understand</button>
                <button type="button" className={section === "inspect" ? "active" : ""} onClick={() => setSection("inspect")}>Inspect</button>
                <button type="button" className={section === "decide" ? "active" : ""} onClick={() => setSection("decide")}>Decide</button>
              </nav>

              {section === "understand" && (
                <div className="understand-view">
                  <p className="eyebrow">{run.label} · {compactProfile(run.workflowProfile)}</p>
                  <h1>{run.sourceTitle}</h1>
                  <p className="lead">{run.sourceSummary}</p>
                  <dl className="provenance-grid">
                    <div><dt>Run ID</dt><dd>{run.id}</dd></div>
                    <div><dt>Source ID</dt><dd>{run.sourceId}</dd></div>
                    <div><dt>Created</dt><dd>{formatDate(run.createdAt)}</dd></div>
                    <div><dt>Origin</dt><dd>{run.sourceOrigin}</dd></div>
                  </dl>
                  <div className="boundary-note"><ShieldCheckIcon size={22} /><div><strong>Review-only boundary</strong><p>{run.packet.canonical_promotion_warning || "This review does not authorize actions, promote memory or change source artifacts."}</p></div></div>
                  <button type="button" className="primary-button" onClick={() => setSection("inspect")}>Continue to evidence <ArrowRightIcon size={17} /></button>
                </div>
              )}

              {section === "inspect" && (
                <>
                  <div className="inspect-toolbar">
                    <div className="inspect-tabs">
                      {INSPECT_TABS.map(([id, label]) => (
                        <button type="button" key={id} className={inspectTab === id ? "active" : ""} onClick={() => changeInspectTab(id)}>
                          {label}
                          {id === "claims" && <span>{inspected.size}/{run.claims.length}</span>}
                          {id === "actions" && <span>{run.actions.length}</span>}
                          {id === "memory" && <span>{run.memories.length}</span>}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="raw-link" onClick={() => setShowRaw(true)}><CodeIcon size={16} /> View raw artifact</button>
                  </div>

                  {inspectTab === "claims" && (
                    <div className="claims-view">
                      <div className="claim-nav">
                        <span>Claim {claimIndex + 1} of {run.claims.length}</span>
                        <div>
                          <button type="button" disabled={claimIndex === 0} onClick={() => goToClaim(claimIndex - 1)}><ArrowLeftIcon size={16} /> Previous</button>
                          <button type="button" disabled={claimIndex === run.claims.length - 1} onClick={() => goToClaim(claimIndex + 1)}>Next <ArrowRightIcon size={16} /></button>
                        </div>
                      </div>
                      <div className="evidence-pair">
                        <article className="claim-pane">
                          <header><span>Agent output</span><code>{claim?.claim_id}</code></header>
                          <blockquote>{claim?.claim_text}</blockquote>
                          <dl>
                            <div><dt>Type</dt><dd>{claim?.claim_type || "not classified"}</dd></div>
                            <div><dt>Confidence</dt><dd>{claim?.confidence || "not recorded"}</dd></div>
                            <div><dt>Source location</dt><dd>{claim?.source_location || "not recorded"}</dd></div>
                          </dl>
                          {claim?.review_note && <p className="review-note"><InfoIcon size={16} /> {claim.review_note}</p>}
                        </article>
                        <article className="evidence-pane">
                          <header><span>Exact evidence</span><span className="readonly"><LockIcon size={14} /> Immutable</span></header>
                          {evidence ? (
                            <>
                              <div className="source-id"><FileTextIcon size={18} /><span><strong>{run.sourceMetadata.title || run.sourceTitle}</strong><small>{evidence.source_location}</small></span><code>{evidence.snippet_id}</code></div>
                              <blockquote>{evidence.text}</blockquote>
                              <p className="privacy"><ShieldCheckIcon size={15} /> Privacy: {evidence.privacy_class || "not recorded"}</p>
                            </>
                          ) : (
                            <div className="missing-evidence"><InfoIcon size={22} /><strong>No linked evidence found</strong><p>This claim needs correction or explicit uncertainty before acceptance.</p></div>
                          )}
                        </article>
                      </div>
                      <div className="claim-checklist">
                        <div><strong>Claims checklist</strong><span>{inspected.size} of {run.claims.length} inspected</span></div>
                        <div className="claim-dots">{run.claims.map((item, index) => <button type="button" key={item.claim_id} className={`${index === claimIndex ? "current" : ""} ${inspected.has(item.claim_id) ? "done" : ""}`} onClick={() => { markClaim(claim); setClaimIndex(index); }}>{inspected.has(item.claim_id) ? <CheckIcon size={13} /> : index + 1}</button>)}</div>
                        <button type="button" className={inspected.has(claim?.claim_id) ? "checked" : ""} onClick={() => markClaim(claim)}>{inspected.has(claim?.claim_id) ? <CheckCircleIcon size={18} weight="fill" /> : <CheckCircleIcon size={18} />} Mark this claim inspected</button>
                      </div>
                    </div>
                  )}

                  {inspectTab === "source" && (
                    <div className="artifact-view">
                      <p className="eyebrow">Source card</p><h2>{run.sourceTitle}</h2><p className="lead">{run.sourceSummary}</p>
                      <h3>Separated agent inference</h3>
                      {run.inferences.length ? run.inferences.map((item) => <article key={item.inference_id}><code>{item.inference_id}</code><p>{item.inference_text}</p><small>Confidence: {item.confidence}</small></article>) : <p className="empty-copy">No agent inference was proposed.</p>}
                    </div>
                  )}

                  {inspectTab === "actions" && (
                    <div className="artifact-view">
                      <p className="eyebrow">Proposed actions</p><h2>Would these help the operator?</h2>
                      {run.actions.length ? run.actions.map((item) => <article key={item.action_id}><header><code>{item.action_id}</code><span>{item.requires_approval ? "Approval required" : "No approval flag"}</span></header><h3>{item.action_text}</h3><p>{item.rationale}</p><small>Owner: {item.suggested_owner} · Risk: {item.risk_level}</small></article>) : <p className="empty-copy">No actions were proposed.</p>}
                      <label className="reviewed-toggle"><input type="checkbox" checked={draft.actionsChecked} onChange={(event) => updateDraft({ actionsChecked: event.target.checked })} /> I checked action usefulness for this run.</label>
                    </div>
                  )}

                  {inspectTab === "memory" && (
                    <div className="artifact-view">
                      <p className="eyebrow">Memory candidates</p><h2>Should any of this become durable memory?</h2>
                      {run.memories.length ? run.memories.map((item, index) => <article key={item.memory_id || index}><header><code>{item.memory_id || `candidate-${index + 1}`}</code><span>{item.status || "candidate only"}</span></header><p>{item.memory_text || item.text || item.content || JSON.stringify(item)}</p></article>) : <div className="positive-empty"><ShieldCheckIcon size={24} /><div><strong>No memory was proposed.</strong><p>Absence is acceptable when the source does not contain a safe, durable fact.</p></div></div>}
                      <label className="reviewed-toggle"><input type="checkbox" checked={draft.memoryChecked} onChange={(event) => updateDraft({ memoryChecked: event.target.checked })} /> I checked memory safety for this run.</label>
                    </div>
                  )}

                  {inspectTab === "uncertainty" && (
                    <div className="artifact-view">
                      <p className="eyebrow">Uncertainty labels</p><h2>Did the run admit what it could not know?</h2>
                      {run.uncertainties.map((item) => <article key={item.uncertainty_id}><header><code>{item.uncertainty_id}</code><span>{item.label}</span></header><p>{item.explanation}</p></article>)}
                    </div>
                  )}
                </>
              )}

              {section === "decide" && (
                <div className="decide-summary">
                  <p className="eyebrow">Human quality judgement</p><h2>Score the complete run once</h2><p>Finish inspecting claims, actions and memory, then use the rating panel. Automated checks cannot supply these scores.</p>
                  <ul>
                    <li className={claimsComplete ? "complete" : ""}>{claimsComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} All {run.claims.length} claims inspected</li>
                    <li className={draft.actionsChecked ? "complete" : ""}>{draft.actionsChecked ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Action usefulness checked</li>
                    <li className={draft.memoryChecked ? "complete" : ""}>{draft.memoryChecked ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Memory safety checked</li>
                    <li className={ratingsComplete ? "complete" : ""}>{ratingsComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Five ratings completed</li>
                  </ul>
                </div>
              )}
            </section>

            <aside className="score-panel">
              <header><div><p className="eyebrow">Decide</p><h2>Score this run overall</h2><span>Five ratings, once per run—not per claim.</span></div><output>{scoreTotal}<small>/15</small></output></header>
              <div className="rating-list">
                {RATING_ROWS.map(([key, title, help]) => (
                  <div className="rating-row" key={key}><div><strong>{title}</strong><span>{help}</span></div><RatingControl name={title} value={draft.ratings[key]} onChange={(value) => updateRating(key, value)} /></div>
                ))}
              </div>
              <div className="scale-legend">{SCALE.map(([score, label]) => <span key={score}><b>{score}</b> {label}</span>)}</div>
              <fieldset className="decision-field"><legend>Decision</legend>{[["pass", "Pass"], ["needs_revision", "Needs revision"], ["fail", "Fail"]].map(([value, label]) => <label key={value}><input type="radio" name="decision" value={value} checked={draft.decision === value} onChange={(event) => updateDraft({ decision: event.target.value })} /><span>{label}</span></label>)}</fieldset>
              <label className="notes-field">Corrections and notes<textarea value={draft.notes} onChange={(event) => updateDraft({ notes: event.target.value })} placeholder="Record exact defective phrases, missing evidence, or the correction this harness should learn…" /></label>
              <div className={`system-check ${structuralCheck.passed ? "pass" : "needs-check"}`}><ShieldCheckIcon size={21} /><div><strong>Automated structural check</strong><span>{structuralCheck.detail} This does not replace your judgement.</span></div><b>{structuralCheck.passed ? "PASS" : "CHECK"}</b></div>
              {saveMessage && <p className="save-message">{saveMessage}</p>}
              <div className="score-actions">
                <button type="button" className="secondary-button" onClick={() => saveDraft()}><FloppyDiskIcon size={18} /> Save draft</button>
                <button type="button" className="primary-button" disabled={!reviewComplete} onClick={finishReview}><CheckCircleIcon size={18} /> Finish review</button>
              </div>
              {!reviewComplete && <p className="completion-hint">Complete the checklist, ratings and decision to finish.</p>}
            </aside>
          </div>
        </section>
      )}

      {showOnboarding && <Onboarding onClose={closeOnboarding} />}
      {showRaw && run && <RawArtifact run={run} artifactName={rawArtifact} setArtifactName={setRawArtifact} onClose={() => setShowRaw(false)} />}
      {showProjectModal && <ProjectModal onClose={() => setShowProjectModal(false)} onCreate={createProject} />}
    </main>
  );
}
