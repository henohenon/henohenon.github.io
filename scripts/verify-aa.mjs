// BOX_SHOTS の各 AA を検証：行ごとの視覚幅（全角=2/半角=1）とアスペクト（幅/(2.36*行数)）。
// 等幅 M PLUS 1 Code（半角0.5em幅・行高1.18em）想定 → セル比 0.5:1.18。目標 5:3 = 1.667。
import { readFileSync } from 'node:fs'

const src = readFileSync('src/lib/kotohakobi/boxTexts.ts', 'utf8')
const shots = [...src.matchAll(/aa: (?:String\.raw)?`([^`]*)`/g)].map((m) => m[1])
const names = [...src.matchAll(/name: '([^']*)'/g)].map((m) => m[1])
const isFW = (c) => /[぀-ヿ一-鿿＀-￯]/.test(c)
const vwidth = (line) => [...line].reduce((a, c) => a + (isFW(c) ? 2 : 1), 0)

for (let i = 0; i < shots.length; i++) {
  const lines = shots[i].split('\n')
  const w = lines.map(vwidth)
  const maxW = Math.max(...w)
  const R = lines.length
  const aspect = maxW / (2.36 * R)
  console.log(`\n[${names[i] ?? i}]  ${R}行 幅max=${maxW}  アスペクト=${aspect.toFixed(2)}  (目標 1.67)`)
  lines.forEach((l, j) => console.log(String(w[j]).padStart(3) + ' |' + l))
}
