import { NextRequest, NextResponse } from "next/server";

type Params = Promise<{ locale: string }>;

// 首页赞助商卡片用的是旧地址 .../liguobao/deepseek-harness-remote，
// 实际仓库已改名为 liguobao/ds-harness-remote。旧地址已对外发布，保留它做 302，
// 不走高层的 plugin-renames（那边是 301 永久重定向），赞助商地址以后可能还会换。
export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  const { locale } = await params;
  return NextResponse.redirect(
    new URL(`/${locale}/plugins/liguobao/ds-harness-remote`, request.url),
    302,
  );
}
