// M PLUS 1p を「コトハコビ Focus で使う文字だけ」に絞って woff2 サブセット化する。
// Node のみ（subset-font = harfbuzz WASM）。Python 不要。
//
// 使う文字 = data.ts の各展示の tech（＝箱に降る使用技術）＋ 固定ラベル「見に行く」（中央ボタン）。
//   ※ 箱テキスト（tech）を変えたら再実行が必要:  pnpm subset:fonts
// 元 ttf は本体リポジトリ（henohenon/hackz-allo-cup）の allo-app から読む（同梱はしない）。

import subsetFont from 'subset-font'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const FONT_SRC = 'D:/0.projects/hackz-allo-cup/allo-app/src/assets/fonts'
const OUT = 'src/lib/kotohakobi/fonts'

// data.ts の `tech: [ ... ]` 配列から文字列リテラルを全部拾う（＝箱に降る使用技術）。
const dataSrc = readFileSync('src/lib/exhibits/data.ts', 'utf8')
const techChars = [...dataSrc.matchAll(/tech:\s*\[([^\]]*)\]/g)]
  .flatMap((m) => [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]))
  .join('')
// boxTexts.ts の追加テキスト（所属/イベント）も箱に降るので拾う。
const extraSrc = readFileSync('src/lib/kotohakobi/boxTexts.ts', 'utf8')
const extraChars = [...extraSrc.matchAll(/'([^']*)'/g)].map((m) => m[1]).join('')
const LABELS = '見に行く' // 中央ボタン等の固定ラベル
const text = techChars + extraChars + LABELS

const uniq = [...new Set(text)].filter((c) => c.trim()).sort().join('')
console.log(`chars(${[...new Set(uniq)].length}): ${uniq}`)

mkdirSync(OUT, { recursive: true })
const targets = [
  ['MPLUS1p-Medium.ttf', 'mplus1p-medium.subset.woff2'], // 荷札 weight 500
  ['MPLUS1p-Bold.ttf', 'mplus1p-bold.subset.woff2'], // ボタン weight 700
]
for (const [src, out] of targets) {
  const buf = readFileSync(`${FONT_SRC}/${src}`)
  const subset = await subsetFont(buf, text, { targetFormat: 'woff2' })
  writeFileSync(`${OUT}/${out}`, subset)
  console.log(`${out}: ${(subset.length / 1024).toFixed(1)} KB`)
}
