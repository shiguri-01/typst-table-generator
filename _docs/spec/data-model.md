# データモデル仕様

## JSON モデル定義

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

## フィールド仕様

### `rows`

矩形のセル行列。実装では最長行の列数を `columnCount` とし、短い行は空文字列セルでパディングして保存する。`rows.length` は 1 以上を想定し、空テーブルは UI 側でガードする。

### `Cell.text`

Typst のインラインマークアップを素で格納する。UI に入力した文字列をそのままセル式へ埋め込み、`linebreak()` などの自動展開は行わない。必要最小限のエスケープ（`]` の閉じ忘れ防止など）は出力フェーズで実施するが、入力済みの Typst コードは変形しない。

### `Cell.align`

セル個別の横位置指定。未指定の場合は `ColumnSpec.align` → テーブル既定値（`'left'`）の順でフォールバックする。

### `Cell.bold` / `Cell.italic`

真の場合のみ Typst 出力時に `strong[…]` / `emph[…]` を重ねる。両方 `false`（未指定）は素のテキストを出力。

### `headerRows`

先頭から何行をヘッダーとして扱うか。未指定は `0`。負値は `0` に、`rows.length` を超える値は `rows.length` にクランプする。Typst コードでは `table.header(repeat: true, …)` に該当行をまとめる。

### `caption`

オプションのキャプション文字列。空文字か未指定なら `figure` で包まない。改行や Typst マークアップは入力どおりに保持し、追加の `linebreak()` 変換は行わない。

### `columnSpecs`

列ごとの幅・整列のヒント。`columnCount` に満たない場合は残りをデフォルト（`{ width: 'auto' }`）で補完し、超過分は無視する。

- `width`: `'auto'` か 0 より大きい数値。数値は Typst の長さ（pt 単位）として `table(columns: …)` に渡す。UI では `auto` が既定。
- `align`: 列既定の横位置。セルが `align` を持つ場合はセル設定を優先。

### `strokes`

行・列境界の罫線指定。`rows[i].top` は行 `i` の直前（表上端含む）、`rows[i].bottom` は行 `i` の直後（最終行後端含む）に該当する。同様に `columns[i].left` が列 `i` の左側（表左端含む）、`columns[i].right` が列 `i` の右側（表右端含む）。

- `StrokeValue`: `'none'` か 0 より大きい数値 (pt)。`'none'` は線を描かない。
- 指定がなければ線を追加しない。UI は既定でプリセット相当の線を提示できるが、JSON には必要な境界のみ保存する。
- 行・列配列の長さはそれぞれ `rows.length`、`columnCount` にそろえる。短い場合は `{}` でパディング、長い場合は切り詰める。

## 正規化ルール

- **読み込み時**: 行列の長さが不揃いなら、右端に `{ text: '' }` を追加して `rows` を矩形化する。
- **書き込み時**: `columnSpecs` は最新の `columnCount` に合わせてトリミング／パディングする。`Cell.align` が列指定と同じ場合でも値は保持してよい。
- **エクスポート前**: `headerRows` のクランプを再確認し、0 の場合は `table.header` ブロックを出力しない。`strokes` は行・列数に合わせて再パディングし、`'none'` は `undefined` と同じ扱いに正規化してよい。

## Stroke (罫線) の扱い

`strokes` により、特定セル単位ではなく行/列全体の境界にだけ線を入れる。途中で途切れたり範囲を限定する機能は提供しない。

### 生成ルール

水平方向は `table.hline(y: boundaryIndex, stroke: …)` を使い、`boundaryIndex` は `0` から `rows.length` までの整数。`rows[i].top` が設定されていれば `boundaryIndex = i`、`rows[i].bottom` が設定されていれば `boundaryIndex = i + 1` の線を追加する。

縦線は `table.vline(x: boundaryIndex, stroke: …)` で、`columns[i].left` → `boundaryIndex = i`、`columns[i].right` → `boundaryIndex = i + 1` を使う。

### StrokeValue の展開

数値は `pt` 単位とみなし、Typst 呼び出しでは `stroke: 0.6pt` のように長さリテラルを発行する。`'none'` または未指定の境界はスキップ。

### 同じ境界への重複指定

`rows[i].bottom` と `rows[i+1].top` のように同じ境界を重複指定した場合、後者を優先する。実装では最後に評価した値を採用することで UI の上書きを反映できる。

### ヘッダーとの相互作用

`headerRows` に関係なく境界インデックスを算出する。ヘッダー直下に線を引くには、ヘッダー最終行の `bottom` を設定する。プリセットは `strokes` に値を書き込むか、エクスポート時に仮想的な線を追加することで実現する。

## スタイルプリセット

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

`StylePreset` は必要に応じて `TableModel` を参照し、`strokes` へ追記したり、`tableArgs` として Typst に渡すパラメータを返す。生成パイプラインは `const preset = STYLE_PRESETS[id]; const overrides = preset?.(model);` のように呼び出し、戻り値を `model` からの生データに重ねる。UI 側は「プリセット適用 → 必要に応じて個別調整 →JSON 保存」という流れを想定するが、適用結果は `strokes` 等の通常フィールドに書き戻される。

### Preset 適用フロー

1. JSON を読み込み、必要なら UI でプリセットボタンを押して `STYLE_PRESETS[id](model)` を適用し、得られた `overrides.strokes` を `model.strokes` にマージする。
2. Typst 出力時は `model` と適用済み `strokes` を使って `table(columns: …)` を構築する。`overrides.tableArgs` があれば `table` 呼び出しの引数へマージし、`header`/`footer` の追加引数も同様に適用する。
3. `strokes` を走査して `table.hline` / `table.vline` を追加。空または `'none'` の境界はスキップする。
4. プリセット適用前のモデルにも対応するため、`STYLE_PRESETS.default` は空操作を返す。プリセットを使用しない場合でも `strokes` に直接値を入れて出力できる。

### `default` プリセット

- **目的**: Excel から貼り付けた直後でも読みやすいミニマル表。
- **Typst 生成時の設定**:
  - `tableArgs.stroke`: `{ y: none }`（縦罫線なし）。
  - `tableArgs.row-gutter`: `6pt`, `tableArgs.column-gutter`: `12pt`。
  - `header.text`: `{ weight: "bold" }`、`header.stroke`: `{ bottom: 0.5pt }`。
  - `strokes.rows`: ヘッダーが 1 行以上ある場合は最後のヘッダー行の `bottom` に `0.5pt`。表の最終行の `bottom` にも `0.5pt` を置き、その他は `undefined`。
- `columnSpecs` やセル側で明示された `align`/`width` は上書きせず尊重する。

### `booktabs` プリセット

- **目的**: Typst での booktabs 風整形に合わせた出力。
- **Typst 生成時の設定**:
  - `tableArgs.stroke`: `{ y: none }`。
  - `tableArgs.row-gutter`: `8pt`, `tableArgs.column-gutter`: `14pt` (行間をやや広めに)。
  - `header.text`: `{ weight: "bold" }`、`header.stroke`: `{ bottom: 0.8pt }`。
  - `strokes.rows`: 先頭行の `top` に `1pt`、ヘッダー最終行の `bottom` に `0.8pt`、本文最終行（`Math.max(headerRows, rows.length - 1)`）の `top` に `0.6pt`、表の最終行の `bottom` に `1pt`。
    - `headerRows >= rows.length` の場合は本文境界が存在しないため `0.6pt` のラインは省略する。境界が重複する場合は後勝ちで上書きする。
- 縦線は引かない。ヘッダー以外の強調(イタリック等)はセルデータに委ねる。

プリセットは `STYLE_PRESETS: Record<StylePresetId, StylePreset>` のような辞書として管理し、JSON モデルに直接展開しない。新しいプリセットを追加する場合は `StylePresetId` を拡張し、仕様へ同様の表形式で挙動を追加する。

## 未決事項

- セル結合の初期対応範囲と UI。
- 列幅自動推定の仕様詳細(等幅/可変の扱い)。
- スタイルプリセットの追加候補 (現状は `default`/`booktabs` のみ)。

## Spec changes

> **Spec change (2025-10-26)** `TableModel` に `strokes` を追加し、スタイルプリセットは関数として適用するように再定義。線は行/列境界単位でのみ指定し、Typst 生成時の `table.hline`/`table.vline` へ変換する。
>
> **Spec change (2025-10-26)** セルとキャプションの文字列は生の Typst マークアップとして扱い、`linebreak()` などの自動変換を行わない。
