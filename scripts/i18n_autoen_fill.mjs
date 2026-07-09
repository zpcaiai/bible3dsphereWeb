#!/usr/bin/env node
// 自动补全 src/i18n/auto-en.js —— 扫描源码里 t("中文") / t('中文') 的中文键，
// 找出 auto-en.js 中缺失的，批量机翻后合并写回。可重复运行（只译缺失项）。
//
// 用法（在前端仓库根目录，Mac/Node）：
//   DEEPSEEK_API_KEY=sk-... node scripts/i18n_autoen_fill.mjs
//   或 SILICONFLOW_API_KEY=... / GEMINI_API_KEY=...
//   预览不写： node scripts/i18n_autoen_fill.mjs --dry-run
//
// 设计：与后端 backfill 同思路，单一翻译库(auto-en.js)，圣经专名走受控词表。
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')
const AUTOEN = path.join(SRC, 'i18n', 'auto-en.js')
const DRY = process.argv.includes('--dry-run')

const GLOSSARY = {
  '以法莲': 'Ephraim', '玛拿西': 'Manasseh', '犹大': 'Judah', '便雅悯': 'Benjamin',
  '巴比伦': 'Babylon', '亚述': 'Assyria', '耶路撒冷': 'Jerusalem', '迦南': 'Canaan',
  '摩西': 'Moses', '大卫': 'David', '所罗门': 'Solomon', '保罗': 'Paul', '彼得': 'Peter',
}

// ── 1. 读现有 auto-en.js（export default {…}）──
function loadExisting() {
  const raw = fs.readFileSync(AUTOEN, 'utf8')
  const m = raw.match(/export\s+default\s+(\{[\s\S]*\})\s*;?\s*$/)
  if (!m) throw new Error('auto-en.js 格式无法解析')
  // 安全 eval 对象字面量
  // eslint-disable-next-line no-new-func
  return { map: Function(`return (${m[1]})`)(), raw }
}

// ── 2. 扫描源码收集 t() 中文键 ──
function collectKeys() {
  const keys = new Set()
  const re = /\b(?:i18nT|t)\(\s*(["'])((?:\\.|(?!\1).)*?)\1/g
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === 'dist') continue
      const fp = path.join(dir, e.name)
      if (e.isDirectory()) walk(fp)
      else if (/\.(jsx?|tsx?)$/.test(e.name)) {
        const txt = fs.readFileSync(fp, 'utf8')
        let mm
        while ((mm = re.exec(txt))) {
          const key = mm[2]
          if (/[一-鿿]/.test(key)) keys.add(key.replace(/\\"/g, '"').replace(/\\'/g, "'"))
        }
      }
    }
  }
  walk(SRC)
  return keys
}

// ── 3. 机翻（OpenAI 兼容：DeepSeek / SiliconFlow / Gemini）──
function provider() {
  if (process.env.DEEPSEEK_API_KEY)
    return { url: 'https://api.deepseek.com/chat/completions', key: process.env.DEEPSEEK_API_KEY, model: 'deepseek-chat' }
  if (process.env.SILICONFLOW_API_KEY)
    return { url: 'https://api.siliconflow.cn/v1/chat/completions', key: process.env.SILICONFLOW_API_KEY, model: 'deepseek-ai/DeepSeek-V3' }
  if (process.env.GEMINI_API_KEY)
    return { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', key: process.env.GEMINI_API_KEY, model: 'gemini-2.0-flash' }
  throw new Error('需设置 DEEPSEEK_API_KEY / SILICONFLOW_API_KEY / GEMINI_API_KEY 之一')
}

const SYS = 'You are a translator for a Chinese Christian app UI. Translate each Simplified-Chinese item to '
  + 'concise, natural English (UI label tone, keep it short). Use standard English Bible proper nouns. '
  + 'Follow this glossary exactly: ' + JSON.stringify(GLOSSARY) + '. '
  + 'Input is a JSON array of strings. Output ONLY a JSON array of the same length with the translations, same order.'

async function translateBatch(items, p) {
  const res = await fetch(p.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${p.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: p.model, temperature: 0.1,
      messages: [{ role: 'system', content: SYS }, { role: 'user', content: JSON.stringify(items) }],
    }),
  })
  if (!res.ok) throw new Error(`翻译请求失败 ${res.status}`)
  const data = await res.json()
  let txt = (data.choices?.[0]?.message?.content || '').trim()
  txt = txt.replace(/^```(json)?/i, '').replace(/```$/, '').trim()
  const arr = JSON.parse(txt)
  if (!Array.isArray(arr) || arr.length !== items.length) throw new Error('翻译返回长度不匹配')
  return arr
}

async function main() {
  const { map } = loadExisting()
  const keys = collectKeys()
  const missing = [...keys].filter((k) => !(k in map) && !(k in GLOSSARY))
  // 词表直填
  for (const k of keys) if (k in GLOSSARY && !(k in map)) map[k] = GLOSSARY[k]
  console.log(`扫描到 t() 中文键 ${keys.size} 个，缺失 ${missing.length} 个`)
  if (missing.length === 0) { console.log('无需翻译'); return }
  if (DRY) { console.log('（dry-run）示例缺失：', missing.slice(0, 20)); return }

  if (!process.env.DEEPSEEK_API_KEY && !process.env.SILICONFLOW_API_KEY && !process.env.GEMINI_API_KEY) {
    console.warn(`\u26a0 \u8df3\u8fc7 auto-en \u56de\u586b\uff1a\u672a\u8bbe API key\uff08\u7f3a ${missing.length} \u6761\uff0c\u7531\u8fd0\u884c\u65f6\u5b9e\u65f6\u7ffb\u8bd1\u515c\u5e95\uff09`)
    return
  }
  const p = provider()
  const BATCH = 40
  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH)
    try {
      const out = await translateBatch(chunk, p)
      chunk.forEach((k, j) => { map[k] = out[j] })
      console.log(`  译完 ${Math.min(i + BATCH, missing.length)}/${missing.length}`)
    } catch (e) {
      console.warn(`  批次 ${i} 失败：${e.message}（跳过）`)
    }
  }

  const header = '// 自动抽取的「中文原文 → 英文」映射 / auto-extracted zh→en map.\n'
    + '// 由 scripts/i18n_autoen_fill.mjs 机翻补全；缺失键回退显示中文原文。\n'
  const sorted = Object.keys(map).sort().reduce((o, k) => (o[k] = map[k], o), {})
  fs.writeFileSync(AUTOEN, header + 'export default ' + JSON.stringify(sorted, null, 0) + '\n', 'utf8')
  console.log(`写回 auto-en.js，共 ${Object.keys(sorted).length} 条`)
}

main().catch((e) => { console.error(e); process.exit(1) })
