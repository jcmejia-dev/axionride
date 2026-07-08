# Git Workflow

## Branch Strategy

Use short-lived branches for focused work:

- `main`: stable project baseline.
- `feature/<name>`: new feature work.
- `fix/<name>`: bug fixes.
- `docs/<name>`: documentation-only changes.
- `chore/<name>`: maintenance tasks.

## Commit Guidelines

Commits should be small, descriptive, and reviewable. Prefer messages that describe the outcome of the change.

Examples:

- `docs: add project architecture overview`
- `chore: create source folder structure`
- `fix: correct development setup instructions`

## Pull Request Guidelines

- Keep pull requests focused on one concern.
- Link related issues when available.
- Describe testing performed.
- Call out risks, migrations, or follow-up work.
- Request review before merging.

## Release Notes

When production releases begin, release notes should summarize user-facing changes, known issues, and migration steps.

