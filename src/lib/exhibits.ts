// 展示品データ。docs/ の各作品メモ（GlobeXplore / MwP / kotohakobi）が出典。
// ここに置くのは「全展示で形が同じ事実」だけ。Icon・Main・遷移演出は展示ごとに
// 姿が違うのでコード側に直書きし、slug で分岐して差し込む。
// ※ Node のサブセットスクリプト（scripts/subset-*.ts）がこのファイルを直接 import する。
//    .svelte を import すると Node 側が壊れるので、ここは純データのまま保つこと。

export type Exhibit = {
  /** URL に使う識別子。遷移先は `/focus/:slug`（クリーンパス）。戻り先だけ `{nav.from}#{slug}`。 */
  slug: string
  /** 作品名 */
  title: string
  /** これが何かを噛み砕いた一文（詳細キャプションの主） */
  summary: string
  /** 補足（自分の関与・受賞・背景など。詳細キャプションの従） */
  detail: string
  /** 使用技術 */
  tags: string[]
  /** 解説記事などへの導線（未確定なら省略） */
  more?: string
}

// 並び順がそのまま Gallery の並びであり、展示番号でもある（exhibitNo が導出する）。
export const exhibits: Exhibit[] = [
  /*
  {
    slug: 'make-with-puppet',
    title: 'Make with Puppet',
    summary: 'XR Puppet ゲームです。',
    detail:
      'BitSummit GameJam で制作・受賞しました。4 人チームで、プログラミングをメインに一部モデリングや企画まで幅広く取り組みました。9 割のコードが人の手で書かれています。',
    tags: ['Unity', 'UniTask', 'VContainer', 'R3', 'Blender'],
  },*/
  {
    slug: 'globexplore',
    title: 'GlobeXplore',
    summary: 'PLATEAU を活用したドローンシミュレーターです。',
    detail:
      'GlobeXplore の初期〜GlobeXplore\'Pro リリースまで、Unity を用いた開発全般とその Steam での公開・運用を主導しました。',
    tags: ['Unity', 'Cesium for Unity', 'Figma'],
    more: 'https://qiita.com/darknes_henohenon/items/364dec985009524d93c8',
  },
  {
    slug: 'kotohakobi',
    title: 'コトハコビ',
    summary: 'ガラパゴス的通信アプリです。',
    detail: 'ハックツハッカソンアロカップで制作・最優秀賞を受賞しました。裏側のロジックの整備と、荷物一覧画面の作成を行いました。',
    tags: ['BLE通信', 'Pixi.js', 'Electron', 'IndexedDB', 'Node.js', 'React'],
  },
]

/** 展示ごとの Main コンポーネントが受け取る props。中身は展示によって使う項目が違うので、
    個別に開かず exhibit を丸ごと渡す（型は消えるので Node からの import は壊れない）。 */
export type MainProps = { exhibit: Exhibit }

export function findExhibit(slug: string): Exhibit | undefined {
  return exhibits.find((e) => e.slug === slug)
}

/** 展示番号。配列順から導出するので、並べ替えれば自動で振り直る。 */
export function exhibitNo(slug: string): string {
  const i = exhibits.findIndex((e) => e.slug === slug)
  return i < 0 ? '' : String(i + 1).padStart(2, '0')
}
