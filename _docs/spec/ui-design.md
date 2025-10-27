# UI/UX 設計仕様

## ルート構成 (`/`)

- 画面骨格は Intent UI の `Page` / `Stack` / `Surface` コンポーネントで構築し、「ツールバー」「グリッド」「プロパティパネル」の三分割レイアウトとする。
- 初回ロード時は `createEmptyTable(3, 3, { headerRows: 1 })` で空モデルを生成し、Zustand ストアへ格納する。既存の `localStorage` スナップショットがあればそちらを優先ロードする。
- レスポンシブ方針: 幅 960px 以上ではツールバー上段／グリッド中央／プロパティパネル右側に横並び。幅が狭い場合はプロパティパネルを折りたたみ、Intent UI の `Drawer` を使ってオンデマンド表示する。
- ルートコンポーネント構成（最上段から）：`TableEditorRoute` → `TableEditorShell`（レイアウト責務）→ `TableGridView`（データグリッド）＋ `TableInspector`（属性編集）＋ `ExportPanel`（Typst/JSON 出力）。

## エディタサーフェス（react-datasheet-grid）

- `DataSheetGrid` を採用し、`value` にストアから得た `rows` を渡す。各セルは `{ text, bold, italic, align }` を編集対象とし、`columns` は動的に `model.columnSpecs.length` に合わせて生成する。
- 列の本数やプロパティが編集で変化するため、グリッド本体は `DynamicDataSheetGrid` を利用する。`columns`／`createRow`／`duplicateRow` などの非プリミティブ props は `useMemo`／`useCallback` で安定化させ、Zustand のセレクタを用いて依存値を最小化する。`DynamicDataSheetGrid` 採用理由とメモ化要件は公式ドキュメントの「Static vs dynamic」ガイドに従う（[参考: Static vs dynamic](https://react-datasheet-grid.netlify.app/docs/performance/static-vs-dynamic)）。
- セルレンダラーはカスタムで、Typst 出力におけるヘッダー行（`rowIndex < headerRows`）の背景を Intent UI の `Surface tone="muted"` で差し替える。DataSheetGrid が提供する WAI-ARIA ロール（`grid`/`row`/`gridcell`）はそのまま尊重し、ヘッダー表現は `data-ttg-header="true"` のようなカスタム属性と `aria-description` を併用して伝える。スクリーンリーダー追加情報は `aria-colindex` / `aria-rowindex` など、グリッド互換の属性で補足する。列ラベル UI は引き続きフォーカス起点として機能させ、視覚的な装飾やサブテキストだけを `aria-hidden` に限定する。
- `onChange` イベントでは変更された行のみを検知し、該当セルに対して `updateCell` または `patchCell` を呼ぶ。まとめて編集された範囲は `batchUpdateCells` アクションで `immer` を使って一括適用する。
- 選択状態は `onActiveCellChange` / `onSelectionChange` で受け取り、ストアの `selection` に同期する。複数セル選択時は矩形範囲を保持し、整列やスタイル操作を範囲単位で適用できるようにする。

### グリッド側のショートカット

- `Enter` / `Shift+Enter`: 同列で上下移動。
- `Tab` / `Shift+Tab`: 同行で左右移動（列末尾では次行へ wrap）。
- `Ctrl+Enter`: 選択範囲全体へ入力値を複製。
- `Ctrl+B` / `Ctrl+I`: 選択セルに対して `bold` / `italic` をトグル。
- `Ctrl+Shift+H`: 選択行をヘッダーに昇格（`setHeaderRows` を選択最終行に合わせて更新）。

### 行・列操作

- 行・列の挿入／削除は DataSheetGrid のコンテキストメニュー API を利用し、項目を差し替えて `insertRow` / `removeRow` / `insertColumn` / `removeColumn` を呼び出す。
- TSV 貼り付けは `onPaste` フックでハンドリングし、貼り付け結果を `createTableModel(parseTsv(..))` に通したうえで現在の表へマージする。

**参考資料**: [react-datasheet-grid documentation](https://react-datasheet-grid.netlify.app/docs/features)

## ツールバーとグローバル操作

- **左側**: テーブル名（任意テキスト入力、`localStorage` キーにも利用）とプリセット切り替え（Intent UI の `SegmentedControl`）。プリセット適用は `applyStylePreset(presetId)` アクションで `STYLE_PRESETS[id]` を呼び、`model.strokes` と `tableArgs` を更新。
- **中央**: 行・列追加ボタン、Undo/Redo、ヘッダー行数スピンボックス（Intent UI `NumberStepper`）。Undo/Redo は Zustand の `temporal` ミドルウェアで 50 ステップ保持。
- **右側**: Typst エクスポート、JSON インポート/エクスポート、共有（クリップボードコピー）。Intent UI の `Button` + `DropdownMenu` を組み合わせて配置。
- **キャプション入力**: ツールバー下段の `IntentTextArea`（内部は `TextArea`）で提供し、`model.caption` と双方向同期する。

## プロパティパネル（Inspector）

パネル内のセクション:

1. **Selection summary** — 現在の選択範囲（セル座標/行列数）を表示し、複数選択時は「セル 12 個を編集中」などの文言にする。
2. **Cell formatting** — `Bold` / `Italic` トグル、セル単位の `Align` スイッチ（left/center/right）。複数セル選択時は tri-state 表示で、混在している場合はハイフン状態を示す。
3. **Column settings** — 選択列に対する `columnSpecs.align` と `columnSpecs.width` 入力。幅は Intent UI の `NumberInput`（空＝`auto`）。複数列を選んで一括適用可。
4. **Strokes** — 行/列境界の `top/bottom/left/right` を `Slider` + `ComboBox('none' | pt値)` で編集。範囲が複数の場合は共通値のみ表示。

ヘッダー数変更時はパネル上部にヘッダー境界の説明（`table.header(repeat: true)` 反映）を表示し、ヘッダーハイライトと連動させる。

## モーダルと通知

- **JSON インポートモーダル**: `IntentModal` 内で JSON を貼り付け → バリデーション → `createTableModel` へ渡す。失敗時は Intent UI の `Callout` でエラーを表示。
- **Typst エクスポートモーダル**: プレビューエリア（モノスペースフォント）と「コピー」「ダウンロード」ボタンを提供。
- 大規模貼り付けや削除操作には Intent UI の `Toast` でフィードバックを出す。

## 状態管理（Zustand）

### ストア定義

```ts
type TableSelection = {
  active: TableCellPosition | null;
  range: { start: TableCellPosition; end: TableCellPosition } | null;
};

interface TableEditorState {
  model: TableModel;
  presetId: StylePresetId;
  selection: TableSelection;
  clipboardPreview: string | null;
  isDirty: boolean;
  modals: { export: boolean; import: boolean };
  actions: {
    load(model: TableModel, options?: { presetId?: StylePresetId }): void;
    setSelection(selection: TableSelection): void;
    editCell(position: TableCellPosition, patch: Partial<Cell>): void;
    editCells(range: TableSelection["range"], patch: Partial<Cell>): void;
    insertRow(at: number): void;
    removeRows(indexes: number[]): void;
    insertColumn(at: number): void;
    removeColumns(indexes: number[]): void;
    setHeaderRows(next: number): void;
    setCaption(text: string): void;
    updateColumnSpec(columnIndex: number, patch: Partial<ColumnSpec>): void;
    updateStroke(
      kind: "row" | "column",
      index: number,
      patch: RowStroke | ColumnStroke
    ): void;
    applyPreset(id: StylePresetId): void;
    setModal(name: "export" | "import", open: boolean): void;
  };
}
```

### ミドルウェア構成

- `createTableStore` は `zustand` を基盤とし、`immer` / `devtools` / `temporal` ミドルウェアを併用して構成する。
- `devtools` は開発環境で自動有効化し、アクション名は `actions.*` のキーをベースに `{ namespace: "table-editor" }` でまとめる。
- `subscribeWithSelector` を用いてグリッドとインスペクタを部分的に購読させる。

### 副作用

- `model` が変わったら `localStorage.setItem("ttg:lastTable", JSON.stringify(model))` をデバウンス 500ms で実行。
- Typst コードプレビューは `model` のみ購読するメモ化セレクタ（`useTableStore((s) => selectTypstPreview(s.model))`）で再計算。
- Undo/Redo は `temporal` の `groupWith` を使い、同一バッチ編集（例えば複数セルへ同じ値をドラッグ）を 1 操作に束ねる。

### 初期化とライフサイクル

- ストアの初期化は `TableEditorRoute` で行い、React Router の `beforeUnload` フックに `isDirty` が真のときの確認ダイアログを設定する。

**参考資料**:

- [Zustand documentation](https://zustand.docs.pmnd.rs/getting-started/introduction)
- [zustand/devtools middleware](https://zustand.docs.pmnd.rs/guides/devtools-integration)
- [zustand/immer middleware](https://zustand.docs.pmnd.rs/guides/using-immer)

## 拡張ポイント

- TanStack Store への置き換えは現時点で不要だが、将来的に非 React 環境へ輸出する場合は Zustand ストアを `subscribe` ベースで公開することで互換 API へ移行可能。
- セル結合など未決事項が実装される際は、`selection.range` と `model.rows` の整合性を保つための追加正規化ステップを `model.ts` 側で拡張する。

## Spec changes

> **Spec change (2025-10-27)** テーブルエディタ画面は `react-datasheet-grid` を中心に構成し、アプリ状態は Zustand ストアで一元管理する。これに合わせてレイアウト、操作フロー、プロパティ編集 UI を具体化した。
