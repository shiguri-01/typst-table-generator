# style preset spec clarifications

- Date: 2025-10-25

## Purpose
`stylePreset` の意味と適用ルールを仕様に落とし込み、実装が迷わないようにする。

## Plan / TODO
- [x] 既存仕様の関連箇所を洗い出す
- [x] プリセットごとの挙動(線・余白・文字装飾)を定義
- [x] `_docs/spec.md` に追記し、影響範囲を記述
- [x] 必要に応じて今後の拡張メモを残す

## Notes (随時追記)
- 設計・検討メモ:
  - プリセットは Typst `table` の `stroke`, `gutter`, `inset`, `text` をまとめて制御する。
  - JSON では識別子だけ保持し、UI/生成側で辞書を引く方式にする。
- 気づき/意思決定:
  - `stylePreset` 未指定時は `default` を適用し、今後拡張しても下位互換を保つ。
- 困りごと/対応:
  - Booktabs 風の太い線の値は Typst の長さ指定が必要→ `0.8pt` `1pt` を目安にする。

## Summary
`stylePreset` を辞書参照ベースと明言し、`default`/`booktabs` の線幅・余白・ヘッダー装飾を仕様化。

## Next (必要に応じて)
- 追加プリセットを検討する際は `PresetDefinition` の型定義を固める

## Reflection (感想)
プリセットの線幅を Typst の想定値で固定できたので、実装側の迷いが減りそう。

## Pre-PR Checklist
- [x] `_docs/spec.md` 更新（該当章 + 「Specの変更点」メモ）（必要に応じて）
- [ ] `bun run check` を通過
- [ ] `bun run test` を通過（必要なテストを追加）
- [ ] `bun run build`（ビルド/ランタイムに影響がある場合）
