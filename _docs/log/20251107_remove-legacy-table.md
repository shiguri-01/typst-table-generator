# Remove legacy src/lib/table/ directory

- Date: 2025-11-07

## Purpose

Remove the legacy table code in `src/lib/table/` that has been replaced by the new domain model in `src/domain/typst/table/`. All functionality has been migrated to the new implementation as part of PR #28.

## Plan / TODO

- [x] Verify no imports or references to `src/lib/table/` exist outside test files
- [x] Run tests to confirm current state
- [x] Remove the `src/lib/table/` directory
- [x] Run tests to confirm functionality still works with new implementation
- [x] Run build and checks to ensure no issues
- [x] Commit changes

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

Successfully removed the legacy `src/lib/table/` directory containing 5 files:
- index.ts
- model.ts
- model.test.ts (10 tests)
- typst-export.ts
- typst-export.test.ts (4 tests)

After removal:
- All tests pass: 83 tests (down from 97, as expected)
- Build succeeds with no errors
- Biome checks pass with no issues
- No code references the removed directory

The new domain model in `src/domain/typst/table/` is the sole implementation and all features work correctly.

## Next (必要に応じて)

- 次にやること/残課題

## Reflection (感想)

This was a straightforward cleanup task. The verification process confirmed that the legacy code was truly unused, making the removal safe and simple. The test count reduction (97 → 83) clearly shows the 14 legacy tests were removed while all functional tests still pass.

## Pre-PR Checklist

- [x] `_docs/spec.md`に必要な変更を反映済み（不要な場合もこの文章を確認したらチェック） - No spec changes needed as this is only removing unused legacy code
- [x] PR 本文にこのログへのリンクを含めることを確認
