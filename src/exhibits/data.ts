// 展示品データ。docs/ の各作品メモ（GlobeXplore / MwP / kotohakobi）が出典。
// Icon・Main は当面「仮 or 空」のため、ここでは持たない（Phase 4/7 で追加）。

export type Exhibit = {
  /** URL に使う識別子（#/focus/:id） */
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
  /** リンク先（未確定なら省略） */
  link?: string
  /** More（未確定なら省略） */
  more?: string
}

export const exhibits: Exhibit[] = [
  {
    id: 'globexplore',
    no: '01',
    title: 'GlobeXplore',
    detail: 'PLATEAU を活用したドローンシミュレーターです。',
    role: 'GlobeXplore の初期〜GlobeXplore\'Pro リリースまで、Unity を用いた開発全般とその Steam での公開・運用を主導しました。',
    tech: ['Unity', 'Cesium for Unity', 'Figma'],
  },
  {
    id: 'make-with-puppet',
    no: '02',
    title: 'Make with Puppet',
    detail: 'XR Puppet ゲームです。BitSummit GameJam で制作・受賞しました。',
    role: '4 人チームで、プログラミングをメインに一部モデリングや企画まで幅広く取り組みました。9 割のコードが人の手で書かれています。',
    tech: ['Unity', 'UniTask', 'VContainer', 'R3', 'Blender'],
  },
  {
    id: 'kotohakobi',
    no: '03',
    title: 'コトハコビ',
    detail: 'コトバでつながる、ハコべる。ガラパゴス的通信アプリです。ハックツハッカソン アロカップで制作・最優秀賞を受賞しました。',
    role: '裏側のロジックの整備と、荷物一覧画面の作成を行いました。',
    tech: ['Electron', 'React', 'Pixi.js', 'IndexedDB', 'Node.js', 'BLE通信'],
    link: 'https://topaz.dev/projects/c2bfcbeb9b1c5fd0e0ec',
  },
]

export function findExhibit(id: string): Exhibit | undefined {
  return exhibits.find((e) => e.id === id)
}
