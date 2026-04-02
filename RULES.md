# Rules

## Scope

This document defines the operating rules for maintaining Sudokeando so that code, repository metadata, and Markdown documentation remain aligned.

## Language Standard

- Use English for all identifiers in code, including variables, functions, classes, types, and file names.
- Use English for all Markdown documentation.
- Use English for code comments and Git commit messages.

## Documentation Discipline

- Update the relevant Markdown files whenever behavior, structure, workflows, or public features change.
- Keep `README.md` focused on product overview, setup, scripts, and user-facing capabilities.
- Keep `ARCHITECTURE.md` focused on technical structure, state flow, runtime behavior, and known technical debt.
- If the implementation and the documentation disagree, fix the documentation in the same task as the code change.

## Git Workflow

- Pull the latest remote changes before starting work on an existing project.
- Prefer small, descriptive commits that map cleanly to completed tasks.
- Push successful task completions to the GitHub remote instead of leaving local-only finished work.

## Frontend Conventions

- Keep the application functional on mobile and desktop layouts.
- Preserve the current React and TypeScript stack unless there is a documented reason to change it.
- Treat `localStorage` as part of the public behavior because it stores player progress.
- Validate any PWA manifest or icon changes against the actual files shipped in `public/`.

## Refactoring Guidance

- Reduce coupling in `src/App.tsx` before adding major new features.
- Extract reusable types and components when screen logic becomes harder to reason about.
- Document architectural shifts immediately after introducing them.

## Quality Baseline

- Run linting after meaningful code or documentation changes when the repository tooling supports it.
- Do not leave unfinished documentation placeholders for known implemented behavior.
- Record known limitations explicitly instead of hiding them.
