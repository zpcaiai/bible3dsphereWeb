import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function writeReleaseManifest(dist, sourceCommit) {
  if (!/^[a-f0-9]{40}$/.test(sourceCommit || '')) throw new Error('A complete source commit is required')
  const files = {}
  function record(file) {
    files[path.relative(dist, file).split(path.sep).join('/')] = createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  }
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.isFile()) record(file)
      else throw new Error('Unexpected build asset type')
    }
  }
  record(path.join(dist, 'index.html'))
  walk(path.join(dist, 'assets'))
  const manifest = { schemaVersion: 1, sourceCommit, files }
  fs.writeFileSync(path.join(dist, 'release-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  return manifest
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  let gitCommit
  try { gitCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() } catch { /* Vercel archive builds may omit .git. */ }
  const platformCommit = process.env.VERCEL_GIT_COMMIT_SHA
  if (gitCommit && platformCommit && gitCommit !== platformCommit) throw new Error('Git and deployment source commits differ')
  const manifest = writeReleaseManifest(path.resolve('dist'), platformCommit || gitCommit)
  console.log(`Release manifest: ${manifest.sourceCommit}, ${Object.keys(manifest.files).length} files`)
}
