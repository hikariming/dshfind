/**
 * next-intl 的最小替身，让老站的客户端组件（论坛、登录面板）在 Astro + Preact compat 下原样复用，
 * 不必逐个重写。astro.config.mjs 把 "next-intl" 别名到这里；新站自己的代码不用它。
 *
 * 文案经 IntlProvider 传入（岛的 props 里只带用到的命名空间），服务端渲染与浏览器水合走同一份。
 * 只实现这几个组件用到的 API：useLocale / useTranslations（含 {name} 插值与 t.raw）。
 */
import { createContext, type ComponentChildren } from "preact";
import { useContext } from "preact/hooks";

type Messages = Record<string, unknown>;

const IntlContext = createContext<{ locale: string; messages: Messages }>({ locale: "zh", messages: {} });

export function IntlProvider({ locale, messages, children }: { locale: string; messages: Messages; children: ComponentChildren }) {
  return <IntlContext.Provider value={{ locale, messages }}>{children}</IntlContext.Provider>;
}

export function useLocale(): string {
  return useContext(IntlContext).locale;
}

function lookup(messages: Messages, path: string): unknown {
  let node: unknown = messages;
  for (const part of path.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
  return node;
}

export function useTranslations(namespace?: string) {
  const { messages } = useContext(IntlContext);
  const full = (key: string) => (namespace ? `${namespace}.${key}` : key);
  function t(key: string, vars?: Record<string, string | number>): string {
    const node = lookup(messages, full(key));
    // 与 next-intl 生产行为一致：缺词显示 key 路径，而不是抛错把整块交互打挂
    if (typeof node !== "string") return full(key);
    return vars ? node.replace(/\{(\w+)\}/g, (m, name) => String(vars[name] ?? m)) : node;
  }
  t.raw = (key: string) => lookup(messages, full(key));
  t.has = (key: string) => lookup(messages, full(key)) !== undefined;
  return t;
}
