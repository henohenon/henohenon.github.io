// Icon で使うへのへのん画像。DEFAULT はランダムプールに混ぜない
// （プリレンダ時の固定表示にも使う。詳細は ai-log/spec-and-plan-henohenon.md §1）。
export const DEFAULT_ICON = '/henohenon/henohenon.png'

export const RANDOM_ICONS = [
  '/henohenon/heno-dolphin.png',
  '/henohenon/hega-scone.png',
  '/henohenon/heshi-gomu.png',
  '/henohenon/he-sushi.png',
  '/henohenon/hekkaidou.png',
  '/henohenon/hetsuji.png',
  '/henohenon/heni.png',
  '/henohenon/heno-baby.png',
  '/henohenon/heno-kama.png',
  '/henohenon/heno-gata.png',
  '/henohenon/heno-tsumuri.png',
  '/henohenon/heno-tengu.png',
  '/henohenon/heno-enma.png',
  '/henohenon/heno-cup.png',
  '/henohenon/heno-car.png',
  '/henohenon/heno-ghost.png',
  '/henohenon/heno-santa.png',
  '/henohenon/heno-devil-2.png',
  '/henohenon/heno-devil.png',
  '/henohenon/heno-dragoon.png',
  '/henohenon/heno-violin.png',
  '/henohenon/heno-sphinx.png',
  '/henohenon/gorumoheji.png',
  '/henohenon/sunshine-henoheno.png',
  '/henohenon/heno-pegasus.png',
  '/henohenon/hekushon-daimaoh.png',
]

export function pickRandomIcon(): string {
  return RANDOM_ICONS[Math.floor(Math.random() * RANDOM_ICONS.length)]
}
