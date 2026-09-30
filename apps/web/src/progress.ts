/**
 * 课程「已学会」进度：只存在本机 localStorage，键与格式和老站 LessonProgressProvider 完全一致，
 * 用户在新老两站之间来回不会丢进度。页面按「全未学会」静态渲染，这里挂载后再改写 data-* 属性，
 * 外观切换交给 Tailwind 的 data 变体——不引入任何前端框架。
 */
const KEY = "dshfind.learned.lessons";
const EVENT = "dshfind:progress";

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set(); // 无痕模式 / 数据损坏：按全未学会处理
  }
}

export function toggleLearned(id: string) {
  const learned = read();
  if (learned.has(id)) learned.delete(id);
  else learned.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...learned]));
  } catch {
    // 配额满或被禁用：本页照常切换，只是不持久化
  }
  dispatchEvent(new Event(EVENT));
}

/** 立即按当前进度渲染一次，之后本页切换或其他标签页改动时再渲染。 */
export function onProgress(render: (learned: Set<string>) => void) {
  const run = () => render(read());
  run();
  addEventListener(EVENT, run);
  addEventListener("storage", (e) => {
    if (e.key === KEY) run();
  });
}

/** 设/清布尔 data 属性，配合 Tailwind `data-learned:` 之类的变体使用。 */
export function flag(el: Element, name: string, on: boolean) {
  el.toggleAttribute(`data-${name}`, on);
}
