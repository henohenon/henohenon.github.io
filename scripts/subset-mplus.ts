// M PLUS 1p を「コトハコビ Focus で使う文字だけ」に絞って woff2 サブセット化する。
// Node のみ（subset-font = harfbuzz WASM）。Node 24 が .ts を直接実行するのでビルド不要。
//
// 使う文字 = data.ts の各展示の tech（＝箱に降る使用技術）＋ boxTexts.ts の BOX_EXTRA /
//   BOX_SHOTS の画面名 ＋ 固定ラベル「見に行く」（中央ボタン）。
//   ※ それらを変えたら再実行が必要:  pnpm subset:fonts
// 元 ttf は .tmp-fonts に置く（gitignore 済み・同梱しない）。
//   取得元: コトハコビ本体 D:/0.projects/hackz-allo-cup/allo-app/src/assets/fonts/

import subsetFont from 'subset-font'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { exhibits } from '../src/lib/exhibits/data.ts'
import { BOX_EXTRA, BOX_SHOTS } from '../src/lib/kotohakobi/boxTexts.ts'

const FONT_SRC = '.tmp-fonts'
const OUT = 'src/lib/kotohakobi/fonts'

const LABELS = '見に行く' // 中央ボタン等の固定ラベル
const text =
  exhibits.flatMap((e) => e.tech).join('') + // 箱に降る使用技術（全展示）
  BOX_EXTRA.join('') + // 所属/イベント
  BOX_SHOTS.map((s) => s.name).join('') + // AA 箱の画面名
  LABELS

const uniq = [...new Set(text)].filter((c) => c.trim()).sort().join('')
console.log(`chars(${uniq.length}): ${uniq}`)

mkdirSync(OUT, { recursive: true })
const targets: [string, string][] = [
  ['MPLUS1p-Medium.ttf', 'mplus1p-medium.subset.woff2'], // 荷札 weight 500
  ['MPLUS1p-Bold.ttf', 'mplus1p-bold.subset.woff2'], // ボタン weight 700
]
for (const [src, out] of targets) {
  const buf = readFileSync(`${FONT_SRC}/${src}`)
  const subset = await subsetFont(buf, text, { targetFormat: 'woff2' })
  writeFileSync(`${OUT}/${out}`, subset)
  console.log(`${out}: ${(subset.length / 1024).toFixed(1)} KB`)
}
