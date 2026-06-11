// offlinePack.js — 离线灵修包（窗口端 Cache API，跨域 API 也适用）。
// 读过的章节自动入包 + 静默预取后续章节；断网时从包里取，地铁里照常读经。

const PACK = 'offline-pack-v1'
const keyUrl = (kind, id) =>
  `${location.origin}/__offline/${kind}/${encodeURIComponent(id)}`

export async function putJson(kind, id, data) {
  try {
    const cache = await caches.open(PACK)
    await cache.put(
      keyUrl(kind, id),
      new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }),
    )
  } catch { /* 不支持 Cache API / 配额满：静默 */ }
}

export async function getJson(kind, id) {
  try {
    const cache = await caches.open(PACK)
    const res = await cache.match(keyUrl(kind, id))
    return res ? await res.json() : null
  } catch { return null }
}

export async function packSize() {
  try {
    const cache = await caches.open(PACK)
    return (await cache.keys()).length
  } catch { return 0 }
}
