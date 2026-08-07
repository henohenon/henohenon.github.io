// 既定の演出：クリックした Icon を中心に index 全体をズームする（View Transitions）。
// 展示ごとの演出が登録されていない場合はこれが使われる。
// 名前を付けなかった要素は全部 `root` という 1 枚のスナップショットに吸い込まれるので、
// ページ全体が 1 枚の絵として拡大／縮小する。CSS は app.css の「ルート遷移」節。
import type { ExhibitTransition } from './types'

const root = () => document.documentElement

// ズームと同時にアイコンを画面中央へ寄せる割合（0=動かない / 1=中央まで）。やり過ぎない程度。
// Gallery は縦中央寄せでアイコンが元々縦中央に近い（dy が小さい）ため、縦は強めにする。
const DRIFT_X = 0.4
const DRIFT_Y = 0.6

/** 要素（Exhibit or Focus 内カード）の .icon 中心を、ズーム原点＋中央への並進量として記録。
 *  クリック時点の位置が要るので、遷移が始まる前に呼ぶ（markExhibitOrigin から）。 */
export function setOrigin(container: Element | null) {
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
// ※ 同じ view-transition-name が同時に 2 つあると VT は InvalidStateError で中断する。
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

export const zoomTransition: ExhibitTransition = async ({ navigation, dive, allowSwap }) => {
  if (!document.startViewTransition) return // 非対応ブラウザは即時遷移にフォールバック

  const el = root()
  if (dive) {
    el.classList.add('vt-dive')
    // 遷移元（Gallery）で、行き先の作品タイトルだけ残す。顔はズームに含める。
    keepOnlyTitle(`title-${navigation.to?.params?.slug}`)
    setFaceName('none')
  } else {
    el.classList.add('vt-rise')
  }

  try {
    // SvelteKit の DOM 差し替えと View Transitions のキャプチャを噛み合わせる。
    // 旧フレームは startViewTransition を呼んだ時点で既に捕捉済みなので、
    // コールバックの中で差し替えを許可してよい。
    const vt = document.startViewTransition(async () => {
      allowSwap()
      await navigation.complete.catch(() => {})
      if (!dive) {
        // 中央着地は #slug ＋ scroll-margin のネイティブスクロール任せ。
        // ズーム原点＋左右ドリフトは戻り先カードの実位置から算出。
        const slug = navigation.from?.params?.slug
        keepOnlyTitle(`title-${slug}`)
        setFaceName('none')
        setOrigin(slug ? document.getElementById(slug) : null)
      }
    })
    // 中断（名前の重複など）では reject する。演出は諦めるが遷移は止めない。
    await vt.finished.catch(() => {})
  } finally {
    // 演出用に付けたクラス／VT 名を必ず元へ戻す。
    el.classList.remove('vt-dive', 'vt-rise')
    restoreTitles()
    setFaceName('')
  }
}
