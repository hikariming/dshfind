<div align="center">

# dshfind

**DeepSeek Harness (DSH) の学習・共有コミュニティ**

原理の学習 · プラグインマーケット · ベストプラクティス

🌐 **[dshfind.com](https://dshfind.com)**

[English](./README.md) | [简体中文](./README.zh-CN.md) | 日本語 | [한국어](./README.ko.md)

</div>

---

## dshfind とは?

dshfind は DeepSeek Harness (DSH) を中心としたコミュニティサイトです:

- **📖 DSH 原理の学習** — 入門から Cordis 論文の章ごとの精読までの体系的なレッスン:モナド、余作用(Coeffect)、可逆エフェクト、エフェクト合成、時空間合成可能性など。
- **🧩 プラグインマーケット** — GitHub topic [`dsh-plugin`](https://github.com/topics/dsh-plugin) から自動集約される DSH プラグインのライブインデックス。
- **🏆 ベストプラクティス** — プラグイン開発ガイド、用語集、作者・プロジェクトのコミュニティランキング。

## 技術スタック

- [Next.js 16](https://nextjs.org)(App Router)+ React 19
- [next-intl](https://next-intl.dev) によるサイトの多言語化(英語・中国語 UI)
- レッスンコンテンツは MDX([`src/content/lessons`](./src/content/lessons))
- Tailwind CSS · Vercel にデプロイ

## ドキュメント

**English**

- [Vercel + Railway production deployment](./docs/deployment-railway-vercel.md)
- [Public API and query guide](./docs/api-query.md)

**簡体字中国語**

- [Vercel + Railway 本番デプロイガイド](./docs/deployment-railway-vercel.zh-CN.md)
- [公開 API・クエリガイド](./docs/api-query.zh-CN.md)

## はじめに

```bash
pnpm install
pnpm dev
```

http://localhost:3000 を開いてください。

### プラグイン・ランキングデータの再生成

プラグインとランキングのデータは GitHub topic `dsh-plugin` から生成されます([GitHub CLI](https://cli.github.com) が必要):

```bash
pnpm gen:data
```

## プラグインを登録する

**公開** GitHub リポジトリに `dsh-plugin` topic を追加すると、次回のデータ更新時にマーケットに表示されます。

## コントリビュート

Issue や PR を歓迎します:

- レッスンは [`src/content/lessons`](./src/content/lessons) に MDX で書かれています。
- UI の文言は [`messages/`](./messages) にあります。

## 関連リンク

- [DSH Desktop](https://dshdesktop.cn) — DeepSeek Harness (DSH) プラグインエコシステムのためのモダンなデスクトップアプリ([GitHub](https://github.com/anywhere-labs/deepseek-harness-desktop))
- [MZYAI GEO(妙智云)](https://www.mzyai.com) — DeepSeek/Kimi/豆包/GLM/混元 などの AI 回答でサイトが正確に引用・推薦されるようにするオープンソース GEO プラットフォーム([GitHub](https://github.com/045mzyai/dsh-geo))
