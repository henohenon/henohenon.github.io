// 本家トップの遷移ボタン（`allo-app/src/ui/TitleScreen.ts` の buildButton）の移植。
// 段ボール箱＝左・下・右の 3 辺＋上辺は左右 2 枚の蓋。ホバーで蓋が上へ外へ開く（離すと閉じる）。
// Focus（荷物一覧）の中央に置く「見に行く」リンクボタンとして使う。

import { Container, Graphics, Rectangle } from 'pixi.js'
import { COLOR, STROKE } from './theme'
import { label } from './wireframe'

// 蓋を開ききったときの回転角（水平=0 / 90°で真上 / それ以上で外側へ開く）。本家と同値。
const LID_OPEN_ANGLE = (120 * Math.PI) / 180
// 蓋の開閉スピード（1 秒あたりの開度＝約 0.2 秒で開閉）。
const LID_SPEED = 5

export interface LinkButtonHandle {
  view: Container
  /** ホバーアニメの RAF を確実に停止する。 */
  dispose: () => void
}

/** ラベル付きワイヤーフレームボタン（＝段ボール箱）。押下で onTap。 */
export function buildLinkButton(
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  onTap: () => void,
): LinkButtonHandle {
  const c = new Container()

  // 背景を白で塗って透けないように（後ろの箱を隠す）。
  c.addChild(new Graphics().rect(x, y, w, h).fill(COLOR.paper))

  // 箱本体（左・下・右の 3 辺）。上辺は蓋として別に描く。
  const body = new Graphics()
  body
    .moveTo(x, y)
    .lineTo(x, y + h)
    .lineTo(x + w, y + h)
    .lineTo(x + w, y)
    .stroke({ width: STROKE.base, color: COLOR.ink })
  c.addChild(body)

  // 上蓋（左右 2 枚）。閉時は中央で合わさり水平な上辺になる。
  const half = w / 2
  const lid = new Graphics()
  const drawLid = (open: number) => {
    if (lid.destroyed) return
    const phi = open * LID_OPEN_ANGLE
    const dx = half * Math.cos(phi)
    const dy = half * Math.sin(phi)
    lid
      .clear()
      .moveTo(x, y) // 左コーナーが蝶番
      .lineTo(x + dx, y - dy)
      .moveTo(x + w, y) // 右コーナーが蝶番
      .lineTo(x + w - dx, y - dy)
      .stroke({ width: STROKE.base, color: COLOR.ink })
  }
  drawLid(0)
  c.addChild(lid)

  c.addChild(
    label(text, x + w / 2, y + h / 2, { size: 56, anchorX: 0.5, anchorY: 0.5, weight: '700' }),
  )

  // 線のみの矩形は内部が当たり判定に入らないため hitArea を明示する。
  c.eventMode = 'static'
  c.cursor = 'pointer'
  c.hitArea = new Rectangle(x, y, w, h)

  // ホバーで上蓋を開閉アニメーション。
  let open = 0
  let target = 0
  let raf = 0
  let last = 0
  const animate = (now: number) => {
    const dt = last ? (now - last) / 1000 : 0
    last = now
    if (open < target) open = Math.min(target, open + LID_SPEED * dt)
    else open = Math.max(target, open - LID_SPEED * dt)
    drawLid(open)
    if (open !== target) {
      raf = requestAnimationFrame(animate)
    } else {
      raf = 0
      last = 0
    }
  }
  const startAnim = () => {
    if (!raf) {
      last = 0
      raf = requestAnimationFrame(animate)
    }
  }
  c.on('pointerover', () => {
    target = 1
    startAnim()
  })
  c.on('pointerout', () => {
    target = 0
    startAnim()
  })
  c.on('pointertap', () => onTap())

  return {
    view: c,
    dispose: () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    },
  }
}
