# Contributing to AxionRide

## Overview

AxionRide is currently a solo developer project, but it should still be maintained with professional standards. Keep changes small, documented, and easy to review later.

## How To Start Work

1. Confirm the task is clear.
2. Check the current branch and working tree.
3. Read the relevant docs before editing.
4. For Expo-specific code, use the Expo SDK 57 documentation.
5. Identify whether the task is code, docs, architecture, or governance.
6. Avoid touching unrelated files.

## Create A Branch

Use a focused branch from `main` unless a `develop` integration branch is active:

```bash
git checkout main
git pull
git checkout -b docs/governance-rules
```

Use branch prefixes consistently:

- `feature/<scope>` for new product behavior.
- `fix/<scope>` for bug fixes.
- `docs/<scope>` for documentation-only changes.
- `chore/<scope>` for maintenance.
- `refactor/<scope>` for restructuring without behavior changes.
- `hotfix/<scope>` for urgent fixes from `main`.

## Test Before Committing

Run checks that match the change:

- `npx.cmd tsc --noEmit` for TypeScript, imports, architecture, or refactors.
- `npx.cmd expo-doctor` for Expo project health.
- Platform runs when UI, navigation, permissions, or native behavior changes.

If a check cannot run, record the exact command and failure reason in the PR notes.

## Write Commits

Use concise conventional-style commit messages:

```text
docs(governance): define ai engineering constitution
```

Good commits are:

- Small.
- Focused.
- Descriptive.
- Free of unrelated formatting or generated noise.

Avoid commits that combine docs, features, refactors, and package changes unless the task requires that combination.

## Open Pull Requests

Open a PR for non-trivial changes, even when working solo. A PR should include:

- Summary of the change.
- Files or areas affected.
- Validation commands run.
- Screenshots for UI changes when practical.
- Risks, migrations, or follow-up work.

Review your own diff before merging. Look for accidental package changes, secrets, unrelated files, and behavior changes outside the task.

## Update Docs

Update documentation when a change affects:

- Architecture.
- Setup or commands.
- Git workflow.
- Security expectations.
- Data storage or sync.
- API boundaries.
- User-visible behavior.

Docs should explain current rules and decisions. Do not leave stale folder structures or workflow instructions behind.

## Work With Codex Safely

When using Codex or another AI assistant:

- Give a focused task and explicit boundaries.
- Tell it when package changes, installs, file moves, or behavior changes are forbidden.
- Require validation commands in the task.
- Review every diff before accepting it.
- Do not allow it to commit secrets.
- Do not allow `npm audit fix`, broad dependency upgrades, or destructive Git commands unless intentionally requested.
- Ask it to summarize files changed, checks run, and remaining warnings.

Codex should preserve Expo Router, keep route files thin, place reusable code under `src/`, and distinguish project issues from issues caused by its changes.
