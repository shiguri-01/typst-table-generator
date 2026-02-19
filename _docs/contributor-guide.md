# Contributor Guide

## Tech Stack

- Language/Runtime: TypeScript; Node 22+.
- Package Manager: pnpm.
- Build/Dev: Vite 7, `vite-plugin-solid`, `vite-tsconfig-paths`.
- Framework/Routing: SolidJS 1.9, `@tanstack/solid-router`.
- Styling/UI: Tailwind CSS v4, `class-variance-authority`, `clsx`, `tailwind-merge`, Kobalte UI primitives.
- Grid: `@shiguri/solid-grid` (`0.1.2` fixed).
- Icons: `@tabler/icons-solidjs`.
- Testing: Vitest 3 + Solid Testing Library (`@solidjs/testing-library`, `jsdom`).
- Lint/Format: Biome 2.2 via Lefthook (staged-only).

## Project Structure

@_docs/architecture.md

## Commands

- Dev server: `pnpm dev` → `http://localhost:3000`
- Build: `pnpm build`; Preview: `pnpm serve`
- Tests: `pnpm test`
- Checks: `pnpm check` (safe); Format writes: `pnpm format`
- Hooks install: `pnpm prepare`

## Coding Style & Naming

- TypeScript, 2-space indentation. Prefer functional Solid components.
- Filenames: routes lowercase with dashes or `index.tsx`; co-located components may use PascalCase.
- Exports: components `PascalCase`; functions/vars `camelCase`.
- UI: Build app-specific wrappers under `src/components/ui` using Kobalte primitives and `cva` variants.

## Testing Guidelines

- Co-locate tests as `*.test.tsx/ts` near sources.
- Unit-test utilities; behavior-driven tests for routes/components.
- Use Testing Library patterns (query by role/label) to preserve a11y.

## Lefthook Automation

- pre-commit: `pnpm exec biome check --write … {staged_files}`
- pre-push: `pnpm exec tsc --noEmit`, `pnpm exec vitest run`, `pnpm build`
- Hooks may auto-skip when Git sees no diff. Do not bypass them manually. Dry-run with `pnpm exec lefthook run pre-push --force`.

## CI

- Workflow: `.github/workflows/ci.yml`
- Triggers: push / pull_request to `main`, manual run
- Steps: `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm exec vitest run`, `pnpm build`
- Treat CI as canonical; investigate and fix failures before merging.

## Work Logs

- Location: @_docs/log/ with `YYYYMMDD_<kebab-case-slug>.md` (date = start day).
- Structure: Title/Date; Purpose; Plan/TODO; Notes; Reflection; Summary/Next; Pre-PR Checklist.
- Create at planning; update during work; link from the PR body.

## Architecture & Spec

- Architecture docs　( @_docs/architecture.md ): overall structure, folder guide
- Spec docs　( @_docs/spec/ ): application specs
  - See @_docs/spec/README.md for the index and relevant sections.
- Update the relevant sections when behavior changes, and add a short "Spec changes" memo (date/summary/impact) with before/after Typst examples when relevant.
- References for Typst output:
  - Typst Tables Guide: <https://raw.githubusercontent.com/typst/typst/refs/heads/main/docs/guides/tables.md>
  - Typst Table Reference: <https://typst.app/docs/reference/model/table/>

## References

- [Kobalte Documentation](https://kobalte.dev/docs/core/overview/introduction/)
- [solid-grid repository](https://github.com/shiguri-01/solid-grid)

## Spec changes

> **Spec change (2026-02-19)** React/React ARIA/Intent UI 前提を削除し、SolidJS + Kobalte + `@shiguri/solid-grid` 前提へ更新。
