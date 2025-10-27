# typst-table-generator: 仕様と設計

最終更新: 2025-10-27 / バージョン: 0.1-draft

## 1. 目的と範囲

Web UI で表を作成し、Typst の表組みコードを生成・共有する。対象は技術文書・論文の表作成。Typst の全機能を網羅するのではなく、日常的な表を素早く整えることに注力。

非目標: ライブコンパイル、WYSIWYG レイアウト完全一致、巨大表の高機能編集。

## 2. 想定ユースケース

- 論文や資料の表を素早く作成して Typst に貼り付ける。
- Excel の表をコピー→TSV としてペースト→整形→Typst コード出力。
- スタイルプリセットで罫線/余白/アラインを統一。

## 3. 機能要求 (Functional)

- 行/列の追加・削除、ヘッダー行数の指定、キャプション設定。
- セル編集: 左/中央/右揃え、基本装飾(太字/斜体)。
- 罫線とスタイル: 最小限の線種、余白、列幅指定。プリセット(booktabs風など)。
- 入出力: JSON モデルの保存/読込、Typst コード出力、クリップボードコピー。
- TSV ペースト対応 (Excel 由来のクリップボード)。
- 検証: 空テーブル防止、過大サイズのガード。

将来候補: セル結合(rowspan/colspan)、数値の小数点揃え、並べ替え/整列。

## 4. 非機能 (Non-Functional)

- パフォーマンス: ~100×30 までインタラクティブに編集可能。
- アクセシビリティ: キーボード操作(セル移動/行列追加)、フォーカス可視化、適切なラベル。
- i18n: 文言は分離し日本語/英語対応可能に。
- 永続化: 直近のテーブルを `localStorage` に保存(明示的にオフ可)。

## 5. データモデル (JSON)

```ts
type Align = "left" | "center" | "right";
type Cell = { text: string; align?: Align; bold?: boolean; italic?: boolean };
type ColumnSpec = { width?: "auto" | number; align?: Align };
type TableModel = {
  rows: Cell[][];
  headerRows?: number;
  caption?: string;
  columnSpecs?: ColumnSpec[];
  strokes?: TableStrokes;
};

type StrokeValue = "none" | number; // number = pt
type TableStrokes = {
  rows?: RowStroke[];
  columns?: ColumnStroke[];
};

type RowStroke = { top?: StrokeValue; bottom?: StrokeValue };
type ColumnStroke = { left?: StrokeValue; right?: StrokeValue };
```

> **Simplicity first** — The persisted model only tracks values that our UI can reliably edit today. When authors need custom Typst
> features (複雑な結合や条件付きスタイルなど), they can copy the generated snippet and continue by hand. We avoid storing auxiliary
> hints such as `dataType` or future-facing merge metadata so that exporting/importing stays predictable and template-like.

### Field semantics

- **`rows`** — 矩形のセル行列。実装では最長行の列数を `columnCount` とし、短い行は空文字列セルでパディングして保存する。`rows.length`
  は 1 以上を想定し、空テーブルは UI 側でガードする。
- **`Cell.text`** — Typst のインラインマークアップを素で格納する。UI に入力した文字列をそのままセル式へ埋め込み、`linebreak()` などの自動展開は行わない。必要最小限のエスケープ（`]` の閉じ忘れ防止など）は出力フェーズで実施するが、入力済みの Typst コードは変形しない。
- **`Cell.align`** — セル個別の横位置指定。未指定の場合は `ColumnSpec.align` → テーブル既定値（`'left'`）の順でフォールバックする。
- **`Cell.bold` / `Cell.italic`** — 真の場合のみ Typst 出力時に `strong[…]` / `emph[…]` を重ねる。両方 `false`（未指定）は素のテキストを出力。
- **`headerRows`** — 先頭から何行をヘッダーとして扱うか。未指定は `0`。負値は `0` に、`rows.length` を超える値は `rows.length` にクランプする。Typst コードでは
  `table.header(repeat: true, …)` に該当行をまとめる。
- **`caption`** — オプションのキャプション文字列。空文字か未指定なら `figure` で包まない。改行や Typst マークアップは入力どおりに保持し、追加の `linebreak()` 変換は行わない。
- **`columnSpecs`** — 列ごとの幅・整列のヒント。`columnCount` に満たない場合は残りをデフォルト（`{ width: 'auto' }`）で補完し、超過分は無視する。
  - `width`: `'auto'` か 0 より大きい数値。数値は Typst の長さ（pt 単位）として `table(columns: …)` に渡す。UI では `auto` が既定。
  - `align`: 列既定の横位置。セルが `align` を持つ場合はセル設定を優先。
- **`strokes`** — 行・列境界の罫線指定。`rows[i].top` は行 `i` の直前（表上端含む）、`rows[i].bottom` は行 `i` の直後（最終行後端含む）に該当する。
  同様に `columns[i].left` が列 `i` の左側（表左端含む）、`columns[i].right` が列 `i` の右側（表右端含む）。
  - `StrokeValue`: `'none'` か 0 より大きい数値 (pt)。`'none'` は線を描かない。
  - 指定がなければ線を追加しない。UI は既定でプリセット相当の線を提示できるが、JSON には必要な境界のみ保存する。
  - 行・列配列の長さはそれぞれ `rows.length`、`columnCount` にそろえる。短い場合は `{}` でパディング、長い場合は切り詰める。

#### Normalization rules

- 読み込み時: 行列の長さが不揃いなら、右端に `{ text: '' }` を追加して `rows` を矩形化する。
- 書き込み時: `columnSpecs` は最新の `columnCount` に合わせてトリミング／パディングする。`Cell.align` が列指定と同じ場合でも値は保持してよい。
- エクスポート前: `headerRows` のクランプを再確認し、0 の場合は `table.header` ブロックを出力しない。`strokes` は行・列数に合わせて再パディングし、`'none'` は `undefined` と同じ扱いに正規化してよい。

### 5.1 Stroke handling

`strokes` により、特定セル単位ではなく行/列全体の境界にだけ線を入れる。途中で途切れたり範囲を限定する機能は提供しない。

- **生成ルール** — 水平方向は `table.hline(y: boundaryIndex, stroke: …)` を使い、`boundaryIndex` は `0` から `rows.length` までの整数。
  `rows[i].top` が設定されていれば `boundaryIndex = i`、`rows[i].bottom` が設定されていれば `boundaryIndex = i + 1` の線を追加する。
  縦線は `table.vline(x: boundaryIndex, stroke: …)` で、`columns[i].left` → `boundaryIndex = i`、`columns[i].right` → `boundaryIndex = i + 1` を使う。
- **StrokeValue の展開** — 数値は `pt` 単位とみなし、Typst 呼び出しでは `stroke: 0.6pt` のように長さリテラルを発行する。`'none'` または未指定の境界はスキップ。
- **同じ境界への重複指定** — `rows[i].bottom` と `rows[i+1].top` のように同じ境界を重複指定した場合、後者を優先する。実装では最後に評価した値を採用することで UI の上書きを反映できる。
- **ヘッダーとの相互作用** — `headerRows` に関係なく境界インデックスを算出する。ヘッダー直下に線を引くには、ヘッダー最終行の `bottom` を設定する。プリセットは `strokes` に値を書き込むか、エクスポート時に仮想的な線を追加することで実現する。

### 5.2 Preset helpers

プリセットは JSON モデルに識別子として保存しない。代わりに UI/エクスポート層で `applyPreset(model, presetId)` のようなヘルパーを持ち、生成直前に `strokes` や `table` 引数を合成する。

```ts
type StylePresetId = "default" | "booktabs";

type PresetOutput = {
  tableArgs?: {
    stroke?: Partial<{
      top: StrokeValue;
      bottom: StrokeValue;
      x: StrokeValue;
      y: StrokeValue;
    }>;
    rowGutter?: number;
    columnGutter?: number;
    inset?:
      | number
      | [number, number]
      | { top?: number; bottom?: number; left?: number; right?: number };
  };
  header?: {
    text?: { weight?: "bold" | "regular"; italic?: boolean };
    stroke?: Partial<{ top: StrokeValue; bottom: StrokeValue }>;
  };
  footer?: {
    stroke?: Partial<{ top: StrokeValue; bottom: StrokeValue }>;
  };
  strokes?: TableStrokes;
};

type StylePreset = (model: TableModel) => PresetOutput;
```

`StylePreset` は必要に応じて `TableModel` を参照し、`strokes` へ追記したり、`tableArgs` として Typst に渡すパラメータを返す。生成パイプラインは `const preset = STYLE_PRESETS[id]; const overrides = preset?.(model);` のように呼び出し、戻り値を `model` からの生データに重ねる。UI 側は「プリセット適用→必要に応じて個別調整→JSON 保存」という流れを想定するが、適用結果は `strokes` 等の通常フィールドに書き戻される。

> **Spec change (2025-10-26)** `TableModel` に `strokes` を追加し、スタイルプリセットは関数として適用するように再定義。線は行/列境界単位でのみ指定し、Typst 生成時の `table.hline`/`table.vline` へ変換する。
> **Spec change (2025-10-26)** `TableModel` に `strokes` を追加し、スタイルプリセットは関数として適用するように再定義。線は行/列境界単位でのみ指定し、Typst 生成時の `table.hline`/`table.vline` へ変換する。
> **Spec change (2025-10-26)** セルとキャプションの文字列は生の Typst マークアップとして扱い、`linebreak()` などの自動変換を行わない。
> **Spec change (2025-10-26)** セルとキャプションの文字列は生の Typst マークアップとして扱い、`linebreak()` などの自動変換を行わない。

#### Preset application flow

1. JSON を読み込み、必要なら UI でプリセットボタンを押して `STYLE_PRESETS[id](model)` を適用し、得られた `overrides.strokes` を `model.strokes` にマージする。
2. Typst 出力時は `model` と適用済み `strokes` を使って `table(columns: …)` を構築する。`overrides.tableArgs` があれば `table` 呼び出しの引数へマージし、`header`/`footer` の追加引数も同様に適用する。
3. `strokes` を走査して `table.hline` / `table.vline` を追加。空または `'none'` の境界はスキップする。
4. プリセット適用前のモデルにも対応するため、`STYLE_PRESETS.default` は空操作を返す。プリセットを使用しない場合でも `strokes` に直接値を入れて出力できる。

#### `default`

- 目的: Excel から貼り付けた直後でも読みやすいミニマル表。
- Typst 生成時の設定:
  - `tableArgs.stroke`: `{ y: none }`（縦罫線なし）。
  - `tableArgs.row-gutter`: `6pt`, `tableArgs.column-gutter`: `12pt`。
  - `header.text`: `{ weight: "bold" }`、`header.stroke`: `{ bottom: 0.5pt }`。
  - `strokes.rows`: ヘッダーが 1 行以上ある場合は最後のヘッダー行の `bottom` に `0.5pt`。表の最終行の `bottom` にも `0.5pt` を置き、その他は `undefined`。
- `columnSpecs` やセル側で明示された `align`/`width` は上書きせず尊重する。

#### `booktabs`

- 目的: Typst での booktabs 風整形に合わせた出力。
- Typst 生成時の設定:
  - `tableArgs.stroke`: `{ y: none }`。
  - `tableArgs.row-gutter`: `8pt`, `tableArgs.column-gutter`: `14pt` (行間をやや広めに)。
  - `header.text`: `{ weight: "bold" }`、`header.stroke`: `{ bottom: 0.8pt }`。
  - `strokes.rows`: 先頭行の `top` に `1pt`、ヘッダー最終行の `bottom` に `0.8pt`、本文最終行（`Math.max(headerRows, rows.length - 1)`）の `top` に `0.6pt`、表の最終行の `bottom` に `1pt`。
    - `headerRows >= rows.length` の場合は本文境界が存在しないため `0.6pt` のラインは省略する。境界が重複する場合は後勝ちで上書きする。
- 縦線は引かない。ヘッダー以外の強調(イタリック等)はセルデータに委ねる。

プリセットは `STYLE_PRESETS: Record<StylePresetId, StylePreset>` のような辞書として管理し、JSON モデルに直接展開しない。新しい
プリセットを追加する場合は `StylePresetId` を拡張し、仕様へ同様の表形式で挙動を追加する。

## 6. Typst 出力方針

- 基本は `#table()` を使用。`columns` に `(auto | 長さ)` を与え、`align` を列/セルで制御。
- 罫線は最小限(ヘッダー下・表下)をデフォルト、プリセットで増減。
- 文字列エスケープ: `[` `]` `#` `"` 等を安全に処理。

簡易例:

```typst
#table(
  columns: (auto, auto, auto),
  align: center,
  [A] [B] [C],
  [1] [2] [3],
)
```

## 7. アルゴリズム/処理

- 列幅推定: 文字幅の概算から `auto`/固定幅を選択。手動指定を優先。
- TSV ペースト: 行区切りは `\r\n` を優先、セル内改行は単独の `\n` を保持。列は `\t` 区切り。行の列数は最大列数にパディング。
- エスケープ: Typst 特殊記号はバッククォート/テキストモード等で回避。
- セル結合: 将来実装。生成時に空セルを `colspan/rowspan` に折り畳む。

## 8. UI/ルーティング

> **Spec change (2025-10-27)** テーブルエディタ画面は `react-datasheet-grid` を中心に構成し、アプリ状態は Zustand ストアで一元管理する。これに合わせてレイアウト、操作フロー、プロパティ編集 UI を具体化した。

### 8.1 ルート構成 (`/`)

- 画面骨格は Intent UI の `Page` / `Stack` / `Surface` コンポーネントで構築し、「ツールバー」「グリッド」「プロパティパネル」の三分割レイアウトとする。
- 初回ロード時は `createEmptyTable(3, 3, { headerRows: 1 })` で空モデルを生成し、Zustand ストアへ格納する。既存の `localStorage` スナップショットがあればそちらを優先ロードする。
- レスポンシブ方針: 幅 960px 以上ではツールバー上段／グリッド中央／プロパティパネル右側に横並び。幅が狭い場合はプロパティパネルを折りたたみ、Intent UI の `Drawer` を使ってオンデマンド表示する。
- ルートコンポーネント構成（最上段から）：`TableEditorRoute` → `TableEditorShell`（レイアウト責務）→ `TableGridView`（データグリッド）＋ `TableInspector`（属性編集）＋ `ExportPanel`（Typst/JSON 出力）。

### 8.2 エディタサーフェス（react-datasheet-grid）

- `DataSheetGrid` を採用し、`value` にストアから得た `rows` を渡す。各セルは `{ text, bold, italic, align }` を編集対象とし、`columns` は動的に `model.columnSpecs.length` に合わせて生成する。
- 列の本数やプロパティが編集で変化するため、グリッド本体は `DynamicDataSheetGrid` を利用する。`columns`／`createRow`／`duplicateRow` などの非プリミティブ props は `useMemo`／`useCallback` で安定化させ、Zustand のセレクタを用いて依存値を最小化する。`DynamicDataSheetGrid` 採用理由とメモ化要件はドキュメントの「Static vs dynamic」指針に従う。citeturn0view0
- セルレンダラーはカスタムで、Typst 出力におけるヘッダー行（`rowIndex < headerRows`）の背景を Intent UI の `Surface tone="muted"` で差し替える。DataSheetGrid が提供する WAI-ARIA ロール（`grid`/`row`/`gridcell`）はそのまま尊重し、ヘッダー表現は `data-ttg-header="true"` のようなカスタム属性と `aria-description` を併用して伝える。スクリーンリーダー追加情報は `aria-colindex` / `aria-rowindex` など、グリッド互換の属性で補足する。列ラベル UI は引き続きフォーカス起点として機能させ、視覚的な装飾やサブテキストだけを `aria-hidden` に限定する。
- `onChange` イベントでは変更された行のみを検知し、該当セルに対して `updateCell` または `patchCell` を呼ぶ。まとめて編集された範囲は `batchUpdateCells` アクションで `immer` を使って一括適用する。
- 選択状態は `onActiveCellChange` / `onSelectionChange` で受け取り、ストアの `selection` に同期する。複数セル選択時は矩形範囲を保持し、整列やスタイル操作を範囲単位で適用できるようにする。
- グリッド側のショートカット設定:
  - `Enter` / `Shift+Enter`: 同列で上下移動。
  - `Tab` / `Shift+Tab`: 同行で左右移動（列末尾では次行へ wrap）。
  - `Ctrl+Enter`: 選択範囲全体へ入力値を複製。
  - `Ctrl+B` / `Ctrl+I`: 選択セルに対して `bold` / `italic` をトグル。
  - `Ctrl+Shift+H`: 選択行をヘッダーに昇格（`setHeaderRows` を選択最終行に合わせて更新）。
- 行・列の挿入／削除は DataSheetGrid のコンテキストメニュー API を利用し、項目を差し替えて `insertRow` / `removeRow` / `insertColumn` / `removeColumn` を呼び出す。
- TSV 貼り付けは `onPaste` フックでハンドリングし、貼り付け結果を `createTableModel(parseTsv(..))` に通したうえで現在の表へマージする。
- 参考資料: [react-datasheet-grid documentation](https://react-datasheet-grid.netlify.app/docs/features)。

### 8.3 ツールバーとグローバル操作

- 左側: テーブル名（任意テキスト入力、`localStorage` キーにも利用）とプリセット切り替え（Intent UI の `SegmentedControl`）。プリセット適用は `applyStylePreset(presetId)` アクションで `STYLE_PRESETS[id]` を呼び、`model.strokes` と `tableArgs` を更新。
- 中央: 行・列追加ボタン、Undo/Redo、ヘッダー行数スピンボックス（Intent UI `NumberStepper`）。Undo/Redo は Zustand の `temporal` ミドルウェアで 50 ステップ保持。
- 右側: Typst エクスポート、JSON インポート/エクスポート、共有（クリップボードコピー）。Intent UI の `Button` + `DropdownMenu` を組み合わせて配置。
- キャプション入力はツールバー下段の `IntentTextArea`（内部は `TextArea`）で提供し、`model.caption` と双方向同期する。

### 8.4 プロパティパネル（Inspector）

- パネル内のセクション:
  1. **Selection summary** — 現在の選択範囲（セル座標/行列数）を表示し、複数選択時は「セル 12 個を編集中」などの文言にする。
  2. **Cell formatting** — `Bold` / `Italic` トグル、セル単位の `Align` スイッチ（left/center/right）。複数セル選択時は tri-state 表示で、混在している場合はハイフン状態を示す。
  3. **Column settings** — 選択列に対する `columnSpecs.align` と `columnSpecs.width` 入力。幅は Intent UI の `NumberInput`（空＝`auto`）。複数列を選んで一括適用可。
  4. **Strokes** — 行/列境界の `top/bottom/left/right` を `Slider` + `ComboBox('none' | pt値)` で編集。範囲が複数の場合は共通値のみ表示。
- ヘッダー数変更時はパネル上部にヘッダー境界の説明（`table.header(repeat: true)` 反映）を表示し、ヘッダーハイライトと連動させる。

### 8.5 モーダルと通知

- JSON インポートモーダル: `IntentModal` 内で JSON を貼り付け → バリデーション → `createTableModel` へ渡す。失敗時は Intent UI の `Callout` でエラーを表示。
- Typst エクスポートモーダル: プレビューエリア（モノスペースフォント）と「コピー」「ダウンロード」ボタンを提供。
- 大規模貼り付けや削除操作には Intent UI の `Toast` でフィードバックを出す。

### 8.6 状態管理（Zustand）

- ストア定義（概略）:

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
    updateStroke(kind: "row" | "column", index: number, patch: RowStroke | ColumnStroke): void;
    applyPreset(id: StylePresetId): void;
    setModal(name: "export" | "import", open: boolean): void;
  };
}
```

- `createTableStore` は `zustand` を基盤とし、`immer` / `devtools` / `temporal` ミドルウェアを併用して構成する。`devtools` は開発環境で自動有効化し、アクション名は `actions.*` のキーをベースに `{ namespace: "table-editor" }` でまとめる。`subscribeWithSelector` を用いてグリッドとインスペクタを部分的に購読させる。
- 副作用:
  - `model` が変わったら `localStorage.setItem("ttg:lastTable", JSON.stringify(model))` をデバウンス 500ms で実行。
  - Typst コードプレビューは `model` のみ購読するメモ化セレクタ（`useTableStore((s) => selectTypstPreview(s.model))`）で再計算。
  - Undo/Redo は `temporal` の `groupWith` を使い、同一バッチ編集（例えば複数セルへ同じ値をドラッグ）を 1 操作に束ねる。

- ストアの初期化は `TableEditorRoute` で行い、React Router の `beforeUnload` フックに `isDirty` が真のときの確認ダイアログを設定する。
- 参考資料: [Zustand documentation](https://zustand.docs.pmnd.rs/getting-started/introduction)、[zustand/devtools middleware](https://zustand.docs.pmnd.rs/guides/devtools-integration)、[zustand/immer middleware](https://zustand.docs.pmnd.rs/guides/using-immer)。

### 8.7 拡張ポイント

- TanStack Store への置き換えは現時点で不要だが、将来的に非 React 環境へ輸出する場合は Zustand ストアを `subscribe` ベースで公開することで互換 API へ移行可能。
- セル結合など未決事項が実装される際は、`selection.range` と `model.rows` の整合性を保つための追加正規化ステップを `model.ts` 側で拡張する。


## 9. ペースト/エクスポート

- TSV 貼付け (主に Excel): `\t` 区切り、`\r\n` 行区切りを基本とする。セル内改行は保持。
- JSON モデルの保存/読込。バージョン識別子で互換性を管理。
- Typst コードを生成→コピー/ダウンロード。

## 10. テスト戦略

- 単体: ユーティリティ(`src/lib/utils.ts` 予定) — CSV パース、エスケープ、Typst 生成。
- コンポーネント: 入力→出力の期待値、キーボード操作、フォーカス移動。
- スナップショット: Typst 出力の安定性を最小限で担保。

## 11. セキュリティ/エラー処理

- 大規模貼付け時はサイズ上限と確認ダイアログ。
- クリップボード失敗時のトースト表示。例外はユーザ向け文言に変換。

## 12. 未決事項 / Open Questions

- セル結合の初期対応範囲と UI。
- 列幅自動推定の仕様詳細(等幅/可変の扱い)。
- スタイルプリセットの追加候補 (現状は `default`/`booktabs` のみ)。
