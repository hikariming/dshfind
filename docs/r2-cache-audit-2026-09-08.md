# R2 缓存核对（2026-09-08）

## 已确认的线上事实

- 账户：`8f19bebe359e4ec1a24c68c5f49c1584`；桶：`dshfind-isr-cache`。
- 控制台显示约 584,500 个对象、300.13 GB（指标有延迟，非全量清单的精确汇总）。
- `incremental-cache/` 下通过四页目录核对到 87 个不同 build ID。
- 公开主站 `/zh` 的 RSC 数据包含当前 build ID：`eVDjMunbHD_ELyQk9MlU6`；该目录样本在 9 月 8 日持续更新。操作前必须重新核对在线版本，不能把本文的 ID 当成永久有效的保留名单。
- Wrangler 查询的桶生命周期只有 `Default Multipart Abort Rule`，7 天后终止未完成分片上传；没有对已完成对象的过期删除规则。
- 非当前目录 `0dkoT739bIbhumKDg53z8` 的对象样本修改时间为 8 月 22 日，且存在与当前目录相同哈希的页面对象。
- 当前目录之外的 86 个目录不能直接全部视为可删：还需排除回滚版本、预览或其他仍在使用此桶的部署。

## 缓存内容与体积实测

使用 Wrangler 正常认证，只读下载当前 build 的三个对象；没有提取现有认证令牌。

| 路径（由缓存 HTML canonical 确认） | 对象大小（字节） | 离线 gzip 大小（字节） |
| --- | ---: | ---: |
| `/en/plugins/TellToday/dsh-narrative-voice` | 332496 | 76928 |
| `/en/plugins/fuzz1og/dsh-ocgo-quota` | 459014 | 91157 |
| `/en/plugins/all/24` | 1935521 | 216711 |

三个对象均为 `type: app`，同时包含 HTML、RSC、segmentData 和元数据。大对象是分页索引，不是未知上传。样本不足以估计全桶 404 占比或可释放的总字节数。

离线压缩仅说明冗余较多，不代表已启用压缩，也不代表压缩一定降低总费用。需同步实现缓存读写兼容，并测量 Worker 解压 CPU、延迟和峰值内存；不能只改变对象 Content-Encoding。

## 修复方向与边界

1. 保留现有 ISR，先统计每个 build 的对象数量、总字节数、最早和最晚写入日期，识别仍服务流量的部署与回滚窗口。
2. 仅对明确退役的 build 前缀添加清理规则；不对整个 `incremental-cache/` 盲目添加短期过期规则。后者会删除当前 build 的冷门或构建期页面，而这些页面的缺失重建行为尚未验证。
3. 后续部署流程应记录 Next build ID 与 Worker version ID 的对应关系，部署验收成功后为退役 build 安排延迟清理；回滚前取消该 build 的清理规则。Next build ID 与 Worker version UUID 不是同一种标识。
4. 404 路径缓存、压缩、索引页大小和纯静态部署分别评估，不能根据三个正常页面样本断言其收益。

## 当前执行状态

- 完成控制台目录核对、生命周期读取、当前 build 识别、三个对象内容与压缩采样。
- 本地修正三处把 Cloudflare ISR 描述为“零函数调用”的注释，未部署。
- 尚未删除 R2 对象、修改生命周期或部署主站修复。
- 临时只读远程诊断被自动审批拒绝（远程 Worker 的元数据暴露风险）。后续用户已授权，但改为缓存迁移试点，未启动该诊断；临时文件位于 `/tmp/dshfind-r2-audit`，无删除或写入 R2 的代码。

## 参考

- [OpenNext 缓存](https://opennext.js.org/cloudflare/caching)
- [Cloudflare R2 生命周期](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
- [R2 定价](https://developers.cloudflare.com/r2/pricing/)
- [Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)
