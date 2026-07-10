import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

const traverse = traverseModule.default || traverseModule
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const attentionRoot = path.join(root, 'src/features/attention')
const extraFiles = [
  path.join(root, 'src/features/spiritual-formation/data/creedCatechismSeed.js'),
  path.join(root, 'src/features/spiritual-formation/components/creed-catechism/CreedCatechismGalaxy.jsx'),
]
const cjk = /[\u3400-\u9fff]/
const visibleAttributes = new Set([
  'title', 'subtitle', 'actionLabel', 'placeholder', 'aria-label', 'heading',
  'empty', 'label', 'description', 'confirmLabel', 'cancelLabel',
])

function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(target)
    return /\.(jsx?|tsx?)$/.test(entry.name) ? [target] : []
  })
}

function isObjectKey(pathRef) {
  const parent = pathRef.parentPath
  return Boolean(
    (parent.isObjectProperty() || parent.isObjectMethod() || parent.isClassMethod())
      && parent.node.key === pathRef.node
      && !parent.node.computed,
  )
}

function isModuleSource(pathRef) {
  const parent = pathRef.parentPath
  return Boolean(
    (parent.isImportDeclaration() || parent.isExportNamedDeclaration() || parent.isExportAllDeclaration())
      && parent.node.source === pathRef.node,
  )
}

function isAlreadyTranslated(pathRef) {
  const parent = pathRef.parentPath
  return parent.isCallExpression()
    && parent.node.callee?.type === 'Identifier'
    && parent.node.callee.name === 'i18nT'
}

function applyEdits(source, edits) {
  return edits
    .sort((a, b) => b.start - a.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end), source)
}

let changedFiles = 0
let wrappedStrings = 0
const remainingTemplates = []

for (const file of [...filesUnder(attentionRoot), ...extraFiles]) {
  const source = fs.readFileSync(file, 'utf8')
  const ast = parse(source, {
    sourceType: 'module',
    plugins: [file.endsWith('.ts') || file.endsWith('.tsx') ? 'typescript' : null, /\.(jsx|tsx)$/.test(file) ? 'jsx' : null].filter(Boolean),
  })
  const edits = []
  let transformed = false

  traverse(ast, {
    StringLiteral(pathRef) {
      const { node } = pathRef
      if (!cjk.test(node.value) || isModuleSource(pathRef) || isObjectKey(pathRef) || isAlreadyTranslated(pathRef)) return
      if (pathRef.parentPath.isDirective()) return

      const original = source.slice(node.start, node.end)
      if (pathRef.parentPath.isJSXAttribute()) {
        const name = pathRef.parentPath.node.name?.name
        if (!visibleAttributes.has(name)) return
        edits.push({ start: node.start, end: node.end, text: `{i18nT(${original})}` })
      } else {
        edits.push({ start: node.start, end: node.end, text: `i18nT(${original})` })
      }
      transformed = true
      wrappedStrings += 1
    },
    JSXText(pathRef) {
      const { node } = pathRef
      if (!cjk.test(node.value)) return
      const value = node.value.trim().replace(/\s+/g, ' ')
      if (!value) return
      const leading = /^\s/.test(node.value) ? ' ' : ''
      const trailing = /\s$/.test(node.value) ? ' ' : ''
      edits.push({
        start: node.start,
        end: node.end,
        text: `${leading}{i18nT(${JSON.stringify(value)})}${trailing}`,
      })
      transformed = true
      wrappedStrings += 1
    },
    TemplateLiteral(pathRef) {
      if (pathRef.node.quasis.some((item) => cjk.test(item.value.raw))) {
        remainingTemplates.push(`${path.relative(root, file)}:${pathRef.node.loc.start.line}`)
      }
    },
  })

  if (!transformed) continue
  const runtimeImport = path.relative(path.dirname(file), path.join(root, 'src/i18n/runtime')).replaceAll(path.sep, '/')
  const runtimeSource = runtimeImport.startsWith('.') ? runtimeImport : `./${runtimeImport}`
  const hasImport = ast.program.body.some((node) => node.type === 'ImportDeclaration'
    && node.source.value === runtimeSource
    && node.specifiers.some((specifier) => specifier.local?.name === 'i18nT'))
  if (!hasImport) {
    const imports = ast.program.body.filter((node) => node.type === 'ImportDeclaration')
    const insertAt = imports.length ? imports.at(-1).end : 0
    edits.push({
      start: insertAt,
      end: insertAt,
      text: `${insertAt ? '\n' : ''}import { t as i18nT } from '${runtimeSource}'\n`,
    })
  }
  fs.writeFileSync(file, applyEdits(source, edits))
  changedFiles += 1
}

console.log(JSON.stringify({ changedFiles, wrappedStrings, remainingTemplates }, null, 2))
