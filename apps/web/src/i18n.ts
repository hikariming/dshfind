import en from "../../../messages/en.json";
import ja from "../../../messages/ja.json";
import ko from "../../../messages/ko.json";
import zh from "../../../messages/zh.json";
import { isLocale, type Locale } from "@/i18n/config";

export { locales, defaultLocale, type Locale } from "@/i18n/config";

/** 文案沿用老站 messages/*.json，新老两站同一份，避免漂移。 */
const messages = { zh, en, ja, ko } as const;

export function toLocale(value: string | undefined): Locale {
  if (!value || !isLocale(value)) throw new Error(`unknown locale: ${value}`);
  return value;
}

function lookup(locale: Locale, key: string): unknown {
  let node: unknown = messages[locale];
  for (const part of key.split(".")) {
    node = (node as Record<string, unknown> | undefined)?.[part];
  }
  if (node === undefined) throw new Error(`missing message ${locale}:${key}`);
  return node;
}

/**
 * 与 next-intl 同口径的取词：`t("Learn.chapters.ch1.title")`、`t("Cordis.durationApproxMin", { n: 5 })`。
 * 缺词直接抛错——静态构建期就能发现，而不是上线后显示成 key。
 * 只支持 `{name}` 简单插值；遇到 ICU plural/select 再扩展。
 */
export function translator(locale: Locale) {
  function t(key: string, vars?: Record<string, string | number>): string {
    const node = lookup(locale, key);
    if (typeof node !== "string") throw new Error(`message is not a string ${locale}:${key}`);
    return vars ? node.replace(/\{(\w+)\}/g, (m, name) => String(vars[name] ?? m)) : node;
  }
  /** 取数组/对象原值，等同 next-intl 的 t.raw */
  t.raw = <T,>(key: string) => lookup(locale, key) as T;
  return t;
}
