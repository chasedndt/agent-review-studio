import { useEffect, useLayoutEffect, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { CompassIcon } from "@phosphor-icons/react/Compass";
import { XIcon } from "@phosphor-icons/react/X";

const LEGACY_TOUR_STEPS = [
  {
    page: "overview",
    target: null,
    eyebrow: "Welcome to Agent Review Studio",
    title: "Review, label and improve an agent—one run at a time.",
    body: "Inspect what the agent did, compare it with the evidence, label the quality, and save a trusted example. Use that example to improve the agent and test it again. The Studio prepares reviewed data; it does not automatically train a model.",
  },
  {
    page: "overview",
    target: "workspace",
    eyebrow: "1 · Name the system",
    title: "Each workspace belongs to one agent or harness.",
    body: "The product stays neutral. Your workspace name and agent identity travel with reviews and exports, so Chaser Agent can be one project among many.",
  },
  {
    page: "overview",
    target: "overview-queue",
    eyebrow: "2 · Work the queue",
    title: "The overview shows exactly what remains.",
    body: "Not started, draft, re-review and finished states are separate. Bundle diagnostics expose missing files, parse failures and broken claim-evidence links before you trust a run.",
  },
  {
    page: "overview",
    target: "imports",
    eyebrow: "3 · Bring the evidence in",
    title: "Import a folder or a loose set of files.",
    body: "Known review artifacts are mapped automatically. JSONL, Markdown, logs, tables, code, images, PDFs and unknown attachments are retained in the file manifest instead of silently discarded.",
  },
  {
    page: "review",
    target: "runs",
    eyebrow: "4 · Keep work chronological",
    title: "Sessions separate today’s pass from tomorrow’s.",
    body: "Runs remain grouped by dated import session. You can revisit the same source later without overwriting the earlier review context.",
  },
  {
    page: "files",
    target: "files-workspace",
    eyebrow: "5 · Inspect the complete bundle",
    title: "The Files workspace shows every imported artifact.",
    body: "Filter by section, inspect parse status, preview readable content and keep binary evidence attached to the run. The eight canonical JSON files are useful, but no longer the whole product contract.",
  },
  {
    page: "review",
    target: "review-workspace",
    eyebrow: "6 · Compare output with evidence",
    title: "Review claims in context, not as isolated rows.",
    body: "The paired view keeps an agent claim beside its linked source evidence. Actions, memory proposals and uncertainty are separate checks because they fail in different ways.",
  },
  {
    page: "review",
    target: "score-panel",
    eyebrow: "7 · Label the complete run",
    title: "Five ratings and one decision describe the result.",
    body: "Score five quality areas from 0–3, choose Pass, Needs revision or Fail, and describe exactly what should change. Saving creates a reusable improvement example.",
  },
  {
    page: "history",
    target: "history-workspace",
    eyebrow: "8 · Re-review without erasing history",
    title: "Improve the agent, run it again, and compare.",
    body: "Open or export an older reviewed example, then start a re-review after the agent changes. The new result links to the earlier one so improvement—or regression—stays visible.",
  },
  {
    page: "settings",
    target: "settings-workspace",
    eyebrow: "9 · Make it yours",
    title: "Settings holds workspace identity and this guide.",
    body: "Edit the project, agent and reviewer names here. You can restart this tour whenever a new operator joins the project.",
  },
];

export const TOUR_STEPS = [
  { page: "overview", target: null, eyebrow: "Welcome to Agent Review Studio", title: "Run, review and improve an agent—without losing the evidence.", body: "The Studio turns repeatable tasks into immutable evaluation runs. Automated checks find structural problems; human reviewers decide what is correct, relevant and safe. Reviewed cases support harness regression testing and may later be selected for governed model training—the Studio itself does not update model weights." },
  { page: "overview", target: "workspace-switcher", eyebrow: "1 · Switch systems", title: "One prominent switcher separates every agent and harness.", body: "Use a workspace for one product or evaluation programme. Chaser Agent is the loaded case study, not the identity of this independent Studio. The selected workspace controls its runs, datasets, versions and review history." },
  { page: "overview", target: "new-workspace", eyebrow: "2 · Create and manage", title: "Create another workspace in one step.", body: "Name the workspace and the agent or harness under test. Settings lets you archive it later; archived evidence stays intact and empty archived workspaces can be removed." },
  { page: "datasets", target: "datasets-workspace", eyebrow: "3 · Define the test data", title: "Datasets make evaluations repeatable.", body: "A dataset contains versioned test cases: input text, a primary-source URL, expected behaviour, privacy class and tags. Adding a case creates a new dataset version instead of changing earlier evidence." },
  { page: "run", target: "run-console", eyebrow: "4 · Execute a run", title: "The run console creates the agent output you will judge.", body: "Choose a test case, harness version and runner. Run evaluation creates a fresh artifact bundle and trace. The Review page displays runs; it does not secretly generate or regenerate them." },
  { page: "overview", target: "overview-queue", eyebrow: "5 · Work the queue", title: "Runs stay chronological and immutable.", body: "Not started, draft, re-review and finished states are separate. Diagnostics expose missing files, parse failures and broken references before you trust a bundle." },
  { page: "review", target: "review-workspace", eyebrow: "6 · Understand before scoring", title: "Review the task boundary, then verify the run.", body: "The candidate text was extracted from the source by the selected runner. It is not automatically true or useful. The paired view keeps each candidate beside its source excerpt, surrounding context, provenance and linked actions." },
  { page: "review", target: "claim-labels", eyebrow: "7 · Classify every claim candidate", title: "Categorical labels create reusable ground truth.", body: "Choose labels such as Supported and relevant, Not a claim, Missing context or Linked action is unrelated. Problem labels require a correction. These per-claim judgments are separate from the five whole-run scores." },
  { page: "review", target: "score-panel", eyebrow: "8 · Score the complete run", title: "Five ratings and one decision describe the result.", body: "After every artifact and claim is checked, score five quality areas from 0–3, choose Pass, Needs revision or Fail, and record the overall correction. Automated evaluator results never fill these human fields." },
  { page: "compare", target: "compare-workspace", eyebrow: "9 · Compare experiments", title: "Baseline and candidate stay side by side.", body: "Compare automated and human signals without rewriting either run. A separate pairwise judgment records whether the baseline, candidate or neither is better for this evaluation goal." },
  { page: "insights", target: "insights-workspace", eyebrow: "10 · Find regressions", title: "Metrics show patterns, not automatic truth.", body: "Use evaluator matrices, failure counts, reviewer agreement and the CI gate to find weak harness versions. Human-reviewed examples remain the product-quality authority." },
  { page: "files", target: "files-workspace", eyebrow: "11 · Inspect every source file", title: "The Files workspace retains the complete bundle.", body: "Filter artifacts, preview readable content and keep binary evidence attached. Generated runs include the original source alongside canonical JSON; imported unknown files are retained instead of silently discarded." },
  { page: "history", target: "history-workspace", eyebrow: "12 · Preserve review lineage", title: "Re-review without erasing history.", body: "A finished review becomes an immutable judgment revision. Re-review creates a linked child revision, so changed opinions and reviewer disagreement stay measurable." },
  { page: "systems", target: "systems-workspace", eyebrow: "13 · Inspect the computer science", title: "See the algorithms, data structures and ML boundary.", body: "The System inspector explains ranking, provenance graphs, immutable lineage, reviewer statistics and regression gates with complexity and Year Two topic links. Backpropagation is clearly marked as future—not implied to be running." },
  { page: "settings", target: "workspace-lifecycle", eyebrow: "14 · Govern the workspace", title: "Archive inactive work without deleting evidence.", body: "Settings holds workspace identity, reviewer identity, appearance and lifecycle controls. Restart this tour whenever a new operator joins. Export before any governed data leaves this browser." },
];

function positionFor(rect) {
  const cardWidth = Math.min(390, Math.max(300, window.innerWidth - 32));
  const cardHeight = 250;
  if (!rect) {
    return {
      left: Math.max(16, (window.innerWidth - cardWidth) / 2),
      top: Math.max(16, (window.innerHeight - cardHeight) / 2),
      width: cardWidth,
    };
  }

  const below = rect.bottom + 16;
  const above = rect.top - cardHeight - 16;
  const top = below + cardHeight < window.innerHeight ? below : Math.max(16, above);
  const left = Math.min(Math.max(16, rect.left), window.innerWidth - cardWidth - 16);
  return { left, top, width: cardWidth };
}

export function GuidedTour({ open, step, onStep, onClose, onNavigate }) {
  const [targetRect, setTargetRect] = useState(null);
  const current = TOUR_STEPS[step] || TOUR_STEPS[0];

  useEffect(() => {
    if (!open) return;
    onNavigate(current.page, current.target);
  }, [open, current.page, current.target, onNavigate]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    let frame = 0;
    const measure = () => {
      const element = current.target ? document.querySelector(`[data-tour="${current.target}"]`) : null;
      if (element) element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      frame = window.requestAnimationFrame(() => setTargetRect(element ? element.getBoundingClientRect() : null));
    };
    const timer = window.setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [open, current.target, current.page]);

  if (!open) return null;
  const last = step === TOUR_STEPS.length - 1;
  const cardStyle = positionFor(targetRect);

  return (
    <div className="tour-layer" role="dialog" aria-modal="true" aria-label="Guided product tour">
      {targetRect && (
        <div
          className="tour-spotlight"
          style={{ left: targetRect.left - 6, top: targetRect.top - 6, width: targetRect.width + 12, height: targetRect.height + 12 }}
        />
      )}
      {!targetRect && <div className="tour-welcome-backdrop" />}
      <section className={`tour-card ${targetRect ? "anchored" : "welcome"}`} style={cardStyle}>
        <header>
          <span className="tour-icon"><CompassIcon size={19} weight="fill" /></span>
          <span>{step + 1} of {TOUR_STEPS.length}</span>
          <button type="button" onClick={onClose} aria-label="Skip guided tour"><XIcon size={18} /></button>
        </header>
        <p className="eyebrow">{current.eyebrow}</p>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <div className="tour-progress" aria-label={`Tour step ${step + 1} of ${TOUR_STEPS.length}`}>
          {TOUR_STEPS.map((item, index) => <i key={item.eyebrow} className={index <= step ? "active" : ""} />)}
        </div>
        <footer>
          <button type="button" className="tour-skip" onClick={onClose}>Skip tour</button>
          <div>
            <button type="button" className="secondary-button" disabled={step === 0} onClick={() => onStep(step - 1)}><ArrowLeftIcon size={16} /> Back</button>
            <button type="button" className="primary-button" onClick={() => last ? onClose() : onStep(step + 1)}>
              {last ? <><CheckCircleIcon size={17} /> Finish</> : <>Next <ArrowRightIcon size={16} /></>}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
