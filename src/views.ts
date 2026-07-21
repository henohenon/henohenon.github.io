import { exhibits, findExhibit } from './exhibits/data.ts'

/** innerHTML へ差し込むテキストのエスケープ。 */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const face = `へ　へ
の　の
　ん`

/** index / about で共通のヘッダー・フッター付きレイアウト。 */
export function renderIndex(about: boolean): string {
  const introCaption = about
    ? `<p>へのへのんについて。</p>
       <p>（About の内容はこれから作り込みます）</p>`
    : `<p>初めまして、へのへのんと申します。</p>
       <p>ここではポートフォリオを兼ねて、自分の作品を展示しています。興味を持っていただけたり、ワクワクしていただければ幸いです。</p>`

  const gallery = exhibits
    .map(
      (e) => `
    <a class="exhibit" href="#/focus/${encodeURIComponent(e.id)}">
      <div class="icon"></div>
      <div class="title-caption"><span class="no">${esc(e.no)}</span><p>${esc(e.title)}</p></div>
    </a>`,
    )
    .join('')

  return `
  <header class="site-header">
    <a class="about-link" href="${about ? '#/' : '#/about'}">${about ? 'Home' : 'About'}</a>
  </header>
  <section class="introduction">
    <pre class="face">${esc(face)}</pre>
    <div class="text-caption">${introCaption}</div>
  </section>
  <section class="gallery">${gallery}
  </section>
  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} henohenon</p>
  </footer>`
}

/** Focus。展示 1 点を集中して見る。Main は当面「仮 or 空」。 */
export function renderFocus(id: string): string {
  const e = findExhibit(id)
  if (!e) {
    return `
  <section class="focus focus--missing">
    <p>作品が見つかりませんでした。</p>
    <a class="close" href="#/">Gallery へ戻る</a>
  </section>`
  }

  const more = e.more ? `<p class="more">${esc(e.more)}</p>` : ''
  const link = e.link
    ? `<a class="focus-link" href="${esc(e.link)}" target="_blank" rel="noopener">${esc(e.title)} を開く</a>`
    : ''

  return `
  <section class="focus">
    <aside class="details-caption">
      <a class="close" href="#/" aria-label="閉じる">×</a>
      <p class="detail">${esc(e.detail)}</p>
      <p class="role">${esc(e.role)}</p>
      <ul class="tech">${e.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      ${more}
    </aside>
    <main class="focus-main">${link}</main>
    <div class="title-caption"><span class="no">${esc(e.no)}</span><p>${esc(e.title)}</p></div>
  </section>`
}
