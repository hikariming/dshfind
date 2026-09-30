/**
 * 论坛与登录的 Preact 岛：原样复用老站的 React 客户端组件（BbsBrowser / BbsComposer /
 * ThreadConversation / LoginPanel），外面包一层 IntlProvider 注入文案。Next 专属依赖
 * （next-intl、@/i18n/navigation、next/navigation）由 astro.config.mjs 别名到 ~/compat。
 *
 * 每个岛只带它用到的命名空间，避免把整份 messages 序列化进 HTML。
 */
import { BbsBrowser } from "@/components/bbs-browser";
import { BbsComposer } from "@/components/bbs-composer";
import { LoginPanel } from "@/components/login-panel";
import { ThreadConversation } from "@/components/thread-conversation";
import type { ForumPost, ThreadPage } from "@/lib/forum";
import { IntlProvider } from "~/compat/next-intl";

type Intl = { locale: string; messages: Record<string, unknown> };

export function BbsBrowserIsland({ locale, messages, initial }: Intl & { initial: ThreadPage | null }) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      <BbsBrowser initial={initial} />
    </IntlProvider>
  );
}

export function BbsComposerIsland({ locale, messages }: Intl) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      <BbsComposer />
    </IntlProvider>
  );
}

export function ThreadConversationIsland({
  locale,
  messages,
  ...props
}: Intl & { slug: string; initialPosts: ForumPost[]; threadAuthor: string; isLocked: boolean }) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      <ThreadConversation {...props} />
    </IntlProvider>
  );
}

export function LoginPanelIsland({ locale, messages }: Intl) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      {/* 登录门禁（AUTH_GATE）在生产环境关闭，与老站一致 */}
      <LoginPanel gateEnabled={false} />
    </IntlProvider>
  );
}
