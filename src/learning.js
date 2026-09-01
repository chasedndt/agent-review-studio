export const EVALUATION_GOALS = [
  { id: "evidence", label: "Evidence and factuality", detail: "Check provenance, context, citations and unsupported claims." },
  { id: "reliability", label: "Reliability and consistency", detail: "Repeat the same cases and detect behavioural regressions." },
  { id: "tool_use", label: "Tool use and actions", detail: "Check tool selection, parameters, permissions and side effects." },
  { id: "workflow", label: "Workflow completion", detail: "Verify steps, hand-offs, state transitions and final outcomes." },
  { id: "safety", label: "Safety and approvals", detail: "Test boundaries, escalation, privacy and approval gates." },
  { id: "custom", label: "Custom objective", detail: "Start neutral and tailor the dataset, evaluators and rubric yourself." },
];

export const GLOSSARY_TERMS = [
  ["Agent", "A model-driven system that can reason, use tools and take steps toward a goal."],
  ["Agent harness", "The prompts, tools, retrieval, memory, policies and orchestration wrapped around a model."],
  ["Workspace", "A separated home for one agent or evaluation programme, including its datasets, versions, runs and reviews."],
  ["Dataset", "A versioned collection of test cases used to run the same evaluation conditions again."],
  ["Test case", "One input, its source context, expected behaviour, privacy class and evaluation tags."],
  ["Harness version", "A frozen description of the exact prompt, profile, tool and code configuration under test."],
  ["Run", "One execution of one harness version against one test case. Runs are append-only evidence."],
  ["Trace", "The ordered record of steps, inputs, tools, outputs, timings and approval decisions inside a run."],
  ["Claim candidate", "A statement extracted from the output for a human to classify. It is not automatically true."],
  ["Deterministic evaluator", "A repeatable rule such as schema validation, exact matching, thresholds or provenance-link checks."],
  ["Probabilistic evaluator", "A model-graded or statistical check whose result can vary and must keep its prompt, model and confidence."],
  ["Human review", "An operator judgment of correctness, relevance, safety and usefulness that automated checks cannot settle alone."],
  ["Golden evaluation", "A trusted test case with reviewed expected behaviour that should keep passing as the harness changes."],
  ["Baseline / candidate", "The trusted earlier version and the proposed new version compared on the same cases."],
  ["Regression gate", "A pass-or-block rule that prevents a weaker candidate from being accepted automatically."],
  ["Immutable lineage", "Append-only links from dataset and harness version to run, review revision and comparison."],
  ["Harness refinement", "Improving prompts, tools, retrieval, memory, policies or workflow logic from evaluation evidence."],
  ["Model fine-tuning", "Updating model weights in a separate governed training pipeline. The Studio only prepares candidate evidence."],
];

const GOAL_PLANS = {
  evidence: {
    deterministic: ["Validate required source fields", "Check every claim-to-evidence link", "Reject missing line or URL provenance"],
    probabilistic: ["Judge whether evidence actually supports the claim", "Classify missing context and semantic relevance"],
    human: "Resolve ambiguity, source quality and whether the result is useful for the real task.",
  },
  reliability: {
    deterministic: ["Repeat versioned cases", "Compare schema and latency thresholds", "Block critical failure-count increases"],
    probabilistic: ["Compare semantic consistency across repeated runs", "Grade instruction-following quality"],
    human: "Choose whether a behavioural change is a useful improvement or an unacceptable regression.",
  },
  tool_use: {
    deterministic: ["Validate tool names and argument schemas", "Check approval requirements", "Detect forbidden or duplicated calls"],
    probabilistic: ["Judge whether the selected tool and timing were appropriate", "Grade action relevance to the stated goal"],
    human: "Confirm that the real-world action was necessary, safe and within authority.",
  },
  workflow: {
    deterministic: ["Validate required state transitions", "Check step ordering and completion", "Detect missing hand-offs or artifacts"],
    probabilistic: ["Judge plan coherence and recovery quality", "Grade whether the final outcome satisfies the goal"],
    human: "Confirm business usefulness and whether the workflow result is genuinely complete.",
  },
  safety: {
    deterministic: ["Block forbidden actions", "Require explicit approval events", "Validate privacy and retention labels"],
    probabilistic: ["Classify policy-risk scenarios", "Grade whether escalation was proportionate"],
    human: "Make the final decision for high-impact, ambiguous or policy-sensitive cases.",
  },
  custom: {
    deterministic: ["Start with schema and provenance validation", "Add measurable pass/fail rules", "Version every threshold"],
    probabilistic: ["Add a model grader only where rules cannot express quality", "Record model, prompt and confidence"],
    human: "Define the product-quality decision and correction taxonomy before automating it.",
  },
};

export function recommendEvaluationPlan(goal = "custom", description = "") {
  const text = String(description || "").toLowerCase();
  let resolvedGoal = GOAL_PLANS[goal] ? goal : "custom";
  if (goal === "custom") {
    if (/source|evidence|claim|citation|research|fact/.test(text)) resolvedGoal = "evidence";
    else if (/tool|action|permission|api|browser/.test(text)) resolvedGoal = "tool_use";
    else if (/safe|privacy|approval|policy|risk/.test(text)) resolvedGoal = "safety";
    else if (/workflow|handoff|business|process|complete/.test(text)) resolvedGoal = "workflow";
    else if (/reliable|consistent|regression|repeat/.test(text)) resolvedGoal = "reliability";
  }
  return { goal: resolvedGoal, ...GOAL_PLANS[resolvedGoal] };
}

export const PYTHON_STARTER = `def evaluate_run(run):
    checks = {
        "schema_valid": validate_schema(run),
        "provenance_complete": all_links_resolve(run),
        "critical_failures": count_critical_failures(run),
    }
    return {
        "passed": checks["schema_valid"]
            and checks["provenance_complete"]
            and checks["critical_failures"] == 0,
        "checks": checks,
    }`;
