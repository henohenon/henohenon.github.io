// ハッシュルーター。GitHub Pages でサーバ設定なしに動くようハッシュ方式を採用。
//   #/            … index（Gallery）
//   #/about       … About（Introduction の内容が変化）
//   #/focus/:id   … Focus（展示 1 点を集中して見る）

export type Route =
  | { name: 'index' }
  | { name: 'about' }
  | { name: 'focus'; id: string }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  if (path === '/about') return { name: 'about' }
  const focus = path.match(/^\/focus\/(.+)$/)
  if (focus) return { name: 'focus', id: decodeURIComponent(focus[1]) }
  return { name: 'index' }
}

/** ルーティングを開始し、現在のルートで初回描画する。 */
export function startRouter(onRoute: (route: Route) => void): void {
  const handle = () => onRoute(parseHash(window.location.hash))
  window.addEventListener('hashchange', handle)
  handle()
}
