// 生 SVG 文字列（`import x from '*.svg?raw'`）を PixiJS の Texture へデコードする。
// コトハコビ本体 `allo-app/src/ui/svgTexture.ts` の移植。viewBox 寸法で採寸→Blob→Image。
import { Texture } from 'pixi.js'
import { DESIGN_W, DESIGN_H } from './theme'

const cache = new Map<string, Promise<Texture>>()

export function loadSvgTexture(raw: string): Promise<Texture> {
  const hit = cache.get(raw)
  if (hit) return hit
  const p = decode(raw)
  cache.set(raw, p)
  return p
}

async function decode(raw: string): Promise<Texture> {
  const vb = raw.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const w = vb ? Number(vb[1]) : DESIGN_W
  const h = vb ? Number(vb[2]) : DESIGN_H
  const svg = raw.replace(/width="100%"\s+height="100%"/, `width="${w}" height="${h}"`)
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image(w, h)
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('failed to load svg'))
      img.src = url
    })
    return Texture.from(img)
  } finally {
    URL.revokeObjectURL(url)
  }
}
