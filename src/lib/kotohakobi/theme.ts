// コトハコビ本体 `allo-app/src/ui/theme.ts` のうち、Focus Main（荷物一覧）移植に要る分だけ。
// モノクロ2色ワイヤーフレーム／3DS 相当 5:3 の論理解像度。

/** デザイン基準解像度（横 1920px / 5:3 = 3DS 同等の比率）。UI は全てこの論理座標で組む。 */
export const DESIGN_W = 1920
export const DESIGN_H = 1152

/** 配色（PixiJS の数値カラー）。レターボックス・線・文字＝ink / 地＝paper。 */
export const COLOR = {
  ink: 0x000000,
  paper: 0xffffff,
} as const

/** ワイヤーフレームの線幅（論理座標 1920px 基準）。 */
export const STROKE = {
  thin: 2,
  base: 4,
} as const

/** M PLUS 1p を最優先（未同梱なら system フォントへフォールバック）。 */
export const FONT_FAMILY = '"M PLUS 1p", system-ui, sans-serif'
