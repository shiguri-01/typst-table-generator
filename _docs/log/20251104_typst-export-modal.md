# Typst export modal

- Date: 2025-11-04

## Purpose

Add a UI flow that lets users export the current table as Typst code and preview/copy it from a modal dialog.

## Plan / TODO

- [x] Review existing table export helpers and store state needed for Typst output
- [x] Design the modal trigger + layout using Intent UI components
- [x] Implement selectors/helpers to format the current table with wrap/escape options
- [x] Render the modal with code preview and copy interaction, wiring into the toolbar
- [x] Exercise basic manual verification of the modal and update notes

## Notes (随時追記)

- 設計・検討メモ:
  - 既存の `renderTable` と `renderFigure` をそのまま使い、ストアの書式オプションセットをそのまま渡すだけで Typst 出力に反映できた。
- Modal は Intent UI の `Modal` ラッパーを使い、ヘッダー/ボディ/フッターのスロットを活用した。
- 気づき/意思決定:
  - コードをコピーした後にテーブルを編集すると状態がズレないよう、Typst スニペットが更新されたタイミングでコピー状態をリセットする処理を追加。
  - クリップボード API が使えない環境向けに `execCommand` ベースのフォールバックを用意し、失敗時は UI 上でエラー表示に切り替える。
- 困りごと/対応:
  - Biome の hook 依存関係 lint を避けるため、依存値を明示的に参照する（`void typstCode`）形でエフェクトを調整した。

## Summary

- エクスポートオプションパネルのヘッダーに Typst エクスポートモーダルのトリガーを配置し、関連設定と同じセクションで開けるようにした。
- Intent UI の Modal コンポーネントでプレビュー UI を構築し、テーブルや図ラップ設定を反映した Typst コードをモノスペース表示。
- コピーボタンに成功/失敗フィードバックとクリップボード API フォールバックを備え、エクスポートオプションの説明テキストも添えた。

## Next (必要に応じて)

- 次にやること/残課題

## Reflection (感想)

- Intent UI のモーダル構成が柔軟で助かった一方、まだツールバー自体が仮のため全体レイアウトの磨き込み余地を感じた。

## Pre-PR Checklist

- [x] `_docs/spec.md`に必要な変更を反映済み（不要な場合もこの文章を確認したらチェック）
- [x] PR 本文にこのログへのリンクを含めることを確認
