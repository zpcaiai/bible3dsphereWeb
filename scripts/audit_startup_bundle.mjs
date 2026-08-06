#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve('dist')
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'precache-manifest.json'), 'utf8'))
const startupAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.js)"/g)].map((match) => match[1])
const specialist = /(three-|pdf-|mirrorData-|krisp-|livekit-|maplibre-|mapbox-|deck-luma-|jspdf|html2canvas)/i
const eagerSpecialistAssets = startupAssets.filter((asset) => specialist.test(asset))
const precachedSpecialistAssets = manifest.files.filter((asset) => specialist.test(asset))
const startupBytes = startupAssets.reduce((total, asset) => total + fs.statSync(path.join(dist, asset.slice(1))).size, 0)
const maxStartupBytes = 900_000

if (eagerSpecialistAssets.length || precachedSpecialistAssets.length || startupBytes > maxStartupBytes) {
  console.error(JSON.stringify({
    result: 'failed',
    startupBytes,
    maxStartupBytes,
    eagerSpecialistAssets,
    precachedSpecialistAssets,
  }, null, 2))
  process.exit(1)
}

process.stdout.write(`${JSON.stringify({
  result: 'passed',
  startupBytes,
  maxStartupBytes,
  startupAssets,
  eagerSpecialistAssets,
  precachedSpecialistAssets,
}, null, 2)}\n`)
