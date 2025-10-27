# Table editor UI implementation

- Date: 2025-10-27

## Purpose

設計仕様に基づき UI を実装し、エディタ体験の主要フロー（編集・設定・エクスポート）を動かせる状態にする。

## Plan / TODO

- [x] ルートレイアウトと Zustand ストアを構築する
- [x] DataSheetGrid のセル編集・選択連携を実装する
- [x] ツールバーとキャプション入力、プリセット操作を実装する
- [ ] プロパティパネルとスタイル編集 UI を実装する
- [x] JSON/Typst モーダルとトースト通知を実装する
- [x] テスト・lint を実行し、仕様とログを更新する

## Notes (随時追記)

- 設計・検討メモ:
- Zustand ストアを `immer` + 独自ヒストリーで実装。`temporal` が提供されていなかったため、スナップショット履歴 (最大50件) を自前で保持し Undo/Redo に対応。
- プリセット適用時は `STYLE_PRESETS` の行境界パッチを既存罫線へマージしつつ、`tableArgs` を個別保持して Typst 出力時に参照できるようにした。
- Intent UI の Toolbar / Toggle / ComboBox / NumberField / Drawer / Toast などのコンポーネント群を追加インストールし、既存 UI ファイルを最新のレジストリ実装へ更新。
- TanStack Router ルートを `TableEditorRoute` に差し替え、ローカルストレージ復元・自動保存・beforeunload ガードの初期実装を追加。UI は暫定スタブだがシェル構造とレスポンシブ切替を導入。
- DataSheetGrid を導入し、セル編集・選択同期・Undo/Redo、行挿入/削除フックまでパイプラインを構築。パフォーマンス対策として `RowRecord` 化と `useMemo` により props 安定化。
- ツールバーにプリセット切り替え、行列操作、Undo/Redo、ヘッダー行数ステッパー、Typst/JSON メニューを実装し、キャプションエディタとエクスポートパネルを併設。
- Typst エクスポート/JSON インポートのモーダルとトースト通知を実装し、コピー・ダウンロード・JSON 検証エラーハンドリングを整備。
- 気づき/意思決定:
- 困りごと/対応:

## Summary

今回の変更の要点と影響範囲。

## Next (必要に応じて)

- 次にやること/残課題

## Reflection (感想)

感じたこと、学び、気づきなどを短く。

## Pre-PR Checklist

- [ ] `_docs/spec.md`に必要な変更を反映済み（不要な場合もこの文章を確認したらチェック）
- [ ] PR 本文にこのログへのリンクを含めることを確認
