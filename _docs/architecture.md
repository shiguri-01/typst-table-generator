# アーキテクチャ方針とディレクトリ構成

## レイヤと責務

- `src/domain/typst`
  - 目的: Typst 向けの純粋なドメインモデルとレンダラ。
  - 入力: テーブルの内部モデル（cells/columnSpecs/headerRows/strokes）。
  - 出力: Typst の文字列（`table()`, `table.header()`, `table.hline/vline()`, `figure()` など）。
  - 特徴: UI 非依存、状態管理や副作用なし、テスト容易性重視。

- `src/lib`
  - 目的: UI/ドメインの共通プリミティブ群（フォーマット補助、配列整形、プリミティブ関数など）。
  - 注意: テーブル生成ロジックは `src/domain/typst` を唯一の真実とし、`src/lib` は汎用補助のみに限定します。

- `src/features`（将来）
  - 目的: 機能単位（Feature Slice）で UI・状態・ドメイン結線をまとめる置き場。
  - 例: `features/table-editor`（編集グリッド、ツールバー、エクスポートパネルなど）。
  - 方針: features → domain（依存OK）、domain → features（禁止）。UI は `src/components/ui` の Kobalte ラッパーを経由して利用します。

## 運用方針（設計・変更）

- 仕様の単一情報源: `_docs/spec/`。挙動変更時は spec を先に更新し、同じ PR で実装を追従させます（今回のように先に文書更新のみ行うケースは、Spec changes に「実装追従タスクあり」と明記）。
- 小さな差分: 変更は機能単位で小さく、テストを同梱します。
- 互換性: 既存の Typst 出力が壊れないように、非互換を伴う変更は `Spec changes` に明確に記述し、サンプル出力を併記します。

## I/O 方針（合意）

- JSON の入出力は提供しません（中間表現の長期保守コストがメリットを上回らない）。
- インポートは TSV、エクスポートは Typst コード（コピー or ダウンロード）。

## フォルダガイド（何をどこに置くか）

- `src/components`
  - 再利用可能な純粋 UI コンポーネント置き場。
  - `src/components/ui` は Kobalte primitive に Tailwind + `cva` を適用した薄いラッパー群。
  - 例: `AppHeader.tsx`（アプリ共通ヘッダー）。

- `src/features`（新規実装の推奨置き場）
  - 1 機能 = 1 ディレクトリで UI・状態・副作用をまとめる。
  - 例: `features/table-editor/{components, hooks, state, panels}`。
  - 依存方向: features → lib/domain は OK、逆は不可。

- `src/domain/typst`
  - テーブル生成のドメインロジック（唯一の真実）。
  - 入口: `table/render-table.ts`（Typst 出力）、`table/table.ts`（編集ヘルパ）。
  - 補助: `alignment.ts` `array.ts` `emphasis.ts` `utils/format.ts` `figure.ts`。
  - テストは同階層に共置（`*.test.ts[x]`）。

- `src/lib`
  - 小粒な共通ユーティリティ（`utils.ts` など）。

- `src/main.tsx` / `src/router.tsx`
  - Solid エントリポイントと TanStack Solid Router の定義。
  - `src/router.tsx` でルートツリーをコード定義し、`src/main.tsx` で `RouterProvider` をマウント。

- `src/hooks`
  - UI で使う汎用 hooks（必要時に追加）。

- `public`
  - 静的アセット。Vite による配信対象。

- `_docs`
  - `spec/` が唯一の仕様ソース。`log/` に作業ログを作成（`YYYYMMDD_<slug>.md`）。

- ルート直下
  - `package.json`（スクリプト: `dev`, `check`, `test`, `build`, `serve`）。
  - `biome.json`（lint/format 設定）, `lefthook.yml`（Git hooks）, `vite.config.ts`, `tsconfig.json`。

## コードを読むときの道しるべ（Start Here）

- Typst 出力: `src/domain/typst/table/render-table.ts`（最重要）→ `render-table.test.ts` で期待出力を把握。
- テーブル編集: `src/domain/typst/table/table.ts` の挿入/削除/境界ロジック。
- 基本ユーティリティ: `src/domain/typst/utils/format.ts`（関数呼び出し整形・エスケープ）。
- 図ラッパ: `src/domain/typst/figure.ts`（将来の `ref` 拡張対象）。
- UI エントリ: `src/main.tsx`（アプリ起動）と `src/router.tsx`（ルート定義）。
- UI 基盤: `src/components/ui/*`（Kobalte ラッパー）、`src/components/AppHeader.tsx`。

## 新しいものを作るときの置き場所と手順

- UI 機能を追加したい: `src/features/<feature-name>/` を作り、UI と状態と副作用を同居。Kobalte ラッパーコンポーネントを活用。
- ドメイン仕様を広げたい: `src/domain/typst` に型・ロジック・テストを追加/変更。挙動変更は先に `_docs/spec/` を更新し、同一 PR で実装とテストを追従。
- 共有ユーティリティ: 小粒関数は `src/lib`、Typst 生成に密接なものは `src/domain/typst` 側へ。
- ルーティング: `src/router.tsx` の route tree にルートを追加。
- スタイル: 共通は `src/styles.css`。UI variants は `cva`、クラス統合は `cn` を利用。
- テスト: 変更箇所と同じディレクトリに `*.test.ts[x]` を追加。
- ログ: `_docs/log/YYYYMMDD_<slug>.md` を作成し、目的・TODO・要点・Spec changes を記録。

## Spec changes

- 2025-10-29
  -  ディレクトリ構成と責務を明文化。
  -  `src/domain/typst` を唯一の生成ロジックとし、`src/lib/table` はレビュー対象外（legacy）。
  -  UI は今後 `src/features` 配下に配置。
  -  I/O は TSV/Typst のみ。
- 2026-02-19
  - React/React Aria 前提を廃止し、SolidJS + TanStack Solid Router + Kobalte 構成へ移行。
  - ルート構成を `src/main.tsx` / `src/router.tsx` のコード定義方式へ更新。
  - グリッド実装を `@shiguri/solid-grid` 前提に更新。
