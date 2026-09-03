# Version 1.5 agent-agnostic first run

Date: 3 September 2026

## Repo-truth delta

Earlier versions automatically inserted a permanent Chaser Agent workspace and loaded four Chaser-specific demonstration runs. That contradicted the standalone product boundary: Agent Review Studio is for any agent or harness, while Chaser Agent is one operator's personal instance.

Version 1.5 removes that product-level default. A fresh browser starts with no workspace and asks the operator to create and name the system under evaluation.

## Current behaviour

- Fresh installations contain no Chaser Agent workspace, harness identity or run data.
- The first-run workspace form captures the workspace name, agent/harness name, intended outcome and primary evaluation goal.
- Every workspace uses the same `local` lifecycle and can be renamed, archived, restored or permanently deleted after exact-name confirmation.
- Deleting or archiving the last active workspace returns to the neutral first-run state; archived workspaces can be restored from the Workspace menu.
- The optional localhost adapter is named `local_bridge`, not after a particular agent.
- Chaser Agent case-study fixtures remain available for deliberate import and regression testing, but are never injected into another user's workspace list.

## Existing personal-instance migration

If browser storage contains the former `built-in` workspace record, the Studio converts it into an ordinary local workspace. Its bundled personal evaluation runs are written once to IndexedDB before the migration marker is removed. After migration, that workspace has no special protection and can be deleted like any other.

The legacy workspace ID is recognised only inside this bounded migration path. It is not used as the product default, selected workspace, initial harness or empty-state fallback.

## Safety boundaries

- Migration preserves local runs and review linkage; it does not publish or transmit them.
- Deletion still requires the exact workspace name and removes only that workspace's browser-local runs, reviews and configuration.
- Source fixtures remain separate from personal browser state.
- No Chaser Agent repository source, hosted deployment, remote provider, model weights or public site was changed in this phase.

## Verification

- Fresh-storage tests assert that zero workspaces are injected.
- Migration tests assert that a legacy built-in record becomes an ordinary local workspace.
- Browser QA covers the migrated personal instance, deletion availability and a fresh isolated browser state.
