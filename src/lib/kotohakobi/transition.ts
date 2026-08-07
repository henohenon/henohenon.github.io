// コトハコビの Gallery↔Focus 演出＝「上下の黒い蓋」。本体 SceneManager.drawFlaps 準拠。
// View Transitions は使わず、素の固定 div 2 枚を WAAPI で scaleY する。
// 上端から下りる蓋と下端から昇る蓋が中央で合わさって覆う → 覆い中に差し替え → 開く。
import type { ExhibitTransition } from '$lib/transitions/types'
import { letterbox } from './screen'

const FLAP_MS = 220 // 片道の時間（本体 FLAP_MS と同じ）
const MIN_HOLD_MS = 560 // 完全に覆ったままの最低保持（本体 MIN_HOLD_MS = 1000 − 220×2）
const FLAP_EASE = 'cubic-bezier(0.45, 0, 0.55, 1)' // easeInOutQuad 近似

// 覆っている間、5:3 の外（余白の隅）に出る Focus のカードを隠すためのフラグ。
// 実体の CSS は app.css 側（<html> に付くのでコンポーネントにスコープできない）。
// 差し替え前に付けておくことで、カードは「最初から隠れた状態で」生まれる。
const COVER_CLASS = 'focus-covered'

let flapEls: { top: HTMLElement; bottom: HTMLElement } | null = null
function ensureFlaps() {
  if (flapEls) return flapEls
  const mk = (origin: 'top' | 'bottom') => {
    const el = document.createElement('div')
    // 位置・大きさは layoutFlaps() が 5:3 矩形に合わせて設定する。
    el.style.cssText =
      `position:fixed;background:#000;transform:scaleY(0);transform-origin:${origin};` +
      `z-index:9999;pointer-events:none;will-change:transform;`
    document.body.appendChild(el)
    return el
  }
  flapEls = { top: mk('top'), bottom: mk('bottom') }
  return flapEls
}

// 共有の 5:3 レターボックス矩形（screen.letterbox）に蓋を合わせて配置する＝Pixi キャンバスと一致。
// 上の蓋は矩形上辺を蝶番に下へ、下の蓋は矩形下辺を蝶番に上へ伸び、中央で合わさる。
// 中央で 2 枚を OVERLAP 分だけ重ねる。half が端数になる比率でも継ぎ目の 1px 隙間を出さない
// （外側の辺＝矩形の上端/下端は保ったまま、内側だけ伸ばして重ねる。黒同士なので重なりは不可視）。
const FLAP_OVERLAP = 1
function layoutFlaps() {
  const { top, bottom } = ensureFlaps()
  const box = letterbox(window.innerWidth, window.innerHeight)
  const half = box.height / 2
  Object.assign(top.style, {
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${half + FLAP_OVERLAP}px`,
  })
  Object.assign(bottom.style, {
    left: `${box.left}px`,
    top: `${box.top + half - FLAP_OVERLAP}px`,
    width: `${box.width}px`,
    height: `${half + FLAP_OVERLAP}px`,
  })
}

// 上下の蓋を to（0=開/1=閉）へ。中央で合わさるよう各辺を蝶番に scaleY する。
function animateFlaps(to: 0 | 1): Promise<unknown> {
  const { top, bottom } = ensureFlaps()
  const from = to === 1 ? 0 : 1
  const opts: KeyframeAnimationOptions = { duration: FLAP_MS, easing: FLAP_EASE, fill: 'forwards' }
  const frames = [{ transform: `scaleY(${from})` }, { transform: `scaleY(${to})` }]
  return Promise.all([top.animate(frames, opts).finished, bottom.animate(frames, opts).finished])
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * 閉じる → 覆い中に差し替え → 最低保持と mount の両待ち → 開く（本体と同じ順）。
 * カード隠しは入場(dive)のみ。戻り(rise)では隠さない。
 */
export const flapTransition: ExhibitTransition = async ({ navigation, dive, allowSwap }) => {
  const html = document.documentElement
  try {
    layoutFlaps() // 直前のビューポートで 5:3 矩形に合わせる
    if (dive) html.classList.add(COVER_CLASS)
    await animateFlaps(1).catch(() => {}) // 閉じて 5:3 だけ黒く覆う（横は白余白のまま）
    allowSwap() // 覆っている間に DOM を差し替えてよい
    await Promise.all([navigation.complete.catch(() => {}), wait(MIN_HOLD_MS)])
  } finally {
    // 途中で投げても必ず蓋を開けて元に戻す（開いたままの黒画面を残さない）。
    html.classList.remove(COVER_CLASS) // 開くと同時にカードを現す（未付与でも安全）
    try {
      await animateFlaps(0)
    } catch {
      /* 演出だけ諦める */
    }
  }
}
