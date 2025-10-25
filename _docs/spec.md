# typst-table-generator: 仕様と設計

最終更新: 2025-10-25 / バージョン: 0.1-draft

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
type Align = 'left' | 'center' | 'right'
type Cell = { text: string; align?: Align; bold?: boolean; italic?: boolean; colspan?: number; rowspan?: number }
type ColumnSpec = { width?: 'auto' | number; align?: Align }
type TableModel = {
  rows: Cell[][]
  headerRows?: number
  caption?: string
  columnSpecs?: ColumnSpec[]
  stylePreset?: 'default' | 'booktabs'
}
```

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
- ルート: `/` にエディタ。`src/routes/index.tsx` に実装。今後 `settings`/`about` 追加可。
- 状態管理: React state を基本。エクスポート/インポートは JSON を使用。
- 主な構成: `TableEditor`, `Toolbar`, `ExportPanel`。

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
- スタイルプリセットの種類(罫線/余白/ヘッダー強調)。
