import {
  buildShard,
  renderUrlset,
  XML_HEADERS,
} from "@/lib/sitemap-shards";

/** 分片按需生成并由 Workers Cache 复用；不再持久化 ISR 产物。 */
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shard: string }> },
) {
  const { shard } = await params;
  const id = shard.replace(/\.xml$/, "");
  const entries = await buildShard(id);
  if (!entries) return new Response("Not found", { status: 404 });

  return new Response(renderUrlset(entries), { headers: XML_HEADERS });
}
