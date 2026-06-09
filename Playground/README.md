# Playground (Nuxt 検証環境)

非公開の検証環境。Nuxt 3 でフェーズ達成確認・性能テスト/ベンチマークを行う。

- `pages/Phases/` — 各フェーズ達成確認ページ（`Phase1.vue`, `Phase2.vue`, ...）
- `pages/Experiments/` — 性能テスト・ベンチマーク用ページ
- `composables/` / `utils/` — Web Worker・遺伝的アルゴリズム実行（Nuxt の範疇）

Nuxt 本体のスキャフォールド（`nuxt.config.ts` 等）は別タスクで導入する。
リポジトリ内のファイルは相対パス/エイリアスで直接 import し、通常の Nuxt ビルドコマンドで構築する。
