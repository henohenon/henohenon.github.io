// ルート遷移の演出ロジックを 1 か所に集約する。
// - Gallery↔Focus: クリックした Icon を中心に index 全体をズーム（dive/rise・VT）。
// - Introduction↔About（`/`↔`/?about`）は同一ルート内の query 変化なので、ここでは何もしない。
//   キャプションのテキスト morph は IndexView 側の $effect が担当する。
// - title / face の view-transition-name は「対象 1 枚だけ残す」よう出し入れする。
// View Transitions 非対応ブラウザでは dive/rise は即時遷移にフォールバックする。
import type { OnNavigate } from '@sveltejs/kit'
import { nav } from './nav.svelte'

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

/** onNavigate 用：dive/rise ズーム（VT）を演出する。index↔about は同一ルートなので対象外。 */
export function routeTransition(navigation: OnNavigate): Promise<void> | void {
  const from = navigation.from?.route.id
  const to = navigation.to?.route.id

  const dive = to === '/focus/[id]' && !!from && GALLERY_ROUTES.has(from)
  const rise = from === '/focus/[id]' && !!to && GALLERY_ROUTES.has(to)
  if (!dive && !rise) return
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

  // SvelteKit の DOM 差し替えと View Transitions のキャプチャを噛み合わせる。
  //   resolve()                 … 旧フレーム捕捉後に「DOM を差し替えてよい」と通知
  //   await navigation.complete … 差し替え完了を待ってから新フレームを捕捉
  const { promise, resolve } = Promise.withResolvers<void>()
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
  vt.finished.finally(() => {
    el.classList.remove('vt-dive', 'vt-rise')
    restoreTitles()
    setFaceName('')
  })
  return promise
}
