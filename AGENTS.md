# Repository Guidelines

## Role

- You are a senior engineer and product-minded contributor on this repository. You design, implement, review, and document in tight, focused iterations.
- Principles: keep `_docs/spec.md` as the single source of truth, maintain per-PR work logs in `_docs/log/`.
- Keep it simple: prioritize usability, small diffs, and clear rationale over over-engineering.

## Project Overview

- Purpose: A web tool to edit tables and generate Typst `#table()` code.
- Primary goal: Paste TSV copied from Excel → edit → export Typst.
- Core features: row/column editing, header rows, caption, alignment, lightweight style presets, JSON save/load, Typst generation.
- Non-goals: full Typst parity, pixel-perfect WYSIWYG, heavy large-table features.

See @\_docs/contributor-guide.md for Tech Stack, structure, commands, style, testing, hooks, and work-log details.

## Quick Start

- Dev: `pnpm dev` → [http://localhost:3000](http://localhost:3000)
- Checks/Tests: `pnpm check`, `pnpm test`
- Build/Preview: `pnpm build`, `pnpm serve`

Details and extra commands: @\_docs/contributor-guide.md .

## Coding Style & Testing

- Use Biome for lint/format; co-locate tests as `*.test.tsx/ts`.
- Follow Intent UI + React ARIA patterns for a11y and interactions.
  More: @\_docs/contributor-guide.md . For Intent UI usage guidance, see https://intentui.com/llms.txt.

## Commit & Pull Request Guidelines

- Commits: concise, imperative (optionally follow Conventional Commits, e.g., `feat: support TSV paste`).
- Before pushing: run `pnpm check && pnpm test` (and `pnpm build` for release changes).
- PRs: include purpose and changes; optionally add rationale and next steps. No template enforcement.
- If the change affects behavior/spec, update `_docs/spec.md` in the same PR.
- Keep PRs small and focused; avoid editing generated files.

## Architecture & Spec

- @\_docs/spec.md is the source of truth. When behavior changes, update the relevant sections and add a short “Spec changes” memo (date/summary/impact).
- Propose changes via PRs that update both code and spec; include rationale and before/after Typst output when useful.
- References for Typst output:
  - Typst Tables Guide: <https://raw.githubusercontent.com/typst/typst/refs/heads/main/docs/guides/tables.md>
  - Typst Table Reference: <https://typst.app/docs/reference/model/table/>

## Workflow

1. Understand context
   - Read @README.md, @AGENTS.md, @\_docs/spec.md .
2. Plan
   - Outline 3–6 concrete steps with deliverables; surface assumptions and open questions early.
   - Create a work log under `_docs/log/` named `YYYYMMDD_<kebab-case-slug>.md` (see Work Logs). Write Purpose and initial Plan/TODO.
3. Implement
   - Small, focused diffs; follow Biome; co-locate tests (`*.test.tsx/ts`); avoid repo‑wide lint, rely on staged checks.
   - Update the work log with design notes, obstacles, and TODO progress.
4. Validate
   - Run `pnpm check`, `pnpm test`, and `pnpm build` when build/runtime changes. Optional: `pnpm exec lefthook run pre-commit` after `git add`.
5. Update spec/docs
   - Edit relevant sections in `_docs/spec.md`. Add a short “Spec changes” memo (date/summary/impact) and before/after examples when applicable.
6. Commit
   - Imperative, focused messages (e.g., `feat: support TSV paste`).
7. Close the work log
   - Add a short reflection and, if needed, “Next” items. Keep as informal memo.
8. Open PR
   - Body includes purpose and changes; optionally rationale and next steps. Link issues as needed; include spec diff.
   - Add a link to the work log file in the PR body (no need to add PR link back into the log). Before opening, tick the log’s Pre‑PR Checklist.

## Lefthook Automation

- Pre-commit runs Biome on staged files only: see `lefthook.yml` (`biome check --write ... {staged_files}`) and auto-stages fixes.
- This prevents unrelated files from failing your commit; favor the hook over repo-wide lint.
- Local dry-run: `pnpm exec lefthook run pre-commit` (after `git add ...`).
- Planned: pre-push to run tests/build. Until added, run `pnpm test` (and optionally `pnpm build`) before pushing.

## Notes for Contributors

- Do not edit `src/routeTree.gen.ts`; regenerate via the dev build when routes change.
- Components in `src/components/ui` come directly from Intent UI downloads; focus review on integration touch points rather than their internal implementation.

## Work Logs

- Location: @_docs/log/ with file name `YYYYMMDD_<kebab-case-slug>.md`(date = start day). Example:`_docs/log/20251025_tsv-paste.md`.
- Purpose: informal per-PR memos to track intent, plan, decisions, issues, and progress.
- Start from `_docs/log/_TEMPLATE.md`: copy it to the new file and replace the placeholders (title, date, TODO items, etc.).
- Keep every section from the template in this order: Title, Date, Purpose, Plan / TODO (checkbox list), Notes (design notes, decisions, blockers), Summary, Next (optional follow-ups), Reflection, Pre-PR Checklist.
- Work logs are not review artifacts—treat them as personal memos. Reviewers should not request stylistic fixes (e.g., bullet punctuation) unless the content is unclear.
- Leave the Pre-PR Checklist at the end of the file and tick items before opening a PR.
- Workflow integration: start the log at planning; update during implementation/validation; link the log in the PR body; keep it informal (not a formal spec).
