# Typst Table Generator

Typst の `#table()` コードを生成するテーブルエディタです。

## 概要

- Web UI で行・列の追加・削除、ヘッダー行の指定、整列や装飾の調整を行い、Typst に貼り付けられるコードを生成することを目指しています。
- Excel などからコピーした TSV を貼り付けて編集し、スタイルプリセットを適用できるワークフローを設計中です。
- スペックや詳細な振る舞いは `_docs/spec.md` にまとめています。

## 主な機能（計画中）

- 行・列操作、ヘッダー行数、キャプション設定
- セルごとの整列・太字・斜体などの装飾
- 列幅や罫線を含むスタイルプリセット（booktabs 風など）
- Typst コード出力とクリップボードコピー
- Excel 由来 TSV のペースト対応とテーブルサイズのバリデーション

## ローカル開発

### 必要な環境

- Bun 1.x（または Node.js 22 以降）と最新のパッケージマネージャを推奨

### セットアップ

1. 依存関係のインストール  
   ```bash
   bun install
   ```
2. 開発サーバーの起動  
   ```bash
   bun run dev
   ```
   ブラウザで <http://localhost:3000> にアクセスするとアプリを確認できます。

### スクリプト

- 型チェック・lint（Biome）: `bun run check`
- フォーマット: `bun run format`
- Lint（自動修正あり）: `bun run lint`
- 単体テスト（Vitest + Testing Library）: `bun run test`
- 本番ビルド: `bun run build`
- ビルド成果物のプレビュー: `bun run serve`
- Git フック（Lefthook）のセットアップ: `bun run prepare`

## ドキュメント

- 仕様と設計: `_docs/spec.md`
- 開発者向けガイド・コマンド一覧: `_docs/contributor-guide.md`
- 進行中作業のログ: `_docs/log/`（テンプレート `_docs/log/_TEMPLATE.md`）

