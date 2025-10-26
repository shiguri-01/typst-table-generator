# Workflow automation improvements

- Date: 2025-10-26

## Purpose
Git hook と CI の自動チェックを整備して、push / PR 前後のワークフローを安定させる。

## Plan / TODO
- [x] pre-push フックにテストとビルドを組み込む
- [x] ドキュメントを更新して新しいフローを共有する
- [x] コマンド結果を確認してログを更新する

## Notes (随時追記)
- 設計・検討メモ:
- 気づき/意思決定: pre-push フックは逐次実行でテスト失敗時にビルドを走らせないよう `parallel: false` を指定。Vitest の worker が環境で落ちるため `vitest run --pool=threads --maxWorkers=1 --minWorkers=1` に固定。型崩れ検知のため `pnpm exec tsc --noEmit` も順番の先頭に追加。
- 困りごと/対応: `lefthook run pre-push` は push 先情報がなくても skip 表示になるので、実行確認は `pnpm exec lefthook run pre-push --force` を使うか、`tsc` / `vitest` / `build` を個別に実行してカバー。差分ゼロで skip されるのは許容するが、`--no-verify` などの手動スキップは禁止ルールに明記した。
- ドキュメントは AI エージェント向けに要点だけ残すよう再調整。
- Workflow 節も圧縮して要点化。
- @_docs/spec.md の参照指示は「必要時のみ」に変更し、@付きファイル名の後はスペースを空けるよう整備。
- Commit 手順は複数回に分ける前提を追記。
- Validate 手順も箇条書きに圧縮。
- ログテンプレートの Pre-PR チェックリストから自動実行項目を除外。
- チェックリストのログリンク項目は「PR本文案ベース」に
- Pre-PR チェックの Spec 項目は「必要性を確認したうえでチェック」方式に統一。
- CI workflow を追加し、AGENTS / contributor guide に記載。
- AGENTS は概要、contributor-guide は詳細という棲み分けに修正。
- ブランチ名を `chore/workflow-improvements` に更新。
- push は環境の DNS 制限で失敗したためローカルコミットのみ。後でリトライ必要。


## Summary
pre-push フックで型チェック → テスト → ビルドを自動化し、CI workflow を追加。AGENTS では概要、contributor guide では詳細手順を示すよう整理した。

## Next (必要に応じて)
- 

## Reflection (感想)
ローカルでの `lefthook run pre-push` が skip 表示になる挙動を初めて知った。`--force` を付けて再現するか、個別コマンドで追う運用を覚えたので次からは迷わなそう。

## Pre-PR Checklist
- [ ] Spec確認：必要な変更は `_docs/spec.md` に反映し、不要なら Summary に理由を記してからチェック
- [ ] PR本文案にこのログへのリンクを含める（PR作成直前に確認）
