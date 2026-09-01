import { useMemo, useState } from "react";
import { BookOpenTextIcon } from "@phosphor-icons/react/BookOpenText";
import { BracketsCurlyIcon } from "@phosphor-icons/react/BracketsCurly";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/MagnifyingGlass";
import { ShieldCheckIcon } from "@phosphor-icons/react/ShieldCheck";
import { SparkleIcon } from "@phosphor-icons/react/Sparkle";
import { EVALUATION_GOALS, GLOSSARY_TERMS, PYTHON_STARTER, recommendEvaluationPlan } from "./learning.js";

export function LearnWorkspace({ workspace, onOpenRun }) {
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState(workspace.evaluationGoal || "custom");
  const plan = useMemo(() => recommendEvaluationPlan(goal, workspace.description), [goal, workspace.description]);
  const terms = GLOSSARY_TERMS.filter(([term, definition]) => `${term} ${definition}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="learn-workspace" data-tour="learn-workspace">
      <header className="page-header">
        <div><p className="eyebrow">Learn · configure · apply</p><h1>Agent harness field guide</h1><p>Plain-English definitions and a practical evaluation strategy for people who are new to building and improving agents.</p></div>
        <button type="button" className="primary-button" onClick={onOpenRun}>Open Run console</button>
      </header>

      <div className="learn-layout">
        <section className="strategy-card" data-tour="strategy-builder">
          <header><SparkleIcon size={23} weight="fill" /><div><p className="eyebrow">Smart local suggestion</p><h2>Evaluation strategy builder</h2><p>Choose the main objective. The Studio recommends a balanced set of repeatable rules, model-graded checks and human decisions.</p></div></header>
          <label>What matters most for this harness?<select value={goal} onChange={(event) => setGoal(event.target.value)}>{EVALUATION_GOALS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <div className="strategy-columns">
            <article><span className="strategy-kicker deterministic">Deterministic</span><h3>Repeatable Python or JavaScript checks</h3><ul>{plan.deterministic.map((item) => <li key={item}><CheckCircleIcon size={15} /> {item}</li>)}</ul></article>
            <article><span className="strategy-kicker probabilistic">Probabilistic</span><h3>Model-graded or statistical checks</h3><ul>{plan.probabilistic.map((item) => <li key={item}><SparkleIcon size={15} /> {item}</li>)}</ul></article>
            <article><span className="strategy-kicker human">Human authority</span><h3>The decision automation cannot own</h3><p>{plan.human}</p></article>
          </div>
          <p className="strategy-boundary"><ShieldCheckIcon size={17} /> These are configuration suggestions, not hidden execution. The current browser runner executes deterministic checks; a model grader or Python service must be connected and versioned before it can run here.</p>
        </section>

        <section className="python-card">
          <header><BracketsCurlyIcon size={22} /><div><h2>Deterministic evaluator starter</h2><p>A transparent Python shape engineers can adapt in the future runner service.</p></div></header>
          <pre><code>{PYTHON_STARTER}</code></pre>
          <small>Template only · not executed in this browser</small>
        </section>

        <section className="glossary-card" data-tour="glossary">
          <header><div><p className="eyebrow">Terminology</p><h2>Agent evaluation glossary</h2><p>Search the language used throughout the Studio.</p></div><label className="glossary-search"><MagnifyingGlassIcon size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search terms" aria-label="Search agent evaluation terminology" /></label></header>
          <div className="glossary-grid">{terms.map(([term, definition]) => <article key={term}><BookOpenTextIcon size={18} /><div><h3>{term}</h3><p>{definition}</p></div></article>)}</div>
          {!terms.length && <p className="glossary-empty">No term matches “{query}”. Try a broader phrase.</p>}
        </section>
      </div>
    </section>
  );
}
