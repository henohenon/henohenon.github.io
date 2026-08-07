// GlobeXplore の Icon＝ドローン（three.js）。絵と動きだけを持ち、枠や遷移のことは知らない。
//
// モデルは Blender 側（D:\5.data\blender\drone）の drone_pro_i05.qnorm.glb を
// static/globexplore/drone.glb として搬入したもの。読み込み後の補正が要らないように
// 向き・原点・寸法がモデル側で作り込んである（以下は向こうの README の実測値）:
//   - 正面が +Z ＝ three.js 既定カメラの正面。回転補正は要らない
//   - 全ノードが identity rotation / scale。最大辺がきっかり 1.0 なので scale＝そのまま寸法
//   - 原点はローター 4 個の重心（bbox 中心ではない）。ジンバルが鼻先に張り出している分
//     bbox 中心は前寄りで、そこを軸にすると回したとき絵が振れる
//   - Drone_Gimbal.rotation.x が真のピッチ軸。安全域は -20°..+10°（負＝レンズ下）で、
//     -30° を越えるとカメラの尻がベイから浮いて筐体が分離して見える
//
// 待機は完全静止（＝常時アニメーションは持たない）。RAF はホバーの出入りが動いている
// 間だけ回し、離れて静止姿勢に戻り切ったところで畳む。
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const MODEL_URL = '/globexplore/drone.glb'

// 画角。モデルの幅はきっかり 1.0 なので、FRAME_HALF が枠に対する大きさをそのまま決める
// （0.64＝画角の幅 1.28 に幅 1.0 の機体。プロペラ端に両側 2 割弱の余白が残る）。
const FOV = 20
const FRAME_HALF = 0.64
const DIST = FRAME_HALF / Math.tan(THREE.MathUtils.degToRad(FOV / 2))

/** ホバーで浮く量（ワールド単位＝機体幅に対する比）。 */
const LIFT = 0.1
/** ホバー中のジンバル角。安全域の内側で、こちらを覗き込む向き（負＝レンズ下）。 */
const GIMBAL_RAD = THREE.MathUtils.degToRad(-14)
/** ホバー中のプロペラ回転（rad/s）。アイコンサイズでは 25 あたりが上限で、
 *  越えるとブレードがフレームレートと干渉してストロボる（モデル README の計測）。 */
const SPIN = 18
/** ホバー状態へ寄る速さ（1/秒）。入りは素早く、離れは少し余韻を残す。 */
const EASE_IN = 7
const EASE_OUT = 4

/** 対角ペアが逆回り。符号はブレードのピッチに合わせてあり、揚力が出る向きに回る。 */
const PROP_DIRS = [
  ['Prop_FL', -1],
  ['Prop_BR', -1],
  ['Prop_FR', 1],
  ['Prop_BL', 1],
] as const

export type DroneIcon = {
  /** ホバー入り。浮いて、ジンバルが傾いて、プロペラが回り出す。 */
  enter(): void
  /** ホバー抜け。静止姿勢へ戻る。戻り切ったところで描画も止まる。 */
  leave(): void
  dispose(): void
}

/** canvas にドローンを立ち上げる。モデルの取得を待つので、解決した時点で 1 枚描けている。 */
export async function createDroneIcon(canvas: HTMLCanvasElement): Promise<DroneIcon> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  // 指定色をそのまま出す。ACESFilmic だとアクセントの #0B84FF / #3FBEFF が目に見えて濁る。
  renderer.toneMapping = THREE.NoToneMapping
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
  camera.position.z = DIST

  // モデルが前提にしている 3 灯（Hemisphere ＋ キー ＋ フィル）に、環境光を足したもの。
  //
  // 環境光が要るのは、モデルのプレビューが Blender の「真っ白なワールド」＝全周からの
  // 環境光の下で作られているのに対し、HemisphereLight は上下軸の光だからで、正面を向いた
  // 面が sky と ground の中間しか受け取らない。正面ビューでは一番見える面がそこなので、
  // 3 灯そのままだと画素の 38% がほぼ黒に沈んで、ページ上で暗く見えていた。
  // 環境光 3.2 で沈む画素は 7% 弱まで下がる（残りはレンズガラス等、本来黒い部分）。
  // 上げても白飛びは出ず、材質ごとの明度差が見える帯域に上がる分むしろ陰影は増える。
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdcdfe8, 1.6))
  scene.add(new THREE.AmbientLight(0xffffff, 3.2))
  const key = new THREE.DirectionalLight(0xffffff, 1.8)
  key.position.set(-2.5, 3.5, 2.5)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xffffff, 0.6)
  fill.position.set(2.5, 1.5, -1.5)
  scene.add(fill)

  const gltf = await new GLTFLoader().loadAsync(MODEL_URL)
  const model = gltf.scene
  scene.add(model)

  const gimbal = model.getObjectByName('Drone_Gimbal')
  const props: Array<[THREE.Object3D, number]> = []
  for (const [name, dir] of PROP_DIRS) {
    const prop = model.getObjectByName(name)
    if (prop) props.push([prop, dir])
  }

  /** ホバー状態への寄り具合 0..1。浮き・傾き・回転はすべてこれ 1 つから出る。 */
  let t = 0
  let hover = false
  let raf = 0
  let last = 0

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  /** t から姿勢を作る。プロペラだけは角度の積分なので frame 側に残る。 */
  function pose() {
    model.position.y = t * LIFT
    if (gimbal) gimbal.rotation.x = t * GIMBAL_RAD
  }

  function draw() {
    pose()
    renderer.render(scene, camera)
  }

  function frame(now: number) {
    // タブから戻ったときの巨大な dt でプロペラが一気に飛ばないよう頭打ちにする。
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now

    const rate = hover ? EASE_IN : EASE_OUT
    t += ((hover ? 1 : 0) - t) * (1 - Math.exp(-rate * dt))
    // 離れ切ったら完全な 0 に落とす。浮きと傾きの端数を静止姿勢に残さない。
    const settled = !hover && t < 0.002
    if (settled) t = 0

    for (const [prop, dir] of props) prop.rotation.y += dir * SPIN * t * dt
    draw()

    raf = settled ? 0 : requestAnimationFrame(frame)
  }

  function start() {
    if (raf) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  // 枠は .icon の 1:1 前提だが、崩れても絵が切れないよう aspect は実寸から取る。
  function resize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w <= 0 || h <= 0) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    // 動いていない間はここでしか描き直されない。
    if (!raf) draw()
  }

  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)

  return {
    enter() {
      hover = true
      // 動きを減らす設定なら、寄らずにその姿勢へ飛ばす（プロペラは回さない）。
      if (reduced.matches) {
        t = 1
        draw()
        return
      }
      start()
    },
    leave() {
      hover = false
      if (reduced.matches) {
        t = 0
        draw()
        return
      }
      start()
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      ro.disconnect()
      // GPU 側は参照が切れても消えない。辿って落としてから renderer を破棄する。
      model.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const m of mats) m.dispose()
      })
      renderer.dispose()
    },
  }
}
