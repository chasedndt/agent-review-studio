import { useMemo, useState } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { BracketsCurlyIcon } from "@phosphor-icons/react/BracketsCurly";
import { ChartBarIcon } from "@phosphor-icons/react/ChartBar";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { DatabaseIcon } from "@phosphor-icons/react/Database";
import { GitBranchIcon } from "@phosphor-icons/react/GitBranch";
import { GitDiffIcon } from "@phosphor-icons/react/GitDiff";
import { LinkSimpleIcon } from "@phosphor-icons/react/LinkSimple";
import { PlayIcon } from "@phosphor-icons/react/Play";
import { PlusIcon } from "@phosphor-icons/react/Plus";
import { RocketLaunchIcon } from "@phosphor-icons/react/RocketLaunch";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";
import { TestTubeIcon } from "@phosphor-icons/react/TestTube";
import { TreeStructureIcon } from "@phosphor-icons/react/TreeStructure";
import { UsersThreeIcon } from "@phosphor-icons/react/UsersThree";
import { WarningCircleIcon } from "@phosphor-icons/react/WarningCircle";
import {
  ALGORITHM_CATALOG,
  calculateReviewerAgreement,
  compareRuns,
  createDatasetDefinition,
  createHarnessDefinition,
  createTestCase,
  evaluateCiGate,
  RUNNER_MODES,
  runAutomatedEvaluators,
} from "./workbench.js";

function PageHeader({ eyebrow, title, children, actions = null }) {
  return <header className="page-header workbench-page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{children}</p></div>{actions && <div className="page-actions">{actions}</div>}</header>;
}

function StatusBadge({ status }) {
  return <span className={`workbench-status ${status}`}>{status === "passed" || status === "ready" ? <CheckCircleIcon size={15} weight="fill" /> : <WarningCircleIcon size={15} />}{String(status || "unknown").replaceAll("-", " ")}</span>;
}

export function RunConsoleWorkspace({ workspace, runs, configuration, onRun, onOpenRun }) {
  const [datasetId, setDatasetId] = useState(configuration.datasets[0]?.id || "");
  const dataset = configuration.datasets.find((item) => item.id === datasetId) || configuration.datasets[0];
  const [caseId, setCaseId] = useState(dataset?.cases?.[0]?.id || "");
  const testCase = dataset?.cases?.find((item) => item.id === caseId) || dataset?.cases?.[0];
  const [harnessId, setHarnessId] = useState(configuration.harnesses[0]?.id || "");
  const harness = configuration.harnesses.find((item) => item.id === harnessId) || configuration.harnesses[0];
  const [versionId, setVersionId] = useState(harness?.versions?.[0]?.id || "");
  const version = harness?.versions?.find((item) => item.id === versionId) || harness?.versions?.[0];
  const [runnerMode, setRunnerMode] = useState("browser_deterministic");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function startRun() {
    if (!dataset || !testCase || !harness || !version) return;
    setRunning(true);
    setMessage("Creating a new immutable run…");
    try {
      const result = await onRun({ dataset, testCase, harness, version, runnerMode });
      setMessage(`Run created: ${result.shortLabel}. It is now in the review queue and the earlier runs are unchanged.`);
    } catch (error) {
      setMessage(error.message || "The runner could not create a run.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="workbench-page run-console" data-tour="run-console">
      <PageHeader eyebrow="Execute · trace · preserve" title="Run evaluation">
        Choose a versioned harness and dataset case, execute it through a bounded runner, then send the immutable result to review.
      </PageHeader>
      <div className="runner-layout">
        <form className="runner-card" onSubmit={(event) => { event.preventDefault(); startRun(); }}>
          <div className="runner-step"><span>1</span><div><strong>Select test data</strong><p>Datasets make the same cases repeatable across harness versions.</p></div></div>
          <div className="field-grid">
            <label>Dataset<select value={dataset?.id || ""} onChange={(event) => { const id = event.target.value; setDatasetId(id); const next = configuration.datasets.find((item) => item.id === id); setCaseId(next?.cases?.[0]?.id || ""); }}>{configuration.datasets.map((item) => <option key={item.id} value={item.id}>{item.name} · v{item.version}</option>)}</select></label>
            <label>Test case<select value={testCase?.id || ""} onChange={(event) => setCaseId(event.target.value)}>{(dataset?.cases || []).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          </div>
          {testCase && <div className="case-preview"><strong>{testCase.title}</strong><p>{testCase.expectedBehavior || "No reference behavior has been written yet."}</p><span>{testCase.privacyClass} · {testCase.tags.join(" · ") || "untagged"}</span>{testCase.sourceUrl && <a href={testCase.sourceUrl} target="_blank" rel="noreferrer"><LinkSimpleIcon size={15} /> Primary source</a>}</div>}

          <div className="runner-step"><span>2</span><div><strong>Select the system under test</strong><p>The exact harness, profile, code reference and configuration travel with the run.</p></div></div>
          <div className="field-grid">
            <label>Agent / harness<select value={harness?.id || ""} onChange={(event) => { const id = event.target.value; setHarnessId(id); const next = configuration.harnesses.find((item) => item.id === id); setVersionId(next?.versions?.[0]?.id || ""); }}>{configuration.harnesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Version<select value={version?.id || ""} onChange={(event) => setVersionId(event.target.value)}>{(harness?.versions || []).map((item) => <option key={item.id} value={item.id}>{item.label} · {item.commit}</option>)}</select></label>
          </div>

          <div className="runner-step"><span>3</span><div><strong>Choose execution boundary</strong><p>A runner creates output; the review screen never pretends that inspection executed the harness.</p></div></div>
          <div className="runner-modes" role="radiogroup" aria-label="Runner mode">{RUNNER_MODES.map((mode) => <label key={mode.id} className={runnerMode === mode.id ? "active" : ""}><input type="radio" name="runner" value={mode.id} checked={runnerMode === mode.id} onChange={() => setRunnerMode(mode.id)} /><span><strong>{mode.label}</strong><small>{mode.detail}</small></span></label>)}</div>
          {runnerMode === "chaser_bridge" && <p className="boundary-callout"><ShieldCheckIcon size={18} /> The bridge must be running locally and explicitly allow this harness, profile and source. It cannot overwrite an earlier run.</p>}
          {runnerMode === "import_only" ? <button type="button" className="primary-button" onClick={() => setMessage("Use Import run folder in the workspace header. The imported folder becomes a new dated session.")}>Show import instruction <ArrowRightIcon size={16} /></button> : <button type="submit" className="primary-button run-button" data-tour="run-execute" disabled={running || !testCase}><PlayIcon size={18} weight="fill" /> {running ? "Running…" : "Run evaluation"}</button>}
          {message && <p className="runner-message">{message}</p>}
        </form>
        <aside className="run-ledger">
          <header><GitBranchIcon size={21} /><div><h2>Immutable run ledger</h2><p>Every execution gets a new identity.</p></div></header>
          {(runs.slice().reverse().slice(0, 8)).map((run, index) => { const automated = runAutomatedEvaluators(run); return <button type="button" key={run.id} onClick={() => onOpenRun(runs.findIndex((item) => item.id === run.id))}><span className="ledger-index">{runs.length - index}</span><span><strong>{run.shortLabel}</strong><small>{run.runLog?.harness_version || run.runLog?.repo_commit || "version not recorded"}</small></span><b>{automated.score}</b></button>; })}
          {!runs.length && <p className="empty-copy">No run has been created or imported yet.</p>}
        </aside>
      </div>
    </section>
  );
}

export function DatasetsWorkspace({ configuration, onChange }) {
  const [selectedId, setSelectedId] = useState(configuration.datasets[0]?.id || "");
  const selected = configuration.datasets.find((item) => item.id === selectedId) || configuration.datasets[0];
  const [showDatasetForm, setShowDatasetForm] = useState(false);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [datasetForm, setDatasetForm] = useState({ name: "", description: "" });
  const [caseForm, setCaseForm] = useState({ title: "", sourceText: "", sourceUrl: "", expectedBehavior: "", tags: "" });
  const [harnessForm, setHarnessForm] = useState({ name: "" });
  const [versionForm, setVersionForm] = useState({ harnessId: configuration.harnesses[0]?.id || "", label: "", commit: "", profile: "general_source_review" });

  function addDataset(event) {
    event.preventDefault();
    const dataset = createDatasetDefinition(datasetForm.name, datasetForm.description);
    onChange({ ...configuration, datasets: [...configuration.datasets, dataset] });
    setSelectedId(dataset.id); setDatasetForm({ name: "", description: "" }); setShowDatasetForm(false);
  }

  function addCase(event) {
    event.preventDefault();
    if (!selected) return;
    const testCase = createTestCase({ ...caseForm, tags: caseForm.tags.split(",") });
    const datasets = configuration.datasets.map((item) => item.id === selected.id ? { ...item, version: item.version + 1, cases: [...item.cases, testCase] } : item);
    onChange({ ...configuration, datasets });
    setCaseForm({ title: "", sourceText: "", sourceUrl: "", expectedBehavior: "", tags: "" }); setShowCaseForm(false);
  }

  function addHarness(event) {
    event.preventDefault();
    const harness = createHarnessDefinition(harnessForm.name);
    onChange({ ...configuration, harnesses: [...configuration.harnesses, harness] });
    setHarnessForm({ name: "" });
    setVersionForm((current) => ({ ...current, harnessId: harness.id }));
  }

  function addHarnessVersion(event) {
    event.preventDefault();
    const version = { id: `version-${Date.now()}`, label: versionForm.label.trim(), commit: versionForm.commit.trim() || "uncommitted-local", profile: versionForm.profile.trim() || "general_source_review", createdAt: new Date().toISOString() };
    const harnesses = configuration.harnesses.map((item) => item.id === versionForm.harnessId ? { ...item, versions: [...item.versions, version] } : item);
    onChange({ ...configuration, harnesses });
    setVersionForm((current) => ({ ...current, label: "", commit: "" }));
  }

  return <section className="workbench-page datasets-page" data-tour="datasets-workspace">
    <PageHeader eyebrow="Datasets · cases · references" title="Evaluation datasets" actions={<><button type="button" className="secondary-button" onClick={() => setShowDatasetForm((value) => !value)}><PlusIcon size={16} /> New dataset</button><button type="button" className="primary-button" disabled={!selected} onClick={() => setShowCaseForm((value) => !value)}><PlusIcon size={16} /> Add test case</button></>}>
      Organise representative inputs, expected behaviour and provenance so every harness version is tested against the same cases.
    </PageHeader>
    {showDatasetForm && <form className="inline-create-card" onSubmit={addDataset}><label>Dataset name<input value={datasetForm.name} onChange={(event) => setDatasetForm({ ...datasetForm, name: event.target.value })} required /></label><label>Description<input value={datasetForm.description} onChange={(event) => setDatasetForm({ ...datasetForm, description: event.target.value })} /></label><button className="primary-button">Create dataset</button></form>}
    {showCaseForm && <form className="inline-create-card case-form" onSubmit={addCase}><label>Case title<input value={caseForm.title} onChange={(event) => setCaseForm({ ...caseForm, title: event.target.value })} required /></label><label>Primary source URL<input type="url" value={caseForm.sourceUrl} onChange={(event) => setCaseForm({ ...caseForm, sourceUrl: event.target.value })} /></label><label className="wide">Source text<textarea rows="7" value={caseForm.sourceText} onChange={(event) => setCaseForm({ ...caseForm, sourceText: event.target.value })} required /></label><label className="wide">Expected behaviour<textarea value={caseForm.expectedBehavior} onChange={(event) => setCaseForm({ ...caseForm, expectedBehavior: event.target.value })} /></label><label>Tags<input value={caseForm.tags} onChange={(event) => setCaseForm({ ...caseForm, tags: event.target.value })} placeholder="safety, research, provenance" /></label><button className="primary-button">Add immutable case version</button></form>}
    <div className="dataset-layout"><aside className="dataset-list">{configuration.datasets.map((dataset) => <button type="button" className={dataset.id === selected?.id ? "active" : ""} key={dataset.id} onClick={() => setSelectedId(dataset.id)}><DatabaseIcon size={19} /><span><strong>{dataset.name}</strong><small>{dataset.cases.length} cases · version {dataset.version}</small></span></button>)}</aside><section className="dataset-detail">{selected ? <><header><div><p className="eyebrow">Dataset version {selected.version}</p><h2>{selected.name}</h2><p>{selected.description}</p></div><span className="immutable-chip"><ShieldCheckIcon size={15} /> Versioned</span></header><div className="case-table">{selected.cases.map((testCase, index) => <article key={testCase.id}><span>{index + 1}</span><div><strong>{testCase.title}</strong><p>{testCase.expectedBehavior || "No reference behaviour yet."}</p><small>{testCase.privacyClass} · {testCase.tags.join(" · ") || "untagged"}</small></div>{testCase.sourceUrl ? <a href={testCase.sourceUrl} target="_blank" rel="noreferrer"><LinkSimpleIcon size={16} /> Source</a> : <em>Source URL missing</em>}</article>)}</div></> : <p>No dataset selected.</p>}</section></div>
    <section className="harness-registry" data-tour="harness-versions">
      <header><div><p className="eyebrow">Configuration lineage</p><h2>Harness and version registry</h2><p>Every run records the exact version ID, workflow profile and code reference selected here.</p></div><span className="immutable-chip"><GitBranchIcon size={15} /> Append only</span></header>
      <div className="harness-columns">
        <div className="harness-list">{configuration.harnesses.map((harness) => <article key={harness.id}><strong>{harness.name}</strong>{harness.versions.map((version) => <span key={version.id}><b>{version.label}</b><small>{version.profile} · {version.commit}</small></span>)}</article>)}</div>
        <div className="harness-forms">
          <form onSubmit={addHarness}><strong>Register another harness</strong><label>Name<input required value={harnessForm.name} onChange={(event) => setHarnessForm({ name: event.target.value })} /></label><button className="secondary-button">Add harness</button></form>
          <form onSubmit={addHarnessVersion}><strong>Append a version</strong><label>Harness<select value={versionForm.harnessId} onChange={(event) => setVersionForm({ ...versionForm, harnessId: event.target.value })}>{configuration.harnesses.map((harness) => <option key={harness.id} value={harness.id}>{harness.name}</option>)}</select></label><label>Version label<input required value={versionForm.label} onChange={(event) => setVersionForm({ ...versionForm, label: event.target.value })} placeholder="Candidate v2" /></label><label>Commit or build reference<input value={versionForm.commit} onChange={(event) => setVersionForm({ ...versionForm, commit: event.target.value })} placeholder="git SHA or package ID" /></label><label>Workflow profile<input value={versionForm.profile} onChange={(event) => setVersionForm({ ...versionForm, profile: event.target.value })} /></label><button className="primary-button">Append version</button></form>
        </div>
      </div>
    </section>
  </section>;
}

export function CompareWorkspace({ runs, history, configuration, onConfigurationChange }) {
  const [baselineId, setBaselineId] = useState(runs[0]?.id || "");
  const [candidateId, setCandidateId] = useState(runs[1]?.id || runs[0]?.id || "");
  const baseline = runs.find((item) => item.id === baselineId);
  const candidate = runs.find((item) => item.id === candidateId);
  const latestFor = (run) => history.find((item) => item.review_instance_id === run?.id || item.run_id === run?.sourceRunId) || null;
  const comparison = compareRuns(baseline, candidate, latestFor(baseline), latestFor(candidate));

  function savePreference(value) {
    if (!baseline || !candidate) return;
    const record = { id: `pairwise-${Date.now()}`, baselineRunId: baseline.id, candidateRunId: candidate.id, preference: value, createdAt: new Date().toISOString(), immutable: true };
    onConfigurationChange({ ...configuration, pairwiseJudgments: [record, ...configuration.pairwiseJudgments] });
  }

  return <section className="workbench-page compare-page" data-tour="compare-workspace"><PageHeader eyebrow="Baseline · candidate · pairwise" title="Compare experiments">Keep both runs immutable, inspect automated and human signals side by side, then record a separate pairwise judgment.</PageHeader><div className="compare-selectors"><label>Baseline run<select value={baselineId} onChange={(event) => setBaselineId(event.target.value)}>{runs.map((run) => <option key={run.id} value={run.id}>{run.shortLabel} · {run.sessionLabel}</option>)}</select></label><GitDiffIcon size={28} /><label>Candidate run<select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}>{runs.map((run) => <option key={run.id} value={run.id}>{run.shortLabel} · {run.sessionLabel}</option>)}</select></label></div>{comparison ? <><div className="comparison-grid"><article><p className="eyebrow">Baseline</p><h2>{baseline.shortLabel}</h2><strong>{comparison.baseline.automated}<small>/100 automated</small></strong><span>{comparison.baseline.human === null ? "Human review pending" : `${comparison.baseline.human}/15 human`}</span><dl><div><dt>Claims</dt><dd>{comparison.baseline.claims}</dd></div><div><dt>Actions</dt><dd>{comparison.baseline.actions}</dd></div></dl></article><article className="delta-card"><p className="eyebrow">Change</p><h2>{comparison.delta.automated >= 0 ? "+" : ""}{comparison.delta.automated}</h2><span>automated-score delta</span><dl><div><dt>Human</dt><dd>{comparison.delta.human === null ? "pending" : comparison.delta.human}</dd></div><div><dt>Claims</dt><dd>{comparison.delta.claims}</dd></div><div><dt>Actions</dt><dd>{comparison.delta.actions}</dd></div></dl></article><article><p className="eyebrow">Candidate</p><h2>{candidate.shortLabel}</h2><strong>{comparison.candidate.automated}<small>/100 automated</small></strong><span>{comparison.candidate.human === null ? "Human review pending" : `${comparison.candidate.human}/15 human`}</span><dl><div><dt>Claims</dt><dd>{comparison.candidate.claims}</dd></div><div><dt>Actions</dt><dd>{comparison.candidate.actions}</dd></div></dl></article></div><section className="pairwise-card"><div><strong>Which run is better for this evaluation goal?</strong><p>This judgment is stored separately; it does not rewrite either run or its individual review.</p></div><div><button type="button" onClick={() => savePreference("baseline")}>Baseline</button><button type="button" onClick={() => savePreference("tie")}>Equivalent</button><button type="button" onClick={() => savePreference("candidate")}>Candidate</button></div></section></> : <div className="page-empty"><GitDiffIcon size={40} /><p>Select two available runs to compare.</p></div>}</section>;
}

function LegacyInsightsWorkspace({ runs, history, configuration }) {
  const evaluations = useMemo(() => runs.map((run) => ({ run, result: runAutomatedEvaluators(run), review: history.find((item) => item.review_instance_id === run.id || item.run_id === run.sourceRunId) || null })), [runs, history]);
  const average = evaluations.length ? Math.round(evaluations.reduce((sum, item) => sum + item.result.score, 0) / evaluations.length) : 0;
  const issueCounts = new Map();
  evaluations.forEach(({ result }) => result.checks.filter((check) => check.score < 80).forEach((check) => issueCounts.set(check.label, (issueCounts.get(check.label) || 0) + 1)));
  const agreement = calculateReviewerAgreement(history);
  const gate = configuration.ciGates.find((item) => item.enabled) || configuration.ciGates[0];
  const latest = evaluations[0];
  const gateResult = latest && gate ? evaluateCiGate({ run: latest.run, latestReview: latest.review, gate }) : null;
  return <section className="workbench-page insights-page" data-tour="insights-workspace"><PageHeader eyebrow="Metrics · failures · calibration" title="Evaluation insights">Automated signals help find where to look; human judgments remain the authority for product quality.</PageHeader><div className="insight-metrics"><article><ChartBarIcon size={21} /><span>Average automated score</span><strong>{average}<small>/100</small></strong></article><article><TestTubeIcon size={21} /><span>Runs evaluated</span><strong>{evaluations.length}</strong></article><article><UsersThreeIcon size={21} /><span>Reviewer agreement</span><strong>{agreement.agreementPercent === null ? "—" : `${agreement.agreementPercent}%`}</strong></article><article className={gateResult?.status === "passed" ? "success" : "attention"}><RocketLaunchIcon size={21} /><span>Active CI gate</span><strong>{gateResult?.status || "not run"}</strong></article></div><div className="insights-grid"><section className="insight-card"><header><h2>Run evaluator matrix</h2><p>Automated outputs never fill a human score.</p></header>{evaluations.map(({ run, result, review }) => <article className="evaluator-row" key={run.id}><div><strong>{run.shortLabel}</strong><small>{review ? `${review.total}/15 · ${review.decision}` : "Human review pending"}</small></div><b>{result.score}</b><StatusBadge status={result.status} /></article>)}</section><section className="insight-card"><header><h2>Failure taxonomy</h2><p>Repeated evaluator weaknesses become engineering targets.</p></header>{Array.from(issueCounts.entries()).sort((a, b) => b[1] - a[1]).map(([label, count]) => <article className="failure-row" key={label}><span>{label}</span><strong>{count}</strong></article>)}{!issueCounts.size && <p className="positive-empty">No repeated automated weaknesses in the loaded runs.</p>}</section><section className="insight-card"><header><h2>Reviewer calibration</h2><p>{agreement.detail}</p></header><div className="calibration-score"><UsersThreeIcon size={28} /><strong>{agreement.agreementPercent === null ? "Needs second review" : `${agreement.agreementPercent}% agreement`}</strong><span>{agreement.comparableRuns} comparable runs</span></div></section><section className="insight-card"><header><h2>CI regression gate</h2><p>{gate?.name || "No gate configured"}</p></header>{gateResult ? <><StatusBadge status={gateResult.status} /><dl className="gate-details"><div><dt>Automated</dt><dd>{gateResult.automatedScore}/{gate.minimumAutomatedScore}</dd></div><div><dt>Critical failures</dt><dd>{gateResult.criticalFailures}/{gate.maximumCriticalFailures}</dd></div><div><dt>Human decision</dt><dd>{gateResult.humanDecision}</dd></div></dl>{gateResult.reasons.length > 0 && <ul>{gateResult.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}</> : <p>No run is available.</p>}</section></div></section>;
}

export function InsightsWorkspace({ runs, history, configuration, onConfigurationChange }) {
  const evaluations = useMemo(() => runs.map((run) => ({ run, result: runAutomatedEvaluators(run), review: history.find((item) => item.review_instance_id === run.id || item.run_id === run.sourceRunId) || null })), [runs, history]);
  const average = evaluations.length ? Math.round(evaluations.reduce((sum, item) => sum + item.result.score, 0) / evaluations.length) : 0;
  const issueCounts = new Map();
  evaluations.forEach(({ result }) => result.checks.filter((check) => check.score < 80).forEach((check) => issueCounts.set(check.label, (issueCounts.get(check.label) || 0) + 1)));
  const agreement = calculateReviewerAgreement(history);
  const gate = configuration.ciGates.find((item) => item.enabled) || configuration.ciGates[0];
  const latest = evaluations[0];
  const gateResult = latest && gate ? evaluateCiGate({ run: latest.run, latestReview: latest.review, gate }) : null;
  function updateGate(patch) {
    if (!gate) return;
    onConfigurationChange({ ...configuration, ciGates: configuration.ciGates.map((item) => item.id === gate.id ? { ...item, ...patch } : item) });
  }
  return <section className="workbench-page insights-page" data-tour="insights-workspace">
    <PageHeader eyebrow="Metrics · failures · calibration" title="Evaluation insights">Automated signals help find where to look; human judgments remain the authority for product quality.</PageHeader>
    <div className="insight-metrics"><article><ChartBarIcon size={21} /><span>Average automated score</span><strong>{average}<small>/100</small></strong></article><article><TestTubeIcon size={21} /><span>Runs evaluated</span><strong>{evaluations.length}</strong></article><article><UsersThreeIcon size={21} /><span>Reviewer agreement</span><strong>{agreement.agreementPercent === null ? "—" : `${agreement.agreementPercent}%`}</strong></article><article className={gateResult?.status === "passed" ? "success" : "attention"}><RocketLaunchIcon size={21} /><span>Active CI gate</span><strong>{gateResult?.status || "not run"}</strong></article></div>
    <div className="insights-grid">
      <section className="insight-card"><header><h2>Run evaluator matrix</h2><p>Automated outputs never fill a human score.</p></header>{evaluations.map(({ run, result, review }) => <article className="evaluator-row" key={run.id}><div><strong>{run.shortLabel}</strong><small>{review ? `${review.total}/15 · ${review.decision}` : "Human review pending"}</small></div><b>{result.score}</b><StatusBadge status={result.status} /></article>)}</section>
      <section className="insight-card"><header><h2>Failure taxonomy</h2><p>Repeated evaluator weaknesses become engineering targets.</p></header>{Array.from(issueCounts.entries()).sort((a, b) => b[1] - a[1]).map(([label, count]) => <article className="failure-row" key={label}><span>{label}</span><strong>{count}</strong></article>)}{!issueCounts.size && <p className="positive-empty">No repeated automated weaknesses in the loaded runs.</p>}</section>
      <section className="insight-card"><header><h2>Reviewer calibration</h2><p>{agreement.detail}</p></header><div className="calibration-score"><UsersThreeIcon size={28} /><strong>{agreement.agreementPercent === null ? "Needs second review" : `${agreement.agreementPercent}% agreement`}</strong><span>{agreement.comparableRuns} comparable runs</span></div></section>
      <section className="insight-card"><header><h2>CI regression gate</h2><p>{gate?.name || "No gate configured"}</p></header>{gate && <div className="gate-controls"><label>Minimum automated<input type="number" min="0" max="100" value={gate.minimumAutomatedScore} onChange={(event) => updateGate({ minimumAutomatedScore: Number(event.target.value) })} /></label><label>Maximum critical failures<input type="number" min="0" value={gate.maximumCriticalFailures} onChange={(event) => updateGate({ maximumCriticalFailures: Number(event.target.value) })} /></label><label className="gate-checkbox"><input type="checkbox" checked={gate.requireHumanPass} onChange={(event) => updateGate({ requireHumanPass: event.target.checked })} /> Require human Pass</label></div>}{gateResult ? <><StatusBadge status={gateResult.status} /><dl className="gate-details"><div><dt>Automated</dt><dd>{gateResult.automatedScore}/{gate.minimumAutomatedScore}</dd></div><div><dt>Critical failures</dt><dd>{gateResult.criticalFailures}/{gate.maximumCriticalFailures}</dd></div><div><dt>Human decision</dt><dd>{gateResult.humanDecision}</dd></div></dl>{gateResult.reasons.length > 0 && <ul>{gateResult.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}</> : <p>No run is available.</p>}</section>
    </div>
  </section>;
}

export function SystemsWorkspace() {
  const [selectedId, setSelectedId] = useState(ALGORITHM_CATALOG[0].id);
  const selected = ALGORITHM_CATALOG.find((item) => item.id === selectedId);
  return <section className="workbench-page systems-page" data-tour="systems-workspace"><PageHeader eyebrow="Algorithms · data structures · ML boundaries" title="System inspector">See what is implemented, why it exists, its computational shape, and where your computer-science topics apply.</PageHeader><div className="systems-layout"><aside>{ALGORITHM_CATALOG.map((item) => <button type="button" key={item.id} className={item.id === selectedId ? "active" : ""} onClick={() => setSelectedId(item.id)}>{item.category === "Data structures" ? <TreeStructureIcon size={19} /> : <BracketsCurlyIcon size={19} />}<span><strong>{item.name}</strong><small>{item.category}</small></span><i className={item.implemented ? "implemented" : "planned"}>{item.implemented ? "Live" : "Planned"}</i></button>)}</aside>{selected && <article className="system-detail"><div className="system-status"><StatusBadge status={selected.implemented ? "passed" : "planned"} /><span>{selected.category}</span></div><h2>{selected.name}</h2><p>{selected.explanation}</p><dl><div><dt>Computational shape</dt><dd>{selected.complexity}</dd></div><div><dt>University connection</dt><dd>{selected.yearTwo}</dd></div><div><dt>Current product state</dt><dd>{selected.implemented ? "Implemented and inspectable in this workbench." : "Explicitly not implemented; no UI claim implies that it is active."}</dd></div></dl><div className="boundary-callout"><ShieldCheckIcon size={19} /><span>{selected.id === "backpropagation" ? "Backpropagation belongs to a future governed model-training pipeline. Evaluation labels and golden cases come first." : "Configuration changes create new versions and runs. Existing evidence and reviews remain immutable."}</span></div></article>}</div></section>;
}
