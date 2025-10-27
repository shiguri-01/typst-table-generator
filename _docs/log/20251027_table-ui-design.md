# Table editor UI design

- Date: 2025-10-27

## Purpose
`src/lib/table/model.ts` を土台にしたエディタ UI の要件と詳細設計を固め、実装着手の準備を整える。

## Plan / TODO
- [x] 既存仕様と `model.ts` の不変条件を確認する
- [x] 状態管理ライブラリを比較して採用方針を決める
- [x] エディタ UI の要求事項を整理する
- [x] ストア構造・主要コンポーネント・操作フローを具体化する
- [x] `_docs/spec.md` へ設計内容を反映する

## Notes (随時追記)
- 設計・検討メモ:
  - Zustand は React Hook ベースで書きやすく、`subscribeWithSelector` によりセル単位の更新を局所化できる。`immer`/`devtools` ミドルウェアもあり、履歴管理の拡張が容易。
  - TanStack Store は Signal ベースで精細な再レンダー制御が魅力だが、React 統合では hook ラッパーを自前で敷く必要があり、エコシステムがまだ限定的。
  - react-datasheet-grid との接続は、行配列と列定義を props で渡し、セル編集ハンドラで `updateCell` を呼ぶ形が自然。範囲選択やバッチ更新は `setState` のトランザクションが必要。
  - プロパティパネルは選択範囲単位で動作させるため、矩形選択の保持と tri-state UI をセットで設計する。
- 参考リンク: [react-datasheet-grid docs/features](https://react-datasheet-grid.netlify.app/docs/features) / [Zustand getting-started](https://zustand.docs.pmnd.rs/getting-started/introduction) / [Zustand devtools-integration](https://zustand.docs.pmnd.rs/guides/devtools-integration) / [Zustand using-immer](https://zustand.docs.pmnd.rs/guides/using-immer)
  - DataSheetGrid の WAI-ARIA ロールはそのまま維持し、Typst 用ヘッダーラベルは `aria-description` や独自属性で補足する。列ラベル UI 自体はフォーカス可能なままにし、装飾要素だけ `aria-hidden` 指定する。
  - 列追加/削除が頻繁に起こるので `DynamicDataSheetGrid` を採用し、`columns` や `createRow` は `useMemo`/`useCallback` で固定する。Zustand の `useStore` セレクタを併用して再描画を局所化する（[Static vs dynamic](https://react-datasheet-grid.netlify.app/docs/performance/static-vs-dynamic)）。
  - Spec に残っていた `cite…` マーカーを通常のリンクへ差し替えて整合性を確保。
- 気づき/意思決定:
  - 状態管理は Zustand を採用。React Hooks との親和性と既存ミドルウェア群で undo/redo, persist を段階的に導入しやすい。
  - Undo/Redo は `zustand/middleware` の `temporal` を利用し、バッチ編集を 1 アクションにまとめる。
  - ストアは `immer` / `devtools` / `temporal` を組み合わせ、開発時は DevTools 名称を `table-editor` ネームスペースで統一する。
- 困りごと/対応:
  - 特になし。

## Summary
- Zustand を前提とした `TableEditorState` のストア形状と主要アクションを定義。
- `/` ルートのレイアウト、react-datasheet-grid と Intent UI を用いた編集フロー、ツールバー・プロパティパネル・モーダルの責務を具体化。
- 仕様書 `_docs/spec.md` に上記要件と操作フローを反映し、Spec change メモを追加。
- Static vs dynamic のガイドに沿ったコンポーネント戦略と引用整備を完了。

## Next (必要に応じて)
- Zustand ストアと TableEditorShell の実装。
- react-datasheet-grid を使ったセル編集の連携実装と単体テスト整備。
- JSON/Typst エクスポートモーダルの UI 実装。

## Reflection (感想)
- モデル層が純粋関数で揃っているおかげで、UI 側のアクション定義をストア内メソッドに集約しやすいと再確認。
- Intent UI と react-datasheet-grid の組み合わせで必要機能が満たせる見込みが立った。

## Pre-PR Checklist
- [x] `_docs/spec.md`に必要な変更を反映済み（不要な場合もこの文章を確認したらチェック）
- [x] PR 本文にこのログへのリンクを含めることを確認
