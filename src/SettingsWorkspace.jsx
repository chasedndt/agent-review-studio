import { useEffect, useState } from "react";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/ArrowCounterClockwise";
import { ArchiveIcon } from "@phosphor-icons/react/Archive";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { FileTextIcon } from "@phosphor-icons/react/FileText";
import { HardDrivesIcon } from "@phosphor-icons/react/HardDrives";
import { IdentificationCardIcon } from "@phosphor-icons/react/IdentificationCard";
import { InfoIcon } from "@phosphor-icons/react/Info";
import { MoonIcon } from "@phosphor-icons/react/Moon";
import { SunIcon } from "@phosphor-icons/react/Sun";
import { TrashIcon } from "@phosphor-icons/react/Trash";
import { SUPPORTED_FILE_GROUPS } from "./data.js";
import { EVALUATION_GOALS } from "./learning.js";

export function SettingsWorkspace({ workspace, reviewerName, onSaveWorkspace, onSaveReviewer, onRestartTour, onArchiveWorkspace, archivedWorkspaces, onRestoreWorkspace, onDeleteWorkspace, runCount, reviewCount, theme, onThemeChange }) {
  const [form, setForm] = useState(workspace);
  const [reviewer, setReviewer] = useState(reviewerName);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(workspace);
    setReviewer(reviewerName);
  }, [workspace, reviewerName]);

  function save(event) {
    event.preventDefault();
    onSaveWorkspace({
      ...workspace,
      name: form.name.trim() || workspace.name,
      agentName: form.agentName.trim() || "Unnamed agent",
      description: form.description.trim(),
      evaluationGoal: form.evaluationGoal || "custom",
    });
    onSaveReviewer(reviewer.trim() || "Local operator");
    setSaved(true);
  }

  return (
    <section className="settings-workspace" data-tour="settings-workspace">
      <header className="page-header">
        <div><p className="eyebrow">Local project configuration</p><h1>Settings</h1><p>Keep the product neutral while naming the exact agent, harness or service being evaluated.</p></div>
        {saved && <span className="settings-saved"><CheckCircleIcon size={17} weight="fill" /> Saved locally</span>}
      </header>

      <div className="settings-grid">
        <form className="settings-card identity-card" onSubmit={save}>
          <header><IdentificationCardIcon size={22} /><div><h2>Workspace identity</h2><p>Included in review exports and revision history.</p></div></header>
          <label>Workspace name<input value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setSaved(false); }} /></label>
          <label>Agent or harness name<input value={form.agentName} onChange={(event) => { setForm({ ...form, agentName: event.target.value }); setSaved(false); }} /></label>
          <label>Purpose<textarea value={form.description || ""} onChange={(event) => { setForm({ ...form, description: event.target.value }); setSaved(false); }} placeholder="What does this agent do, and what are you evaluating?" /></label>
          <label>Primary evaluation goal<select value={form.evaluationGoal || "custom"} onChange={(event) => { setForm({ ...form, evaluationGoal: event.target.value }); setSaved(false); }}>{EVALUATION_GOALS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>Default reviewer<input value={reviewer} onChange={(event) => { setReviewer(event.target.value); setSaved(false); }} /></label>
          <button type="submit" className="primary-button">Save workspace settings</button>
        </form>

        <section className="settings-card storage-card">
          <header><HardDrivesIcon size={22} /><div><h2>Local data</h2><p>No server or account is required in this phase.</p></div></header>
          <div className="storage-stats"><div><strong>{runCount}</strong><span>Runs</span></div><div><strong>{reviewCount}</strong><span>Reviewed examples</span></div><div><strong>0</strong><span>Source mutations</span></div></div>
          <ul><li>Imported run bundles and binary attachments use this browser’s IndexedDB.</li><li>Drafts, workspace identity and reviewed examples use local browser storage.</li><li>Exported JSON tells engineers how the review can support harness improvement, golden evaluations or governed training-data selection.</li></ul>
        </section>

        <section className="settings-card formats-card">
          <header><FileTextIcon size={22} /><div><h2>Accepted files</h2><p>Known roles are mapped; unfamiliar files are retained.</p></div></header>
          <div className="format-list">{SUPPORTED_FILE_GROUPS.map((group) => <div key={group.label}><strong>{group.label}</strong><span>{group.extensions}</span></div>)}</div>
        </section>

        <section className="settings-card tour-settings-card">
          <header><InfoIcon size={24} weight="fill" /><div><h2>Help and guided onboarding</h2><p>Start the complete walkthrough from here at any time.</p></div></header>
          <p>The guide points to the real Run button, then moves through versioned data, immutable lineage, evidence review, categorical labels, scoring, comparison, failure analysis, terminology and lifecycle controls.</p>
          <p className="tour-access-note">You can also open it from the persistent <strong>Help &amp; tour</strong> information button in the header on every page.</p>
          <button type="button" className="primary-button tour-start-button" onClick={onRestartTour}><ArrowCounterClockwiseIcon size={17} /> Start guided onboarding</button>
        </section>

        <section className="settings-card training-boundary-card">
          <header><FileTextIcon size={22} /><div><h2>Improvement and training boundary</h2><p>Know exactly what the exported evidence can do.</p></div></header>
          <ol>
            <li><strong>Harness refinement:</strong> use labels and corrections to change prompts, tools, retrieval, memory rules or orchestration.</li>
            <li><strong>Regression testing:</strong> rerun the same versioned case and compare candidate against baseline.</li>
            <li><strong>Model training:</strong> select approved reviewed examples, add target outputs, and send them to a separate governed trainer.</li>
          </ol>
          <p className="boundary-callout">Agent Review Studio prepares and governs evaluation evidence. It is not a GPU trainer and does not update model weights.</p>
        </section>

        <section className="settings-card lifecycle-card" data-tour="workspace-lifecycle">
          <header><ArchiveIcon size={22} /><div><h2>Workspace lifecycle</h2><p>Take inactive work out of the main switcher without losing evidence.</p></div></header>
          {workspace.kind === "built-in" ? <p>The built-in Chaser Agent calibration workspace is permanent so every new operator has a working example.</p> : <><p>Archive hides this workspace from the active stack. Runs, source files and review revisions stay intact and can be restored here. Rename, archive and guarded deletion are also available from the workspace's three-dot or right-click menu.</p><button type="button" className="secondary-button" onClick={onArchiveWorkspace}><ArchiveIcon size={17} /> Archive workspace</button></>}
          <small>Archiving is reversible. Permanent deletion can start here or from the workspace menu and always requires the exact workspace name.</small>
        </section>

        <section className="settings-card archives-card" data-tour="archive-manager">
          <header><ArchiveIcon size={22} /><div><h2>Archived workspaces</h2><p>Restore old projects or permanently remove an archived local workspace.</p></div></header>
          {!archivedWorkspaces.length && <p className="archive-empty">Nothing is archived. Archive keeps a workspace out of the main switcher without losing its evidence.</p>}
          <div className="archive-manager-list">{archivedWorkspaces.map((item) => <article key={item.id}><div><strong>{item.name}</strong><span>{item.agentName}</span><small>{item.runCount} runs · {item.reviewCount} reviews · archived {new Date(item.archivedAt).toLocaleDateString("en-GB")}</small></div><button type="button" className="secondary-button" onClick={() => onRestoreWorkspace(item.id)}>Restore</button><button type="button" className="danger-button" onClick={() => onDeleteWorkspace(item.id)}><TrashIcon size={16} /> Delete</button></article>)}</div>
          <p className="archive-warning">Delete is permanent and asks you to type the workspace name. Export anything you need first.</p>
        </section>

        <section className="settings-card appearance-card">
          <header>{theme === "dark" ? <MoonIcon size={22} /> : <SunIcon size={22} />}<div><h2>Appearance</h2><p>Choose the same complete workspace in dark or light mode.</p></div></header>
          <div className="theme-choice" role="group" aria-label="Appearance theme">
            <button type="button" className={theme === "dark" ? "active" : ""} aria-pressed={theme === "dark"} onClick={() => onThemeChange("dark")}><MoonIcon size={18} /><span><strong>Dark</strong><small>Focused operator sessions</small></span></button>
            <button type="button" className={theme === "light" ? "active" : ""} aria-pressed={theme === "light"} onClick={() => onThemeChange("light")}><SunIcon size={18} /><span><strong>Light</strong><small>Extended evidence reading</small></span></button>
          </div>
        </section>
      </div>
    </section>
  );
}
