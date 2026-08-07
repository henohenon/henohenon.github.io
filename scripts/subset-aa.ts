// 画面 AA（BOX_SHOTS）で使う M PLUS 1 Code（等幅・JP対応）をサブセット化。
// 罫線=半角(1) / 全角=2 が固定なので AA の桁がズレない。元 ttf は .tmp-fonts に置く（google/fonts）。
//   再取得: curl -sL -o .tmp-fonts/MPLUS1Code.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/mplus1code/MPLUS1Code%5Bwght%5D.ttf"
//
// ★「使用文字だけ」だと AA に後から入れた記号（例: ASCII の \ ／ |）が本番で“消える”。
//   それを防ぐため、AA で使いうる範囲（ASCII・罫線・ブロック・幾何・矢印・句読点）は常時同梱し、
//   かな/漢字など可変分だけ BOX_SHOTS の実 AA から拾う。
import subsetFont from 'subset-font'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { BOX_SHOTS } from '../src/lib/kotohakobi/boxTexts.ts'

const range = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i)).join('')
// AA で使いうる記号類は“常に”含める（ここに無い字だけが本番で消える）。
const base =
  range(0x20, 0x7e) + // ASCII（\ / | ` " など AA 頻出記号を確実に）
  range(0xa0, 0xff) + // ラテン1補助（記号・約物）
  range(0x2010, 0x206f) + // 一般句読点（各種ダッシュ・引用符・スペース）
  range(0x2190, 0x21ff) + // 矢印
  range(0x2500, 0x257f) + // 罫線
  range(0x2580, 0x259f) + // ブロック要素
  range(0x25a0, 0x25ff) + // 幾何図形（三角・四角・丸）
  range(0x2600, 0x26ff) + // その他記号（一部）
  range(0x3000, 0x30ff) + // 全角空白・かな
  range(0xff00, 0xffef) // 全角英数記号（＼／｜ 等）・半角かな

// 可変分（かな・漢字など）は AA の実文字から拾う。
const aa = BOX_SHOTS.map((s) => s.aa).join('')

const text = [...new Set(base + aa)].join('')
console.log('aa chars:', text.length, '(base+実文字)')

mkdirSync('src/lib/kotohakobi/fonts', { recursive: true })
const buf = readFileSync('.tmp-fonts/MPLUS1Code.ttf')
const sub = await subsetFont(buf, text, { targetFormat: 'woff2' })
writeFileSync('src/lib/kotohakobi/fonts/mplus1code-aa.subset.woff2', sub)
console.log('mplus1code-aa.subset.woff2:', (sub.length / 1024).toFixed(1), 'KB')
