/**
 * 文档中心单篇文档的数据形状。语料存 D1（docs_pages），读库实现在新站
 * apps/web/src/detail/docs.ts。
 */
export interface DocPage {
  section: string;
  slug: string;
  locale: string;
  title: string;
  summary: string | null;
  body: string;
  sourcePath: string;
  sourceSha: string;
  /** true = 本站翻译，false = 上游原文。决定页面上声明栏的措辞。 */
  isTranslated: boolean;
  navOrder: number;
  updatedAt: string;
}
