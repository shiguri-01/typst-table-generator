# Contributor Guide

## Tech Stack

- Language/Runtime: TypeScript; Node 22+.
- Package Manager: pnpm.
- Build/Dev: Vite 7, `@vitejs/plugin-react`, `vite-tsconfig-paths`.
- Framework/Routing: React 19, TanStack Router (+ plugin, React Start, SSR query utils).
- Styling/UI: Intent UI components with Tailwind CSS v4, `tailwind-merge`, `tailwindcss-react-aria-components` (built on React ARIA). Follow React ARIA patterns and a11y conventions.
- Icons: `lucide-react`, `@tabler/icons-react`.
- Testing: Vitest 3 + Testing Library (`@testing-library/react`, `jsdom`).
- Lint/Format: Biome 2.2 via Lefthook (staged-only).

## Project Structure

- `src/` — app code. Routes in `src/routes/`; shared utils in `src/lib/`; styles in `src/styles.css`.
- `public/` — static assets.
- `_docs/` — documentation and work logs (`_docs/spec/` and `_docs/log/`).
- Generated: `src/routeTree.gen.ts` (do not edit).

## Commands

- Dev server: `pnpm dev` → `http://localhost:3000`
- Build: `pnpm build`; Preview: `pnpm serve`
- Tests: `pnpm test`
- Checks: `pnpm check` (safe); Format writes: `pnpm format`
- Hooks install: `pnpm prepare`

## Coding Style & Naming

- TypeScript, 2-space indentation. Prefer functional React components.
- Filenames: routes lowercase with dashes or `index.tsx`; co-located components may use PascalCase.
- Exports: components `PascalCase`; functions/vars `camelCase`.
- UI: Follow Intent UI + React ARIA idioms (roles/labels, keyboard interactions, focus management).

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

- Source of truth: @_docs/spec/ (split into multiple files by topic).
- See @_docs/spec/README.md for the index and relevant sections.
- Update the relevant sections when behavior changes, and add a short "Spec changes" memo (date/summary/impact) with before/after Typst examples when relevant.
- References for Typst output:
  - Typst Tables Guide: <https://raw.githubusercontent.com/typst/typst/refs/heads/main/docs/guides/tables.md>
  - Typst Table Reference: <https://typst.app/docs/reference/model/table/>

## References

- [Intent UI guidance for LLMs and component usage](https://intentui.com/llms.txt)
- Explore other docs by using Context7 MCP Server.
