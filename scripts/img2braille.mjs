// 画像 → 点字(Braille)アート。1 文字 = 2×4 サブドットで実質高解像度。線画・モノクロ向け。
//   usage: node scripts/img2braille.mjs <image> [cols=80] [thresh=128] [crop=x,y,w,h] [invert=0]
// 白地に黒線を想定：暗い画素でドットを立てる（invert=1 で反転）。
// 縮小は min-pooling（サブドット格子ごとに最暗画素）で細線を残す。
import { Jimp } from 'jimp'
import { writeFileSync } from 'node:fs'

const [, , input, colsArg, threshArg, cropArg, invArg] = process.argv
const COLS = Number(colsArg) || 80
const THRESH = Number(threshArg) || 128
const INVERT = invArg === '1'

// 点字ドット (x,y)→ビット。x∈{0,1} y∈{0,1,2,3}。
const DOT = [
  [0x01, 0x02, 0x04, 0x40], // x=0: dot1,2,3,7
  [0x08, 0x10, 0x20, 0x80], // x=1: dot4,5,6,8
]

const img = await Jimp.read(input)
if (cropArg) {
  const [x, y, w, h] = cropArg.split(',').map(Number)
  img.crop({ x, y, w, h })
}
img.greyscale()
const { width, height, data } = img.bitmap

const W2 = COLS * 2 // サブドット横数
const ROWS = Math.max(1, Math.round((COLS * height) / width / 2))
const H4 = ROWS * 4 // サブドット縦数
const sx = width / W2
const sy = height / H4

// サブドット格子へ min-pool（最暗）で縮小。
const grid = new Uint8Array(W2 * H4)
for (let gy = 0; gy < H4; gy++) {
  for (let gx = 0; gx < W2; gx++) {
    const x0 = Math.floor(gx * sx)
    const x1 = Math.max(x0 + 1, Math.floor((gx + 1) * sx))
    const y0 = Math.floor(gy * sy)
    const y1 = Math.max(y0 + 1, Math.floor((gy + 1) * sy))
    let min = 255
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const b = data[(y * width + x) * 4]
        if (b < min) min = b
      }
    grid[gy * W2 + gx] = min
  }
}

let out = ''
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    let bits = 0
    for (let dx = 0; dx < 2; dx++)
      for (let dy = 0; dy < 4; dy++) {
        const v = grid[(r * 4 + dy) * W2 + (c * 2 + dx)]
        const on = INVERT ? v >= THRESH : v < THRESH
        if (on) bits |= DOT[dx][dy]
      }
    out += String.fromCodePoint(0x2800 + bits)
  }
  out += '\n'
}
process.stdout.write(out)
writeFileSync(input.replace(/\.\w+$/, '.braille.txt'), out)
