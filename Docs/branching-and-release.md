# ブランチ運用と安定版昇格

最終更新: 2026-10-16

## 目的と正本

- `main`: 検証済みの安定版。開発中の変更を直接追加しない。
- `develop`: 開発の最新統合版。研究上の全フェーズを完了したことは意味しない。
- `feature/*`: 単一の機能追加・修正・リファクタリング・文書変更を進める作業ブランチ。`develop`から派生し、`develop`にPRする。
- `hotfix/*`: `main`を起点とした安定版の緊急修正。`main`にPRし、その修正を`develop`にも反映する。
- `archive/*`: 履歴保存専用。作業基準として使用しない。
- `release/*`: 複数段階の安定化が必要になったときだけ利用する任意の枝。`sandbox` / `experiment` は個別の研究作業であり、統合時は`feature/*`に整理する。

通常フロー: `develop -> feature/<issue-or-purpose> -> PR(develop) -> develop -> PR(main) -> main`。リリース時のみ`develop -> main`を許す。直接push、通常のforce push、旧試作の一括マージは禁止。

## 2026-10-16 初回移行

- 移行前`main`: `6edf796e6282f10addd7c032a1236d2769ce6428`
- 移行前`develop`: `b1928b5ed224704a169e7f0d9e73a45456521ebe`
- 旧developの保全先: `archive/develop-legacy-20261016`（旧developと同一SHA）
- 移行後`develop`: `main`の`6edf796e6282f10addd7c032a1236d2769ce6428`に一度だけ付け替え
- 検証: 移行直後の`main...develop`比較はahead=0、behind=0

移行前は両ブランチが共通祖先`7685eb3cfee7866973d15bec94e0914c559a999d`から分岐し、旧develop固有14コミット、main固有70コミットがあった。旧developの`packages/core`・`experiments/phase1-fixed`などの試作を新しい`Model` / `Playground`構成へ自動マージしていない。移植が必要なら、採用済みPromptQL仕様に照らして、独立した`feature/*`で再実装・再検証する。旧コードの存在は完成または仕様確定を示さない。

初回のdevelop参照先変更はアーカイブ作成後、旧SHAを一致確認するforce-with-leaseで実施する一回限りの移行操作であり、通常運用のforce push許可を意味しない。

## PRの規則

- `develop`へのPRは`feature/*`または`hotfix/*`からのみ。個別変更の範囲説明とCI成功が必要。
- `main`へのPRは`develop`（安定版昇格）または`hotfix/*`（緊急修正）からのみ。CI成功とリスク評価が必要。

- 原則としてfeature PRはSquash Merge、developからmainへの安定版昇格はMerge Commit（取り込んだdevelopコミットの追跡性を重視）を使用する。
- `main`への安定版昇格で新しいマージコミットができても、ファイル内容がdevelopと同一なら機械的なバックマージは不要。mainに独自変更がある場合（hotfix等）は必ずdevelopへ反映する。
- mainが最新であることは、機能全体の実装・研究成功を意味しない。現時点でSNN中核や学習成立は未達と明記する。
- 原則として既存ブランチから無関係な変更を抱き合わせず、実装と研究実証・テスト基盤を区別する。
- バグを見つけた場合はIssueへ記録し、該当する`feature/*`または`hotfix/*`で修正する。
- 不採用・廃止した過去の試作ブランチは統合作業に使用しない。履歴保持の必要性を確認したうえで、将来整理してよい。

## CI と安全性

`.github/workflows/verify.yml` は `main`・`develop`へのpushおよび両ブランチ向けPRを検証する。PRの場合は上表の方向に一致するか確認する。その後、`pnpm install --frozen-lockfile`、`format:check`、`lint`、`tsc --build`、`pnpm test`を実行する。

**CIのチェックとGitHub上の強制的なブランチ保護は別。** 必須ステータスチェックを管理画面で設定しない限り、CI失敗を無視したマージや直接pushをGitHubが必ず拒否するわけではない。運用文書による禁止だけで保護済みと扱わない。

### GitHub管理画面で必要な設定

GitHubの対象リポジトリ → Settings → Rules → Rulesets（または Branches の保護ルール）で、`main`と`develop`を対象に次を適用する。

1. PR必須、直接push禁止、強制push・削除禁止。
2. マージ前に必須チェック`verify`の成功を要求。CIがブランチで少なくとも1回成功した後、実際のステータス名を確認して選択する。
3. PRに未解決レビューがないことを要求し、可能であれば最新HEADに対する再検証を要求する。
4. 管理者を含めたバイパス権限は最小化する。過度に厳格なレビュー人数は開発人数に合わせて決定する。
5. GitHub Actionsの`pull_request`方向チェックはPR審査の補助であり、Ruleset未適用時は強制力がない。

GitHub管理用APIが使用できない場合は、この管理画面操作を未完了として記録する。実際にRulesetとbranch protectionを再取得するまで「保護済み」とは報告しない。

## 開発版と安定版の合否基準

### developへ取り込む条件

- コード品質CIが成功する。
- PRが独立した責務に限定され、仕様の出典と未決事項が明記されている。
- 既存の実装・テストを壊さず、未完成の機能は未完成と明示する。
- アーキテクチャの境界と依存方向を維持する。

### mainへの昇格条件

- develop側の対象変更がCIに合格し、回帰テストの範囲・未検証領域が記録されている。
- 安定版で保証する機能を明示し、必要な動作検証を実施する。
- 本研究のPhase達成はプログラムテストの成功と分けて扱い、学習能力の実証が必要なら実験結果で判定する。
- 問題があれば昇格を延期するか、未完成の変更を分離する。
- mainに昇格後、適切なリリースタグと変更履歴を付ける。タグは検証済み状態にだけ作成する。

## 旧developからの移植候補

旧`archive/develop-legacy-20261016`には、神経回路、シナプス・学習・恒常性・可塑性・内部状態、感情、休眠、実験ログ、Phase1のXOR試作が存在する。ただし、`main`に移植済みの恒常性基礎演算やPromptQL由来の新規設計を重複実装しない。各機能は最新仕様と比較した上で適用可能範囲のみ個別に移植する。旧試作のパラメータは採用済み仕様ではない。

## 参照

- [README](../README.md)
- [2026-10-16 旧developの保全](https://github.com/surumeneco/ProjectTailFairy/tree/archive/develop-legacy-20261016)
- [PromptQL設計の原本索引](https://drive.google.com/file/d/1n3z58WAeILNay3xgyox0bTwC4HzLSO0O/view)
