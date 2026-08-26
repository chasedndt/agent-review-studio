# Repository Instructions

Run the local server and open the preview in the in-app browser when making product changes. Do not hand off an unverified static mock.

Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the verified local product can later be handed to Sites without reinitialization. Do not deploy, push or publish without explicit operator authority.

## Current product decisions

- The product name is **Agent Review Studio**.
- The product is agent-agnostic. **Chaser Agent** is a built-in example workspace, not the global brand.
- The selected visual direction is the Evidence Operations Console: clear stages, paired claim/evidence, visible provenance and linked actions, quiet structural checks, five once-per-run ratings and persistent onboarding access. Dark and light modes are equal product surfaces.
- Optimize first for a new reviewer understanding what to do, what the data means and what remains immutable.
- Open on the operator session overview. Treat deterministic generation and development QA as wiring evidence, never as a completed human review.
- Bundle diagnostics may validate structure and references but must never auto-score a human quality dimension.
- The work is agent evaluation, evidence curation, benchmark engineering and harness refinement—not model-weight fine-tuning.
- Source run artifacts are immutable. Reviews, drafts, exports and revision lineage must remain separate from source evidence.
- Preserve every imported file. Known adapters may normalize artifacts into review panels, but unfamiliar files must stay visible in the run manifest.
- Re-review creates a new linked revision. Never overwrite a finished human judgement.
- Use IndexedDB for imported blobs/run bundles and browser-local storage for small settings, drafts and revision records until a governed backend is deliberately selected.
- The operator authorized a public standalone repository, live deployment, Apache-2.0 license and ChaseInTech project feature on 2026-08-26. Publishing authority applies to this repository and the isolated site worktree only; source evidence, Chaser Agent core and unrelated dirty work remain protected.
- Keep this repository separate from the public Chaser Agent core.

## Verification gate

Before handoff, run:

```powershell
npm test
npm run build
```

Then verify the primary flow in the in-app browser, check desktop and compact widths, check the console, compare the implementation with the selected visual source, and update `design-qa.md` to `final result: passed` only when no actionable P0/P1/P2 issue remains.
