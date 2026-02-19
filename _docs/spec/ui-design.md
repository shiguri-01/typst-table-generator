# UI/UX 設計仕様

## ルート構成 (`/`)

- エントリポイントは `src/main.tsx`。`src/router.tsx` で TanStack Solid Router の route tree をコード定義する。
- `rootRoute` は共通シェルとして `AppHeader` と `Container` を提供する。
- `indexRoute` では以下の 2 カラムレイアウトを描画する。
  - 左: `GridToolBar` + `TableEditorGrid`
  - 右: `ExportOptionsPanel` + `ExportButton`
- `ExportModal` はページ内に常駐し、ストアの `export.showExportModal` で開閉する。

## エディタサーフェス（`@shiguri/solid-grid`）

- グリッドは `Gridsheet<Cell>` を利用する。
- プラグインは `createPluginHost` 経由で以下を適用する。
  - `selectionPlugin`
  - `editingPlugin`
  - `deletePlugin`
  - `clipboardTextPlugin`
- `onCellsChange` の patch を受け、`TableEditorState.table.rows` に反映する。
- `onActiveCellChange` / `onSelectionChange` を `activeCell` / `selection` に同期する。
- セル描画は `renderCell` で行い、`align` / `bold` / `italic` / stroke をクラスで反映する。
- セル編集中の入力値は editor 内のドラフトとして保持し、`Enter` または `Blur` で確定、`Escape` で破棄する。
- 行数が 0 の場合でも列ヘッダー操作を維持するため、グリッド描画では列数ぶんの仮想行を使用して列操作を継続可能にする。

## ツールバー

- 4 セクションで構成する。
  - `align`: horizontal / vertical の単一選択トグル
  - `format`: bold / italic
  - `border`: top/bottom/left/right/all/none
  - `row / col`: 行列の追加・削除
- 選択範囲がない場合、範囲依存アクションは disabled にする。
- 選択情報は `A1` 形式で表示し、複数選択時は開始・終了セルを表示する。

## エクスポート関連 UI

- `ExportOptionsPanel`
  - Escape 設定 (`escapeCellContent`)
  - `columnsArgStyle` の選択（`autoArray` / `count`）
  - `figure` 包装の有効化と caption/ref 入力
- `ExportButton`
  - Export（モーダル表示）
  - ドロップダウン: Export and Copy / Export and Download / Last export actions
- `ExportModal`
  - 最新エクスポートコード表示
  - stale 警告表示
  - copy 失敗時のエラーメッセージ表示
  - 右上のアイコンボタン（`x`）とフッターの Close ボタンの両方で閉じられる

## UI コンポーネント方針

- `src/components/ui` に Kobalte ラッパーを配置する。
- クラス統合は `cn`（`clsx` + `tailwind-merge`）を使用する。
- バリアント定義は `cva` で統一する。
- アイコンは `@tabler/icons-solidjs` を利用する。

## 状態管理（Solid signals）

- `src/features/table-editor/store.ts` の module-scope signal を単一状態として扱う。
- 主要 state:
  - `table`
  - `selection` / `activeCell`
  - `wrapFigure`
  - `tableRenderingOptions`
  - `export`
- 主要 action:
  - 選択範囲更新・書式更新（bold/italic/align/border）
  - 行列挿入・削除
  - Export モーダル/コピー状態管理

## 拡張ポイント

- `@shiguri/solid-grid` は `0.1.2` 固定採用とし、更新時は別 PR で検証する。
- 将来的な大規模UI分割では `features/table-editor` 内を `components/state/utils` に再分割可能。

## Spec changes

> **Spec change (2025-10-27)** テーブルエディタ画面は `react-datasheet-grid` を中心に構成し、アプリ状態は Zustand ストアで一元管理する。これに合わせてレイアウト、操作フロー、プロパティ編集 UI を具体化した。
>
> **Spec change (2026-02-19)** UI 基盤を SolidJS + Kobalte + `@shiguri/solid-grid` に移行。React/React Aria/react-datasheet-grid/Zustand 前提の記述を廃止し、現在の実装構成（signals store・Kobalte ラッパー・Solid Router）へ更新。
>
> **Spec change (2026-02-19)** グリッド編集時の確定タイミングを明確化。入力中はドラフトを保持し、`Enter` / `Blur` で反映、`Escape` でキャンセルする。
>
> **Spec change (2026-02-19)** モーダル共通UIに右上のアイコン閉じるボタンを追加。キーボード/ポインタ双方で閉じ動線を確保。
>
> **Spec change (2026-02-19)** グリッド編集中のセルクリックで 1 回目クリックから選択遷移できるよう編集解除タイミングを調整。あわせて行 0 件時でも列操作が行えるよう選択正規化と描画データを補正。
