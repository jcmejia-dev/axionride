# Git Workflow

## Branch Strategy

AxionRide uses a professional lightweight Git flow:

- `main`: stable baseline. Code on `main` should build and pass project health checks.
- `develop`: optional integration branch for batches of work before a release. Use it only when multiple active branches need integration before `main`.
- `feature/<scope>`: new product or engineering work.
- `fix/<scope>`: non-urgent bug fixes.
- `docs/<scope>`: documentation-only changes.
- `chore/<scope>`: maintenance that does not change app behavior.
- `hotfix/<scope>`: urgent fixes branched from `main`.
- `release/<version>`: release stabilization when formal releases begin.

For solo development, branch from `main` by default. Branch from `develop` only when `develop` is actively being used for release integration.

## Branch Naming Rules

Use lowercase kebab-case:

- `feature/garage-profile`
- `fix/router-imports`
- `docs/architecture-rules`
- `chore/project-structure`
- `hotfix/splash-crash`
- `release/0.1.0`

Branch names should describe the work, not the implementation details.

## Commit Message Format

Use concise conventional-style commits:

```text
type(scope): summary
```

Valid types:

- `feat`: user-facing feature.
- `fix`: bug fix.
- `docs`: documentation-only change.
- `chore`: maintenance.
- `refactor`: code restructuring without behavior change.
- `test`: test-only change.
- `build`: build, dependency, or tooling change.
- `ci`: CI workflow change.

Examples:

- `docs(governance): define ai engineering rules`
- `refactor(structure): move shared code into src`
- `fix(router): correct typed external link href`

Keep commits small enough to review. Do not hide unrelated changes inside a broad commit.

## Pull Request Flow

1. Start from an up-to-date base branch.
2. Create a focused branch.
3. Make the smallest coherent change.
4. Run relevant checks before opening the PR.
5. Update documentation when the change affects architecture, setup, workflow, data, security, or behavior.
6. Open a PR with a clear summary, testing notes, risks, and follow-up work.
7. Review the diff for accidental generated files, unrelated formatting, secrets, and package changes.
8. Merge only after the review checklist is satisfied.

Even for solo development, use PRs for non-trivial work so decisions and validation stay traceable.

## Review Checklist

Before merging, verify:

- The change matches the task or issue.
- The branch is focused on one concern.
- Expo Router and `app/` route boundaries are preserved.
- Reusable application code belongs under `src/`.
- Screens stay thin and behavior changes are intentional.
- TypeScript errors are not ignored.
- Offline-first implications are considered for data workflows.
- Security-sensitive data is not exposed.
- Documentation is updated when needed.
- Required checks were run and results are recorded.
- No unrelated package, lockfile, or generated changes are included.

## Merge Rules

- Merge to `main` only when the branch is ready to be treated as stable.
- Prefer squash merge for small focused branches.
- Preserve merge commits only when a branch has meaningful multi-commit history.
- Do not merge with failing required checks unless the failure is documented and accepted.
- Do not force-push shared branches without explicit agreement.

## Hotfix Flow

Use hotfix branches for urgent production or release-blocking problems:

1. Branch from `main`: `hotfix/<scope>`.
2. Make the smallest safe fix.
3. Run targeted validation plus `npx.cmd tsc --noEmit` and `npx.cmd expo-doctor` when practical.
4. Open a PR into `main`.
5. After merge, backport or merge the hotfix into `develop` if `develop` exists.
6. Document the cause, fix, and release impact.

## Release Flow

Formal releases should use `release/<version>` branches once the app has releasable product scope:

1. Branch from `develop` if it exists, otherwise from `main`.
2. Allow only release stabilization changes on the release branch.
3. Update release notes and any versioned documentation.
4. Run full validation.
5. Merge into `main`.
6. Tag the release from `main`.
7. Merge release changes back into `develop` if `develop` exists.

Release notes should include user-facing changes, migration notes, known issues, and validation performed.
