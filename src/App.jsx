import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { BookOpenIcon } from "@phosphor-icons/react/BookOpen";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { CheckIcon } from "@phosphor-icons/react/Check";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/ClockCounterClockwise";
import { ClockIcon } from "@phosphor-icons/react/Clock";
import { FileArrowUpIcon } from "@phosphor-icons/react/FileArrowUp";
import { FilesIcon } from "@phosphor-icons/react/Files";
import { FloppyDiskIcon } from "@phosphor-icons/react/FloppyDisk";
import { FolderIcon } from "@phosphor-icons/react/Folder";
import { FolderOpenIcon } from "@phosphor-icons/react/FolderOpen";
import { GaugeIcon } from "@phosphor-icons/react/Gauge";
import { GearSixIcon } from "@phosphor-icons/react/GearSix";
import { InfoIcon } from "@phosphor-icons/react/Info";
import { ListIcon } from "@phosphor-icons/react/List";
import { LockIcon } from "@phosphor-icons/react/Lock";
import { PlusIcon } from "@phosphor-icons/react/Plus";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";
import { TargetIcon } from "@phosphor-icons/react/Target";
import { XIcon } from "@phosphor-icons/react/X";
import {
  appendReviewRevision,
  createReviewRevision,
  emptyDraft,
  findEvidence,
  loadDemoRuns,
  loadDraft,
  loadLegacyImportedRuns,
  loadReviewHistory,
  parseRunFolderFiles,
  persistDraft,
} from "./data.js";
import { loadStoredRuns, storeImportedRuns } from "./storage.js";
import { FilesWorkspace } from "./FilesWorkspace.jsx";
import { GuidedTour } from "./Tour.jsx";
import { HistoryWorkspace } from "./HistoryWorkspace.jsx";
import { SettingsWorkspace } from "./SettingsWorkspace.jsx";

const WORKSPACES_KEY = "agent-review-studio-workspaces-v2";
const SELECTED_WORKSPACE_KEY = "agent-review-studio-selected-workspace-v1";
const REVIEWER_KEY = "agent-review-studio-reviewer-v1";
const TOUR_KEY = "agent-review-studio-tour-complete-v1";

const BUILT_IN_WORKSPACE = {
  id: "chaser-agent",
  name: "Chaser Agent Evaluation",
  agentName: "Chaser Agent",
  description: "Standalone harness research, golden-case curation and product-quality review.",
  kind: "built-in",
};

const RATING_ROWS = [
  ["source_fidelity", "Source fidelity", "How well does the run preserve the supplied evidence?"],
  ["inference_separation", "Inference separation", "Are agent conclusions visibly separate from source statements?"],
  ["uncertainty_handling", "Uncertainty handling", "Are important unknowns and limitations made explicit?"],
  ["action_usefulness", "Action usefulness", "Could an operator act or decide without unnecessary guesswork?"],
  ["memory_safety", "Memory safety", "Are durable-memory proposals safe, complete and appropriately scoped?"],
];

const SCALE = [[0, "Unusable"], [1, "Weak"], [2, "Acceptable"], [3, "Strong"]];
const INSPECT_TABS = [["claims", "Claims"], ["source", "Source card"], ["actions", "Actions"], ["memory", "Memory"], ["uncertainty", "Uncertainty"]];
const APP_PAGES = [
  ["review", "Review", TargetIcon],
  ["files", "Files", FilesIcon],
  ["history", "History", ClockCounterClockwiseIcon],
  ["settings", "Settings", GearSixIcon],
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

function loadWorkspaces() {
  try {
    const saved = JSON.parse(localStorage.getItem(WORKSPACES_KEY) || "[]");
    if (Array.isArray(saved) && saved.length) {
      const withoutBuiltIn = saved.filter((workspace) => workspace.id !== BUILT_IN_WORKSPACE.id);
      const storedBuiltIn = saved.find((workspace) => workspace.id === BUILT_IN_WORKSPACE.id);
      return [{ ...BUILT_IN_WORKSPACE, ...(storedBuiltIn || {}) }, ...withoutBuiltIn];
    }
    const legacy = JSON.parse(localStorage.getItem("chaser-agent-projects-v1") || "[]");
    return [BUILT_IN_WORKSPACE, ...legacy.map((project) => ({ ...project, agentName: project.name, description: "Migrated Phase 1 workspace" }))];
  } catch {
    return [BUILT_IN_WORKSPACE];
  }
}

function persistWorkspaces(workspaces) {
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
}

function downloadJson(record, filename) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header"><h2>{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><XIcon size={20} /></button></header>
        {children}
      </section>
    </div>
  );
}

function WorkspaceModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [agentName, setAgentName] = useState("");
  return (
    <Modal title="Create evaluation workspace" onClose={onClose}>
      <div className="project-form">
        <p>Workspaces keep one agent, harness or service and its review history together.</p>
        <label>Workspace name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Support Agent QA" /></label>
        <label>Agent or harness name<input value={agentName} onChange={(event) => setAgentName(event.target.value)} placeholder="Example: Returns assistant" /></label>
      </div>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="button" className="primary-button" disabled={!name.trim()} onClick={() => onCreate(name.trim(), agentName.trim() || name.trim())}>Create workspace</button></div>
    </Modal>
  );
}

function RatingControl({ value, onChange, name, disabled = false }) {
  return (
    <div className="rating-control" role="radiogroup" aria-label={name}>
      {SCALE.map(([score, label]) => <button key={score} type="button" disabled={disabled} className={value === score ? "selected" : ""} onClick={() => onChange(score)} title={`${score} — ${label}`} aria-pressed={value === score}>{score}</button>)}
    </div>
  );
}

function EmptyProject({ onFolderImport, onFileImport }) {
  return (
    <div className="empty-state">
      <FolderOpenIcon size={42} />
      <h2>This workspace has no runs yet</h2>
      <p>Import one run folder, a parent folder containing several runs, or a loose selection of evidence files. Everything stays on this computer.</p>
      <div className="empty-actions"><button type="button" className="primary-button" onClick={onFolderImport}><FolderOpenIcon size={18} /> Import folder</button><button type="button" className="secondary-button" onClick={onFileImport}><FileArrowUpIcon size={18} /> Import files</button></div>
    </div>
  );
}

export function App() {
  const [workspaces, setWorkspaces] = useState(loadWorkspaces);
  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem(SELECTED_WORKSPACE_KEY) || BUILT_IN_WORKSPACE.id);
  const [projectRuns, setProjectRuns] = useState({ [BUILT_IN_WORKSPACE.id]: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [runIndex, setRunIndex] = useState(0);
  const [activePage, setActivePage] = useState("review");
  const [section, setSection] = useState("inspect");
  const [inspectTab, setInspectTab] = useState("claims");
  const [claimIndex, setClaimIndex] = useState(0);
  const [draft, setDraft] = useState(emptyDraft());
  const [saveMessage, setSaveMessage] = useState("");
  const [reviewHistory, setReviewHistory] = useState(() => loadReviewHistory());
  const [reviewerName, setReviewerName] = useState(() => localStorage.getItem(REVIEWER_KEY) || "Local operator");
  const [tourOpen, setTourOpen] = useState(() => localStorage.getItem(TOUR_KEY) !== "yes");
  const [tourStep, setTourStep] = useState(0);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadDemoRuns(), loadStoredRuns()])
      .then(([demoRuns, storedRuns]) => {
        if (cancelled) return;
        const legacyRuns = loadLegacyImportedRuns();
        const merged = {};
        const projectIds = new Set([...Object.keys(legacyRuns), ...Object.keys(storedRuns)]);
        projectIds.forEach((projectId) => {
          const combined = [...(legacyRuns[projectId] || []), ...(storedRuns[projectId] || [])];
          merged[projectId] = combined.filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);
        });
        const storedBuiltIn = merged[BUILT_IN_WORKSPACE.id] || [];
        const importedBuiltIn = storedBuiltIn.filter((item) => item.kind !== "built-in" && !String(item.demoId || "").startsWith("run-"));
        merged[BUILT_IN_WORKSPACE.id] = [...demoRuns, ...importedBuiltIn];
        setProjectRuns(merged);
      })
      .catch((error) => setLoadError(error.message || "The demonstration runs could not be loaded."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!workspaces.some((workspace) => workspace.id === selectedProjectId)) setSelectedProjectId(workspaces[0]?.id || BUILT_IN_WORKSPACE.id);
    localStorage.setItem(SELECTED_WORKSPACE_KEY, selectedProjectId);
  }, [selectedProjectId, workspaces]);

  const workspace = workspaces.find((item) => item.id === selectedProjectId) || workspaces[0] || BUILT_IN_WORKSPACE;
  const runs = projectRuns[selectedProjectId] || [];
  const run = runs[runIndex] || null;
  const workspaceHistory = reviewHistory.filter((record) => record.project_id === selectedProjectId);
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

  useEffect(() => { setRunIndex(0); }, [selectedProjectId]);

  useEffect(() => {
    if (!run) {
      setDraft(emptyDraft());
      return;
    }
    setDraft(loadDraft(run.id));
    setClaimIndex(0);
    setSection("inspect");
    setInspectTab("claims");
  }, [run?.id]);

  const claim = run?.claims?.[claimIndex] || null;
  const evidence = run && claim ? findEvidence(run, claim) : null;
  const inspected = new Set(draft.inspectedClaims || []);
  const ratingsComplete = RATING_ROWS.every(([key]) => draft.ratings[key] !== null && draft.ratings[key] !== undefined);
  const claimsComplete = run ? run.claims.every((item) => inspected.has(item.claim_id)) : false;
  const reviewComplete = Boolean(run && ratingsComplete && claimsComplete && draft.actionsChecked && draft.memoryChecked && draft.decision);
  const structuralCheck = useMemo(() => {
    if (!run) return { passed: false, detail: "No run is loaded." };
    const issues = [];
    const claimIds = run.claims.map((item) => item?.claim_id).filter(Boolean);
    if (!run.artifacts?.["source_card.json"] && !run.artifacts?.["human_review_packet.json"]) issues.push("review contract");
    if (!run.claims.length) issues.push("claims");
    if (claimIds.length !== run.claims.length || new Set(claimIds).size !== claimIds.length) issues.push("unique claim IDs");
    if (!run.id || !run.sourceId || run.sourceId === "unknown source") issues.push("run/source IDs");
    return issues.length ? { passed: false, detail: `Check ${issues.join(", ")} before relying on this run.` } : { passed: true, detail: `${run.claims.length} claims, ${run.files.length} files and required run/source IDs were detected.` };
  }, [run]);
  const scoreTotal = useMemo(() => RATING_ROWS.reduce((sum, [key]) => sum + (Number.isInteger(draft.ratings[key]) ? draft.ratings[key] : 0), 0), [draft.ratings]);

  const navigateForTour = useCallback((page) => {
    setActivePage(page);
    setMobileNavOpen(false);
  }, []);

  function updateDraft(patch) {
    setDraft((current) => current.status === "reviewed" ? current : ({ ...current, ...patch, status: "draft" }));
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
    setClaimIndex(Math.max(0, Math.min(nextIndex, Math.max(0, run.claims.length - 1))));
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
    setSaveMessage(status === "reviewed" ? "Review revision saved locally and exported." : "Draft saved locally.");
  }

  function finishReview() {
    if (!reviewComplete || !run) return;
    const completedDraft = persistDraft(run.id, { ...draft, status: "reviewed" });
    const revision = createReviewRevision({ projectId: selectedProjectId, workspaceName: workspace.name, agentName: workspace.agentName, reviewerName, run, draft: completedDraft, scoreTotal });
    appendReviewRevision(revision);
    setDraft(completedDraft);
    setReviewHistory(loadReviewHistory());
    setSaveMessage("Review revision saved locally and exported.");
    downloadJson(revision, `${run.label.toLowerCase().replaceAll(" ", "-")}-review-${revision.revision_id}.json`);
  }

  async function importFiles(event) {
    const selected = event.target.files;
    if (!selected?.length) return;
    setSaveMessage("Reading the selected files…");
    try {
      const imported = await parseRunFolderFiles(selected);
      if (!imported.length) {
        setSaveMessage("No readable files were selected.");
        return;
      }
      const existingRuns = projectRuns[selectedProjectId] || [];
      await storeImportedRuns(selectedProjectId, imported);
      setProjectRuns((current) => ({ ...current, [selectedProjectId]: [...(current[selectedProjectId] || []), ...imported] }));
      setRunIndex(existingRuns.length);
      setActivePage("files");
      setSaveMessage(`Saved a new dated session with ${imported.length} run bundle${imported.length === 1 ? "" : "s"} and every selected file.`);
      setMobileNavOpen(false);
    } catch (error) {
      setSaveMessage(error.message || "The selected files could not be imported.");
    } finally {
      event.target.value = "";
    }
  }

  function createWorkspace(name, agentName) {
    const project = { id: `workspace-${Date.now()}`, name, agentName, description: "Local agent evaluation workspace", kind: "local" };
    const next = [...workspaces, project];
    persistWorkspaces(next);
    setWorkspaces(next);
    setProjectRuns((current) => ({ ...current, [project.id]: [] }));
    setSelectedProjectId(project.id);
    setActivePage("review");
    setShowWorkspaceModal(false);
  }

  function saveWorkspace(updated) {
    const next = workspaces.map((item) => item.id === updated.id ? updated : item);
    persistWorkspaces(next);
    setWorkspaces(next);
  }

  function saveReviewer(value) {
    localStorage.setItem(REVIEWER_KEY, value);
    setReviewerName(value);
  }

  function startReReview(record) {
    const index = runs.findIndex((item) => item.id === record.review_instance_id || item.sourceRunId === record.run_id);
    if (index < 0) {
      setSaveMessage("The source run for this revision is not loaded in the current workspace.");
      setActivePage("history");
      return;
    }
    const seeded = emptyDraft({ ...record, status: "draft", parentRevisionId: record.revision_id });
    persistDraft(runs[index].id, seeded);
    setRunIndex(index);
    setDraft(seeded);
    setActivePage("review");
    setSection("decide");
    setSaveMessage(`Re-review started from ${record.revision_id}. Finishing will create a linked revision.`);
  }

  function openTour() {
    setTourStep(0);
    setTourOpen(true);
  }

  function closeTour() {
    localStorage.setItem(TOUR_KEY, "yes");
    setTourOpen(false);
  }

  if (loading) return <main className="loading-screen"><GaugeIcon size={46} weight="duotone" /><p>Preparing Agent Review Studio…</p></main>;

  return (
    <main className="app-shell">
      <input ref={folderInputRef} type="file" multiple webkitdirectory="true" directory="true" hidden onChange={importFiles} />
      <input ref={fileInputRef} type="file" multiple hidden onChange={importFiles} />

      <header className="topbar">
        <div className="brand"><span className="brand-mark"><GaugeIcon size={25} weight="duotone" /></span><strong><span>AGENT REVIEW</span><small>STUDIO</small></strong></div>
        <div className="top-context">
          <div data-tour="workspace"><span>Workspace</span><strong>{workspace.name}</strong></div>
          <div><span>Agent / harness</span><strong>{workspace.agentName}</strong></div>
          <div><span>Session</span><strong>{run?.sessionLabel || "No session selected"}</strong></div>
          {run && <div className="run-progress"><span>Run {activeSessionRunIndex + 1} of {activeSessionRuns.length}</span><div>{activeSessionRuns.map((item, index) => <i key={item.id} className={index === activeSessionRunIndex ? "active" : ""} />)}</div></div>}
        </div>
        <button type="button" className="mobile-nav-button" aria-label="Browse workspace" onClick={() => setMobileNavOpen(true)}><ListIcon size={19} /><span>Browse</span></button>
        <button type="button" className="guide-button" aria-label="Open guided tour" onClick={openTour}><BookOpenIcon size={18} /><span>Guided tour</span></button>
      </header>

      {mobileNavOpen && <button type="button" className="sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close workspace navigation" />}
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-mobile-header"><strong>Browse workspace</strong><button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close workspace navigation"><XIcon size={19} /></button></div>
        <section>
          <div className="sidebar-heading"><span>Workspaces</span><button type="button" onClick={() => { setShowWorkspaceModal(true); setMobileNavOpen(false); }} aria-label="New workspace"><PlusIcon size={16} /></button></div>
          <nav className="project-list" aria-label="Evaluation workspaces">
            {workspaces.map((project) => <button type="button" key={project.id} className={project.id === selectedProjectId ? "active" : ""} onClick={() => { setSelectedProjectId(project.id); setMobileNavOpen(false); }}><FolderIcon size={17} weight={project.id === selectedProjectId ? "fill" : "regular"} /><span>{project.name}</span></button>)}
          </nav>
        </section>

        <nav className="app-nav" aria-label="Workspace sections">
          {APP_PAGES.map(([id, label, Icon]) => <button type="button" key={id} data-tour={`nav-${id}`} className={activePage === id ? "active" : ""} onClick={() => { setActivePage(id); setMobileNavOpen(false); }}><Icon size={18} /><span>{label}</span>{id === "history" && workspaceHistory.length > 0 && <b>{workspaceHistory.length}</b>}</button>)}
        </nav>

        <section className="session-section" data-tour="runs">
          <div className="sidebar-heading"><span>Sessions & runs</span><button type="button" data-tour="imports" onClick={() => folderInputRef.current?.click()} aria-label="Import run folders"><FileArrowUpIcon size={16} /></button></div>
          <div className="run-list">
            {runGroups.map((group) => <div className="run-group" key={group.id}><span className="session-label">{group.label}</span>{group.items.map(({ item, index }) => { const state = loadDraft(item.id).status; return <button type="button" key={item.id} className={index === runIndex ? "active" : ""} onClick={() => { setRunIndex(index); setActivePage("review"); setSaveMessage(""); setMobileNavOpen(false); }}><span className={`status-dot ${state}`} /><span><strong>{item.label} · {item.shortLabel}</strong><small>{compactProfile(item.description)}</small></span></button>; })}</div>)}
          </div>
        </section>
        <footer className="sidebar-footer"><button type="button" onClick={() => folderInputRef.current?.click()}><FileArrowUpIcon size={17} /> Import run folder</button><p><LockIcon size={13} /> Local-first · source files stay immutable</p></footer>
      </aside>

      <section className="workspace">
        {loadError && <p className="error-banner">{loadError}</p>}
        {saveMessage && activePage !== "review" && <p className="global-message">{saveMessage}</p>}

        {activePage === "review" && !run && <EmptyProject onFolderImport={() => folderInputRef.current?.click()} onFileImport={() => fileInputRef.current?.click()} />}
        {activePage === "review" && run && (
          <>
            <section className="explain-strip">
              <span className="explain-icon"><TargetIcon size={30} weight="duotone" /></span>
              <div><strong>What am I doing?</strong><p>Check whether this run preserved its source, separated its reasoning, handled uncertainty, proposed useful actions and avoided unsafe memory.</p></div>
              <div><strong>Why this matters</strong><p>Your corrections become regression evidence and reviewed benchmark data. This is evaluation and data curation—not model-weight training.</p></div>
            </section>

            <nav className="workflow-steps" aria-label="Review progress">
              {[
                ["understand", 1, "Understand the run", "Review purpose and provenance", true],
                ["inspect", 2, "Check outputs against evidence", "Inspect every artifact", claimsComplete && draft.actionsChecked && draft.memoryChecked],
                ["decide", 3, "Score overall quality", "Rate once per run", ratingsComplete && Boolean(draft.decision)],
                ["save", 4, "Save review", "Preserve every judgement", draft.status === "reviewed"],
              ].map(([id, number, title, helper, complete]) => <button type="button" key={id} className={`${section === id || (id === "save" && draft.status === "reviewed") ? "active" : ""} ${complete ? "complete" : ""}`} onClick={() => id === "save" ? saveDraft() : setSection(id)}><span>{complete ? <CheckIcon size={15} /> : number}</span><div><strong>{title}</strong><small>{helper}</small></div></button>)}
            </nav>

            <div className="review-layout" data-tour="review-workspace">
              <section className="review-main">
                <nav className="section-tabs"><button type="button" className={section === "understand" ? "active" : ""} onClick={() => setSection("understand")}>Understand</button><button type="button" className={section === "inspect" ? "active" : ""} onClick={() => setSection("inspect")}>Inspect</button><button type="button" className={section === "decide" ? "active" : ""} onClick={() => setSection("decide")}>Decide</button></nav>

                {section === "understand" && <div className="understand-view"><p className="eyebrow">Run purpose</p><h1>{run.sourceTitle}</h1><p className="lead">{run.sourceSummary}</p><div className="provenance-grid"><div><dt>Source ID</dt><dd>{run.sourceId}</dd></div><div><dt>Workflow profile</dt><dd>{compactProfile(run.workflowProfile)}</dd></div><div><dt>Created</dt><dd>{formatDate(run.createdAt)}</dd></div><div><dt>Imported files</dt><dd>{run.files.length}</dd></div></div><div className="boundary-note"><ShieldCheckIcon size={22} /><div><strong>Review boundary</strong><p>You may score, annotate, export and create a new revision. Source artifacts remain immutable, and no external action or memory promotion is authorized.</p></div></div><button type="button" className="primary-button" onClick={() => setSection("inspect")}>Start evidence review <ArrowRightIcon size={17} /></button></div>}

                {section === "inspect" && <>
                  <div className="inspect-toolbar"><div className="inspect-tabs">{INSPECT_TABS.map(([id, label]) => <button type="button" key={id} className={inspectTab === id ? "active" : ""} onClick={() => changeInspectTab(id)}>{label}{id === "claims" && <span>{inspected.size}/{run.claims.length}</span>}{id === "actions" && <span>{run.actions.length}</span>}{id === "memory" && <span>{run.memories.length}</span>}</button>)}</div><button type="button" className="raw-link" onClick={() => setActivePage("files")}><FilesIcon size={16} /> Open all files</button></div>

                  {inspectTab === "claims" && <div className="claims-view">
                    {run.claims.length ? <>
                      <div className="claim-nav"><span>Claim {claimIndex + 1} of {run.claims.length}</span><div><button type="button" disabled={claimIndex === 0} onClick={() => goToClaim(claimIndex - 1)}><ArrowLeftIcon size={16} /> Previous</button><button type="button" disabled={claimIndex === run.claims.length - 1} onClick={() => goToClaim(claimIndex + 1)}>Next <ArrowRightIcon size={16} /></button></div></div>
                      <div className="evidence-pair"><article className="claim-pane"><header><span>Agent output</span><code>{claim?.claim_id}</code></header><blockquote>{claim?.claim_text}</blockquote><dl><div><dt>Type</dt><dd>{claim?.claim_type || "not classified"}</dd></div><div><dt>Confidence</dt><dd>{claim?.confidence || "not recorded"}</dd></div><div><dt>Source location</dt><dd>{claim?.source_location || "not recorded"}</dd></div></dl>{claim?.review_note && <p className="review-note"><InfoIcon size={16} /> {claim.review_note}</p>}</article><article className="evidence-pane"><header><span>Exact evidence</span><span className="readonly"><LockIcon size={14} /> Immutable</span></header>{evidence ? <><div className="source-id"><FilesIcon size={18} /><span><strong>{run.sourceMetadata.title || run.sourceTitle}</strong><small>{evidence.source_location}</small></span><code>{evidence.snippet_id}</code></div><blockquote>{evidence.text}</blockquote><p className="privacy"><ShieldCheckIcon size={15} /> Privacy: {evidence.privacy_class || "not recorded"}</p></> : <div className="missing-evidence"><InfoIcon size={22} /><div><strong>No linked evidence found</strong><p>This claim needs correction or explicit uncertainty before acceptance.</p></div></div>}</article></div>
                      <div className="claim-checklist"><div><strong>Claims checklist</strong><span>{inspected.size} of {run.claims.length} inspected</span></div><div className="claim-dots">{run.claims.map((item, index) => <button type="button" key={item.claim_id} className={`${index === claimIndex ? "current" : ""} ${inspected.has(item.claim_id) ? "done" : ""}`} onClick={() => { markClaim(claim); setClaimIndex(index); }}>{inspected.has(item.claim_id) ? <CheckIcon size={13} /> : index + 1}</button>)}</div><button type="button" disabled={draft.status === "reviewed"} className={inspected.has(claim?.claim_id) ? "checked" : ""} onClick={() => markClaim(claim)}>{inspected.has(claim?.claim_id) ? <CheckCircleIcon size={18} weight="fill" /> : <CheckCircleIcon size={18} />} Mark this claim inspected</button></div>
                    </> : <div className="artifact-empty"><InfoIcon size={28} /><h2>No normalized claims were detected</h2><p>Use the Files workspace to inspect the imported bundle. Add a recognized claims table when this run should enter the paired evidence-review flow.</p><button type="button" className="secondary-button" onClick={() => setActivePage("files")}>Open Files</button></div>}
                  </div>}

                  {inspectTab === "source" && <div className="artifact-view"><p className="eyebrow">Source card</p><h2>{run.sourceTitle}</h2><p className="lead">{run.sourceSummary}</p><h3>Separated agent inference</h3>{run.inferences.length ? run.inferences.map((item, index) => <article key={item.inference_id || index}><code>{item.inference_id || `inference-${index + 1}`}</code><p>{item.inference_text || item.text || JSON.stringify(item)}</p><small>Confidence: {item.confidence || "not recorded"}</small></article>) : <p className="empty-copy">No agent inference was proposed.</p>}</div>}
                  {inspectTab === "actions" && <div className="artifact-view"><p className="eyebrow">Proposed actions</p><h2>Would these help the operator?</h2>{run.actions.length ? run.actions.map((item, index) => <article key={item.action_id || index}><header><code>{item.action_id || `action-${index + 1}`}</code><span>{item.requires_approval ? "Approval required" : "No approval flag"}</span></header><h3>{item.action_text || item.text || "Unlabelled action"}</h3><p>{item.rationale || "No rationale recorded."}</p><small>Owner: {item.suggested_owner || "not assigned"} · Risk: {item.risk_level || "not recorded"}</small></article>) : <p className="empty-copy">No actions were proposed.</p>}<label className="reviewed-toggle"><input type="checkbox" disabled={draft.status === "reviewed"} checked={draft.actionsChecked} onChange={(event) => updateDraft({ actionsChecked: event.target.checked })} /> I checked action usefulness for this run.</label></div>}
                  {inspectTab === "memory" && <div className="artifact-view"><p className="eyebrow">Memory candidates</p><h2>Should any of this become durable memory?</h2>{run.memories.length ? run.memories.map((item, index) => <article key={item.memory_id || index}><header><code>{item.memory_id || `candidate-${index + 1}`}</code><span>{item.status || "candidate only"}</span></header><p>{item.memory_text || item.text || item.content || JSON.stringify(item)}</p></article>) : <div className="positive-empty"><ShieldCheckIcon size={24} /><div><strong>No memory was proposed.</strong><p>Absence is acceptable when the source does not contain a safe, durable fact.</p></div></div>}<label className="reviewed-toggle"><input type="checkbox" disabled={draft.status === "reviewed"} checked={draft.memoryChecked} onChange={(event) => updateDraft({ memoryChecked: event.target.checked })} /> I checked memory safety for this run.</label></div>}
                  {inspectTab === "uncertainty" && <div className="artifact-view"><p className="eyebrow">Uncertainty labels</p><h2>Did the run admit what it could not know?</h2>{run.uncertainties.length ? run.uncertainties.map((item, index) => <article key={item.uncertainty_id || index}><header><code>{item.uncertainty_id || `uncertainty-${index + 1}`}</code><span>{item.label || "unlabelled"}</span></header><p>{item.explanation || item.text || JSON.stringify(item)}</p></article>) : <p className="empty-copy">No uncertainty labels were recorded.</p>}</div>}
                </>}

                {section === "decide" && <div className="decide-summary"><p className="eyebrow">Human quality judgement</p><h2>Score the complete run once</h2><p>Finish inspecting claims, actions and memory, then use the rating panel. Automated checks cannot supply these scores.</p>{draft.parentRevisionId && <div className="revision-seed"><ClockCounterClockwiseIcon size={19} /><span>This re-review started from <code>{draft.parentRevisionId}</code>. Finishing creates a linked revision.</span></div>}<ul><li className={claimsComplete ? "complete" : ""}>{claimsComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} All {run.claims.length} claims inspected</li><li className={draft.actionsChecked ? "complete" : ""}>{draft.actionsChecked ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Action usefulness checked</li><li className={draft.memoryChecked ? "complete" : ""}>{draft.memoryChecked ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Memory safety checked</li><li className={ratingsComplete ? "complete" : ""}>{ratingsComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Five ratings completed</li></ul></div>}
              </section>

              <aside className="score-panel" data-tour="score-panel"><header><div><p className="eyebrow">Decide</p><h2>Score this run overall</h2><span>Five ratings, once per run—not per claim.</span></div><output>{scoreTotal}<small>/15</small></output></header><div className="rating-list">{RATING_ROWS.map(([key, title, help]) => <div className="rating-row" key={key}><div><strong>{title}</strong><span>{help}</span></div><RatingControl name={title} value={draft.ratings[key]} disabled={draft.status === "reviewed"} onChange={(value) => updateRating(key, value)} /></div>)}</div><div className="scale-legend">{SCALE.map(([score, label]) => <span key={score}><b>{score}</b> {label}</span>)}</div><fieldset className="decision-field"><legend>Decision</legend>{[["pass", "Pass"], ["needs_revision", "Needs revision"], ["fail", "Fail"]].map(([value, label]) => <label key={value}><input type="radio" name="decision" value={value} disabled={draft.status === "reviewed"} checked={draft.decision === value} onChange={(event) => updateDraft({ decision: event.target.value })} /><span>{label}</span></label>)}</fieldset><label className="notes-field">Corrections and notes<textarea value={draft.notes} disabled={draft.status === "reviewed"} onChange={(event) => updateDraft({ notes: event.target.value })} placeholder="Record the exact defect, missing evidence, or correction this harness should learn…" /></label><div className={`system-check ${structuralCheck.passed ? "pass" : "needs-check"}`}><ShieldCheckIcon size={21} /><div><strong>Automated structural check</strong><span>{structuralCheck.detail} This does not replace your judgement.</span></div><b>{structuralCheck.passed ? "PASS" : "CHECK"}</b></div>{saveMessage && <p className="save-message">{saveMessage}</p>}<div className="score-actions"><button type="button" className="secondary-button" disabled={draft.status === "reviewed"} onClick={() => saveDraft()}><FloppyDiskIcon size={18} /> {draft.status === "reviewed" ? "Draft saved" : "Save draft"}</button><button type="button" className="primary-button" disabled={!reviewComplete || draft.status === "reviewed"} onClick={finishReview}><CheckCircleIcon size={18} /> {draft.status === "reviewed" ? "Review saved" : "Finish review"}</button></div>{!reviewComplete && <p className="completion-hint">Complete the checklist, ratings and decision to finish.</p>}{draft.status === "reviewed" && <p className="completion-hint reviewed-hint">Use History → Re-review to create a linked revision.</p>}</aside>
            </div>
          </>
        )}

        {activePage === "files" && <FilesWorkspace run={run} onImport={importFiles} folderInputRef={folderInputRef} fileInputRef={fileInputRef} />}
        {activePage === "history" && <HistoryWorkspace history={workspaceHistory} onReReview={startReReview} />}
        {activePage === "settings" && <SettingsWorkspace workspace={workspace} reviewerName={reviewerName} onSaveWorkspace={saveWorkspace} onSaveReviewer={saveReviewer} onRestartTour={openTour} runCount={runs.length} reviewCount={workspaceHistory.length} />}
      </section>

      {showWorkspaceModal && <WorkspaceModal onClose={() => setShowWorkspaceModal(false)} onCreate={createWorkspace} />}
      <GuidedTour open={tourOpen} step={tourStep} onStep={setTourStep} onClose={closeTour} onNavigate={navigateForTour} />
    </main>
  );
}
