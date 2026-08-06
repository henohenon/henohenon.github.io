// コトハコビ・ワードマークを SVG 実測レイアウトに沿って AA（半角ストローク線画）で生成。
// 8行×54列のコンパクト版。タイトル画面タグの上部に置き、下に地面＋工場＋3ボタンを足す。
// 全角カナは使わず罫線/斜め(╱╲)で描く（全て MPLUS1Code 半角=1、桁が崩れない）。
export function genLogo() {
const COLS = 54,
  ROWS = 8
const g = Array.from({ length: ROWS }, () => Array(COLS).fill(' '))
const put = (r, c, ch) => {
  if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g[r][c] = ch
}
const hbar = (r, c0, c1) => {
  for (let c = c0; c <= c1; c++) put(r, c, '─')
}
const vbar = (c, r0, r1) => {
  for (let r = r0; r <= r1; r++) put(r, c, '│')
}
const up = (r, c, n) => {
  for (let i = 0; i < n; i++) put(r - i, c + i, '╱')
} // 右上へ
const down = (r, c, n) => {
  for (let i = 0; i < n; i++) put(r + i, c + i, '╲')
} // 右下へ

// ── コ（1文字目・上段左）
hbar(0, 5, 11)
put(0, 11, '┐')
put(1, 11, '│')
hbar(2, 5, 11)
put(2, 11, '┘')

// ── ト（上段中）：縦棒＋右上への跳ね
vbar(14, 0, 3)
up(2, 15, 3) // (2,15)→(0,17)

// ── 箱（下段）＋フラップ
const bx0 = 3,
  bx1 = 28,
  by0 = 3,
  by1 = 7
hbar(by0, bx0, bx1)
hbar(by1, bx0, bx1)
vbar(bx0, by0, by1)
vbar(bx1, by0, by1)
put(by0, bx0, '┌')
put(by0, bx1, '┐')
put(by1, bx0, '└')
put(by1, bx1, '┘')
put(4, bx0 - 1, '╱') // 左上フラップ（外へ下左）
put(4, bx1 + 1, '╲') // 右上フラップ（外へ下右）

// ── ハ（箱の中・左）：内で高く外へ低い2画（Λ）
up(6, 6, 3) // 左画 (6,6)→(4,8)
down(4, 10, 3) // 右画 (4,10)→(6,12)

// ── コ（2文字目・箱の中・中央右）
hbar(4, 16, 23)
put(4, 23, '┐')
put(5, 23, '│')
hbar(6, 16, 23)
put(6, 23, '┘')

// ── ビ（箱の右外）：濁点＋縦＋跳ね＋下バー
vbar(32, 4, 7)
up(7, 33, 4) // 跳ね (7,33)→(4,36)
hbar(7, 32, 39)
put(7, 39, '┘')
put(3, 36, '"') // 濁点（ビ本体の直上・半角2つ）
put(3, 38, '"')

  return g.map((row) => row.join('').replace(/\s+$/, ''))
}

// 直接実行時はプレビュー
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const isFW = (c) => /[぀-ヿ一-鿿＀-￯]/.test(c)
  const lines = genLogo()
  console.log(lines.join('\n'))
  console.log('\n--- 幅 ---')
  lines.forEach((l, i) => {
    const w = [...l].reduce((a, c) => a + (isFW(c) ? 2 : 1), 0)
    console.log(String(i).padStart(2) + ' w=' + String(w).padStart(2) + ' |' + l + '|')
  })
}
