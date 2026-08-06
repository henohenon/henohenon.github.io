// ルート遷移の演出ロジックを 1 か所に集約する。
// - Gallery↔Focus: クリックした Icon を中心に index 全体をズーム（dive/rise・VT）。
// - Introduction↔About（`/`↔`/?about`）は同一ルート内の query 変化なので、ここでは何もしない。
//   キャプションのテキスト morph は IndexView 側の $effect が担当する。
// - title / face の view-transition-name は「対象 1 枚だけ残す」よう出し入れする。
// View Transitions 非対応ブラウザでは dive/rise は即時遷移にフォールバックする。
import type { OnNavigate } from '@sveltejs/kit'
import { nav } from './nav.svelte'
import { letterbox } from './kotohakobi/screen'

// Focus に入れる元＝Gallery ルート（about モードでも route id は '/'）。
const GALLERY_ROUTES = new Set(['/'])
const root = () => document.documentElement

// ズームと同時にアイコンを画面中央へ寄せる割合（0=動かない / 1=中央まで）。やり過ぎない程度。
// Gallery は縦中央寄せでアイコンが元々縦中央に近い（dy が小さい）ため、縦は強めにする。
const DRIFT_X = 0.4
const DRIFT_Y = 0.6

// 要素（Exhibit or Focus 内カード）の .icon 中心を、ズーム原点＋中央への並進量として記録。
function setOrigin(container: Element | null) {
  const icon = container?.querySelector('.icon')
  if (!icon) return
  const r = icon.getBoundingClientRect()
  const px = r.left + r.width / 2
  const py = r.top + r.height / 2
  const s = root().style
  s.setProperty('--vt-x', `${px}px`)
  s.setProperty('--vt-y', `${py}px`)
  // 方向は中央向き（縦横比は自然に決まる）、量は DRIFT_X / DRIFT_Y。
  s.setProperty('--vt-dx', `${(window.innerWidth / 2 - px) * DRIFT_X}px`)
  s.setProperty('--vt-dy', `${(window.innerHeight / 2 - py) * DRIFT_Y}px`)
}


// Gallery のタイトルのうち name の 1 枚だけ残し、他は none（root のズームに含める）。
function keepOnlyTitle(name: string) {
  for (const el of document.querySelectorAll<HTMLElement>('.gallery .title-caption[data-vt]')) {
    el.style.viewTransitionName = el.dataset.vt === name ? name : 'none'
  }
}

// 全タイトルの view-transition-name を元に戻す。
function restoreTitles() {
  for (const el of document.querySelectorAll<HTMLElement>('.gallery .title-caption[data-vt]')) {
    el.style.viewTransitionName = el.dataset.vt ?? ''
  }
}

// 顔タイポグラフィの名前を切替（'none' で外す / '' で CSS の face に戻す）。
function setFaceName(value: 'none' | '') {
  const face = document.querySelector<HTMLElement>('.face')
  if (face) face.style.viewTransitionName = value
}

/** Exhibit クリック時：戻り先ルートを控え、ズーム原点（Icon 中心）を記録する。
 *  icon / title どちらのリンクから来ても、原点は Exhibit の Icon に合わせる。 */
export function markExhibitOrigin(event: MouseEvent, about: boolean) {
  // 戻り先は元のモードを保つ（query と hash は共存できる：`/?about#id`）。
  nav.from = about ? '/?about' : '/'
  setOrigin((event.currentTarget as HTMLElement).closest('.exhibit'))
}

// 進行中の遷移があるか。VT を重ねると InvalidStateError で中断され旧フレームが焼き付く／
// 蓋トランジションも重ねたくないので、両方でこのフラグを見て多重発火を防ぐ。
let transitioning = false

// ── コトハコビ専用「上下の黒い蓋」トランジション（本体 SceneManager.drawFlaps 準拠） ──
// 上端から下りる蓋＋下端から昇る蓋が中央で合わさり黒く覆う → 覆い中に差し替え → 開く。
const FLAP_MS = 220 // 片道の時間（本体 FLAP_MS と同じ）
const MIN_HOLD_MS = 560 // 完全に覆ったままの最低保持（本体 MIN_HOLD_MS = 1000 − 220×2）
const FLAP_EASE = 'cubic-bezier(0.45, 0, 0.55, 1)' // easeInOutQuad 近似

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
 * コトハコビ行き来を上下の蓋で覆って差し替える。VT は使わない。
 * 本体順: 閉じる → 覆い中に差し替え → 最低保持(MIN_HOLD_MS)と mount の両待ち → 開く。
 * hideCards（Focus 入場のみ）: Focus のカード（details/title は 5:3 外の余白隅で蓋に覆われない）を
 * 覆い中は隠し、開くと同時に現す。戻り(rise)では隠さない。
 */
function flapTransition(navigation: OnNavigate, hideCards: boolean): Promise<void> {
  const html = document.documentElement
  const { promise, resolve } = Promise.withResolvers<void>()
  ;(async () => {
    layoutFlaps() // 直前のビューポートで 5:3 矩形に合わせる
    if (hideCards) html.classList.add('koto-covering')
    try {
      await animateFlaps(1) // 閉じて 5:3 だけ黒く覆う（横は白余白のまま）
    } catch {
      /* noop */
    }
    resolve() // 覆っている間に DOM を差し替えてよい
    await Promise.all([navigation.complete.catch(() => {}), wait(MIN_HOLD_MS)])
    html.classList.remove('koto-covering') // 開くと同時にカードを現す（未付与でも安全）
    try {
      await animateFlaps(0) // 開いて新ページを見せる
    } catch {
      /* noop */
    }
    transitioning = false
  })()
  return promise
}

/** onNavigate 用：dive/rise ズーム（VT）を演出する。index↔about は同一ルートなので対象外。 */
export function routeTransition(navigation: OnNavigate): Promise<void> | void {
  const from = navigation.from?.route.id
  const to = navigation.to?.route.id

  const dive = to === '/focus/[id]' && !!from && GALLERY_ROUTES.has(from)
  const rise = from === '/focus/[id]' && !!to && GALLERY_ROUTES.has(to)
  if (!dive && !rise) return
  if (transitioning) return

  // コトハコビ行き来だけは「上下の黒い蓋」トランジション（VT ではなく黒オーバーレイ）。
  // dive は行き先(to)の id、rise は戻り元(from)の id を見る。
  const focusId = navigation.to?.params?.id ?? navigation.from?.params?.id
  if (focusId === 'kotohakobi') {
    transitioning = true
    // Focus 入場(dive)のみカードを覆い中は隠す。戻り(rise)は従来どおり。
    return flapTransition(navigation, dive)
  }

  if (!document.startViewTransition) return

  const el = root()

  if (dive) {
    el.classList.add('vt-dive')
    // 遷移元（Gallery）で、行き先の作品タイトルだけ残す。顔はズームに含める。
    keepOnlyTitle(`title-${navigation.to?.params?.id}`)
    setFaceName('none')
  } else if (rise) {
    el.classList.add('vt-rise')
  }

  // 演出用に付けたクラス／VT 名を必ず元へ戻す。VT 完了・中断・同期例外の全経路で呼ぶ。
  const cleanup = () => {
    el.classList.remove('vt-dive', 'vt-rise')
    restoreTitles()
    setFaceName('')
    transitioning = false
  }

  // SvelteKit の DOM 差し替えと View Transitions のキャプチャを噛み合わせる。
  //   resolve()                 … 旧フレーム捕捉後に「DOM を差し替えてよい」と通知
  //   await navigation.complete … 差し替え完了を待ってから新フレームを捕捉
  const { promise, resolve } = Promise.withResolvers<void>()
  try {
    transitioning = true
    const vt = document.startViewTransition(async () => {
      resolve()
      await navigation.complete
      if (rise) {
        // 中央着地は #id ＋ scroll-margin のネイティブスクロール任せ。
        // ズーム原点＋左右ドリフトは戻り先カードの実位置から算出。
        const id = navigation.from?.params?.id
        keepOnlyTitle(`title-${id}`)
        setFaceName('none')
        setOrigin(id ? document.getElementById(id) : null)
      }
    })
    // finished は中断時に reject する。両経路で cleanup し、未処理拒否を出さない。
    vt.finished.then(cleanup, cleanup)
  } catch {
    // 稀に invalid state で同期例外。演出は諦めるが、ナビゲーション自体は止めない。
    cleanup()
    resolve()
  }
  return promise
}
