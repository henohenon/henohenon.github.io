// GlobeXplore の Gallery↔Focus 演出＝「ワープ」。
// 画面中央へ吸い込まれ、魚眼で引き伸ばされ、光条に飲まれて向こう側へ抜ける。
// 遷移中は中身が読めなくてよい、という前提で振り切っている。
//
// 4 つを重ねている:
//   1. 魚眼（樽型歪み）  … ページ全体のスナップショットを feDisplacementMap で歪める
//   2. 加速ズーム＋ブラー … 同じスナップショットを CSS keyframes で拡大・ぼかし・露出飛ばし
//   3. 放射ストリーク    … canvas に中央から放射状の光条。加速して伸びる
//   4. 白飛び            … 山で画面を白く飛ばす。差し替えもここで隠れる
//
// 1 が View Transitions のスナップショットに掛かるのが肝。スナップショットは
// 「レンダリング済みの 1 枚の絵」なので、テキストでも canvas でも video でも
// 区別なく写っているもの全部が同じように歪む。生 DOM に filter を掛けると
// containing block が生まれて position:fixed が壊れるが、その副作用もない。
//
// 変位マップは実行時に canvas で作る（radial gradient では「方向」を表現できないため）。
//   R = 0.5 + 0.5 * nx * r   G = 0.5 + 0.5 * ny * r   ※ n=中央からの正規化座標, r=|n|
// 変位の向きは放射状、大きさは r^2 に比例＝樽型歪み。
// feDisplacementMap は P'(x) ← P(x + scale*(C-0.5)) なので、
//   scale < 0 … 内側から拾う＝中央がふくらむ（使うのはこちら）
import type { ExhibitTransition } from '$lib/transitions/types'

const FILTER_ID = 'gx-warp-fisheye'
const WARP_CLASS = 'gx-warp'

/** 演出全体の尺。CSS 側へは --gx-dur で渡すので、ここだけ変えれば両方に効く。 */
const BASE_DUR_MS = 780
/** URL に ?warpslow を付けると何倍に伸ばすか（歪みや重なりを観察する用）。 */
const SLOW_FACTOR = 6
/** 白飛びの山が来る位置（0..1）。差し替えもこの前後で隠れる。 */
const PEAK_AT = 0.46

// 変位マップの長辺解像度。歪みは滑らかなので小さくてよい。
const MAP_LONG = 256
/** 魚眼の最大変位（px 相当）。「ぐっと」の強さはここ。 */
const FISHEYE_PEAK = 1500
/** レンズ（真円）の半径 ÷ 画面の半対角。
 *  1.0 … 画面の四隅にちょうど接する円
 *  >1  … 画面より大きい円の「中央あたりだけ」を見る＝ゆるやかで巨大なレンズ
 *  強さ自体は FISHEYE_PEAK が持つので、ここは曲がり方（＝球の大きさ）だけを変える。 */
const LENS_RADIUS = 1.8

/** 光条の本数と最大長の係数。0 で光条なし。 */
const STREAK_COUNT = 220
const STREAK_LEN = 2.4
/** 白飛びの強さ（0..1）。0 で白飛びなし。 */
const FLASH = 0

// ---- 魚眼フィルタ -----------------------------------------------------------

// 真円にするため、マップ自体をビューポートと同じ縦横比で作る
// （正方形マップを preserveAspectRatio="none" で引き伸ばすと楕円になってしまう）。
let mapUrl: string | null = null
let mapKey = ''
function buildMap(vw: number, vh: number): string {
  const key = `${Math.round((vw / vh) * 100)}`
  if (mapUrl && mapKey === key) return mapUrl

  const mw = vw >= vh ? MAP_LONG : Math.max(2, Math.round((MAP_LONG * vw) / vh))
  const mh = vw >= vh ? Math.max(2, Math.round((MAP_LONG * vh) / vw)) : MAP_LONG
  const c = document.createElement('canvas')
  c.width = mw
  c.height = mh
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(mw, mh)

  const cx = mw / 2
  const cy = mh / 2
  const halfDiag = Math.hypot(cx, cy)
  const lensR = halfDiag * LENS_RADIUS
  // 画面隅で変位が最大（=1）になるよう正規化する。これで LENS_RADIUS を変えても
  // 強さは変わらず、曲がり方だけが変わる。
  const norm = (halfDiag / lensR) ** 2

  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const dx = x - cx
      const dy = y - cy
      const d = Math.hypot(dx, dy)
      const r = Math.min(1, d / lensR)
      // 向きは放射方向、大きさは r^2 に比例（＝樽型）。
      const m = (r * r) / norm
      const ux = d > 0 ? dx / d : 0
      const uy = d > 0 ? dy / d : 0
      const i = (y * mw + x) * 4
      img.data[i] = Math.round(255 * (0.5 + 0.5 * ux * m)) // R = dx
      img.data[i + 1] = Math.round(255 * (0.5 + 0.5 * uy * m)) // G = dy
      img.data[i + 2] = 0
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  mapUrl = c.toDataURL()
  mapKey = key
  return mapUrl
}

// マップはビューポート比に依存するので、feImage も掴んでおいて毎回貼り直す。
let parts: { fe: SVGFEDisplacementMapElement; feImage: SVGFEImageElement } | null = null
function ensureFilter(vw: number, vh: number) {
  if (parts) {
    parts.feImage.setAttribute('href', buildMap(vw, vh))
    return parts.fe
  }
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.cssText = 'position:absolute;pointer-events:none'

  const filter = document.createElementNS(NS, 'filter')
  filter.setAttribute('id', FILTER_ID)
  // 変位で外から引っ張るぶん、フィルタ領域を広げて端が欠けないようにする。
  filter.setAttribute('x', '-30%')
  filter.setAttribute('y', '-30%')
  filter.setAttribute('width', '160%')
  filter.setAttribute('height', '160%')
  filter.setAttribute('color-interpolation-filters', 'sRGB')

  const feImage = document.createElementNS(NS, 'feImage')
  feImage.setAttribute('href', buildMap(vw, vh))
  feImage.setAttribute('preserveAspectRatio', 'none')
  feImage.setAttribute('x', '0')
  feImage.setAttribute('y', '0')
  feImage.setAttribute('width', '100%')
  feImage.setAttribute('height', '100%')
  feImage.setAttribute('result', 'map')

  const fe = document.createElementNS(NS, 'feDisplacementMap')
  fe.setAttribute('in', 'SourceGraphic')
  fe.setAttribute('in2', 'map')
  fe.setAttribute('xChannelSelector', 'R')
  fe.setAttribute('yChannelSelector', 'G')
  fe.setAttribute('scale', '0')

  filter.append(feImage, fe)
  svg.append(filter)
  document.body.append(svg)
  parts = { fe, feImage }
  return fe
}

// ---- 光条＋白飛びのオーバーレイ ---------------------------------------------

let canvas: HTMLCanvasElement | null = null
function ensureCanvas(): HTMLCanvasElement {
  if (canvas) return canvas
  const c = document.createElement('canvas')
  // スナップショットより前。蓋（9999）とは別演出なので競合しない。
  c.style.cssText =
    'position:fixed;inset:0;z-index:9998;pointer-events:none;opacity:0;mix-blend-mode:screen'
  document.body.append(c)
  canvas = c
  return c
}

type Streak = { a: number; r: number; v: number }

function makeStreaks(maxR: number): Streak[] {
  return Array.from({ length: STREAK_COUNT }, () => ({
    a: Math.random() * Math.PI * 2,
    // 初期半径をばらけさせて、始まった瞬間から全域に線がある状態にする。
    r: Math.random() * maxR * 0.5,
    v: 0.6 + Math.random() * 1.6,
  }))
}

// ---- 本体 -------------------------------------------------------------------

const easeIn = (t: number) => t * t * t
const easeOut = (t: number) => 1 - (1 - t) ** 3

export const warpTransition: ExhibitTransition = async ({ navigation, dive, allowSwap }) => {
  // View Transitions が無いとスナップショットが撮れない＝歪ませる対象が無い。
  if (!document.startViewTransition) return

  const html = document.documentElement
  const w = window.innerWidth
  const h = window.innerHeight

  // 尺はここが唯一の出所。CSS 側は --gx-dur を読むので、JS と keyframes が必ず揃う。
  // ?warpslow を付けるとスローになり、old/new の重なりや歪みの推移を目で追える。
  const slow = new URLSearchParams(location.search).has('warpslow')
  const DUR_MS = BASE_DUR_MS * (slow ? SLOW_FACTOR : 1)
  html.style.setProperty('--gx-dur', `${DUR_MS}ms`)

  // マップは真円にするためビューポート比で作る。比が変わっていれば貼り直される。
  const fe = ensureFilter(w, h)
  const cvs = ensureCanvas()
  const ctx = cvs.getContext('2d')!

  const dpr = Math.min(2, window.devicePixelRatio || 1)
  cvs.width = w * dpr
  cvs.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const cx = w / 2
  const cy = h / 2
  const maxR = Math.hypot(cx, cy)
  const streaks = makeStreaks(maxR)

  html.classList.add(WARP_CLASS, dive ? 'gx-dive' : 'gx-rise')
  fe.setAttribute('scale', '0')
  cvs.style.opacity = '1'

  /** t:0→1 を DUR_MS かけて回し、魚眼・光条・白飛びを同じ時計で進める。 */
  const runEffect = () =>
    new Promise<void>((done) => {
      const t0 = performance.now()
      let prev = t0
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / DUR_MS)
        const dt = Math.min(48, now - prev) / 1000
        prev = now

        // 魚眼：山まで一気に、山を越えたらゆっくり戻す。
        const fish =
          t < PEAK_AT ? easeIn(t / PEAK_AT) : 1 - easeOut((t - PEAK_AT) / (1 - PEAK_AT))
        fe.setAttribute('scale', String(-FISHEYE_PEAK * fish * (dive ? 1 : 0.75)))

        // 光条：山に向けて加速し、抜けたら減速して消える。
        const speed = (t < PEAK_AT ? easeIn(t / PEAK_AT) : 1 - easeOut((t - PEAK_AT) / (1 - PEAK_AT))) * 9
        const alpha = t < PEAK_AT ? t / PEAK_AT : 1 - (t - PEAK_AT) / (1 - PEAK_AT)

        ctx.clearRect(0, 0, w, h)
        ctx.globalAlpha = alpha
        ctx.lineCap = 'round'
        for (const s of streaks) {
          // 中央から外へ指数的に加速（＝ワープの伸び）。
          s.r += (s.r + 40) * s.v * speed * dt
          if (s.r > maxR * 1.4) {
            s.r = Math.random() * 30
            s.a = Math.random() * Math.PI * 2
          }
          const len = Math.min(maxR, s.r * STREAK_LEN * (speed / 9))
          const ux = Math.cos(s.a)
          const uy = Math.sin(s.a)
          const near = Math.max(0, s.r - len)
          ctx.strokeStyle = `hsl(${196 + (s.v * 20) % 40} 100% ${72 + 20 * (s.r / maxR)}%)`
          ctx.lineWidth = 1 + 2.6 * (s.r / maxR)
          ctx.beginPath()
          ctx.moveTo(cx + ux * near, cy + uy * near)
          ctx.lineTo(cx + ux * s.r, cy + uy * s.r)
          ctx.stroke()
        }

        // 白飛び：山で画面を覆う。差し替えもここで見えなくなる。
        const flash = FLASH * Math.max(0, 1 - Math.abs(t - PEAK_AT) / 0.3) ** 2
        if (flash > 0.001) {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR)
          g.addColorStop(0, `rgba(255,255,255,${flash})`)
          g.addColorStop(0.45, `rgba(226,246,255,${flash * 0.85})`)
          g.addColorStop(1, `rgba(190,230,255,${flash * 0.25})`)
          ctx.globalAlpha = 1
          ctx.fillStyle = g
          ctx.fillRect(0, 0, w, h)
        }

        if (t < 1) requestAnimationFrame(frame)
        else done()
      }
      requestAnimationFrame(frame)
    })

  try {
    const vt = document.startViewTransition(async () => {
      allowSwap()
      await navigation.complete.catch(() => {})
    })
    // 疑似要素が出てからでないと歪みが乗らないので ready を待つ。
    await vt.ready.catch(() => {})
    await runEffect()
    await vt.finished.catch(() => {})
  } finally {
    html.classList.remove(WARP_CLASS, 'gx-dive', 'gx-rise')
    fe.setAttribute('scale', '0')
    cvs.style.opacity = '0'
    ctx.clearRect(0, 0, w, h)
  }
}
