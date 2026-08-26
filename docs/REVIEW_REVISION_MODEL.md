# Review revision model

## States

```text
Imported immutable run bundle
        |
        v
Local mutable draft
        |
        | Finish review
        v
Immutable review revision + JSON export
        |
        | Re-review
        v
New draft with parent_revision_id
        |
        v
New immutable successor revision
```

Source artifacts never move through this state machine. Only human judgement changes.

## Draft

A draft is keyed by review-instance ID and contains:

- five 0–3 ratings;
- final decision;
- correction notes;
- inspected claim IDs;
- explicit completion flags for the review contract, source card, actions, memory, uncertainty and run log;
- status and update timestamp;
- optional parent revision ID when created through Re-review.

Drafts may be overwritten because they are unfinished working state.

## Finished review revision

Finishing creates `agent_review_studio.review.v3` with:

- a unique `revision_id`;
- optional `parent_revision_id`;
- workspace, agent and reviewer identity;
- dated session and review-instance identity;
- source run, source and workflow identities;
- rating vector, total, decision and correction notes;
- inspected claims and explicit completion flags for every canonical artifact group;
- `source_artifacts_mutated: false`.

The exact same record is saved to local revision history and exported as JSON.

## Re-review and re-ranking

Re-review copies the earlier judgement into a new draft and records the earlier revision as its parent. The operator may change any rating, decision or correction. Finishing creates a successor revision; the History workspace then shows score and decision movement from the parent.

This is revisioned human evaluation, not continuous model training. A later pipeline may select reviewed revisions for golden benchmarks, prompt changes, regression tests or training data, but that promotion requires a separate governed decision.
