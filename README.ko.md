<div align="center">

# dshfind

**DeepSeek Harness (DSH) 학습 및 공유 커뮤니티**

원리 학습 · 플러그인 마켓 · 베스트 프랙티스

🌐 **[dshfind.com](https://dshfind.com)**

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | 한국어

</div>

---

## dshfind란?

dshfind는 DeepSeek Harness (DSH)를 중심으로 한 커뮤니티 사이트입니다:

- **📖 DSH 원리 학습** — 입문부터 Cordis 논문의 장별 정독까지 체계적인 강의: 모나드, 코이펙트(Coeffect), 되돌릴 수 있는 이펙트, 이펙트 합성, 시공간 합성 가능성 등.
- **🧩 플러그인 마켓** — GitHub topic [`dsh-plugin`](https://github.com/topics/dsh-plugin)에서 자동으로 수집되는 DSH 플러그인 실시간 인덱스.
- **🏆 베스트 프랙티스** — 플러그인 개발 가이드, 용어집, 작성자·프로젝트 커뮤니티 랭킹.

## 기술 스택

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [next-intl](https://next-intl.dev) 기반 사이트 다국어 지원 (영어·중국어 UI)
- 강의 콘텐츠는 MDX ([`src/content/lessons`](./src/content/lessons))
- Tailwind CSS · Vercel에 배포

## 문서

**English**

- [Vercel + Railway production deployment](./docs/deployment-railway-vercel.md)
- [Public API and query guide](./docs/api-query.md)

**중국어 간체**

- [Vercel + Railway 프로덕션 배포 가이드](./docs/deployment-railway-vercel.zh-CN.md)
- [공개 API 및 쿼리 가이드](./docs/api-query.zh-CN.md)

## 시작하기

```bash
pnpm install
pnpm dev
```

그다음 http://localhost:3000 을 여세요.

### 플러그인·랭킹 데이터 재생성

플러그인과 랭킹 데이터는 GitHub topic `dsh-plugin`에서 생성됩니다 ([GitHub CLI](https://cli.github.com) 필요):

```bash
pnpm gen:data
```

## 플러그인 등록하기

**공개** GitHub 저장소에 `dsh-plugin` topic을 추가하면 다음 데이터 갱신 때 마켓에 표시됩니다.

## 기여하기

Issue와 PR을 환영합니다:

- 강의는 [`src/content/lessons`](./src/content/lessons)에 MDX로 작성되어 있습니다.
- UI 문구는 [`messages/`](./messages)에 있습니다.

## 관련 링크

- [DSH Desktop](https://dshdesktop.cn) — DeepSeek Harness (DSH) 플러그인 생태계를 위한 모던 데스크톱 앱 ([GitHub](https://github.com/anywhere-labs/deepseek-harness-desktop))
- [MZYAI GEO (妙智云)](https://www.mzyai.com) — DeepSeek/Kimi/두바오/GLM/훈위안 등 AI 답변에서 사이트가 정확히 인용·추천되도록 하는 오픈소스 GEO 플랫폼 ([GitHub](https://github.com/045mzyai/dsh-geo))
