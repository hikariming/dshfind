import type { Lesson, LessonStatus } from "./types";

/**
 * 由本机学习进度推导每节课的状态。
 * 已标记「已学会」的是 `completed`；其后第一节未学会的是 `in_progress`（下一节该学的）；
 * 再往后的都是 `locked`。全部未学会时，第一节即为 `in_progress`。
 *
 * @param lessons - 按 index 排好序的课程列表
 * @param isLearned - 判断某个课程 id 是否已被用户标记为学会
 * @returns 课程 id 到状态的映射
 */
export function deriveLessonStatus(
  lessons: readonly Lesson[],
  isLearned: (id: string) => boolean,
): Map<string, LessonStatus> {
  const nextIndex = lessons.findIndex((lesson) => !isLearned(lesson.id));
  return new Map(
    lessons.map((lesson, i) => [
      lesson.id,
      isLearned(lesson.id) ? "completed" : i === nextIndex ? "in_progress" : "locked",
    ]),
  );
}

/**
 * 用户下一节该学的课——第一节未标记学会的课；全部学完时返回最后一节。
 *
 * @param lessons - 按 index 排好序的课程列表
 * @param isLearned - 判断某个课程 id 是否已被用户标记为学会
 * @returns 下一节课，列表为空时为 undefined
 */
export function nextLesson(
  lessons: readonly Lesson[],
  isLearned: (id: string) => boolean,
): Lesson | undefined {
  return lessons.find((lesson) => !isLearned(lesson.id)) ?? lessons[lessons.length - 1];
}
