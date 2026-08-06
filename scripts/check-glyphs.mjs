// MPLUS1Code.ttf の cmap を読み、候補グリフが収録されているか一覧する（読み取り専用）。
// AA でどの罫線/斜め/三角/ブロックが使えるかを確認するための調査スクリプト。
import { readFileSync } from 'node:fs'

const buf = readFileSync('.tmp-fonts/MPLUS1Code.ttf')
const u16 = (o) => buf.readUInt16BE(o)
const u32 = (o) => buf.readUInt32BE(o)

// テーブルディレクトリから cmap を探す
const numTables = u16(4)
let cmapOff = 0
for (let i = 0; i < numTables; i++) {
  const rec = 12 + i * 16
  const tag = buf.toString('ascii', rec, rec + 4)
  if (tag === 'cmap') cmapOff = u32(rec + 8)
}

// Unicode サブテーブルを選ぶ（format 12 優先、無ければ format 4）
const nSub = u16(cmapOff + 2)
let best = 0,
  bestScore = -1
for (let i = 0; i < nSub; i++) {
  const r = cmapOff + 4 + i * 8
  const pid = u16(r),
    eid = u16(r + 2),
    off = cmapOff + u32(r + 4)
  const fmt = u16(off)
  let score = -1
  if ((pid === 3 && eid === 10) || (pid === 0 && eid >= 4)) score = 3 // full unicode
  else if (pid === 3 && eid === 1) score = 2
  else if (pid === 0) score = 1
  if (fmt === 12) score += 0.5
  if (score > bestScore) (bestScore = score), (best = off)
}

const covered = new Set()
const fmt = u16(best)
if (fmt === 4) {
  const segX2 = u16(best + 6),
    segs = segX2 / 2
  const endO = best + 14,
    startO = endO + segX2 + 2,
    deltaO = startO + segX2,
    rangeO = deltaO + segX2
  for (let s = 0; s < segs; s++) {
    const end = u16(endO + s * 2),
      start = u16(startO + s * 2)
    const delta = u16(deltaO + s * 2),
      rangeOff = u16(rangeO + s * 2)
    for (let c = start; c <= end && c !== 0xffff; c++) {
      let g
      if (rangeOff === 0) g = (c + delta) & 0xffff
      else {
        const gi = rangeO + s * 2 + rangeOff + (c - start) * 2
        g = u16(gi)
        if (g !== 0) g = (g + delta) & 0xffff
      }
      if (g !== 0) covered.add(c)
    }
  }
} else if (fmt === 12) {
  const nGroups = u32(best + 12)
  for (let i = 0; i < nGroups; i++) {
    const g = best + 16 + i * 12
    const sc = u32(g),
      ec = u32(g + 4)
    for (let c = sc; c <= ec; c++) covered.add(c)
  }
}

const groups = {
  '既存(細線)': '─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼',
  斜め: '╱ ╲ ╳',
  '塗り三角(直角)': '◤ ◥ ◣ ◢',
  '輪郭三角(直角)': '◸ ◹ ◺ ◿',
  '三角(向き)': '▲ ▼ ◀ ▶ △ ▽ ◁ ▷',
  太線: '━ ┃ ┏ ┓ ┗ ┛ ┣ ┫ ┳ ┻ ╋',
  二重線: '═ ║ ╔ ╗ ╚ ╝',
  丸角: '╭ ╮ ╰ ╯',
  破線: '┄ ┅ ┆ ┇ ┈ ┉',
  スタブ: '╴ ╵ ╶ ╷ ╸ ╹ ╺ ╻ ╼ ╽ ╾ ╿',
  ブロック: '▀ ▄ █ ▌ ▐ ░ ▒ ▓ ▁ ▂ ▃ ▏ ▎ ▍',
  象限ブロック: '▖ ▗ ▘ ▝ ▙ ▚ ▛ ▜ ▞ ▟',
  縦2本候補: '║ ∥ ‖ ｜ ▏ ▕ ▎ ▐ ▌',
}

console.log(`fmt=${fmt}  収録コードポイント数=${covered.size}\n`)
for (const [name, chars] of Object.entries(groups)) {
  const cs = chars.split(' ')
  const line = cs.map((c) => (covered.has(c.codePointAt(0)) ? c : '·')).join(' ')
  const ok = cs.filter((c) => covered.has(c.codePointAt(0))).length
  console.log(`${name.padEnd(14)} ${ok}/${cs.length}  ${line}`)
}
