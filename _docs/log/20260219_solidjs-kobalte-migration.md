# SolidJS/Kobalte Migration

- Date: 2026-02-19

## Purpose

React + React Aria + react-datasheet-grid 構成を SolidJS + Kobalte + @shiguri/solid-grid に置き換える。  
UI 基盤を `cva` と `cn` に統一し、既存の表編集と Typst 出力機能を維持する。

## Plan / TODO

- [x] 新規ブランチ `feat-solidjs-kobalte-migration` で作業開始
- [x] 依存関係とビルド設定を SolidJS 向けに移行
- [x] ルーティング/アプリシェルを Solid 実装へ移植
- [x] `components/ui` を Kobalte ベースで再構築（利用中のみ）
- [x] `TableEditorGrid` を `@shiguri/solid-grid@0.1.2` に置換
- [x] テストと `pnpm check/test/build` を通す
- [x] `_docs/spec/` と関連ドキュメントを更新

## Notes (随時追記)

- 設計・検討メモ:
- 気づき/意思決定:
  - `@shiguri/solid-grid` は `0.1.2` 固定で運用。
  - アイコンは `@tabler/icons-solidjs` を採用。
  - 既存のアクションAPI名を維持し、ストア実装のみ Solid signal へ置換。
- 困りごと/対応:
  - サンドボックス制限で `pnpm test` / `pnpm build` が `spawn EPERM`。昇格実行で解消。
  - Kobalte `Select` 型の取り回しで object value が必要。`itemComponent` 方式に修正して型エラー解消。
  - `TableEditorGrid` で `onInput` ごとに `commitEdit` していたため、入力が即終了して Enter 編集も不安定。セル editor でドラフト保持し、`Enter` / `Blur` commit・`Escape` cancel に修正。
  - 上記修正後、`Enter` の keydown がグリッドへ伝播して再編集される不具合が判明。input 側で `event.stopPropagation()` を追加して解消。
  - マウス操作で編集開始しづらい問題に対し、`cell:pointerdown` の `detail >= 2`（ダブルクリック相当）で編集開始するプラグインを追加して安定化。
  - レビュー指摘対応として、編集中クリックを `mouse-editing` プラグインが奪わないよう修正。あわせて no-op 編集時は `commitEdit` せず `cancelEditing` に分岐し、export の不要な stale 化を防止。
  - 追加で更新粒度を改善。`applyGridPatches` は変更セルを含む行のみ clone し、変更なし patch は table 参照を維持。`markExportAsStale` も no-op state 更新時はそのまま返すよう修正。
  - `tableEditorStore` の実装を `createSignal` から `createStore + reconcile` へ移行。公開API（`tableEditorStore()` / action群）は維持しつつ、差分反映時の更新粒度を改善。
  - レビュー指摘対応として、グリッド patch 適用時は既存セルへマージしてから反映するよう変更し、delete/paste 時に `bold/italic/align` が消えないよう修正。
  - `Checkbox` children に `<Label>` を渡していた箇所を通常要素へ置換し、nested `<label>` の不正マークアップを解消。
  - table更新APIを分割。グリッドの `onCellsChange` は `applyTableCellPatches`（`produce`）で直接適用し、全体置換系は `replaceTable`（`reconcile`）で扱うハイブリッドへ変更。
  - `components/ui/modal.tsx` に右上の `x` 閉じるボタンを共通追加。`@tabler/icons-solidjs` の `IconX` を利用し、`aria-label` 付きで操作可能にした。

## Summary

- React/TanStack React Start/React Aria/react-datasheet-grid を除去し、SolidJS + TanStack Solid Router + Kobalte + `@shiguri/solid-grid` に移行。
- `src/components/ui` を利用中コンポーネント分のみ再実装（`cva` + `cn`）。
- テーブル編集・エクスポート動線を維持したまま Solid 実装へ移植。
- セル編集 UX を安定化（Enter で編集開始後に input へフォーカス、入力途中で state が途切れない）。
- 検証: `pnpm check` / `pnpm test` / `pnpm build` / `pnpm exec tsc --noEmit` 全通過。

## Next (必要に応じて)

- `@shiguri/solid-grid` 更新時の追従方針（breaking change対応）を別途ドキュメント化する。

## Reflection (感想)

UI と状態管理の責務境界を保ったまま移行できたため、機能回帰を抑えてフレームワーク置換を完了できた。

## Pre-PR Checklist

- [x] 変更に応じて `_docs/spec/` を更新済み
- [ ] PR 本文にこのログへのリンクを含めることを確認
