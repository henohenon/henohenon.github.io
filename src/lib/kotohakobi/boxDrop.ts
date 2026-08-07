// 荷物一覧の「箱降らし」。コトハコビ本体 `allo-app/src/ui/scenes/listBoxDrop.ts` の移植。
// Web ポートフォリオ向けに以下を外した:
//   - Capacitor / Android 加速度センサー（重力は下向き固定）
// 音（sequence.ts）の拍同期は本体同様に残してある（seq.onBeat で 1 拍 1 箱）。
// 残したもの: matter-js 物理で上中央から箱が落ち画面端の見えない壁・箱同士で積もる／
//   箱ホバーで荷札タグ（中身テキスト）がポップ。見た目は白塗り＋黒枠の角丸正方形。

import { Container, Graphics, Rectangle, Text } from 'pixi.js'
import { Bodies, Body, Composite, Engine, type Body as MatterBody } from 'matter-js'
import { COLOR, DESIGN_H, DESIGN_W, STROKE } from './theme'
import { label, wireRect } from './wireframe'
import { getSequence } from './sequence'

/** 重力の強さ（matter-js の gravity.y 既定スケール向け）。 */
const GRAVITY_MAG = 5.0
/** 物理の固定タイムステップ（ms）。 */
const FIXED_DT = 1000 / 60

interface BoxEntity {
  body: MatterBody
  sprite: Container
  size: number
  /** ホバー時にタグへ出すテキスト。 */
  text: string
  /** 荷札を monospace で出すか（AA スクショ用）。 */
  mono: boolean
}

// 箱の一辺は文字数に応じて拡大縮小する。
const BOX_SIZE_MIN = 90
const BOX_SIZE_MAX = 230
const CHARS_AT_MIN = 1
const CHARS_AT_MAX = 14
// AA（画面スクショ）箱は文字数（＝情報量）に応じて可変。サイズ差で味を出す。
const SHOT_SIZE_MIN = 260
const SHOT_SIZE_MAX = 500
const SHOT_CHARS_MIN = 320
const SHOT_CHARS_MAX = 500
// AA 箱 左下の画面名フォントサイズ（箱サイズに依らず全箱統一）。
const SHOT_NAME_FONT = 34
// 同時に存在できる箱の上限。超えたら古いものから消す。
const MAX_BOXES = 28

// 壁の内面を画面端から内側 1px に置く（＝ほぼ端ぴったり・見えない）。
const EDGE = 1
const WALL_THICK = 400

// タグのポップイン/アウト時間（ms）。
const TAG_POP_MS = 150
const TAG_EDGE_MARGIN = 20

export interface BoxDropHandle {
  view: Container
  overlay: Container
  dispose: () => void
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const easeOutBack = (p: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
}

/** テキストの文字数から箱の一辺を求める（多いほど大きい／質量も面積比で連動）。 */
function sizeForText(text: string): number {
  const len = Array.from(text).length
  const t = clamp((len - CHARS_AT_MIN) / (CHARS_AT_MAX - CHARS_AT_MIN), 0, 1)
  return BOX_SIZE_MIN + (BOX_SIZE_MAX - BOX_SIZE_MIN) * t
}

/** AA スクショ箱の一辺。AA の文字数（情報量）で SHOT_SIZE_MIN〜MAX に可変させ、画面ごとに差を出す。 */
function sizeForShot(text: string): number {
  const len = Array.from(text).length
  const t = clamp((len - SHOT_CHARS_MIN) / (SHOT_CHARS_MAX - SHOT_CHARS_MIN), 0, 1)
  return SHOT_SIZE_MIN + (SHOT_SIZE_MAX - SHOT_SIZE_MIN) * t
}

/** 荷物に付く荷札タグ。原点 (0,0) が箱との接点（＝紐の付け根）。 */
export function buildTag(text: string, flip: boolean, mono = false): Container {
  const c = new Container()
  // mono=AA スクショ（罫線＋日本語）は M PLUS 1 Code（等幅）で。通常は M PLUS 1p（label）。
  const t = mono
    ? new Text({
        text,
        style: {
          // 罫線と CJK は Code（罫線=半角/全角=2 で桁が揃う＝AA らしさ）。
          // Code は全角形ブロック（U+FF00-FFEF）をほぼ持たないので ＿ ￣ ／ ＼ ｸ ✝ ⟋ ⟍ が欠け、
          // そこだけ環境の等幅フォントに落ちる＝この数字だけ字幅・字形が環境依存になる。
          // 同梱の 1p を受け皿にすれば環境非依存にできるが、1p だと ＿＿＿ / ￣￣￣ が繋がらない。
          // 全体を monospace にすると罫線の桁が崩れる。繋がりを取ってこの形にしている。
          fontFamily: ['M PLUS 1 Code', 'monospace'],
          fontSize: TAG_MONO_FONT,
          lineHeight: TAG_MONO_FONT * 1.18,
          fill: COLOR.ink,
          align: 'left',
          whiteSpace: 'pre',
        },
      })
    : label(text, 0, 0, { size: 30, anchorX: 0.5, anchorY: 0.5, weight: '500' })
  if (mono) t.anchor.set(0.5, 0.5)

  const padX = mono ? 22 : 30
  const padY = mono ? 18 : 20
  const w = t.width + padX * 2
  const ARC_R = 42
  const HOLE_R = 8
  const HOLE_INSET = 18

  const holeX = ARC_R
  const holeY = -ARC_R
  const cardLeft = ARC_R - HOLE_INSET
  const cardBottom = -ARC_R + HOLE_INSET
  const bodyH = t.height + padY * 2
  const cardTop = cardBottom - bodyH

  const shapes = new Container()

  const string = new Graphics()
    .arc(ARC_R, 0, ARC_R, Math.PI, Math.PI * 1.5)
    .stroke({ width: STROKE.base, color: COLOR.ink })

  const body = new Graphics()
    .roundRect(cardLeft, cardTop, w, bodyH, 16)
    .fill(COLOR.paper)
    .stroke({ width: STROKE.base, color: COLOR.ink })

  const hole = new Graphics()
    .circle(holeX, holeY, HOLE_R)
    .fill(COLOR.paper)
    .stroke({ width: STROKE.thin, color: COLOR.ink })

  shapes.addChild(string, body, hole)
  if (flip) shapes.scale.x = -1
  c.addChild(shapes)

  const cx = cardLeft + w / 2
  t.position.set(flip ? -cx : cx, cardTop + bodyH / 2)
  c.addChild(t)

  return c
}

/** AA（画面スクショ）を出す荷札の等幅フォントサイズ。普通の荷札(30)と等倍。 */
const TAG_MONO_FONT = 30

/**
 * 画面端を見えない壁にして、一定間隔で荷物箱を落とす物理デモを構築する。
 * @param texts 箱に割り当てるテキスト（短文＝1 箱、ホバーで荷札）。
 * @param shots デカ箱に貼る複数行 AA（1 つ＝1 デカ箱、テキストは箱に直接描画）。
 */
export function buildListBoxDrop(
  texts: string[],
  shots: { name: string; aa: string }[] = [],
): BoxDropHandle {
  // 落とす順：AA 箱（画面名＋ホバー AA）を先に、続いて短文箱。
  const items = [
    ...shots.map((s) => ({ shot: true, text: s.aa, name: s.name })),
    ...texts.map((t) => ({ shot: false, text: t, name: '' })),
  ]
  const view = new Container()
  const overlay = new Container()

  const engine = Engine.create({ enableSleeping: false })
  engine.gravity.x = 0
  engine.gravity.y = GRAVITY_MAG

  // 壁・床・天井（静的）。内面を画面端に置き本体は画面外へ。箱を閉じ込めるだけ（描画しない）。
  const wallOpts = { isStatic: true, friction: 0.06, frictionStatic: 0.12 }
  const leftWall = Bodies.rectangle(EDGE - WALL_THICK / 2, DESIGN_H / 2, WALL_THICK, DESIGN_H * 2, wallOpts)
  const rightWall = Bodies.rectangle(DESIGN_W - EDGE + WALL_THICK / 2, DESIGN_H / 2, WALL_THICK, DESIGN_H * 2, wallOpts)
  const floor = Bodies.rectangle(DESIGN_W / 2, DESIGN_H - EDGE + WALL_THICK / 2, DESIGN_W * 2, WALL_THICK, wallOpts)
  const ceiling = Bodies.rectangle(DESIGN_W / 2, EDGE - WALL_THICK / 2, DESIGN_W * 2, WALL_THICK, wallOpts)
  Composite.add(engine.world, [leftWall, rightWall, floor, ceiling])

  const boxes: BoxEntity[] = []

  let hovered: BoxEntity | null = null
  interface TagState {
    view: Container
    entity: BoxEntity
    dir: 1 | -1
    t: number
  }
  let tag: TagState | null = null

  const destroyTag = () => {
    if (tag) {
      tag.view.destroy({ children: true })
      tag = null
    }
  }

  const showTag = (entity: BoxEntity) => {
    if (tag && tag.entity === entity) {
      tag.dir = 1
      return
    }
    destroyTag()
    let tagView = buildTag(entity.text, false, entity.mono)
    const flip = entity.body.position.x + tagView.width > DESIGN_W - TAG_EDGE_MARGIN
    if (flip) {
      tagView.destroy({ children: true })
      tagView = buildTag(entity.text, true, entity.mono)
    }
    tagView.scale.set(0)
    tagView.position.set(entity.body.position.x, entity.body.position.y - entity.size / 2)
    overlay.addChild(tagView)
    tag = { view: tagView, entity, dir: 1, t: 0 }
  }

  const hideTag = (entity: BoxEntity) => {
    if (tag && tag.entity === entity) tag.dir = -1
  }

  let spawnCount = 0
  const spawnBox = () => {
    if (spawnCount >= items.length) return
    const item = items[spawnCount++]
    // 見た目は普通の箱。AA スクショ箱は情報量で可変（大きめ）。中身はホバーの荷札に出す（mono）。
    const size = item.shot ? sizeForShot(item.text) : sizeForText(item.text)
    const x = DESIGN_W / 2 + rand(-120, 120)
    const y = EDGE + size / 2 + 8

    const body = Bodies.rectangle(x, y, size, size, {
      restitution: 0.15,
      friction: 0.16,
      frictionStatic: 0.28,
      frictionAir: 0.001,
      angle: rand(-0.3, 0.3),
    })
    Body.setVelocity(body, { x: rand(-2, 2), y: 0 })
    Body.setAngularVelocity(body, rand(-0.08, 0.08))
    Composite.add(engine.world, body)

    const sprite = new Container()
    sprite.addChild(wireRect(-size / 2, -size / 2, size, size, { radius: 12, fillPaper: true }))
    // deco（全箱共通）：上中央の装飾長方形（テープ/取っ手のニュアンス）。
    const decoW = size / 8
    const decoH = ((size / 3) * 3) / 4
    sprite.addChild(wireRect(-decoW / 2, -size / 2, decoW, decoH))
    if (item.shot) {
      // AA 箱：左下に画面名（本家 M PLUS 1p・全箱同フォントサイズ）。中身は AA でホバー荷札に。
      const pad = size * 0.07
      sprite.addChild(
        label(item.name, -size / 2 + pad, size / 2 - pad, {
          size: SHOT_NAME_FONT,
          anchorX: 0,
          anchorY: 1,
          weight: '500',
        }),
      )
    }
    sprite.eventMode = 'static'
    sprite.hitArea = new Rectangle(-size / 2, -size / 2, size, size)
    sprite.position.set(body.position.x, body.position.y)
    sprite.rotation = body.angle
    view.addChild(sprite)

    const entity: BoxEntity = { body, sprite, size, text: item.text, mono: item.shot }
    sprite.on('pointerover', () => {
      hovered = entity
      showTag(entity)
    })
    sprite.on('pointerout', () => {
      if (hovered === entity) hovered = null
      hideTag(entity)
    })

    boxes.push(entity)

    if (boxes.length > MAX_BOXES) {
      const oldest = boxes.shift()
      if (oldest) {
        if (tag && tag.entity === oldest) destroyTag()
        if (hovered === oldest) hovered = null
        Composite.remove(engine.world, oldest.body)
        oldest.sprite.destroy({ children: true })
      }
    }
  }

  // 音の拍に同期して 1 拍 1 箱（本体同様）。Transport 起動前は発火しないので、
  // Focus 入場（クリック）で resume 済みなら即・落ち始める。
  const seq = getSequence()
  const unsubBeat = seq.onBeat(() => spawnBox())

  // 物理を固定ステップで進め、各箱のスプライトをボディに同期する。
  let raf = 0
  let last = performance.now()
  let acc = 0
  const frame = () => {
    const now = performance.now()
    const dt = now - last
    last = now
    acc = Math.min(acc + dt, FIXED_DT * 5)
    while (acc >= FIXED_DT) {
      Engine.update(engine, FIXED_DT)
      acc -= FIXED_DT
    }

    for (const { body, sprite } of boxes) {
      sprite.position.set(body.position.x, body.position.y)
      sprite.rotation = body.angle
    }

    if (tag) {
      tag.t = clamp(tag.t + (tag.dir * Math.min(dt, 50)) / TAG_POP_MS, 0, 1)
      if (tag.dir === -1 && tag.t <= 0) {
        destroyTag()
      } else {
        const s = tag.dir === 1 ? easeOutBack(tag.t) : tag.t * tag.t
        tag.view.scale.set(Math.max(0, s))
        const b = tag.entity
        tag.view.position.set(b.body.position.x, b.body.position.y - b.size / 2)
      }
    }
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return {
    view,
    overlay,
    dispose: () => {
      unsubBeat()
      if (raf) cancelAnimationFrame(raf)
      destroyTag()
      Composite.clear(engine.world, false)
      Engine.clear(engine)
    },
  }
}
