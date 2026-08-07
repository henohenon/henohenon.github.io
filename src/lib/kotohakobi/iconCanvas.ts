// コトハコビ Icon（Gallery のハコ）の描画。
//
// SVG ではなく canvas に焼くのは、Focus Main と質感を揃えるため。SVG はベクターなので
// 拡大・回転しても無限に鮮明で、canvas でラスタライズしている Main と並ぶと切れ味が合わない。
// 解像度も Main と同じ決め方にする＝ CSS サイズ × devicePixelRatio
// （main.svelte の Application resolution / autoDensity 相当）。固定値を持たないので、
// DPR や枠幅（app.css の grid は minmax(180px, 240px)）が変わっても粒が Main とズレない。
//
// 座標は本体ロゴ `allo-app/src/assets/kotohakobi-icon.svg` 準拠の 256 論理系。
// 元の SVG 実装と同じ数値をそのまま持ってきているので、見た目は変わらない。

const VIEW = 256 // 論理座標の一辺
const INK = '#111'
const STROKE = 7.5

/** 箱本体：閉じた四角（上辺も残す）。フタが開いても上ぶちは常に見える。 */
const BOX = { x: 41.163, y: 43.35, w: 170.174, h: 174.424 }

/** 上フタ 2 枚。長さは上辺の半分で、各上角が蝶番。 */
const LID_LEN = 85.087
const HINGE_L = { x: 41.163, y: 43.35 }
const HINGE_R = { x: 211.337, y: 43.35 }
/** 開き角。閉(0°)=上辺に重なる / 開=斜め上・外へ（buildButton 準拠）。 */
const LID_OPEN = (120 * Math.PI) / 180

/** 「コ」：上バー＋右縦バー＋下バー（ロゴの輪郭矩形）。常時表示。 */
const KO = [
  { x: 72.62, y: 69.09, w: 111.06, h: 20.96 },
  { x: 150.16, y: 79.56, w: 33.52, h: 101.43 },
  { x: 72.62, y: 170.51, w: 111.06, h: 20.96 },
]

/** フタの開き具合（0=閉 / 1=開）だけを受け取って 1 フレーム描く。 */
export function drawIcon(ctx: CanvasRenderingContext2D, size: number, lid: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, size, size)
  ctx.scale(size / VIEW, size / VIEW)
  ctx.strokeStyle = INK
  ctx.lineWidth = STROKE
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.strokeRect(BOX.x, BOX.y, BOX.w, BOX.h)

  // 左は基準角 0°（+x 向き）から反時計へ、右は 180°（-x 向き）から時計へ開く。
  for (const [hinge, base, dir] of [
    [HINGE_L, 0, -1],
    [HINGE_R, Math.PI, 1],
  ] as const) {
    ctx.save()
    ctx.translate(hinge.x, hinge.y)
    ctx.rotate(base + LID_OPEN * lid * dir)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(LID_LEN, 0)
    ctx.stroke()
    ctx.restore()
  }

  for (const r of KO) ctx.strokeRect(r.x, r.y, r.w, r.h)
}

export interface IconRenderer {
  /** フタを開ける / 閉じる。到達済みなら rAF は回らない。 */
  setOpen(open: boolean): void
  dispose(): void
}

/**
 * canvas に描画を張り付け、バッキング解像度の追従と rAF の起動/停止を持つ。
 * rAF はアニメーション中だけ回す（一覧に何個並んでも常時描画にはしない）。
 */
export function createIconRenderer(canvas: HTMLCanvasElement): IconRenderer {
  const ctx = canvas.getContext('2d')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')

  let size = 0 // バッキングの一辺（デバイスピクセル）
  let lid = 0
  let target = 0
  let raf = 0

  const render = () => drawIcon(ctx!, size, lid)

  const tick = () => {
    lid += (target - lid) * 0.18
    if (Math.abs(target - lid) < 0.002) {
      lid = target
      raf = 0
    }
    render()
    if (raf) raf = requestAnimationFrame(tick)
  }

  const kick = () => {
    if (!ctx || !size) return
    if (reduce.matches) {
      // 動かさない設定では終状態にスナップ（元の CSS 版の transition:none 相当）。
      lid = target
      render()
      return
    }
    if (!raf) raf = requestAnimationFrame(tick)
  }

  // devicePixelContentBoxSize が使えればそれが正（DPR 変更にも追従する）。
  // 無い環境は clientWidth × DPR で近似する。
  const resize = (entry?: ResizeObserverEntry) => {
    const dpr = window.devicePixelRatio || 1
    const box = entry?.devicePixelContentBoxSize?.[0]
    const next = box ? box.inlineSize : Math.round(canvas.clientWidth * dpr)
    if (!next || next === size) return
    size = next
    canvas.width = size
    canvas.height = size
    render()
  }

  const ro = new ResizeObserver((entries) => resize(entries[0]))
  ro.observe(canvas)
  resize()

  return {
    setOpen(open) {
      target = open ? 1 : 0
      kick()
    },
    dispose() {
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },
  }
}
