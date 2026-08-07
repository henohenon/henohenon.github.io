// コトハコビの「5:3 画面」レターボックス計算を 1 か所に集約する。
// Pixi キャンバスの fit（KotohakobiMain）と、トランジションの上下の蓋（transition.ts）が
// 同じ 5:3 矩形を参照するようにして、画面と蓋の位置・幅を必ず一致させる。
import { DESIGN_W, DESIGN_H } from './theme'

export interface ScreenRect {
  left: number
  top: number
  width: number
  height: number
  /** DESIGN 論理座標 → 画面ピクセルの倍率。 */
  scale: number
}

/** 幅 vw×高さ vh に 5:3（DESIGN_W×DESIGN_H）を Math.min contain で収めた矩形（中央寄せ）。 */
export function letterbox(vw: number, vh: number): ScreenRect {
  const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H)
  const width = DESIGN_W * scale
  const height = DESIGN_H * scale
  return { left: (vw - width) / 2, top: (vh - height) / 2, width, height, scale }
}
