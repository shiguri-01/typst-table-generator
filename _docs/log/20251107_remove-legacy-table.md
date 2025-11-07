# Remove legacy src/lib/table/ directory

- Date: 2025-11-07

## Purpose

Remove the legacy table code in `src/lib/table/` that has been replaced by the new domain model in `src/domain/typst/table/`. All functionality has been migrated to the new implementation as part of PR #28.

## Plan / TODO

- [x] Verify no imports or references to `src/lib/table/` exist outside test files
- [x] Run tests to confirm current state
- [ ] Remove the `src/lib/table/` directory
- [ ] Run tests to confirm functionality still works with new implementation
- [ ] Run build and checks to ensure no issues
- [ ] Commit changes

## Notes (随時追記)

- 設計・検討メモ:
  - The legacy directory contains 5 files: index.ts, model.ts, model.test.ts, typst-export.ts, typst-export.test.ts
  - No production code references the legacy directory - all code uses the new domain model
  - The legacy code was introduced in PR #28 alongside the new domain model but was never used
  
- 気づき/意思決定:
  - All tests currently pass (97 tests total, including 14 tests in the legacy directory)
  - After removal, we expect 83 tests to remain
  - The `src/features/table-editor/export.ts` uses the new domain model, not the legacy code

## Summary

今回の変更の要点と影響範囲。

## Next (必要に応じて)

- 次にやること/残課題

## Reflection (感想)

感じたこと、学び、気づきなどを短く。

## Pre-PR Checklist

- [ ] `_docs/spec.md`に必要な変更を反映済み（不要な場合もこの文章を確認したらチェック）
- [ ] PR 本文にこのログへのリンクを含めることを確認
