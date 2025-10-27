# 入出力仕様

## Typst 出力方針

- 基本は `#table()` を使用。`columns` に `(auto | 長さ)` を与え、`align` を列/セルで制御。
- 罫線は最小限(ヘッダー下・表下)をデフォルト、プリセットで増減。
- 文字列エスケープ: `[` `]` `#` `"` 等を安全に処理。

### 簡易例

```typst
#table(
  columns: (auto, auto, auto),
  align: center,
  [A] [B] [C],
  [1] [2] [3],
)
```

### 生成アルゴリズム

1. `columnSpecs` から `columns: (...)` 引数を構築。`width: 'auto'` は `auto`、数値は `<数値>pt` として出力。
2. プリセットの `tableArgs` があれば `table()` 呼び出しにマージ。
3. `headerRows > 0` なら先頭行を `table.header(repeat: true, ...)` でラップ。
4. 各セルは `[テキスト]` として出力し、`bold` なら `strong[...]`、`italic` なら `emph[...]` を重ねる。
5. `strokes` を走査して `table.hline` / `table.vline` を追加。境界インデックスは @\_docs/spec/data-model.md の Stroke 仕様に従う。
6. `caption` があれば全体を `#figure(caption: [キャプション], ...)` で包む。

## TSV ペースト処理

- **行区切り**: `\r\n` を優先、セル内改行は単独の `\n` を保持。
- **セル区切り**: `\t` で分割。
- **列数の不揃い**: 各行の列数は最大列数にパディングし、空セルは `{ text: '' }` として追加。
- **処理フロー**:
  1. クリップボードから TSV テキストを取得。
  2. `parseTsv(text)` で `rows: string[][]` へパース。
  3. `createTableModel({ rows: parsedRows.map(row => row.map(text => ({ text }))) })` で正規化されたモデルを生成。
  4. 現在の選択位置に貼り付け、または新規テーブルとして置き換え。

### パース仕様

```ts
function parseTsv(text: string): string[][] {
  // 1. 行を \r\n または \n で分割
  // 2. 各行を \t で分割
  // 3. 空行はスキップ
  // 4. 最大列数を計算し、短い行は空文字列でパディング
}
```

## JSON モデルの保存/読込

### 保存

- `JSON.stringify(model, null, 2)` で整形して出力。
- ファイル名は `<テーブル名>.ttg.json` を推奨。
- `localStorage` への自動保存は `ttg:lastTable` キーで実施。

### 読込

- `JSON.parse(text)` でパースし、型検証を実施。
- 必須フィールド（`rows`）の存在確認。
- `createTableModel(parsed)` に通して正規化ルールを適用。
- 不正な値がある場合はエラーダイアログを表示し、読込を中止。

### バリデーション

```ts
function validateTableModel(data: unknown): data is TableModel {
  // 1. rows が配列であること
  // 2. 各 row が Cell 配列であること
  // 3. headerRows が数値または未定義
  // 4. columnSpecs が配列または未定義
  // 5. strokes が正しい構造
}
```

## エクスポート処理

### Typst コードエクスポート

1. `generateTypstCode(model, presetId)` を呼び出し。
2. プリセットを適用して最終的な `strokes` と `tableArgs` を取得。
3. 生成したコードをモーダルに表示。
4. 「コピー」ボタンでクリップボードへコピー。
5. 「ダウンロード」ボタンで `.typ` ファイルとしてダウンロード。

### JSON エクスポート

1. 現在の `model` を `JSON.stringify` で整形。
2. `.ttg.json` ファイルとしてダウンロード。
3. クリップボードへのコピーも提供。

## アルゴリズム詳細

### 列幅推定

- 文字幅の概算から `auto`/固定幅を選択。
- 手動指定（`columnSpecs.width`）を優先。
- 将来的には最大セル幅を計算して推奨値を提示。

### エスケープ処理

- Typst 特殊記号（`[` `]` `#` `"` 等）はバッククォート/テキストモード等で回避。
- 現在は生の Typst マークアップをそのまま出力するため、エスケープは最小限。
- セル内に `]` が単独である場合など、構文エラーを防ぐための基本的なエスケープのみ実施。

### セル結合（将来実装）

- 空セルを `colspan/rowspan` に折り畳む。
- `table.cell(colspan: 2, [テキスト])` のような出力を生成。

## エラー処理

### 大規模貼り付け

- サイズ上限（例: 1000 行 × 100 列）を超える場合は確認ダイアログを表示。
- 処理中はローディング表示。

### クリップボード失敗

- クリップボード API が使えない場合は手動コピー用のテキストエリアを表示。
- トースト通知でフィードバック。

### JSON パースエラー

- 不正な JSON の場合はエラーメッセージを表示。
- 部分的に修復可能な場合は修復提案を表示。
