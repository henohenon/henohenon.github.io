// Focus Main のワードマーク用フォントを、使う文字だけに絞って woff2 サブセット化する。
// Node のみ（subset-font = harfbuzz WASM）。Node 24 が .ts を直接実行するのでビルド不要。
//
// フォント = TeX Gyre Heros Bold。系譜は Helvetica → Nimbus Sans L → TeX Gyre Heros で、
// GlobeXplore ロゴ（Figma 指定＝Helvetica Bold）の字形をそのまま踏襲する。特に大文字 G の
// スパー（横棒から下へ伸びる突起）が Helvetica と同じで、Arial 系との一番の相違点がここで揃う。
// ライセンスは GUST Font License（= LPPL 1.3c）で、Web フォント配信に制限はない。
//   ※ 「派生物は名前を変えて配布してほしい」という依頼（法的要求ではない）があるため、
//      出力名を heros-gx.subset.woff2 として元と区別する。ライセンス全文は OUT に同梱。
//
// 使う文字 = GlobeXplore のリンクラベル（＝ワードマーク）＋商標記号。
//   リンクは展示固有なのでデータ側には無く、コンポーネントと同じ globexplore/links.ts を
//   読む（文字列の出所を 1 つに保つ）。
//   ※ ラベルを変えたら再実行が必要:  pnpm subset:heros
// 元 otf は .tmp-fonts に置く（gitignore 済み・同梱しない）。
//   再取得: curl -sL -o .tmp-fonts/texgyreheros-bold.otf "https://mirrors.ctan.org/fonts/tex-gyre/opentype/texgyreheros-bold.otf"

import subsetFont from 'subset-font'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { LINKS } from '../src/lib/globexplore/links.ts'

const FONT_SRC = '.tmp-fonts/texgyreheros-bold.otf'
const OUT = 'src/lib/globexplore/fonts'
const OUT_NAME = 'heros-gx.subset.woff2'

const labels = LINKS.map((l) => l.label).join(' ')
// 商標記号は今はラベルに含めていないが、後で付けられるよう先に含めておく（1 グリフ）。
const text = labels + ' ®'

const uniq = [...new Set(text)].sort().join('')
console.log(`chars(${uniq.length}): ${JSON.stringify(uniq)}`)

mkdirSync(OUT, { recursive: true })
const subset = await subsetFont(readFileSync(FONT_SRC), text, { targetFormat: 'woff2' })
writeFileSync(`${OUT}/${OUT_NAME}`, subset)
console.log(`${OUT_NAME}: ${(subset.length / 1024).toFixed(1)} KB`)
