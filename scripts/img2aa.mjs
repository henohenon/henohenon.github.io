// 画像 → ASCII アート（線画向け）。純 JS（jimp）。
//   usage: node scripts/img2aa.mjs <image> [cols=90] [mode=min|avg] [gamma=1] [crop=x,y,w,h]
// 線が潰れないよう、既定は min-pooling（セル内の最暗画素を採用＝細線を残す）。
// crop を渡すと窓枠を除いた中身だけ変換できる。
import { Jimp } from 'jimp'
import { writeFileSync } from 'node:fs'

const [, , input, colsArg, mode = 'min', gammaArg, cropArg] = process.argv
const COLS = Number(colsArg) || 90
const GAMMA = Number(gammaArg) || 1
const RAMP = ' .:-=+*#%@' // 明 → 暗

const img = await Jimp.read(input)
if (cropArg) {
  const [x, y, w, h] = cropArg.split(',').map(Number)
  img.crop({ x, y, w, h })
}
img.greyscale()
const { width, height, data } = img.bitmap
const ROWS = Math.max(1, Math.round((COLS * height) / width / 2)) // 文字は約 2:1（縦長）

const cw = width / COLS
const ch = height / ROWS
let out = ''
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const x0 = Math.floor(c * cw)
    const x1 = Math.max(x0 + 1, Math.floor((c + 1) * cw))
    const y0 = Math.floor(r * ch)
    const y1 = Math.max(y0 + 1, Math.floor((r + 1) * ch))
    let acc = mode === 'avg' ? 0 : 255
    let n = 0
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const b = data[(y * width + x) * 4]
        if (mode === 'avg') acc += b
        else acc = Math.min(acc, b)
        n++
      }
    }
    const bright = mode === 'avg' ? acc / n : acc
    let darkness = (255 - bright) / 255
    darkness = Math.pow(darkness, GAMMA)
    const idx = Math.min(RAMP.length - 1, Math.floor(darkness * RAMP.length))
    out += RAMP[idx]
  }
  out += '\n'
}
process.stdout.write(out)
writeFileSync(input.replace(/\.\w+$/, '.aa.txt'), out)
