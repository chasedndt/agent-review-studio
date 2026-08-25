import { useEffect, useState } from "react";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/ArrowCounterClockwise";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { FileTextIcon } from "@phosphor-icons/react/FileText";
import { HardDrivesIcon } from "@phosphor-icons/react/HardDrives";
import { IdentificationCardIcon } from "@phosphor-icons/react/IdentificationCard";
import { SUPPORTED_FILE_GROUPS } from "./data.js";

export function SettingsWorkspace({ workspace, reviewerName, onSaveWorkspace, onSaveReviewer, onRestartTour, runCount, reviewCount }) {
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
          <label>Default reviewer<input value={reviewer} onChange={(event) => { setReviewer(event.target.value); setSaved(false); }} /></label>
          <button type="submit" className="primary-button">Save workspace settings</button>
        </form>

        <section className="settings-card storage-card">
          <header><HardDrivesIcon size={22} /><div><h2>Local data</h2><p>No server or account is required in this phase.</p></div></header>
          <div className="storage-stats"><div><strong>{runCount}</strong><span>Runs</span></div><div><strong>{reviewCount}</strong><span>Review revisions</span></div><div><strong>0</strong><span>Source mutations</span></div></div>
          <ul><li>Imported run bundles and binary attachments use this browser’s IndexedDB.</li><li>Drafts, workspace identity and review revisions use local browser storage.</li><li>Exported JSON is the portable handoff format.</li></ul>
        </section>

        <section className="settings-card formats-card">
          <header><FileTextIcon size={22} /><div><h2>Accepted files</h2><p>Known roles are mapped; unfamiliar files are retained.</p></div></header>
          <div className="format-list">{SUPPORTED_FILE_GROUPS.map((group) => <div key={group.label}><strong>{group.label}</strong><span>{group.extensions}</span></div>)}</div>
        </section>

        <section className="settings-card tour-settings-card">
          <header><ArrowCounterClockwiseIcon size={22} /><div><h2>Guided onboarding</h2><p>Walk a new operator through the real product controls.</p></div></header>
          <p>The tour moves through projects, imports, run sessions, the complete file bundle, paired evidence review, scoring, history and settings.</p>
          <button type="button" className="secondary-button" onClick={onRestartTour}><ArrowCounterClockwiseIcon size={17} /> Restart guided tour</button>
        </section>
      </div>
    </section>
  );
}
