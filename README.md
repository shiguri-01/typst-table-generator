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

- pnpm
- node

### セットアップ

1. 依存関係のインストール  
   ```bash
   pnpm install
   ```
2. 開発サーバーの起動  
   ```bash
   pnpm dev
   ```
   ブラウザで <http://localhost:3000> にアクセスするとアプリを確認できます。

### スクリプト

- 型チェック・lint（Biome）: `pnpm check`
- フォーマット: `pnpm format`
- Lint（自動修正あり）: `pnpm lint`
- 単体テスト（Vitest + Testing Library）: `pnpm test`
- 本番ビルド: `pnpm build`
- ビルド成果物のプレビュー: `pnpm serve`
- Git フック（Lefthook）のセットアップ: `pnpm prepare`

## ドキュメント

- 仕様と設計: `_docs/spec.md`
- 開発者向けガイド・コマンド一覧: `_docs/contributor-guide.md`
- 進行中作業のログ: `_docs/log/`（テンプレート `_docs/log/_TEMPLATE.md`）

