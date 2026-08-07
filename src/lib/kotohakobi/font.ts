// コトハコビ Focus 用の M PLUS 1p サブセット（scripts/subset-mplus.mjs が生成）を読み込む。
// Pixi の Text は生成時にフォントを焼き込むので、Text を作る前に必ず await でロード完了させる。
// woff2 は ?url で読み込む（Vite がハッシュ付き URL を発行＝base 依存なし・キャッシュバスト）。
import mediumUrl from './fonts/mplus1p-medium.subset.woff2?url'
import boldUrl from './fonts/mplus1p-bold.subset.woff2?url'
// AA スクショ用の等幅フォント（罫線=半角 / 全角=2 で桁が揃う）。scripts/subset-aa.mjs 生成。
import aaCodeUrl from './fonts/mplus1code-aa.subset.woff2?url'

let loaded: Promise<void> | null = null

/** M PLUS 1p（500=荷札 / 700=ボタン）＋ M PLUS 1 Code（AA）を登録。二重呼び出し安全。 */
export function loadFont(): Promise<void> {
  loaded ??= (async () => {
    const faces = [
      new FontFace('M PLUS 1p', `url(${mediumUrl})`, { weight: '500' }),
      new FontFace('M PLUS 1p', `url(${boldUrl})`, { weight: '700' }),
      new FontFace('M PLUS 1 Code', `url(${aaCodeUrl})`, { weight: '400' }),
    ]
    await Promise.all(faces.map((f) => f.load()))
    for (const f of faces) document.fonts.add(f)
  })()
  return loaded
}
