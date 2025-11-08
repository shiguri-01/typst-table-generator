# Improve CodeBlock copy functionality with error handling and timeout cleanup

- Date: 2025-11-08

## Purpose

Add error handling, timeout cleanup, and extract magic number in CodeBlock component's copy functionality to address issues reported in PR #22 review.

## Plan / TODO

- [x] Create work log file with initial plan
- [ ] Review existing `copyToClipboard` utility from table-editor
- [ ] Add error handling to CodeBlock copy using existing utility pattern
- [ ] Add timeout ref to prevent race conditions on rapid clicks
- [ ] Extract magic number (3000ms) to named constant
- [ ] Create focused tests for the new error handling and timeout behavior
- [ ] Run lint/build/test to validate changes
- [ ] Manual testing of copy functionality in dev server
- [ ] Update documentation if needed

## Notes (随時追記)

- 設計・検討メモ:
  - The project already has a `copyToClipboard` utility in `src/features/table-editor/utils.ts` that handles errors properly
  - We should consider either:
    1. Moving the utility to a shared location (e.g., `src/lib/utils.ts`)
    2. Creating a similar utility specifically for the CodeBlock component
  - A timeout ref using `useRef` will prevent race conditions when users click rapidly
  - Extract the 3000ms magic number to a named constant for better maintainability
  
- 気づき/意思決定:
  - No toast/notification system exists yet in the project
  - For now, we'll show error state inline similar to ExportModal approach
  - Since CodeBlock is a generic UI component, we might want to keep dependencies minimal
  
- 困りごと/対応:
  - TBD

## Summary

TBD

## Next (必要に応じて)

- Consider if `copyToClipboard` utility should be moved to a shared location

## Reflection (感想)

TBD

## Pre-PR Checklist

- [ ] `_docs/spec.md`に必要な変更を反映済み（不要な場合もこの文章を確認したらチェック）
- [ ] PR 本文にこのログへのリンクを含めることを確認
