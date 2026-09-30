import { Markdown } from "@/components/markdown";

/**
 * 服务端渲染 Markdown（复用老站 components/markdown：react-markdown + remark-gfm，不解析原始 HTML）。
 *
 * 必须经这层包装、用普通属性传正文：在 .astro 里写 <Markdown>{text}</Markdown>，Astro 会把标签之间的内容
 * 当作插槽（已渲染的 HTML 片段）传给框架组件，而不是 react-markdown 需要的 children 字符串——结果是空白正文。
 */
export default function MarkdownBody({ source }: { source: string }) {
  return <Markdown>{source}</Markdown>;
}
