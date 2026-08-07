// 展示品データ。docs/ の各作品メモ（GlobeXplore / MwP / kotohakobi）が出典。
// Icon・Main の中身はここでは持たず、id で分岐して差し込む（IndexView / focus/[id]/+page.svelte
// / transition.ts の 3 箇所）。将来レジストリに集約するならここが置き場になる。

export type Exhibit = {
  /** URL に使う識別子。遷移先は `/focus/:id`（クリーンパス）。戻り先だけ `{nav.from}#{id}`。 */
  id: string
  /** 展示番号 */
  no: string
  /** 作品名 */
  title: string
  /** コンセプト・短文の説明 */
  detail: string
  /** 自分の作業 */
  role: string
  /** 使用技術 */
  tech: string[]
  /** Focus Main のリンクボタン。作品ごとに本数が違う（GlobeXplore は Steam / Pro の 2 本）。
      未確定なら省略。 */
  links?: { label: string; href: string }[]
  /** More（未確定なら省略） */
  more?: string
}

export const exhibits: Exhibit[] = [
  {
    id: 'make-with-puppet',
    no: '01',
    title: 'Make with Puppet',
    detail: 'XR Puppet ゲームです。BitSummit GameJam で制作・受賞しました。',
    role: '4 人チームで、プログラミングをメインに一部モデリングや企画まで幅広く取り組みました。9 割のコードが人の手で書かれています。',
    tech: ['Unity', 'UniTask', 'VContainer', 'R3', 'Blender'],
  },
  {
    id: 'globexplore',
    no: '02',
    title: 'GlobeXplore',
    detail: 'PLATEAU を活用したドローンシミュレーターです。',
    role: 'GlobeXplore の初期〜GlobeXplore\'Pro リリースまで、Unity を用いた開発全般とその Steam での公開・運用を主導しました。',
    tech: ['Unity', 'Cesium for Unity', 'Figma'],
    links: [
      { label: 'GlobeXplore', href: 'https://store.steampowered.com/app/2635620/GlobeXplore' },
      { label: 'GlobeXplore Pro', href: 'https://gxpro.app/' },
    ],
    more: 'https://qiita.com/darknes_henohenon/items/364dec985009524d93c8',
  },
  {
    id: 'kotohakobi',
    no: '03',
    title: 'コトハコビ',
    detail: 'ガラパゴス的通信アプリです。ハックツハッカソンアロカップで制作・最優秀賞を受賞しました。',
    role: '裏側のロジックの整備と、荷物一覧画面の作成を行いました。',
    tech: ['BLE通信', 'Pixi.js', 'Electron', 'IndexedDB', 'Node.js', 'React'],
    links: [{ label: '見に行く', href: 'https://topaz.dev/projects/c2bfcbeb9b1c5fd0e0ec' }],
  },
]

export function findExhibit(id: string): Exhibit | undefined {
  return exhibits.find((e) => e.id === id)
}
