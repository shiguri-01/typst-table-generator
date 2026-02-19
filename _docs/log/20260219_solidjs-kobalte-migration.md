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
