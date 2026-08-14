<div align="center">

# dshfind

**The learning & sharing community for DeepSeek Harness (DSH)**

Learn the principles · Discover plugins · Share best practices

🌐 **[dshfind.com](https://dshfind.com)**

English | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

</div>

---

## What is dshfind?

dshfind is a community site built around DeepSeek Harness (DSH):

- **📖 Learn DSH principles** — structured lessons from the basics up to a chapter-by-chapter deep dive of the Cordis paper: monads, coeffects, revertible effects, effect composition, spatiotemporal composability, and more.
- **🧩 Plugin marketplace** — a live index of DSH plugins, automatically aggregated from the GitHub topic [`dsh-plugin`](https://github.com/topics/dsh-plugin).
- **🏆 Best practices** — plugin development guides, a glossary, and community rankings of authors and projects.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [next-intl](https://next-intl.dev) for site i18n (English & Chinese UI)
- MDX for lesson content ([`src/content/lessons`](./src/content/lessons))
- Tailwind CSS · deployed on Vercel

## Getting started

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

### Regenerating plugin & ranking data

Plugin and ranking data are generated from the GitHub topic `dsh-plugin` (requires the [GitHub CLI](https://cli.github.com)):

```bash
pnpm gen:data
```

## Submit your plugin

Add the `dsh-plugin` topic to your **public** GitHub repository — it will show up in the marketplace on the next data refresh.

## Contributing

Issues and PRs are welcome:

- Lessons live in [`src/content/lessons`](./src/content/lessons) as MDX.
- UI strings live in [`messages/`](./messages).
