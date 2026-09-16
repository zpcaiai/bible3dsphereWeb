import pptxgen from '/Users/stephen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs/dist/pptxgen.cjs.js'

const out = process.argv[2] || 'docs/presentations/spiritual-planet-ai-presentation.pptx'
const pptx = new pptxgen()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'Spiritual Planet Project'
pptx.company = 'Spiritual Planet'
pptx.subject = 'Website presentation and AI technology application'
pptx.title = '属灵星球：网站呈现与 AI 技术应用'
pptx.lang = 'zh-CN'
pptx.theme = {
  headFontFace: 'PingFang SC', bodyFontFace: 'PingFang SC', lang: 'zh-CN',
}
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 })
pptx.layout = 'CUSTOM_WIDE'
pptx.margin = 0

const C = {
  navy: '071323', ink: '10213E', sky: 'EAF4FF', white: 'FFFFFF',
  blue: '2864DC', cyan: '23C4D9', violet: '8865E8', gold: 'F3C969',
  mint: '4CCFA6', red: 'DD6A6A', slate: '54708A', mist: 'F5F8FC', line: 'DDE7F2',
}
const root = '/Users/stephen/Documents/Projects/DoctorPro/bible3dsphereWeb'
const og = `${root}/public/og-image.png`
const aiScreen = `${root}/docs/ai-formation-certification/chrome-desktop.png`
const mobileScreen = `${root}/docs/ai-formation-certification/chrome-mobile-sunday-school-placement.png`

const shadow = () => ({ type: 'outer', color: '13213A', opacity: 0.12, blur: 2, angle: 45, offset: 1 })
const noLine = { color: 'FFFFFF', transparency: 100 }
const rounded = (slide, x, y, w, h, fill = C.white, radius = 0.12) => {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: noLine, shadow: shadow() })
}
const text = (slide, value, x, y, w, h, opts = {}) => slide.addText(value, {
  x, y, w, h, margin: opts.margin ?? 0, fontFace: opts.fontFace || 'PingFang SC',
  fontSize: opts.fontSize || 16, color: opts.color || C.ink, bold: opts.bold || false,
  align: opts.align || 'left', valign: opts.valign || 'mid', breakLine: false,
  fit: 'shrink', paraSpaceAfterPt: opts.paraSpaceAfterPt || 0,
})
const title = (slide, kicker, headline, sub = '') => {
  text(slide, kicker.toUpperCase(), 0.62, 0.42, 4.8, 0.24, { fontSize: 9, color: C.blue, bold: true, charSpacing: 1.7 })
  text(slide, headline, 0.62, 0.70, 11.8, 0.55, { fontSize: 29, color: C.ink, bold: true, fontFace: 'PingFang SC' })
  if (sub) text(slide, sub, 0.64, 1.31, 11.5, 0.28, { fontSize: 11.5, color: C.slate })
}
const footer = (slide, num, label = '项目代码与架构文档梳理 · 2026.09') => {
  text(slide, label, 0.62, 7.08, 8.2, 0.18, { fontSize: 8.5, color: '7A8EA4' })
  text(slide, String(num).padStart(2, '0'), 12.05, 7.02, 0.55, 0.22, { fontSize: 9, color: C.blue, bold: true, align: 'right' })
}
const pill = (slide, value, x, y, w, color = C.blue) => {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.3, rectRadius: 0.12, fill: { color, transparency: 86 }, line: { color, transparency: 100 } })
  text(slide, value, x, y + 0.035, w, 0.18, { fontSize: 8.5, color, bold: true, align: 'center' })
}
const dot = (slide, x, y, color) => slide.addShape(pptx.ShapeType.ellipse, { x, y, w: 0.13, h: 0.13, fill: { color }, line: { color, transparency: 100 } })
const card = (slide, { x, y, w, h, icon, heading, body, color = C.blue }) => {
  rounded(slide, x, y, w, h, C.white)
  slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.24, y: y + 0.25, w: 0.43, h: 0.43, fill: { color, transparency: 84 }, line: { color, transparency: 100 } })
  text(slide, icon, x + 0.24, y + 0.29, 0.43, 0.24, { fontSize: 15, align: 'center' })
  text(slide, heading, x + 0.24, y + 0.82, w - 0.48, 0.26, { fontSize: 15, bold: true })
  text(slide, body, x + 0.24, y + 1.17, w - 0.48, h - 1.35, { fontSize: 10.5, color: C.slate, valign: 'top', breakLine: false })
}
const darkBg = (slide) => {
  slide.background = { color: C.navy }
  ;[[0.7, 0.75, 0.07, C.gold], [2.6, 1.8, 0.04, C.white], [10.9, 0.8, 0.08, C.cyan], [11.8, 5.7, 0.04, C.white], [9.2, 6.5, 0.06, C.violet], [3.8, 6.7, 0.03, C.white]].forEach(([x, y, s, color]) => {
    slide.addShape(pptx.ShapeType.ellipse, { x, y, w: s, h: s, fill: { color }, line: { color, transparency: 100 } })
  })
}

// 1 — cover
{
  const s = pptx.addSlide(); darkBg(s)
  s.addShape(pptx.ShapeType.ellipse, { x: 7.78, y: 0.73, w: 4.8, h: 4.8, fill: { color: C.violet, transparency: 78 }, line: { color: C.cyan, transparency: 68, width: 1.1 } })
  s.addShape(pptx.ShapeType.ellipse, { x: 8.37, y: 1.32, w: 3.62, h: 3.62, fill: { color: C.blue, transparency: 32 }, line: { color: C.gold, transparency: 80, width: 0.8 } })
  s.addImage({ path: og, x: 7.17, y: 0.4, w: 5.65, h: 4.42, transparency: 22, sizing: { type: 'cover', x: 7.17, y: 0.4, w: 5.65, h: 4.42 } })
  text(s, 'SPIRITUAL PLANET · PRESENTATION', 0.72, 1.18, 5.5, 0.3, { fontSize: 11, color: C.cyan, bold: true, charSpacing: 1.2 })
  text(s, '属灵星球', 0.70, 1.62, 6.2, 0.72, { fontSize: 39, color: C.white, bold: true, fontFace: 'PingFang SC' })
  text(s, '网站呈现内容与 AI 技术应用', 0.72, 2.47, 6.3, 0.5, { fontSize: 23, color: 'D9E7FF', bold: true })
  text(s, '以技术降低学习、反思与连接的门槛；\n以圣经、关系、教会与人的责任守住中心。', 0.73, 3.28, 5.55, 0.72, { fontSize: 15, color: 'B8CADF', valign: 'top' })
  pill(s, 'PWA · 3D · MAP · VOICE · AI GOVERNANCE', 0.74, 4.37, 3.7, C.gold)
  text(s, '项目介绍 / 技术汇报', 0.73, 6.63, 3.5, 0.24, { fontSize: 10, color: '8EABC7' })
  s.addNotes('开场：属灵星球不是把属灵生命变成数据评分，而是把觉察、经文、行动与真实关系连接起来。')
}

// 2 — mission
{
  const s = pptx.addSlide(); s.background = { color: C.mist }
  title(s, '01 · 定位', '从分散工具到连续成长路径', '平台以“成长地图”组织内容，而非把灵修、地图、课程、记录割裂成孤立功能。')
  card(s, { x: 0.68, y: 2.0, w: 3.72, h: 3.25, icon: '◌', heading: '看见当下状态', body: '以情绪觉察、灵修记录与个人轨迹，帮助用户命名真实处境，而不是急于给出结论。', color: C.violet })
  card(s, { x: 4.80, y: 2.0, w: 3.72, h: 3.25, icon: '✦', heading: '回到真理与行动', body: '把经文、祷告、反思问题、可执行操练与周期复盘连接为一条可暂停、可调整的路径。', color: C.gold })
  card(s, { x: 8.92, y: 2.0, w: 3.72, h: 3.25, icon: '⌘', heading: '回到真实共同体', body: '技术只做辅助；教会、牧养、家庭、同伴与专业支持仍是高风险和长期成长的责任主体。', color: C.mint })
  text(s, '核心闭环', 0.7, 5.85, 1.0, 0.26, { fontSize: 11, color: C.slate, bold: true })
  const steps = [['状态', C.violet], ['识别', C.blue], ['引导', C.cyan], ['行动', C.mint], ['复盘', C.gold], ['形成', C.violet]]
  steps.forEach(([v, c], i) => { const x = 1.8 + i * 1.72; dot(s, x, 5.94, c); text(s, v, x + 0.18, 5.85, 1.1, 0.27, { fontSize: 12, color: C.ink, bold: true }); if (i < steps.length - 1) s.addShape(pptx.ShapeType.line, { x: x + 1.08, y: 6.0, w: 0.47, h: 0, line: { color: C.line, width: 1.4, beginArrowType: 'none', endArrowType: 'triangle' } }) })
  footer(s, 2)
}

// 3 — experience ecosystem
{
  const s = pptx.addSlide(); s.background = { color: C.white }
  title(s, '02 · 网站内容', '一个门户，六类持续可探索的内容体验', '面向个人、家庭、教会与教师的模块被组织为可回访、可组合的“内容星系”。')
  const items = [
    ['☀', '每日灵修', '读经、晨间甘露、背经、默想、日志', C.gold],
    ['♡', '心灵觉察', '情绪星球、福音回应、反思与祷告', C.violet],
    ['⌁', '属灵操练', '祷告、安息、习惯、禁食、生活规则', C.mint],
    ['◫', '圣经可视化', '地图、时间线、人物旅程、3D 圣殿', C.cyan],
    ['⌂', '群体与教会', '代祷、门训、问责、教会连接、福音行动', C.blue],
    ['✧', '成长与关怀', '决策分辨、苦难医治、牧养授权、成长回顾', C.red],
  ]
  items.forEach(([icon, h, b, color], i) => { const col = i % 3; const row = Math.floor(i / 3); card(s, { x: 0.72 + col * 4.17, y: 1.95 + row * 2.42, w: 3.74, h: 1.94, icon, heading: h, body: b, color }) })
  footer(s, 3)
}

// 4 — visual UX
{
  const s = pptx.addSlide(); s.background = { color: C.sky }
  title(s, '03 · 呈现方式', '把抽象成长过程变成可探索的视觉叙事', '3D、地图、时间线和轻量交互服务于理解与反思，不制造炫技式复杂度。')
  rounded(s, 0.65, 1.92, 7.25, 4.55, '0B1A30')
  s.addImage({ path: og, x: 0.83, y: 2.10, w: 6.89, h: 4.18, sizing: { type: 'cover', x: 0.83, y: 2.10, w: 6.89, h: 4.18 } })
  const visual = [
    ['3D 情绪星球', '以可视化关系呈现情绪、经文与引导入口。', C.violet],
    ['圣经时空地图', '通过地点、路线和时间轴降低圣经背景理解门槛。', C.cyan],
    ['渐进式导航', '按“认识自己—回到福音—与神同行”等路径组织现有功能。', C.gold],
    ['多端可达', 'PWA、响应式布局、语言切换、语音与减弱动态支持。', C.mint],
  ]
  visual.forEach(([h, b, c], i) => { const y = 1.95 + i * 1.15; dot(s, 8.38, y + 0.12, c); text(s, h, 8.62, y, 3.9, 0.25, { fontSize: 14, bold: true }); text(s, b, 8.62, y + 0.34, 3.9, 0.43, { fontSize: 10.5, color: C.slate, valign: 'top' }) })
  footer(s, 4)
}

// 5 — AI objective / support loops
{
  const s = pptx.addSlide(); s.background = { color: C.white }
  title(s, '04 · AI 应用目标', 'AI 是受边界约束的助手，不是属灵权威', '技术承担整理、提示与提议；高风险判断、牧养责任和最终决定始终归属人。')
  const roles = [
    ['输入理解', '文字与语音输入；转写、翻译、主题提取与结构化整理。', '语音 / 翻译', C.blue],
    ['内容辅助', '经文相关线索、反思问题、课程草案、教师备课与情境提示。', '检索 / 建议', C.violet],
    ['路径支持', '按角色、年龄带、目标及授权状态推荐合适课程与操练路径。', '最小必要信息', C.mint],
    ['复盘支持', '把用户确认过的记录组织为周期回顾与下一步建议。', '可编辑 / 可撤销', C.gold],
  ]
  roles.forEach(([h, b, tag, c], i) => { const x = 0.73 + i * 3.15; rounded(s, x, 2.10, 2.77, 3.22, C.mist); pill(s, tag, x + 0.23, 2.35, 1.6, c); text(s, h, x + 0.23, 2.93, 2.3, 0.34, { fontSize: 16, bold: true }); text(s, b, x + 0.23, 3.45, 2.26, 1.08, { fontSize: 11, color: C.slate, valign: 'top' }) })
  rounded(s, 1.3, 5.87, 10.73, 0.62, 'EFF7F8')
  text(s, 'AI 的正确位置：提供可审查的下一步，而不是代替良心、圣经、牧者、家长或真实共同体。', 1.58, 6.07, 10.1, 0.22, { fontSize: 13, color: '1E6170', bold: true, align: 'center' })
  footer(s, 5)
}

// 6 — architecture
{
  const s = pptx.addSlide(); s.background = { color: C.mist }
  title(s, '05 · 技术架构', '从多模态输入到安全呈现的应用层协作', '前端承担体验与可视化；后端 API 提供转写、查询、翻译和受保护业务能力。')
  const nodes = [
    ['用户输入', '文字 · 语音 · 选择 · 记录', C.violet],
    ['Web / PWA', 'Vite + React\n状态、路由、离线体验、i18n', C.blue],
    ['服务接口', '转写 · 查询 · 翻译\n形成与关怀业务 API', C.cyan],
    ['受控呈现', '3D · 地图 · 课程\n复盘 · 人工审核台', C.mint],
  ]
  nodes.forEach(([h, b, c], i) => { const x = 0.68 + i * 3.17; rounded(s, x, 2.35, 2.63, 2.2, C.white); slideIcon(s, x + 1.02, 2.65, c, String(i + 1)); text(s, h, x + 0.23, 3.39, 2.17, 0.26, { fontSize: 15, bold: true, align: 'center' }); text(s, b, x + 0.28, 3.78, 2.07, 0.48, { fontSize: 10.5, color: C.slate, align: 'center', valign: 'top' }); if (i < 3) s.addShape(pptx.ShapeType.line, { x: x + 2.72, y: 3.45, w: 0.35, h: 0, line: { color: C.blue, transparency: 32, width: 1.5, endArrowType: 'triangle' } }) })
  rounded(s, 0.98, 5.38, 11.36, 0.84, 'ECF2FF')
  text(s, '基础设施要点', 1.27, 5.65, 1.36, 0.2, { fontSize: 11, color: C.blue, bold: true })
  text(s, 'Vercel 负责前端构建与分发；后端通过 API 提供业务服务。语音服务密钥保持在服务端，不暴露为浏览器环境变量。', 2.72, 5.56, 8.8, 0.36, { fontSize: 11.5, color: C.ink })
  footer(s, 6)
}

function slideIcon(slide, x, y, color, label) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: 0.6, h: 0.6, fill: { color, transparency: 84 }, line: { color, transparency: 100 } })
  text(slide, label, x, y + 0.13, 0.6, 0.2, { fontSize: 12, color, bold: true, align: 'center' })
}

// 7 — AI Formation
{
  const s = pptx.addSlide(); s.background = { color: C.white }
  title(s, '06 · AI 时代门训', '一个模块、四条轨道、十二个依赖有序的 Batch', '面向成人、家庭、儿童青少年及教师/牧养支持；课程内容必须经相应审核才可向学习者开放。')
  rounded(s, 0.65, 1.90, 6.93, 4.88, '101B33')
  s.addImage({ path: aiScreen, x: 0.83, y: 2.09, w: 6.57, h: 3.69, sizing: { type: 'contain', w: 6.57, h: 3.69 } })
  const tracks = [
    ['成人自我治理', '注意力、身体节律、AI 分辨与恢复支持', 'B01–B04', C.violet],
    ['父母与家庭门训', '父母榜样、修复、家庭注意力与 AI 公约', 'B05–B06', C.gold],
    ['儿童青少年形成', '年龄适切、成人脚手架、诚实提问与自治交还', 'B07–B08', C.mint],
    ['教师与牧养支持', '审核课程、情境、成长回顾与发布证据', 'B09–B12', C.blue],
  ]
  tracks.forEach(([h, b, tag, c], i) => { const y = 1.94 + i * 1.19; pill(s, tag, 7.94, y, 0.92, c); text(s, h, 9.08, y - 0.01, 3.42, 0.25, { fontSize: 14, bold: true }); text(s, b, 9.08, y + 0.31, 3.55, 0.34, { fontSize: 10.2, color: C.slate, valign: 'top' }) })
  text(s, '当前产品状态：release candidate；内容审核与发布认证仍需由授权人完成。', 7.96, 6.02, 4.6, 0.3, { fontSize: 10, color: C.red, bold: true })
  footer(s, 7)
}

// 8 — governance
{
  const s = pptx.addSlide(); s.background = { color: C.sky }
  title(s, '07 · 伦理与安全', '以“不能做什么”定义 AI 的可信边界', '项目将神学、牧养、儿童保护、隐私、无障碍和回滚作为可验证的发布门槛。')
  const left = [
    ['不替代权威', 'AI 不是启示、良心、牧者、诊断者或最终发布人。'],
    ['不制造评分', '不生成救恩、圣洁、成熟、纯洁、父母适格或隐藏罪评分。'],
    ['不进行秘密监控', '不读取完整浏览史、私聊、认罪或儿童秘密。'],
  ]
  const right = [
    ['S0–S3 安全中断', '高风险处境停止普通流程，优先进入真人支持与保护路径。'],
    ['最小必要数据', '课程推荐仅使用角色、年龄带、目标与同意状态等必要信息。'],
    ['审核先于发布', '未审核的神学、性教育、儿童与青少年内容不得对学习者开放。'],
  ]
  ;[left, right].forEach((list, col) => list.forEach(([h, b], i) => { const x = col ? 6.86 : 0.7; const y = 1.92 + i * 1.52; rounded(s, x, y, 5.74, 1.2, C.white); slideIcon(s, x + 0.28, y + 0.3, col ? C.mint : C.violet, col ? '✓' : '×'); text(s, h, x + 1.07, y + 0.24, 4.22, 0.23, { fontSize: 14, bold: true }); text(s, b, x + 1.07, y + 0.58, 4.34, 0.32, { fontSize: 10.4, color: C.slate, valign: 'top' }) }))
  footer(s, 8)
}

// 9 — governance workflow
{
  const s = pptx.addSlide(); s.background = { color: C.white }
  title(s, '08 · 人机协作治理', '内容生成、审核、发布与回滚均保留明确责任人', '系统可以提供草案、证据和提醒，但任何高影响决策都必须由授权人签署。')
  const flow = [
    ['AI / 规则辅助', '形成草案、风险提示、版本化情境、证据归集', C.violet],
    ['专业审核', '神学、牧养、儿童保护、隐私与内容质量审查', C.blue],
    ['授权发布', '功能开关、受众范围、人工发布决定、可追溯记录', C.mint],
    ['持续验证', '无障碍、红队、事故演练、回滚与再认证', C.gold],
  ]
  flow.forEach(([h, b, c], i) => { const x = 0.75 + i * 3.12; slideIcon(s, x + 0.85, 2.16, c, String(i + 1)); text(s, h, x, 3.04, 2.35, 0.28, { fontSize: 14, bold: true, align: 'center' }); text(s, b, x + 0.1, 3.47, 2.15, 0.65, { fontSize: 10.6, color: C.slate, align: 'center', valign: 'top' }); if (i < 3) s.addShape(pptx.ShapeType.line, { x: x + 2.43, y: 2.44, w: 0.48, h: 0, line: { color: C.line, width: 1.5, endArrowType: 'triangle' } }) })
  rounded(s, 1.03, 5.13, 11.22, 0.9, 'FFF8E3')
  text(s, '发布原则', 1.35, 5.38, 1.16, 0.22, { fontSize: 12, color: '88601D', bold: true })
  text(s, '缺失任何关键门槛证据时，状态保持 NOT_CERTIFIED；自动化不能越过人工发布责任。', 2.62, 5.35, 8.8, 0.25, { fontSize: 13, color: '6E5531', bold: true })
  footer(s, 9)
}

// 10 — status
{
  const s = pptx.addSlide(); s.background = { color: C.mist }
  title(s, '09 · 当前实现与边界', '已具备可展示的产品与工程基础，但不夸大认证状态', '以下内容区分已实现的前端/契约能力与尚需完成的外部人工验证。')
  const yes = [
    'React + Vite 前端、PWA、国际化与响应式交互',
    '3D 情绪可视化、圣经地图、语音输入与文本转写接口',
    'AI Formation 课程模块、最小上下文校验、审核与发布工作台',
    '安全边界、Feature Flag、版本化内容与回滚门槛的产品契约',
  ]
  const no = [
    '面向所有学习者的已审核课程内容',
    '完整人工无障碍签署与移动实机签署',
    '有限发布、事故演练、回滚演练的具名最终签署',
    '生产级 AI 门训服务的全面认证结论',
  ]
  rounded(s, 0.72, 1.91, 5.86, 4.74, 'EDF8F4'); rounded(s, 6.76, 1.91, 5.86, 4.74, 'FFF2F1')
  text(s, '已实现 / 可展示', 1.10, 2.28, 3.0, 0.28, { fontSize: 18, bold: true, color: '247459' })
  text(s, '仍需人工证据 / 不应宣称', 7.14, 2.28, 4.1, 0.28, { fontSize: 18, bold: true, color: 'A94747' })
  yes.forEach((v, i) => { slideIcon(s, 1.1, 2.94 + i * 0.72, C.mint, '✓'); text(s, v, 1.88, 2.95 + i * 0.72, 4.18, 0.42, { fontSize: 11.2, color: C.ink, valign: 'top' }) })
  no.forEach((v, i) => { slideIcon(s, 7.14, 2.94 + i * 0.72, C.red, '!'); text(s, v, 7.92, 2.95 + i * 0.72, 4.18, 0.42, { fontSize: 11.2, color: C.ink, valign: 'top' }) })
  footer(s, 10)
}

// 11 — value
{
  const s = pptx.addSlide(); s.background = { color: C.white }
  title(s, '10 · 项目价值', '不是扩大 AI 输出，而是提升安全、可理解、可连接的成长支持', '成效应以可持续、安全和被共同体承接的实践来判断，而非内容消费量或模型输出量。')
  const vals = [
    ['个人', '更低门槛的每日觉察、经文学习、祷告与习惯支持。', '更容易开始', C.violet],
    ['家庭', '可复盘的数字公约、家长榜样与年龄适切的学习陪伴。', '更透明的对话', C.gold],
    ['教会', '课程审核、关怀授权、门训连接与牧养支持的工具化协作。', '更清晰的责任', C.blue],
    ['平台治理', '版本、证据、权限、审核和回滚机制降低高风险内容误用。', '更可追溯的发布', C.mint],
  ]
  vals.forEach(([h, b, tag, c], i) => { const x = 0.75 + i * 3.13; rounded(s, x, 2.0, 2.78, 3.38, C.mist); pill(s, tag, x + 0.25, 2.3, 1.38, c); text(s, h, x + 0.25, 2.94, 2.14, 0.28, { fontSize: 18, bold: true }); text(s, b, x + 0.25, 3.53, 2.22, 0.94, { fontSize: 11, color: C.slate, valign: 'top' }) })
  text(s, '北极星原则', 0.76, 5.9, 1.15, 0.24, { fontSize: 11, color: C.blue, bold: true })
  text(s, '活跃实践是否仍然安全、可问责、有证据支持，并走向真实关系与本地共同体的承接？', 2.02, 5.86, 9.5, 0.32, { fontSize: 15, color: C.ink, bold: true })
  footer(s, 11)
}

// 12 — roadmap / conclusion
{
  const s = pptx.addSlide(); darkBg(s)
  text(s, 'NEXT', 0.73, 0.7, 1.2, 0.25, { fontSize: 10, color: C.cyan, bold: true, charSpacing: 2 })
  text(s, '从可展示能力走向可信赖的有限发布', 0.7, 1.12, 8.8, 0.56, { fontSize: 30, color: C.white, bold: true, fontFace: 'PingFang SC' })
  text(s, '下一阶段的重点不是增加更多功能，而是完成高风险模块的内容、体验和治理证据闭环。', 0.73, 1.86, 8.9, 0.32, { fontSize: 13, color: 'AEC3D9' })
  const next = [
    ['01', '完成内容审核', '按角色审核神学、牧养、儿童青少年与敏感主题内容。', C.violet],
    ['02', '补齐人工证据', '完成无障碍、移动实机、事故与回滚演练签署。', C.gold],
    ['03', '有限范围发布', '受众、功能开关、停止条件与监控责任明确后再扩大。', C.mint],
  ]
  next.forEach(([n, h, b, c], i) => { const x = 0.76 + i * 4.06; s.addShape(pptx.ShapeType.ellipse, { x, y: 3.05, w: 0.78, h: 0.78, fill: { color: c, transparency: 84 }, line: { color: c, transparency: 70, width: 1 } }); text(s, n, x, 3.29, 0.78, 0.18, { fontSize: 12, color: c, bold: true, align: 'center' }); text(s, h, x + 0.99, 3.05, 2.36, 0.28, { fontSize: 17, color: C.white, bold: true }); text(s, b, x + 0.99, 3.49, 2.66, 0.7, { fontSize: 11, color: 'B7C8DB', valign: 'top' }) })
  rounded(s, 0.74, 5.58, 11.75, 0.69, '142A48')
  text(s, '结论：让 AI 服务于人的学习、反思与关系；让人继续对真理、关怀与发布承担责任。', 1.04, 5.80, 11.15, 0.24, { fontSize: 15, color: C.white, bold: true, align: 'center' })
  text(s, 'SPIRITUAL PLANET', 0.74, 6.72, 2.4, 0.2, { fontSize: 9, color: '8EABC7', bold: true, charSpacing: 1.5 })
  text(s, '12', 12.05, 6.72, 0.55, 0.2, { fontSize: 9, color: C.cyan, bold: true, align: 'right' })
  s.addNotes('结尾：强调“可信”优先于“更多 AI 功能”。邀请听众围绕有限发布前的审核、证据和责任分工继续讨论。')
}

await pptx.writeFile({ fileName: out })
console.log(out)
