import { useEffect, useLayoutEffect, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { CompassIcon } from "@phosphor-icons/react/Compass";
import { XIcon } from "@phosphor-icons/react/X";

export const TOUR_STEPS = [
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
