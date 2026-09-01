import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { BookOpenIcon } from "@phosphor-icons/react/BookOpen";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { CheckIcon } from "@phosphor-icons/react/Check";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/ClockCounterClockwise";
import { ClockIcon } from "@phosphor-icons/react/Clock";
import { ArchiveIcon } from "@phosphor-icons/react/Archive";
import { BracketsCurlyIcon } from "@phosphor-icons/react/BracketsCurly";
import { ChartBarIcon } from "@phosphor-icons/react/ChartBar";
import { DatabaseIcon } from "@phosphor-icons/react/Database";
import { FileArrowUpIcon } from "@phosphor-icons/react/FileArrowUp";
import { FilesIcon } from "@phosphor-icons/react/Files";
import { FloppyDiskIcon } from "@phosphor-icons/react/FloppyDisk";
import { FolderIcon } from "@phosphor-icons/react/Folder";
import { FolderOpenIcon } from "@phosphor-icons/react/FolderOpen";
import { GaugeIcon } from "@phosphor-icons/react/Gauge";
import { GearSixIcon } from "@phosphor-icons/react/GearSix";
import { GraduationCapIcon } from "@phosphor-icons/react/GraduationCap";
import { GitDiffIcon } from "@phosphor-icons/react/GitDiff";
import { InfoIcon } from "@phosphor-icons/react/Info";
import { ListIcon } from "@phosphor-icons/react/List";
import { LockIcon } from "@phosphor-icons/react/Lock";
import { MoonIcon } from "@phosphor-icons/react/Moon";
import { PlusIcon } from "@phosphor-icons/react/Plus";
import { PlayIcon } from "@phosphor-icons/react/Play";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";
import { SidebarSimpleIcon } from "@phosphor-icons/react/SidebarSimple";
import { SquaresFourIcon } from "@phosphor-icons/react/SquaresFour";
import { SunIcon } from "@phosphor-icons/react/Sun";
import { TargetIcon } from "@phosphor-icons/react/Target";
import { TrashIcon } from "@phosphor-icons/react/Trash";
import { XIcon } from "@phosphor-icons/react/X";
import {
  appendReviewRevision,
  archiveWorkspaceDefinition,
  BUILT_IN_WORKSPACE,
  createWorkspaceDefinition,
  createSessionEvaluationPack,
  createReviewRevision,
  emptyDraft,
  findEvidence,
  loadDemoRuns,
  loadDraft,
  loadLegacyImportedRuns,
  loadReviewHistory,
  loadWorkspaceDefinitions,
  parseRunFolderFiles,
  persistDraft,
  persistWorkspaceDefinitions,
  removeReviewHistoryForProject,
  RATING_DEFINITIONS,
  reviewCompletionState,
  reviewStateForRun,
  restoreWorkspaceDefinition,
  SCORE_SCALE,
  validateRunBundle,
} from "./data.js";
import { loadStoredRuns, removeProjectRuns, storeImportedRuns } from "./storage.js";
import { FilesWorkspace } from "./FilesWorkspace.jsx";
import { GuidedTour } from "./Tour.jsx";
import { HistoryWorkspace } from "./HistoryWorkspace.jsx";
import { LearnWorkspace } from "./LearnWorkspace.jsx";
import { OverviewWorkspace } from "./OverviewWorkspace.jsx";
import { SettingsWorkspace } from "./SettingsWorkspace.jsx";
import {
  CompareWorkspace,
  DatasetsWorkspace,
  InsightsWorkspace,
  RunConsoleWorkspace,
  SystemsWorkspace,
} from "./WorkbenchWorkspace.jsx";
import {
  CLAIM_LABELS,
  createExperimentRecord,
  loadWorkbenchConfiguration,
  persistWorkbenchConfiguration,
  removeWorkbenchConfiguration,
  runBrowserDeterministicCase,
} from "./workbench.js";

const SELECTED_WORKSPACE_KEY = "agent-review-studio-selected-workspace-v1";
const REVIEWER_KEY = "agent-review-studio-reviewer-v1";
const TOUR_KEY = "agent-review-studio-tour-complete-v1";
const THEME_KEY = "agent-review-studio-theme-v1";
const SIDEBAR_KEY = "agent-review-studio-sidebar-collapsed-v1";

const INSPECT_TABS = [["claims", "Claims"], ["source", "Source card"], ["actions", "Actions"], ["memory", "Memory"], ["uncertainty", "Uncertainty"], ["trace", "Run log"]];
const APP_PAGES = [
  ["overview", "Overview", SquaresFourIcon],
  ["run", "Run", PlayIcon],
  ["review", "Review", TargetIcon],
  ["datasets", "Datasets", DatabaseIcon],
  ["compare", "Compare", GitDiffIcon],
  ["insights", "Insights", ChartBarIcon],
  ["files", "Files", FilesIcon],
  ["history", "History", ClockCounterClockwiseIcon],
  ["systems", "Systems", BracketsCurlyIcon],
  ["learn", "Learn", GraduationCapIcon],
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

function downloadJson(record, filename) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function Modal({ title, children, onClose, className = "" }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header"><h2>{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><XIcon size={20} /></button></header>
        {children}
      </section>
    </div>
  );
}

function WorkspaceModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [evaluationGoal, setEvaluationGoal] = useState("custom");
  return (
    <Modal title="Create evaluation workspace" onClose={onClose}>
      <div className="project-form">
        <p>Workspaces keep one agent, harness or service and its review history together.</p>
        <label>Workspace name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Support Agent QA" /></label>
        <label>Agent or harness name<input value={agentName} onChange={(event) => setAgentName(event.target.value)} placeholder="Example: Returns assistant" /></label>
        <label>What are you building it toward?<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Example: Reliably answer return-policy questions from approved support documents, then escalate uncertain cases." /></label>
        <label>Primary evaluation goal<select value={evaluationGoal} onChange={(event) => setEvaluationGoal(event.target.value)}><option value="evidence">Evidence and factuality</option><option value="reliability">Reliability and consistency</option><option value="tool_use">Tool use and actions</option><option value="workflow">Workflow completion</option><option value="safety">Safety and approvals</option><option value="custom">Custom objective</option></select></label>
      </div>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="button" className="primary-button" disabled={!name.trim() || !description.trim()} onClick={() => onCreate(name.trim(), agentName.trim() || name.trim(), description.trim(), evaluationGoal)}>Create workspace</button></div>
    </Modal>
  );
}

function DeleteWorkspaceModal({ workspace, runCount, reviewCount, onClose, onConfirm }) {
  const [confirmation, setConfirmation] = useState("");
  const matches = confirmation.trim() === workspace.name;
  return <Modal title="Delete archived workspace" onClose={onClose}>
    <div className="delete-workspace-warning"><TrashIcon size={28} /><div><strong>This permanently deletes local evaluation data.</strong><p>{workspace.name} contains {runCount} run{runCount === 1 ? "" : "s"} and {reviewCount} review revision{reviewCount === 1 ? "" : "s"}. Archive is reversible; deletion is not.</p></div></div>
    <div className="project-form"><label>Type <strong>{workspace.name}</strong> to confirm<input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label></div>
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Keep workspace</button><button type="button" className="danger-button" disabled={!matches} onClick={onConfirm}><TrashIcon size={17} /> Delete permanently</button></div>
  </Modal>;
}

function RubricModal({ onClose }) {
  return (
    <Modal title="0–3 operator scoring rubric" onClose={onClose} className="modal-wide">
      <div className="rubric-intro">
        <p>Give five ratings once per complete run. Use the evidence bundle—not polish or personal preference—as the scoring basis.</p>
        <div className="rubric-scale">{SCORE_SCALE.map(([score, label]) => <span key={score}><b>{score}</b><strong>{label}</strong></span>)}</div>
      </div>
      <div className="rubric-table">
        {RATING_DEFINITIONS.map((rating) => (
          <article key={rating.key}>
            <header><strong>{rating.label}</strong><span>{rating.help}</span></header>
            <div>{rating.anchors.map((anchor, score) => <p key={anchor}><b>{score}</b><span>{anchor}</span></p>)}</div>
          </article>
        ))}
      </div>
      <div className="rubric-decision-guide"><strong>Decision rule</strong><p>Pass means usable as-is. Needs revision means the run is recoverable but requires a recorded correction. Fail means the output is unsafe or unusable. Notes are required for Needs revision and Fail.</p></div>
      <div className="modal-actions"><button type="button" className="primary-button" onClick={onClose}>Use this rubric</button></div>
    </Modal>
  );
}

function RatingControl({ value, onChange, name, disabled = false }) {
  return (
    <div className="rating-control" role="group" aria-label={`${name} score`}>
      {SCORE_SCALE.map(([score, label]) => <button key={score} type="button" disabled={disabled} className={value === score ? "selected" : ""} onClick={() => onChange(score)} title={`${score} — ${label}`} aria-pressed={value === score}>{score}</button>)}
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
  const [workspaces, setWorkspaces] = useState(loadWorkspaceDefinitions);
  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem(SELECTED_WORKSPACE_KEY) || BUILT_IN_WORKSPACE.id);
  const [projectRuns, setProjectRuns] = useState({ [BUILT_IN_WORKSPACE.id]: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [runIndex, setRunIndex] = useState(0);
  const [activePage, setActivePage] = useState("overview");
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
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === "yes");
  const [deleteCandidateId, setDeleteCandidateId] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark");
  const [fileFocus, setFileFocus] = useState({ fileName: "", line: null });
  const [workbenchConfiguration, setWorkbenchConfiguration] = useState(() => loadWorkbenchConfiguration(BUILT_IN_WORKSPACE.id, BUILT_IN_WORKSPACE, []));
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "yes" : "no"); }, [sidebarCollapsed]);

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
  const activeWorkspaces = workspaces.filter((item) => !item.archivedAt);
  const archivedWorkspaces = workspaces.filter((item) => item.archivedAt);

  useEffect(() => {
    if (loading) return;
    setWorkbenchConfiguration(loadWorkbenchConfiguration(selectedProjectId, workspace, runs));
  }, [loading, selectedProjectId]);

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
  const claimJudgment = claim ? (draft.claimJudgments?.[claim.claim_id] || { labels: [], correction: "" }) : { labels: [], correction: "" };
  const claimNeedsCorrection = CLAIM_LABELS.some((label) => label.needsCorrection && claimJudgment.labels?.includes(label.id));
  const inspected = new Set(draft.inspectedClaims || []);
  const completion = useMemo(() => reviewCompletionState(run, draft), [run, draft]);
  const { ratingsComplete, claimsComplete, artifactsComplete, complete: reviewComplete } = completion;
  const diagnostics = useMemo(() => validateRunBundle(run), [run]);
  const scoreTotal = useMemo(() => RATING_DEFINITIONS.reduce((sum, { key }) => sum + (Number.isInteger(draft.ratings[key]) ? draft.ratings[key] : 0), 0), [draft.ratings]);

  const navigateForTour = useCallback((page, target) => {
    setActivePage(page);
    setMobileNavOpen(target === "imports" || target === "runs");
  }, []);

  function updateDraft(patch) {
    setDraft((current) => current.status === "reviewed" ? current : ({ ...current, ...patch, status: "draft" }));
    setSaveMessage("");
  }

  function updateRating(key, value) {
    updateDraft({ ratings: { ...draft.ratings, [key]: value } });
  }

  function updateClaimJudgment(item, patch) {
    if (!item || draft.status === "reviewed") return;
    const current = draft.claimJudgments?.[item.claim_id] || { labels: [], correction: "" };
    const next = { ...current, ...patch };
    const nextJudgments = { ...(draft.claimJudgments || {}), [item.claim_id]: next };
    const inspectedClaims = Object.entries(nextJudgments)
      .filter(([, judgment]) => Array.isArray(judgment.labels) && judgment.labels.length > 0)
      .map(([claimId]) => claimId);
    updateDraft({ claimJudgments: nextJudgments, inspectedClaims });
  }

  function toggleClaimLabel(item, labelId) {
    if (!item) return;
    const current = draft.claimJudgments?.[item.claim_id] || { labels: [], correction: "" };
    const labels = current.labels?.includes(labelId)
      ? current.labels.filter((value) => value !== labelId)
      : [...(current.labels || []), labelId];
    updateClaimJudgment(item, { labels });
  }

  function goToClaim(nextIndex) {
    setClaimIndex(Math.max(0, Math.min(nextIndex, Math.max(0, run.claims.length - 1))));
  }

  function changeInspectTab(next) {
    setInspectTab(next);
    setSection("inspect");
  }

  function saveDraft(status = "draft") {
    if (!run) return;
    const saved = persistDraft(run.id, { ...draft, status });
    setDraft(saved);
    setSaveMessage(status === "reviewed" ? "Reviewed example saved locally and exported for improvement work." : "Draft saved locally.");
  }

  function finishReview() {
    if (!reviewComplete || !run) return;
    const completedDraft = persistDraft(run.id, { ...draft, status: "reviewed" });
    const revision = createReviewRevision({ projectId: selectedProjectId, workspaceName: workspace.name, agentName: workspace.agentName, reviewerName, run, draft: completedDraft, scoreTotal });
    appendReviewRevision(revision);
    setDraft(completedDraft);
    setReviewHistory(loadReviewHistory());
    setSaveMessage("Reviewed example saved locally and exported for improvement work.");
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
      setActivePage("overview");
      setSaveMessage(`Saved a new dated session with ${imported.length} run bundle${imported.length === 1 ? "" : "s"} and every selected file.`);
      setMobileNavOpen(false);
    } catch (error) {
      setSaveMessage(error.message || "The selected files could not be imported.");
    } finally {
      event.target.value = "";
    }
  }

  function openRun(index) {
    setRunIndex(index);
    setActivePage("review");
    setSaveMessage("");
    setMobileNavOpen(false);
  }

  function exportSession(session) {
    if (!session) return;
    const sessionRuns = runs.filter((item) => item.sessionId === session.id);
    const drafts = Object.fromEntries(sessionRuns.map((item) => [item.id, loadDraft(item.id)]));
    const pack = createSessionEvaluationPack({
      projectId: selectedProjectId,
      workspaceName: workspace.name,
      agentName: workspace.agentName,
      reviewerName,
      session,
      runs: sessionRuns,
      history: workspaceHistory,
      drafts,
    });
    const safeSession = String(session.label || session.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    downloadJson(pack, `${safeSession || "evaluation-session"}-evaluation-pack.json`);
    setSaveMessage(`Exported ${pack.summary.reviewed_runs}/${pack.summary.total_runs} finished reviews with deterministic bundle diagnostics.`);
  }

  function createWorkspace(name, agentName, description, evaluationGoal) {
    const project = createWorkspaceDefinition(name, agentName, { description, evaluationGoal });
    const next = [...workspaces, project];
    persistWorkspaceDefinitions(next);
    setWorkspaces(next);
    setProjectRuns((current) => ({ ...current, [project.id]: [] }));
    setSelectedProjectId(project.id);
    setActivePage("overview");
    setShowWorkspaceModal(false);
  }

  function saveWorkspace(updated) {
    const next = workspaces.map((item) => item.id === updated.id ? updated : item);
    persistWorkspaceDefinitions(next);
    setWorkspaces(next);
  }

  function openClaimSource() {
    const line = Number(String(claim?.source_location || "").match(/\d+/)?.[0]) || null;
    setFileFocus({ fileName: "original_source.md", line });
    setActivePage("files");
  }

  function updateWorkbenchConfiguration(next) {
    const value = typeof next === "function" ? next(workbenchConfiguration) : next;
    persistWorkbenchConfiguration(selectedProjectId, value);
    setWorkbenchConfiguration(value);
    return value;
  }

  async function runEvaluation({ dataset, testCase, harness, version, runnerMode }) {
    if (runnerMode === "import_only") throw new Error("Use Import run folder for an import-only execution.");
    let generatedRun;
    if (runnerMode === "chaser_bridge") {
      const response = await fetch("http://127.0.0.1:4318/v1/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: selectedProjectId, workspace, dataset, testCase, harness, version }),
      });
      if (!response.ok) throw new Error(`The local Chaser bridge returned ${response.status}. Start it with npm run runner.`);
      generatedRun = await response.json();
    } else {
      generatedRun = runBrowserDeterministicCase({
        workspaceId: selectedProjectId,
        workspaceName: workspace.name,
        agentName: workspace.agentName,
        dataset,
        testCase,
        harness,
        version,
        profile: version.profile,
      });
    }
    const existing = projectRuns[selectedProjectId] || [];
    await storeImportedRuns(selectedProjectId, [generatedRun]);
    setProjectRuns((current) => ({ ...current, [selectedProjectId]: [...(current[selectedProjectId] || []), generatedRun] }));
    const experiment = createExperimentRecord({ datasetId: dataset.id, testCaseId: testCase.id, harnessId: harness.id, versionId: version.id, runnerMode, run: generatedRun });
    updateWorkbenchConfiguration({ ...workbenchConfiguration, experiments: [experiment, ...workbenchConfiguration.experiments] });
    setRunIndex(existing.length);
    setActivePage("review");
    setSection("understand");
    setSaveMessage("A new immutable run was created. Read the task boundary, then classify each claim candidate.");
    return generatedRun;
  }

  function archiveWorkspace(workspaceId) {
    const target = workspaces.find((item) => item.id === workspaceId);
    if (!target) return;
    try {
      const updated = archiveWorkspaceDefinition(target);
      const next = workspaces.map((item) => item.id === workspaceId ? updated : item);
      persistWorkspaceDefinitions(next);
      setWorkspaces(next);
      if (selectedProjectId === workspaceId) setSelectedProjectId(next.find((item) => !item.archivedAt)?.id || BUILT_IN_WORKSPACE.id);
      setSaveMessage(`${target.name} was archived. Its runs and reviews remain available.`);
    } catch (error) {
      setSaveMessage(error.message);
    }
  }

  function restoreWorkspace(workspaceId) {
    const target = workspaces.find((item) => item.id === workspaceId);
    if (!target) return;
    const next = workspaces.map((item) => item.id === workspaceId ? restoreWorkspaceDefinition(item) : item);
    persistWorkspaceDefinitions(next);
    setWorkspaces(next);
    setSelectedProjectId(workspaceId);
    setSaveMessage(`${target.name} was restored.`);
  }

  async function deleteWorkspace(workspaceId) {
    const target = workspaces.find((item) => item.id === workspaceId);
    if (!target || target.kind === "built-in" || !target.archivedAt) {
      setSaveMessage("Only an archived local workspace can be permanently deleted.");
      return;
    }
    await removeProjectRuns(workspaceId);
    removeReviewHistoryForProject(workspaceId);
    removeWorkbenchConfiguration(workspaceId);
    const next = workspaces.filter((item) => item.id !== workspaceId);
    persistWorkspaceDefinitions(next);
    setWorkspaces(next);
    setProjectRuns((current) => { const copy = { ...current }; delete copy[workspaceId]; return copy; });
    setReviewHistory(loadReviewHistory());
    setSelectedProjectId(next.find((item) => !item.archivedAt)?.id || BUILT_IN_WORKSPACE.id);
    setDeleteCandidateId("");
    setSaveMessage(`${target.name} was removed from this browser.`);
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
    setMobileNavOpen(false);
  }

  if (loading) return <main className="loading-screen"><GaugeIcon size={46} weight="duotone" /><p>Preparing Agent Review Studio…</p></main>;

  return (
    <main className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`} data-theme={theme}>
      <input ref={folderInputRef} type="file" multiple webkitdirectory="true" directory="true" hidden onChange={importFiles} />
      <input ref={fileInputRef} type="file" multiple hidden onChange={importFiles} />

      <header className="topbar">
        <div className="brand"><span className="brand-mark"><img src="/assets/agent-review-studio-mark.png" alt="" /></span><strong><span>AGENT REVIEW STUDIO</span><small>REVIEW · LABEL · IMPROVE</small></strong></div>
        <div className="top-context">
          <label className="workspace-switcher" data-tour="workspace-switcher"><span>Workspace</span><select aria-label="Switch evaluation workspace" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>{activeWorkspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <div><span>Agent / harness</span><strong>{workspace.agentName}</strong></div>
          <div><span>Session</span><strong>{run?.sessionLabel || "No session selected"}</strong></div>
          {run && <div className="run-progress"><span>Run {activeSessionRunIndex + 1} of {activeSessionRuns.length}</span><div>{activeSessionRuns.map((item, index) => <i key={item.id} className={index === activeSessionRunIndex ? "active" : ""} />)}</div></div>}
        </div>
        <button type="button" className="mobile-nav-button" aria-label="Browse workspace" onClick={() => setMobileNavOpen(true)}><ListIcon size={19} /><span>Browse</span></button>
        <button type="button" className="theme-button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}>{theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}<span>{theme === "dark" ? "Light" : "Dark"}</span></button>
        <button type="button" className="guide-button" aria-label="Open guided tour" onClick={openTour}><BookOpenIcon size={18} /><span>Guided tour</span></button>
      </header>

      {mobileNavOpen && <button type="button" className="sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close workspace navigation" />}
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-mobile-header"><strong>Browse workspace</strong><button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close workspace navigation"><XIcon size={19} /></button></div>
        <section>
          <div className="sidebar-heading"><span>Workspaces</span><button type="button" data-tour="new-workspace" onClick={() => { setShowWorkspaceModal(true); setMobileNavOpen(false); }} aria-label="New workspace"><PlusIcon size={16} /></button></div>
          <nav className="project-list" aria-label="Evaluation workspaces">
            {activeWorkspaces.map((project) => <button type="button" key={project.id} className={project.id === selectedProjectId ? "active" : ""} onClick={() => { setSelectedProjectId(project.id); setMobileNavOpen(false); }}><FolderIcon size={17} weight={project.id === selectedProjectId ? "fill" : "regular"} /><span>{project.name}</span></button>)}
          </nav>
          {archivedWorkspaces.length > 0 && <button type="button" className="archive-shortcut" onClick={() => { setActivePage("settings"); setMobileNavOpen(false); }}><ArchiveIcon size={16} /><span>Archived workspaces</span><b>{archivedWorkspaces.length}</b></button>}
        </section>

        <nav className="app-nav" aria-label="Workspace sections">
          {APP_PAGES.map(([id, label, Icon]) => <button type="button" key={id} data-tour={`nav-${id}`} className={activePage === id ? "active" : ""} onClick={() => { setActivePage(id); setMobileNavOpen(false); }}><Icon size={18} /><span>{label}</span>{id === "history" && workspaceHistory.length > 0 && <b>{workspaceHistory.length}</b>}</button>)}
        </nav>

        <section className="session-section" data-tour="runs">
          <div className="sidebar-heading"><span>Sessions & runs</span><button type="button" data-tour="imports" onClick={() => folderInputRef.current?.click()} aria-label="Import run folders"><FileArrowUpIcon size={16} /></button></div>
          <div className="run-list">
            {runGroups.map((group) => <div className="run-group" key={group.id}><span className="session-label">{group.label}</span>{group.items.map(({ item, index }) => { const state = reviewStateForRun(item, workspaceHistory, loadDraft(item.id)); return <button type="button" key={item.id} className={index === runIndex && activePage === "review" ? "active" : ""} onClick={() => openRun(index)}><span className={`status-dot ${state}`} /><span><strong>{item.label} · {item.shortLabel}</strong><small>{compactProfile(item.description)}</small></span></button>; })}</div>)}
          </div>
        </section>
        <footer className="sidebar-footer"><button type="button" onClick={() => folderInputRef.current?.click()} title="Import run folder"><FileArrowUpIcon size={17} /><span>Import run folder</span></button><button type="button" className="collapse-sidebar-button" onClick={() => setSidebarCollapsed((value) => !value)} title={sidebarCollapsed ? "Expand sidebar" : "Minimise sidebar"}><SidebarSimpleIcon size={17} /><span>{sidebarCollapsed ? "Expand sidebar" : "Minimise sidebar"}</span></button><p><LockIcon size={13} /><span>Local-first · source files stay immutable</span></p></footer>
      </aside>

      <section className="workspace">
        {loadError && <p className="error-banner">{loadError}</p>}
        {saveMessage && activePage !== "review" && <p className="global-message">{saveMessage}</p>}

        {activePage === "overview" && <OverviewWorkspace workspace={workspace} runs={runs} history={workspaceHistory} onOpenRun={openRun} onImport={() => folderInputRef.current?.click()} onExportSession={exportSession} />}
        {activePage === "run" && <RunConsoleWorkspace workspace={workspace} runs={runs} configuration={workbenchConfiguration} onRun={runEvaluation} onOpenRun={openRun} />}
        {activePage === "datasets" && <DatasetsWorkspace configuration={workbenchConfiguration} onChange={updateWorkbenchConfiguration} />}
        {activePage === "compare" && <CompareWorkspace runs={runs} history={workspaceHistory} configuration={workbenchConfiguration} onConfigurationChange={updateWorkbenchConfiguration} />}
        {activePage === "insights" && <InsightsWorkspace runs={runs} history={workspaceHistory} configuration={workbenchConfiguration} onConfigurationChange={updateWorkbenchConfiguration} />}
        {activePage === "systems" && <SystemsWorkspace />}
        {activePage === "learn" && <LearnWorkspace workspace={workspace} onOpenRun={() => setActivePage("run")} />}

        {activePage === "review" && !run && <EmptyProject onFolderImport={() => folderInputRef.current?.click()} onFileImport={() => fileInputRef.current?.click()} />}
        {activePage === "review" && run && (
          <>
            <section className="explain-strip">
              <span className="explain-icon"><TargetIcon size={30} weight="duotone" /></span>
              <div><strong>What am I doing?</strong><p>Compare the agent’s work with its evidence, then label what was correct, weak, missing or unsafe.</p></div>
              <div><strong>What does this create?</strong><p>A trusted example you can use to improve prompts, tools, retrieval, memory rules and workflows—or select as a candidate for a governed training dataset.</p></div>
            </section>

            <nav className="workflow-steps" aria-label="Review progress">
              {[
                ["understand", 1, "Understand the task", "Know the goal and boundaries", true],
                ["inspect", 2, "Verify the agent’s work", "Check outputs against evidence", artifactsComplete],
                ["decide", 3, "Label and score the run", "Five ratings + a final decision", ratingsComplete && Boolean(draft.decision)],
                ["save", 4, "Save an improvement example", "Export a reusable review record", draft.status === "reviewed"],
              ].map(([id, number, title, helper, complete]) => <button type="button" key={id} className={`${(id === "save" ? section === "decide" && reviewComplete : section === id) || (id === "save" && draft.status === "reviewed") ? "active" : ""} ${complete ? "complete" : ""}`} onClick={() => setSection(id === "save" ? "decide" : id)}><span>{complete ? <CheckIcon size={15} /> : number}</span><div><strong>{title}</strong><small>{helper}</small></div></button>)}
            </nav>

            <div className="review-layout" data-tour="review-workspace">
              <section className="review-main">
                <nav className="section-tabs"><button type="button" className={section === "understand" ? "active" : ""} onClick={() => setSection("understand")}>Understand</button><button type="button" className={section === "inspect" ? "active" : ""} onClick={() => setSection("inspect")}>Inspect</button><button type="button" className={section === "decide" ? "active" : ""} onClick={() => setSection("decide")}>Decide</button></nav>

                {section === "understand" && <div className="understand-view"><p className="eyebrow">Run purpose</p><h1>{run.sourceTitle}</h1><p className="lead">{run.sourceSummary}</p><dl className="provenance-grid"><div><dt>Source ID</dt><dd>{run.sourceId}</dd></div><div><dt>Workflow profile</dt><dd>{compactProfile(run.workflowProfile)}</dd></div><div><dt>Created</dt><dd>{formatDate(run.createdAt)}</dd></div><div><dt>Imported files</dt><dd>{run.files.length}</dd></div></dl><div className="boundary-note"><ShieldCheckIcon size={22} /><div><strong>Review boundary</strong><p>You may score, annotate, export and create a new revision. Source artifacts remain immutable, and no external action or memory promotion is authorized.</p></div></div><label className="reviewed-toggle artifact-confirmation"><input type="checkbox" disabled={draft.status === "reviewed"} checked={draft.contractChecked} onChange={(event) => updateDraft({ contractChecked: event.target.checked })} /> I read the human review contract and understand this run's approval boundary.</label><button type="button" className="primary-button" onClick={() => setSection("inspect")}>Start evidence review <ArrowRightIcon size={17} /></button></div>}

                {section === "inspect" && <>
                  <div className="inspect-toolbar"><div className="inspect-tabs">{INSPECT_TABS.map(([id, label]) => <button type="button" key={id} className={inspectTab === id ? "active" : ""} onClick={() => changeInspectTab(id)}>{label}{id === "claims" && <span>{inspected.size}/{run.claims.length}</span>}{id === "actions" && <span>{run.actions.length}</span>}{id === "memory" && <span>{run.memories.length}</span>}</button>)}</div><button type="button" className="raw-link" onClick={() => setActivePage("files")}><FilesIcon size={16} /> Open all files</button></div>

                  {inspectTab === "claims" && <div className="claims-view">
                    {run.claims.length ? <>
                      <div className="claim-nav"><span>Claim {claimIndex + 1} of {run.claims.length}</span><div><button type="button" disabled={claimIndex === 0} onClick={() => goToClaim(claimIndex - 1)}><ArrowLeftIcon size={16} /> Previous</button><button type="button" disabled={claimIndex === run.claims.length - 1} onClick={() => goToClaim(claimIndex + 1)}>Next <ArrowRightIcon size={16} /></button></div></div>
                      <div className="evidence-pair">
                        <article className="claim-pane">
                          <header><span>Extracted claim candidate</span><code>{claim?.claim_id}</code></header>
                          <blockquote>{claim?.claim_text}</blockquote>
                          <dl><div><dt>Extractor type</dt><dd>{claim?.claim_type || "not classified"}</dd></div><div><dt>Extraction confidence</dt><dd>{claim?.extraction_confidence || claim?.confidence || "not recorded"}</dd></div><div><dt>Source location</dt><dd>{claim?.source_location || "not recorded"}</dd></div></dl>
                          <p className="confidence-explainer"><InfoIcon size={16} /> Extraction confidence means the parser is confident it copied a candidate—not that the statement is true, relevant, or useful.</p>
                          {claim?.review_note && <p className="review-note"><InfoIcon size={16} /> {claim.review_note}</p>}
                          <div className="linked-actions"><strong>Linked actions <span>{run.actions.filter((item) => !item.source_claim_ids || item.source_claim_ids.includes(claim?.claim_id)).length}</span></strong>{run.actions.filter((item) => !item.source_claim_ids || item.source_claim_ids.includes(claim?.claim_id)).slice(0, 2).map((item, index) => <div key={item.action_id || index}><code>{item.action_id || `action-${index + 1}`}</code><p>{item.action_text || item.text || "Unlabelled action"}</p><small>{item.requires_approval ? "Operator approval required" : "No approval flag"}</small></div>)}</div>
                          <a className="claim-jump" href="#claim-judgment">Next: label this candidate <ArrowRightIcon size={16} /></a>
                        </article>
                        <article className="evidence-pane">
                          <header><span>Linked source excerpt</span><span className="readonly"><LockIcon size={14} /> Immutable</span></header>
                          {evidence ? <><div className="source-id"><FilesIcon size={18} /><span><strong>{run.sourceMetadata.title || run.sourceTitle}</strong><small>{evidence.source_location}</small></span><code>{evidence.snippet_id}</code></div>{evidence.context_before && <p className="source-context"><span>Before</span>{evidence.context_before}</p>}<blockquote>{evidence.text}</blockquote>{evidence.context_after && <p className="source-context"><span>After</span>{evidence.context_after}</p>}<div className="source-actions">{run.sourceMetadata?.url && <a href={run.sourceMetadata.url} target="_blank" rel="noreferrer">Open primary source ↗</a>}<button type="button" onClick={openClaimSource}>Open local source at {evidence.source_location || "linked line"}</button></div><p className="privacy"><ShieldCheckIcon size={15} /> Privacy: {evidence.privacy_class || "not recorded"}</p><dl className="source-provenance"><div><dt>Captured</dt><dd>{formatDate(run.createdAt)}</dd></div><div><dt>Published</dt><dd>{run.sourceMetadata.published || "not recorded"}</dd></div><div><dt>Authors</dt><dd>{run.sourceMetadata.authors || "not recorded"}</dd></div><div><dt>Source origin</dt><dd>{run.sourceOrigin || "not recorded"}</dd></div></dl></> : <div className="missing-evidence"><InfoIcon size={22} /><div><strong>No linked evidence found</strong><p>This candidate needs an Unsupported label and a correction before acceptance.</p></div></div>}
                        </article>
                      </div>
                      <section className="claim-judgment" id="claim-judgment" tabIndex="-1" data-tour="claim-labels">
                        <header><div><strong>What is your judgment?</strong><span>Choose every label that applies. This is the human ground truth for this candidate.</span></div><b>{claimJudgment.labels?.length || 0} selected</b></header>
                        <div className="claim-label-grid">{CLAIM_LABELS.map((label) => <button type="button" key={label.id} disabled={draft.status === "reviewed"} className={`${label.tone} ${claimJudgment.labels?.includes(label.id) ? "selected" : ""}`} aria-pressed={claimJudgment.labels?.includes(label.id)} onClick={() => toggleClaimLabel(claim, label.id)}>{claimJudgment.labels?.includes(label.id) && <CheckIcon size={14} />}{label.label}</button>)}</div>
                        <label className={claimNeedsCorrection ? "required" : ""}>Correction or better classification {claimNeedsCorrection && <em>Required for the selected issue</em>}<textarea disabled={draft.status === "reviewed"} value={claimJudgment.correction || ""} onChange={(event) => updateClaimJudgment(claim, { correction: event.target.value })} placeholder="Write the corrected claim, missing context, or why this candidate should be removed." /></label>
                        <p><LockIcon size={14} /> Finishing the review saves this judgment in a new immutable revision. Editing a draft does not change the source run.</p>
                      </section>
                      <div className="claim-checklist"><div><strong>Claim classification progress</strong><span>{inspected.size} of {run.claims.length} labelled</span></div><div className="claim-dots">{run.claims.map((item, index) => <button type="button" key={item.claim_id} className={`${index === claimIndex ? "current" : ""} ${inspected.has(item.claim_id) ? "done" : ""}`} onClick={() => setClaimIndex(index)}>{inspected.has(item.claim_id) ? <CheckIcon size={13} /> : index + 1}</button>)}</div><span className={`classification-state ${inspected.has(claim?.claim_id) ? "checked" : ""}`}>{inspected.has(claim?.claim_id) ? <><CheckCircleIcon size={18} weight="fill" /> Candidate classified</> : "Select at least one label above"}</span></div>
                    </> : <div className="artifact-empty"><InfoIcon size={28} /><h2>No normalized claims were detected</h2><p>Use the Files workspace to inspect the imported bundle. Add a recognized claims table when this run should enter the paired evidence-review flow.</p><button type="button" className="secondary-button" onClick={() => setActivePage("files")}>Open Files</button></div>}
                  </div>}

                  {inspectTab === "source" && <div className="artifact-view"><p className="eyebrow">Source card</p><h2>{run.sourceTitle}</h2><p className="lead">{run.sourceSummary}</p><h3>Separated agent inference</h3>{run.inferences.length ? run.inferences.map((item, index) => <article key={item.inference_id || index}><code>{item.inference_id || `inference-${index + 1}`}</code><p>{item.inference_text || item.text || JSON.stringify(item)}</p><small>Confidence: {item.confidence || "not recorded"}</small></article>) : <p className="empty-copy">No agent inference was proposed.</p>}<label className="reviewed-toggle"><input type="checkbox" disabled={draft.status === "reviewed"} checked={draft.sourceChecked} onChange={(event) => updateDraft({ sourceChecked: event.target.checked })} /> I checked the source card and inference separation.</label></div>}
                  {inspectTab === "actions" && <div className="artifact-view"><p className="eyebrow">Proposed actions</p><h2>Would these help the operator?</h2>{run.actions.length ? run.actions.map((item, index) => <article key={item.action_id || index}><header><code>{item.action_id || `action-${index + 1}`}</code><span>{item.requires_approval ? "Approval required" : "No approval flag"}</span></header><h3>{item.action_text || item.text || "Unlabelled action"}</h3><p>{item.rationale || "No rationale recorded."}</p><small>Owner: {item.suggested_owner || "not assigned"} · Risk: {item.risk_level || "not recorded"}</small></article>) : <p className="empty-copy">No actions were proposed.</p>}<label className="reviewed-toggle"><input type="checkbox" disabled={draft.status === "reviewed"} checked={draft.actionsChecked} onChange={(event) => updateDraft({ actionsChecked: event.target.checked })} /> I checked action usefulness for this run.</label></div>}
                  {inspectTab === "memory" && <div className="artifact-view"><p className="eyebrow">Memory candidates</p><h2>Should any of this become durable memory?</h2>{run.memories.length ? run.memories.map((item, index) => <article key={item.memory_id || index}><header><code>{item.memory_id || `candidate-${index + 1}`}</code><span>{item.status || "candidate only"}</span></header><p>{item.memory_text || item.text || item.content || JSON.stringify(item)}</p></article>) : <div className="positive-empty"><ShieldCheckIcon size={24} /><div><strong>No memory was proposed.</strong><p>Absence is acceptable when the source does not contain a safe, durable fact.</p></div></div>}<label className="reviewed-toggle"><input type="checkbox" disabled={draft.status === "reviewed"} checked={draft.memoryChecked} onChange={(event) => updateDraft({ memoryChecked: event.target.checked })} /> I checked memory safety for this run.</label></div>}
                  {inspectTab === "uncertainty" && <div className="artifact-view"><p className="eyebrow">Uncertainty labels</p><h2>Did the run admit what it could not know?</h2>{run.uncertainties.length ? run.uncertainties.map((item, index) => <article key={item.uncertainty_id || index}><header><code>{item.uncertainty_id || `uncertainty-${index + 1}`}</code><span>{item.label || "unlabelled"}</span></header><p>{item.explanation || item.text || JSON.stringify(item)}</p></article>) : <p className="empty-copy">No uncertainty labels were recorded.</p>}<label className="reviewed-toggle"><input type="checkbox" disabled={draft.status === "reviewed"} checked={draft.uncertaintyChecked} onChange={(event) => updateDraft({ uncertaintyChecked: event.target.checked })} /> I checked uncertainty coverage and limitation honesty.</label></div>}
                  {inspectTab === "trace" && <div className="artifact-view"><p className="eyebrow">Run log / execution trace</p><h2>What actually ran, and what remained blocked?</h2>{Array.isArray(run.runLog.trace_steps) && run.runLog.trace_steps.length ? <ol className="trace-tree">{run.runLog.trace_steps.map((step, index) => <li key={step.id || index}><span>{index + 1}</span><div><strong>{step.name || step.id}</strong><p>{step.status || "status not recorded"}{Number.isFinite(step.duration_ms) ? ` · ${step.duration_ms} ms` : ""}</p>{Number.isFinite(step.output_count) && <small>{step.output_count} outputs</small>}</div></li>)}</ol> : <p className="legacy-trace"><InfoIcon size={18} /> This imported legacy run contains only a summary log. A full trace cannot be reconstructed after execution.</p>}<div className="trace-summary"><article><header><span>Command</span></header><p>{run.runLog.command || "No command was recorded."}</p></article><article><header><span>External/provider activity</span></header><p>Provider calls: {run.runLog.provider_calls || run.runLog.external_api_calls || "not recorded"}</p><p>Browser/computer use: {run.runLog.browser_or_computer_use || "not recorded"}</p><p>Training: {run.runLog.fine_tuning_or_training || "not recorded"}</p></article><article><header><span>Blocked boundaries</span></header>{Array.isArray(run.runLog.blocked_actions) && run.runLog.blocked_actions.length ? <ul>{run.runLog.blocked_actions.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No blocked-action list was recorded.</p>}</article></div><label className="reviewed-toggle"><input type="checkbox" disabled={draft.status === "reviewed"} checked={draft.traceChecked} onChange={(event) => updateDraft({ traceChecked: event.target.checked })} /> I checked the full available trace, external-call state and blocked boundaries.</label></div>}
                </>}

                {section === "decide" && <div className="decide-summary"><p className="eyebrow">Human quality judgement</p><h2>Score the complete run once</h2><p>Explicitly confirm all eight canonical artifacts, then use the rating panel. Automated diagnostics cannot supply these scores.</p>{draft.parentRevisionId && <div className="revision-seed"><ClockCounterClockwiseIcon size={19} /><span>This re-review started from <code>{draft.parentRevisionId}</code>. Finishing creates a linked revision.</span></div>}<ul><li className={completion.contractComplete ? "complete" : ""}>{completion.contractComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Human review contract understood</li><li className={claimsComplete ? "complete" : ""}>{claimsComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Claims and evidence: {inspected.size}/{run.claims.length} confirmed</li><li className={completion.sourceComplete ? "complete" : ""}>{completion.sourceComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Source card and inference separation checked</li><li className={completion.actionsComplete ? "complete" : ""}>{completion.actionsComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Action candidates checked</li><li className={completion.memoryComplete ? "complete" : ""}>{completion.memoryComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Memory candidates checked</li><li className={completion.uncertaintyComplete ? "complete" : ""}>{completion.uncertaintyComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Uncertainty labels checked</li><li className={completion.traceComplete ? "complete" : ""}>{completion.traceComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Run log and blocked boundaries checked</li><li className={ratingsComplete ? "complete" : ""}>{ratingsComplete ? <CheckCircleIcon weight="fill" /> : <ClockIcon />} Five ratings completed</li></ul></div>}
              </section>

              <aside className="score-panel" data-tour="score-panel">
                <header>
                  <div><p className="eyebrow">Label & decide</p><h2>Label this run’s overall quality</h2><span>Five ratings, once per run—not per claim.</span><button type="button" className="rubric-link" onClick={() => setShowRubricModal(true)}>View the complete 0–3 rubric</button></div>
                  <output>{scoreTotal}<small>/15</small></output>
                </header>
                <div className="rating-list">{RATING_DEFINITIONS.map(({ key, label, help }) => <div className="rating-row" key={key}><div><strong>{label}</strong><span>{help}</span></div><RatingControl name={label} value={draft.ratings[key]} disabled={draft.status === "reviewed"} onChange={(value) => updateRating(key, value)} /></div>)}</div>
                <div className="scale-legend">{SCORE_SCALE.map(([score, label]) => <span key={score}><b>{score}</b> {label}</span>)}</div>
                <fieldset className="decision-field"><legend>Decision</legend>{[["pass", "Pass"], ["needs_revision", "Needs revision"], ["fail", "Fail"]].map(([value, label]) => <label key={value}><input type="radio" name="decision" value={value} disabled={draft.status === "reviewed"} checked={draft.decision === value} onChange={(event) => updateDraft({ decision: event.target.value })} /><span>{label}</span></label>)}</fieldset>
                <label className="notes-field">Corrections and notes {draft.decision && draft.decision !== "pass" && <em>Required</em>}<textarea value={draft.notes} disabled={draft.status === "reviewed"} aria-required={draft.decision !== "" && draft.decision !== "pass"} onChange={(event) => updateDraft({ notes: event.target.value })} placeholder="Describe what should stay the same, what should change, and what a better result would do." /></label>
                <div className={`system-check ${diagnostics.status === "ready" ? "pass" : "needs-check"}`}><ShieldCheckIcon size={21} /><div><strong>Deterministic bundle diagnostics</strong><span>{diagnostics.presentArtifactCount}/{diagnostics.requiredArtifactCount} canonical files · {diagnostics.errors} errors · {diagnostics.warnings} warnings. This does not replace your judgement.</span></div><b>{diagnostics.status === "ready" ? "READY" : "CHECK"}</b></div>
                {saveMessage && <p className="save-message">{saveMessage}</p>}
                <div className="score-actions"><button type="button" className="secondary-button" disabled={draft.status === "reviewed"} onClick={() => saveDraft()}><FloppyDiskIcon size={18} /> {draft.status === "reviewed" ? "Draft saved" : "Save draft"}</button><button type="button" className="primary-button" disabled={!reviewComplete || draft.status === "reviewed"} onClick={finishReview}><CheckCircleIcon size={18} /> {draft.status === "reviewed" ? "Example saved" : "Save reviewed example"}</button></div>
                {!reviewComplete && <p className="completion-hint">Complete the artifact checklist, five ratings and decision. Add notes when revision or failure is selected.</p>}
                {draft.status === "reviewed" && <><p className="completion-hint reviewed-hint">This is now a reusable improvement example. Refine the agent, run the task again, then use History → Re-review to compare the result.</p><button type="button" className="overview-return" onClick={() => setActivePage("overview")}>Return to session overview <ArrowRightIcon size={15} /></button></>}
              </aside>
            </div>
          </>
        )}

        {activePage === "files" && <FilesWorkspace run={run} onImport={importFiles} folderInputRef={folderInputRef} fileInputRef={fileInputRef} focusFileName={fileFocus.fileName} focusLine={fileFocus.line} />}
        {activePage === "history" && <HistoryWorkspace history={workspaceHistory} onReReview={startReReview} />}
        {activePage === "settings" && <SettingsWorkspace workspace={workspace} reviewerName={reviewerName} onSaveWorkspace={saveWorkspace} onSaveReviewer={saveReviewer} onRestartTour={openTour} onArchiveWorkspace={() => archiveWorkspace(workspace.id)} archivedWorkspaces={archivedWorkspaces.map((item) => ({ ...item, runCount: (projectRuns[item.id] || []).length, reviewCount: reviewHistory.filter((record) => record.project_id === item.id).length }))} onRestoreWorkspace={restoreWorkspace} onDeleteWorkspace={setDeleteCandidateId} runCount={runs.length} reviewCount={workspaceHistory.length} theme={theme} onThemeChange={setTheme} />}
      </section>

      {showWorkspaceModal && <WorkspaceModal onClose={() => setShowWorkspaceModal(false)} onCreate={createWorkspace} />}
      {deleteCandidateId && (() => { const target = workspaces.find((item) => item.id === deleteCandidateId); return target ? <DeleteWorkspaceModal workspace={target} runCount={(projectRuns[target.id] || []).length} reviewCount={reviewHistory.filter((record) => record.project_id === target.id).length} onClose={() => setDeleteCandidateId("")} onConfirm={() => deleteWorkspace(target.id)} /> : null; })()}
      {showRubricModal && <RubricModal onClose={() => setShowRubricModal(false)} />}
      <GuidedTour open={tourOpen} step={tourStep} onStep={setTourStep} onClose={closeTour} onNavigate={navigateForTour} />
    </main>
  );
}
