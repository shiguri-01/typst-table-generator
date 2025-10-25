# Intent UI review note log

- Date: 2025-10-25

## Purpose
- Capture the rationale and steps for clarifying AGENTS.md guidance about reviewing Intent UI sourced components.

## Plan / TODO
- [x] Confirm existing guidance in `AGENTS.md` related to component review.
- [x] Update `AGENTS.md` to mention that `src/components/ui` mirrors Intent UI downloads and needs only light review.
- [x] Re-read the updated section to ensure tone and clarity fit the doc.

## Notes
- Initial review: no explicit mention of Intent UI component maintenance policies.
- Added contributor note under "Notes for Contributors" to clarify review expectations.

## Summary
- Added reviewer guidance about Intent UI-sourced components to `AGENTS.md`.

## Next
- None.

## Reflection
- Quick tweak, but worth documenting so reviewers stay focused on integration concerns.

## Pre-PR Checklist
- [ ] `_docs/spec.md` 更新（該当章 + 「Specの変更点」メモ）（必要に応じて）
- [ ] `bun run check` を通過
- [ ] `bun run test` を通過（必要なテストを追加）
- [ ] `bun run build`（ビルド/ランタイムに影響がある場合）
- [ ] `bunx lefthook run pre-commit`（任意）
- [ ] 変更は小さくフォーカスされている
