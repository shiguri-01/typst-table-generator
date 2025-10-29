# 出力仕様（src/domain/typst）

## Typst 出力の基本

- `table()` を用いて表を出力します。
  - `columns`: 既定は各列 `auto`。スタイルは 2 方式（下記）。
  - `align`  : 全列未指定なら `auto`、列ごとに異なる場合は配列で出力。
  - `stroke` : 全面/水平のみ/垂直のみのときは省略表現（`1pt` または `(x|y)`）。部分的な場合は `none` を指定し、個別の線は `table.hline()` / `table.vline(x: k)` を追加します。
- 水平線の出力位置: `strokes.row[y]` が true の y 境界に `table.hline()` を挿入します（ただし全面/水平のみの省略時は挿入しない）。
- 垂直線の出力位置: `strokes.column[x]` が true の x 境界に `table.vline(x: x)` を追加します（全面/垂直のみの省略時は挿入しない）。
- ヘッダー行: `headerRows > 0` のとき先頭から `table.header(...)` ブロックに含めます。repeat 指定は行いません。
- 引数の整形: 複数行モードでは各引数を 2 スペースでインデントして改行します（実装の `formatFunction(..., { multipleLine: true })` に一致）。

### `columns` 引数の出力スタイル

- 既定（autoArray）: 列数ぶんの `auto` を配列で出力（例: `columns: (auto, auto, auto)`）。
- shorthand（count）: 省略カウントで出力（例: `columns: 3`）。

- 任意の列幅指定の機能は扱いません。
  - ユーザーは出力されたコードを編集することで柔軟に対応できます。このアプリでは table の土台を簡単に生成することに注力します。
  - `autoArray` スタイルで出力することで、後からの手動編集が容易になります。

### セルの出力

- 内容は Typst のコンテンツブロック `[ ... ]` で包む。
- 斜体/太字はインライン記法を使用（`_*...*_` / `*...*`）。
- セル個別の整列がある場合のみ `table.cell(align: ..., [content])` を使用する。
- エスケープ: オプションのエスケープ集合（`Set<string>`）を渡せる。含まれるパターン（例: `#`, `[`, `]`, `//` など）が未エスケープで現れた場合に先頭へ `\` を付加して出力する。

## Figure（キャプション・参照）

キャプションはテーブルから独立しており、必要に応じて `figure()` でラップします。表への参照・言及のため `ref` を指定できます。

```ts
type FigureOption = { caption?: string; ref?: string };
renderFigure(tableCode, { caption: "サンプル", ref: "tb:sample" });
```

## Stroke 詳細仕様（解釈と出力）

ここでは `Table.strokes` と Typst への出力の対応を詳述します。

- 用語
  - 行境界 y: `0..rows.length`。y=0 は表の最上端、y=n は最下端。
  - 列境界 x: `0..columns`。x=0 は最左端、x=m は最右端。
  - `strokes.row[y]` が true: y 境界に水平線、`strokes.column[x]` が true: x 境界に垂直線。

- `table(stroke: ...)` 引数の最適化
  - 全水平かつ全垂直が true: `stroke: 1pt`。個別の `hline/vline` は出力しない。
  - 全水平のみ true: `stroke: (x: 1pt, y: none)`。`hline` は出力しない。
  - 全垂直のみ true: `stroke: (x: none, y: 1pt)`。`vline` は出力しない。
  - それ以外: `stroke: none`。必要な位置のみ `hline/vline` を個別に出力。

- `table.hline()` の挿入位置（`stroke: none` の場合）
  - ヘッダー内: `i = 0..headerRows-1` の各行について、y=i が true なら先に `table.hline()`、続けて行内容を `table.header(...)` ブロックに出力。
  - ヘッダー直後: y=`headerRows` が true の場合、ヘッダーの後に `table.hline()` を挿入（ボディ開始前の境界）。
  - ボディ行: `i = headerRows..rows.length-1` の各行について、y=i が true なら先に `table.hline()`、続けて行内容を出力。
  - 最終境界: y=`rows.length` が true なら最後に `table.hline()` を出力。

- `table.vline(x: k)` の出力（`stroke: none` の場合）
  - x=`0..columns` で true の境界それぞれについて、テーブル末尾に `table.vline(x: k)` を追加（ヘッダー有無に関わらずまとめて末尾に出力）。

- 例（ヘッダー1行、外枠＋ヘッダー下＋最下端、左右のみ垂直線）
  - `strokes.row = [true, true, false, true]`（y=0,1,3）
  - `strokes.column = [true, false, true]`（x=0,2）
  - 出力はテストの期待例に一致:
    - `table.header(hline(), [H0..])`, ヘッダー直後に `hline()`, ボディ後に `hline()`、末尾に `vline(x:0)`, `vline(x:2)`。

## I/O方針

- JSON（アプリ独自の中間表現）の入出力は提供しません。
  - 理由: 元データは Excel/TSV が多く、出力は Typst コードとして保存・共有できるため。これらの方が運用面で広く安定しているためです。
- インポート: TSV のみ（行区切り正規化 → タブ分割 → 列数正規化）。
- エクスポート: 生成した Typst コードのコピー（クリップボード）またはダウンロードのみ。

## 参考リンク（Typst ドキュメント）

- [Typst Tables Guide](https://raw.githubusercontent.com/typst/typst/refs/heads/main/docs/guides/tables.md)
- [Typst Table Reference](https://typst.app/docs/reference/model/table/)

## Spec changes

- 2025-10-29
  - 出力規則を詳細化。`stroke` の最適化と `hline/vline` の挿入位置（ヘッダー内/直後/ボディ/末尾）を明文化。
  - I/O 方針を更新。JSON の入出力を廃止し、TSV インポート＋Typst エクスポートに限定。
  - `figure(ref: string)` を追加（参照用識別子）。
