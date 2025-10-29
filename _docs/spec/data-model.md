# データモデル仕様（src/domain/typst）

## 型の定義

セル/列/テーブルの型は次のとおりです。

```ts
export type HorizontalAlign = "left" | "center" | "right";
export type VerticalAlign   = "top"  | "horizon" | "bottom";

export type Align = {
  horizontal?: HorizontalAlign;
  vertical?: VerticalAlign;
};

export type Cell = {
  content: string;
  align?: Align;   // セル単位の整列。指定時は table.cell() を使用して出力。
  bold?: boolean;  // `*...*` で出力
  italic?: boolean; // `_..._` で出力
};

export type ColumnSpec = {
  align?: Align; // 列の既定整列。未指定なら auto。
};

export type Table = {
  columnSpecs: ColumnSpec[];
  rows: Cell[][];
  /** 先頭からのヘッダー行数（0 を含む） */
  headerRows?: number;
  /** 罫線の有無（境界ごと）。true = 線を引く */
  strokes: {
    /** y 境界（0..rows.length）。長さ = rows.length + 1 */
    row: boolean[];
    /** x 境界（0..columns）。長さ = columnSpecs.length + 1 */
    column: boolean[];
  };
};
```

注意事項:

- キャプションは Table の一部ではありません。必要に応じて `figure()` でラップします（io-spec を参照）。

## フィールド仕様

### `rows`

セルの二次元配列。各行の長さは `columnSpecs.length` に正規化されます（不足は空セルで埋め、超過は切り詰め）。

### `Cell.content`

Typst のインラインマークアップとして扱います。UI で改行入力された場合でもエスケープしない限り改行は区切りとみなしません。必要に応じてエスケープセット（任意の `Set<string>`）を指定してレンダリング時に `\` を付与します。

### `Cell.align`

セル個別の整列。指定された場合に限り `table.cell(align: ..., [content])` で出力します。未指定のセルは列整列・テーブル既定（auto）に従います。

### `Cell.bold` / `Cell.italic`

実装は Typst のインライン記法をそのまま用います。
- 太字: `*text*`
- 斜体: `_text_`
両方 true の場合は `*_text_*` の順で入れ子にします。

### `headerRows`

先頭からヘッダー行数。未指定は 0 と等価です。Typst では `table.header(...)` ブロックに含めて出力します（repeat 指定は行いません）。

### `columnSpecs`

列数と既定整列を表します。整列が全列で未指定の場合、テーブル引数の `align` は `auto` で出力します。列ごとに異なる場合は `align: (v0, v1, ...)` 形式で出力します。

### `strokes`

行・列の境界ごとに罫線を引くかどうかのブール配列です。

- `row[y]` が true なら y 境界に水平線。
- `column[x]` が true なら x 境界に垂直線。
- 全境界が true（水平・垂直とも）のときは `stroke: 1pt` の省略表現を使い、個別の `table.hline/vline` は出力しません。
- 水平のみが全 true のときは `stroke: (x: 1pt, y: none)`、垂直のみが全 true のときは `stroke: (x: none, y: 1pt)` を使用します。
- それ以外（部分的な線）は `stroke: none` を指定し、必要な位置にだけ `table.hline()` と `table.vline(x: k)` を追加します。

### `Align`

`horizontal` / `vertical` の両方またはいずれかを指定できます。未指定の場合は Typst の `auto` として扱います。

Typst の整列指定は次のとおりです。
- 水平方向: `left`, `center`, `right`
- 垂直方向: `top`, `horizon`, `bottom`

参照： [Typst Alignment Documentation](https://typst.app/docs/reference/layout/alignment/)

## 変更時の取り扱い（挿入・削除）

テーブル編集ヘルパは罫線配列の長さとインデックスを保ったままシフトします。

- 行の挿入: `rows` に行を差し込み、`strokes.row` は長さを `rows.length + 1` に再構成して既存境界の真偽を保持します。`insertAt <= headerRows` のとき `headerRows` を +1。
- 行の削除: 対象行を削除して `strokes.row` を再構成します。`removeAt < headerRows` のとき `headerRows` を -1（下限 0）。
- 列の挿入/削除も同様に `strokes.column` を再構成します。

## Spec changes

- 2025-10-26
  - `TableModel` に `strokes` を追加し、スタイルプリセットは関数として適用するように再定義。線は行/列境界単位でのみ指定し、Typst 生成時の `table.hline`/`table.vline` へ変換する。
  - セルとキャプションの文字列は生の Typst マークアップとして扱い、`linebreak()` などの自動変換を行わない。
  
- 2025-10-29
  - src/domain/typst に合わせてデータモデルを刷新。`ColumnSpec.width` と `TableStrokes`（pt 指定）を廃止し、`strokes.row/column: boolean[]` に一本化。
  - `Align` はオブジェクト型（`horizontal`/`vertical`）とし、キャプションは Table から分離（`figure()` で扱う）。
  - 太字/斜体は `strong[]/emph[]` ではなくインライン記法（`*...*`, `_..._`）で出力する。-

