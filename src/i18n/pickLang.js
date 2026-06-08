// 业务数据按语言取值助手（国际化阶段一）。
// 约定：参考/种子内容用并列双列。常见两种命名：
//   1) base_zh / base_en          （如 name_zh / name_en）
//   2) base(英) / base_zh         （如 bible_* 的 name=英, name_zh=中；description=中, descriptionEn=英）
// 也兼容 camelCase 的接口字段（descriptionEn / spiritualMeaningEn）。
// 取值：英文模式优先英文，空则回退中文；中文模式优先中文，空则回退英文。永不返回 undefined。
import { getRuntimeLang } from './runtime'

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== '') return v
  }
  return ''
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * pick(row, base)
 * @param {object} row  数据对象
 * @param {string} base 字段基名，如 'name' / 'description' / 'spiritualMeaning'
 */
export function pick(row, base) {
  if (!row || !base) return ''
  // 候选英文键：base_en（snake）、baseEn（camel）、以及「裸 base 即英文」的情形
  const enKeys = [`${base}_en`, `${base}En`, base]
  // 候选中文键：base_zh（snake）、baseZh（camel）
  const zhKeys = [`${base}_zh`, `${base}Zh`]
  // 若 base 本身就是 camelCase（如 spiritualMeaning），其 snake 形式也试一下
  const snake = base.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())
  if (snake !== base) { enKeys.push(`${snake}_en`, snake); zhKeys.push(`${snake}_zh`) }

  const en = firstNonEmpty(...enKeys.map((k) => row[k]))
  const zh = firstNonEmpty(...zhKeys.map((k) => row[k]), row[base])
  return getRuntimeLang() === 'en' ? firstNonEmpty(en, zh) : firstNonEmpty(zh, en)
}

// 便捷：直接给两个值挑（用于已有 zh/en 变量的场景）
export function pickVal(zh, en) {
  return getRuntimeLang() === 'en' ? firstNonEmpty(en, zh) : firstNonEmpty(zh, en)
}

export { cap }
