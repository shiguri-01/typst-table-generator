# Raw Typst cell output adjustments

- Date: 2025-10-26

## Purpose
セル文字列をそのまま Typst コードとして扱う仕様にそろえ、不要な `linebreak()` 変換の記述を排除する。

## Plan / TODO
- [x] 仕様内の `linebreak()` 変換に関する記述を洗い出す
- [x] `Cell.text` と `caption` まわりの説明を「生の Typst マークアップを出力する」に改訂する
- [x] 仕様変更メモと本ログを更新して完了チェック

## Notes (随時追記)
- 設計・検討メモ:
  - `Cell.text` を「プレーンテキスト」ではなく「Typst マークアップの断片」と表現することで、変換せずに埋め込む意図を明文化。
- 気づき/意思決定:
  - `caption` も同じ扱いにし、行頭に `linebreak()` を挿入する仕様を撤廃。
- 困りごと/対応:
  - なし。


## Summary
- `_docs/spec.md` の `Cell.text` と `caption` 説明を更新し、`linebreak()` の自動挿入をやめて生の Typst 文字列を利用する方針を確定。
- Spec change (2025-02-18) を追記して履歴を明示。

## Next (必要に応じて)
- なし。

## Reflection (感想)
- 「テンプレートとして最低限の補助に留める」という方針に沿って、余計な自動整形を避ける判断が明文化できた。

## Pre-PR Checklist
- [x] `_docs/spec.md` 更新（該当章 + 「Specの変更点」メモ）（必要に応じて）
- [ ] `bun run check` を通過
- [ ] `bun run test` を通過（必要なテストを追加）
- [ ] `bun run build`（ビルド/ランタイムに影響がある場合）
