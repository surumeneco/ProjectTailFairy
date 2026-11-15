# Playground（研究検証用 Nuxt アプリ）

Phase 1以降の学習能力・実験結果を観測する非公開の検証UIです。**アプリの起動成功はモデルの学習能力の実証を意味しません。**

## 起動

リポジトリルートから Node.js 22、pnpm 10.28.1 を使用します。

```sh
pnpm install --frozen-lockfile
pnpm dev:playground
pnpm build:playground
```

- `app/pages/Phases/` — フェーズごとの検証画面
- `app/pages/Experiments/` — 性能測定・ベンチマーク画面
- `composables/` / `utils/` — Web Workers・パラメータ探索の後続実装の配置予定

現時点ではナビゲーションと各画面のプレースホルダーのみです。Agent・Worker・実験オーケストレーター・記録機構は別の実装／検証課題です。

## Nuxt のバージョン

当初の Nuxt 3 計画は未導入の予定技術でしたが、Nuxt 3 は2026-07-31にサポート終了したため、環境構築時には現行サポート系の Nuxt 4 を採用しています。これは研究上のSNN・検証要件やモデル仕様を変更するものではありません。
