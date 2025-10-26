# Table stroke model refinement

- Date: 2025-10-26
- Purpose: Revisit the table data model to support row/column stroke control and reposition style presets as export-time helpers.

## Plan / TODO
- [x] Capture current pain points and assumptions about stroke editing in Notes.
- [x] Update `_docs/spec.md` with the refined `TableModel` (stroke arrays, no persisted preset id).
- [x] Describe the export algorithm for strokes and preset helpers。
- [x] Decide on follow-up questions or open issues after the spec change。

## Notes
- ユーザー要望: 行の上下・列の左右に線を入れられる程度の柔軟性が欲しいが、セル単位や部分的な線は不要。
- `TableModel` に線情報を直接持たせ、UI で編集→JSON へ保存→Typst 変換する流れが分かりやすいと判断。
- プリセットは永続フィールドではなく、`applyPreset` 関数でモデルへ書き戻すワークフローに変更。

## Summary
- `TableModel` へ `strokes` を追加し、行/列境界ごとの線幅を `RowStroke` / `ColumnStroke` に格納する方針を策定。
- プリセットは関数として `TableModel` を受け取り `strokes` や `table` 引数を返す設計に再定義。
- Typst 出力時の `table.hline`/`table.vline` 生成ルールを文書化。

## Next
- プリセット定義の型と実装サンプルをまとめる (別タスク)。
- UI 側の線編集 UX (境界ハイライト/オンオフ) を要検討。

## Reflection
- 行/列境界に絞ることで Typst の `hline`/`vline` 呼び出しが単純に整理できた。セル単位の線指定は現行ゴールから外して負担を避けられた。

## Pre-PR Checklist
- [x] Spec updated (if required)
- [ ] Tests added/updated (if required)
- [x] Work log updated
- [ ] Typst example updated (if required)
