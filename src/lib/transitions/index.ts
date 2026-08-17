// ルート遷移の配線。どの展示にどの演出を当てるかの対応表もここが持つ。
// - Gallery↔Focus: 展示ごとの演出があれば引き当て、無ければ既定のズーム（zoom.ts）。
// - Introduction↔ex（`/`↔`/?ex`）は同一ルート内の query 変化なので何もしない。
//   キャプションのテキスト morph は IndexView 側の Action（use:introText）が担当する。
//   （mount＝即確定 / update＝morph の分離が「初回は morph しない」条件そのもの）
import type { OnNavigate } from '@sveltejs/kit'
import { nav } from '$lib/nav.svelte'
import { flapTransition } from '$lib/kotohakobi/transition'
import { warpTransition } from '$lib/globexplore/transition'
import type { ExhibitTransition } from './types'
import { zoomTransition, setOrigin } from './zoom'

// Focus に入れる元＝Gallery ルート（ex モードでも route id は '/'）。
const GALLERY_ROUTES = new Set(['/'])
const FOCUS_ROUTE = '/focus/[slug]'

/** 展示ごとの演出。作ったらここに 1 行足す。無い展示は既定のズームになる。 */
const EXHIBIT_TRANSITIONS: Record<string, ExhibitTransition> = {
  kotohakobi: flapTransition,
  globexplore: warpTransition,
}

/** Exhibit クリック時：戻り先ルートを控え、ズーム原点（Icon 中心）を記録する。
 *  icon / title どちらのリンクから来ても、原点は Exhibit の Icon に合わせる。 */
export function markExhibitOrigin(event: MouseEvent, ex: boolean) {
  // 戻り先は元のモードを保つ（query と hash は共存できる：`/?ex#slug`）。
  nav.from = ex ? '/?ex' : '/'
  setOrigin((event.currentTarget as HTMLElement).closest('.exhibit'))
}

// 進行中の遷移があるか。VT を重ねると InvalidStateError で中断され旧フレームが焼き付く／
// 覆う演出も重ねたくないので、全経路でこのフラグを見て多重発火を防ぐ。
let transitioning = false

/**
 * 演出を起動し、後始末を保証する。
 * 展示側の実装が何を投げても、ガードは必ず下り、ナビゲーションは必ず解放される。
 */
function start(run: ExhibitTransition, navigation: OnNavigate, dive: boolean): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  transitioning = true
  run({ navigation, dive, allowSwap: resolve })
    .catch(() => {}) // 演出の失敗でナビゲーションを巻き添えにしない
    .finally(() => {
      transitioning = false
      resolve() // 未解決なら解放（解決済みなら無害）
    })
  return promise
}

/** onNavigate 用。Gallery↔Focus のときだけ演出を挟む。 */
export function routeTransition(navigation: OnNavigate): Promise<void> | void {
  const from = navigation.from?.route.id
  const to = navigation.to?.route.id

  const dive = to === FOCUS_ROUTE && !!from && GALLERY_ROUTES.has(from)
  const rise = from === FOCUS_ROUTE && !!to && GALLERY_ROUTES.has(to)
  if (!dive && !rise) return
  if (transitioning) return

  // dive は行き先(to)の slug、rise は戻り元(from)の slug を見る。
  const slug = navigation.to?.params?.slug ?? navigation.from?.params?.slug
  return start((slug && EXHIBIT_TRANSITIONS[slug]) || zoomTransition, navigation, dive)
}
