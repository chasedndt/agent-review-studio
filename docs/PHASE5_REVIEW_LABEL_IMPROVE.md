# Review, label, improve upgrade

## Product promise

Agent Review Studio turns completed agent runs into trusted improvement examples:

1. Review the task, evidence and agent output.
2. Label quality with five 0–3 ratings, a decision and an exact correction.
3. Save an immutable reviewed example.
4. Improve prompts, retrieval, tools, workflow logic, approval policy or memory rules.
5. Run the task again and compare through a linked re-review.

## Training boundary

This is human evaluation and data curation. A reviewed example may be selected later for a governed training dataset, but the Studio does not automatically train a model, modify model weights, promote memory or execute actions.

## Portable handoff

Review exports use `agent_review_studio.review.v4`; session packs use `agent_review_studio.session_evaluation.v2`. Both now carry a `learning_handoff` block that states the artifact purpose, intended uses, improvement targets and training authorization boundary.

## Verification

Final test, build, browser, responsive, interaction and deployment evidence is recorded in `design-qa.md` and the release handover.
