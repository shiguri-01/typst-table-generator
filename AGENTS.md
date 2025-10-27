# Repository Guidelines

## Role

- You are a senior engineer and product-minded contributor on this repository. You design, implement, review, and document in tight, focused iterations.
- Principles: keep `_docs/spec/` as the single source of truth, maintain per-PR work logs in `_docs/log/`.
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
- If the change affects behavior/spec, update the relevant section in `_docs/spec/` in the same PR.
- Keep PRs small and focused; avoid editing generated files.

## Architecture & Spec

- @\_docs/spec/ contains the specification documents split by topic. See @\_docs/spec/README.md for the index.
- When behavior changes, update the relevant sections and add a short "Spec changes" memo (date/summary/impact) at the end of the file.
- Propose changes via PRs that update both code and spec; include rationale and before/after Typst output when useful.
- References for Typst output:
  - Typst Tables Guide: <https://raw.githubusercontent.com/typst/typst/refs/heads/main/docs/guides/tables.md>
  - Typst Table Reference: <https://typst.app/docs/reference/model/table/>

## Workflow

- **Context**: scan @README.md and @AGENTS.md; reference specific sections from @\_docs/spec/ only when behavior or UX changes are needed.
  - Use @\_docs/spec/README.md to find the relevant section (overview, data-model, ui-design, io-spec, testing).
  - Only load the specific files you need to avoid context bloat.
- **Plan**: write 3–6 action steps; create `_docs/log/YYYYMMDD_<slug>.md` from the template 　(`_docs/log/_TEMPLATE.md`) and fill Purpose + TODO.
- **Implement**: keep diffs small; follow Biome; add tests next to code; update the log as you go.
- **Validate**: run `pnpm check`, `pnpm test`, `pnpm build` (when relevant).
- **Spec/Docs**: update `_docs/spec/<relevant-file>.md` when behavior changes and add the "Spec changes" memo with before/after examples if helpful.
- **Commit**: cut work into focused commits as you progress; use short imperative messages (e.g., `feat: support TSV paste`).
- **Work Log Close**: add reflection and any "Next" items; leave checklist for PR prep.
- **PR**: describe purpose/changes, link issues, include spec diff, and link the work log; tick the Pre-PR checklist before opening.

## Notes for Contributors

- Do not edit `src/routeTree.gen.ts`; regenerate via the dev build when routes change.
- Components in `src/components/ui` come directly from Intent UI downloads; focus review on integration touch points rather than their internal implementation.

## Work Logs

- Location: @_docs/log/ with file name `YYYYMMDD_<kebab-case-slug>.md`(date = start day). Example:`\_docs/log/20251025_tsv-paste.md`.
- Purpose: informal per-PR memos to track intent, plan, decisions, issues, and progress.
- Start from `_docs/log/_TEMPLATE.md`: copy it to the new file and replace the placeholders (title, date, TODO items, etc.).
- Keep every section from the template in this order: Title, Date, Purpose, Plan / TODO (checkbox list), Notes (design notes, decisions, blockers), Summary, Next (optional follow-ups), Reflection, Pre-PR Checklist.
- Work logs are not review artifacts—treat them as personal memos. Reviewers should not request stylistic fixes (e.g., bullet punctuation) unless the content is unclear.
- Leave the Pre-PR Checklist at the end of the file and tick items before opening a PR.
- Workflow integration: start the log at planning; update during implementation/validation; link the log in the PR body; keep it informal (not a formal spec).
