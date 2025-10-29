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
- [x] SSR 警告と Drawer トリガーの入れ子ボタン問題を解消する

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
  - DrawerTrigger を ButtonPrimitive ラップのまま使うと `<button>` の入れ子が発生して SSR が崩れるため、`buttonStyles` を直接適用して単一のボタンで実装。
  - `Textarea` に `minRows` を渡すと DOM 属性警告が出るので `rows` 指定へ変更。
  - Zustand の Immer ドラフトを `structuredClone` すると `DataCloneError` になるので、`cloneTableArgs` で Draft を元オブジェクトに戻してからクローンするよう修正。
  - DataSheetGrid の `keyColumn` は内部的に `columnData.original` を付与するため、セルコンポーネントの型を `Cell` ベースに組み直しつつ、`set` ラッパー (`apply`) で devtools/immer 両対応するよう調整。

## Summary

- SSR とブラウザの警告になっていた `minRows` 属性と DrawerTrigger/ボタンの入れ子問題を解消し、クライアント初期化時のハイドレーションエラーを防止。
- `columnData` が未定義のケースでクラッシュしていた DataSheetGrid セル描画をフォールバック処理に置き換え、安全にセル編集を継続できるようにした。
- `pnpm check` / `pnpm test` を再実行して退行がないことを確認。
- 履歴スナップショット生成時に `structuredClone` が落ちる問題に対応し、Undo/Redo が例外なく動作するようにした。
- `pnpm exec tsc --noEmit` で型チェックを追加実行し、Grid カラム定義と Zustand ミドルウェアが型的にも整合することを確認。

## Next (必要に応じて)

- Inspector の残りセクション（列設定・ストローク編集 UI）を実装し、tri-state 表示を整理する。
- ツールバーの整列/書式トグルをストアアクションへ接続し、Undo/Redo グルーピングを最適化する。
- DataSheetGrid のショートカット/コンテキストメニュー仕様（Ctrl+Enter・Ctrl+B・Ctrl+I・Ctrl+Shift+H など）を実装する。

## Reflection (感想)

React Aria コンポーネントは asChild まわりの相性に注意が必要と再確認。要素ツリーを簡単に保つのが一番安全。

## Pre-PR Checklist

- [x] `_docs/spec.md`に必要な変更を反映済み（不要な場合もこの文章を確認したらチェック）
- [ ] PR 本文にこのログへのリンクを含めることを確認
