# Typst export pipeline spike

- Date: 2025-10-26

## Purpose

Typst コード生成のコアロジックを `src/lib/table/model.ts` に実装し、UI 土台のモデルからそのままエクスポートできるようにする。仕様準拠の純粋関数とテストを整える。

## Plan / TODO

- [x] Typst 出力仕様を読み込んで API 形状を決める
- [x] 生成関数・ユーティリティを実装し TSDoc を付ける
- [x] Vitest で出力スナップショットと端ケースを確認する

## Notes (随時追記)

- 設計・検討メモ:
- `renderTableModelToTypst` まわりを `src/lib/table/typst-export.ts` へ分離し、`model.ts` は構造編集ヘルパー専任にした。`TypstExportOptions` で `header`/`strokes`/`caption` をまとめて制御。
- 列幅は `(auto | <pt>)` のタプル、横位置は必要な場合だけ `align` 行を出力。セル単位の `align` は `table.cell` でオーバーライド。
- `#` / `[` / `]` の未エスケープによる Typst エラーを避けるため、偶数個のバックスラッシュ判定で必要最小限のエスケープを実装。
- 気づき/意思決定:
- `strokes` は Map 経由で境界インデックスを計算し、後勝ちで上書きする。line 出力順はインデックス昇順で安定化。
- キャプションがある場合のみ `#figure` 包装。`wrapFigure: false` で将来 UI から切り替えられる余地を残した。
- レビュー指摘に合わせてエスケープ対象を整理し、テストで `#` / `[` ケースを追加して回帰検知を強化。
- 困りごと/対応:
- `pnpm test` が `tinypool ERR_IPC_CHANNEL_CLOSED` で落ちる。`--runInBand`/`--pool=child` も状況変わらず。環境依存とみなして PR 時に再確認する。

## Summary

`renderTableModelToTypst` とオプション型を追加し、`TableModel` 単独で Typst コードを整形して出力できるようになった。行/列ストローク、キャプション (`#figure` 包装)、セルごとの強調・整列など仕様に沿った要素をすべてカバーし、Vitest で代表ケースのスナップショットを押さえた。さらに inline エスケープを `#`・`[`・`]` 対応に拡張し、専用テストを追加済み。

## Next (必要に応じて)

- `pnpm test` が通る環境で再実行し、CI 上での挙動を確認する

## Reflection (感想)

 Typst の行列ストローク周りは境界インデックスの正規化が肝なので、Map + ソートで安定化する実装が素直だった。エスケープは最小限に留めつつ仕様の「ユーザー入力は尊重」を守れたと思う。

## Pre-PR Checklist

- [x] `_docs/spec.md`に必要な変更を反映済み（不要な場合もこの文章を確認したらチェック）
- [x] PR 本文にこのログへのリンクを含めることを確認
