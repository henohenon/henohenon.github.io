// Emanation の 3D シーン本体。光る球を中心に、skills/展示/へのへのアイコンズが
// 浮遊オブジェクトとして漂う（ai-log/spec-and-plan-henohenon.md §2）。
// ドラッグでカメラが球を中心に周回する（OrbitControls 相当。zoom/pan は無効化）。
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createFloatingObjects, disposeFloatingObject, type FloatingObject } from './floatingObjects'

export type EmanationScene = {
  pause(): void
  resume(): void
  dispose(): void
}

export function createEmanationScene(canvas: HTMLCanvasElement): EmanationScene {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 8)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // 光る球。自己発光（emissive）なので外部ライト無しでも存在感が出る。
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x5932ff, emissive: 0x5932ff, emissiveIntensity: 1.6 }),
  )
  scene.add(sphere)

  // 浮遊オブジェクトが「光に当てられている」ようにするための光源。球自身の色に揃える。
  // tmp 品質なので物理的な正確さより「見えること」を優先し、intensity は強めに振っている。
  const light = new THREE.PointLight(0x5932ff, 15, 30)
  scene.add(light)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))

  const loader = new THREE.TextureLoader()
  const floaters: FloatingObject[] = createFloatingObjects(loader)
  for (const f of floaters) scene.add(f.mesh)

  // 見て回る＝カメラが周回。ズーム／パンは無効化し、回転だけ許可する。
  const controls = new OrbitControls(camera, canvas)
  controls.enableZoom = false
  controls.enablePan = false
  controls.enableDamping = true
  controls.dampingFactor = 0.08

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas
    if (w === 0 || h === 0) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  // 非表示中（about を離れている間）も requestAnimationFrame 自体は止まらないため、
  // display:none ではなく opacity で隠す設計と対にして、ここで明示的に render ループを
  // 止める（無駄な GPU/CPU 消費と、three.js が display:none で resize 時に描画を
  // 崩すことがある問題の両方を避ける。詳細は ai-log/spec-and-plan-henohenon.md）。
  // 破棄はせず pause/resume の使い回しにして、about の再入場でシーンを作り直さない。
  const clock = new THREE.Clock()
  let raf = 0
  let running = false
  const tick = () => {
    const delta = clock.getDelta()
    // 自由な向きでゆっくり自転しながら漂う（Billboard 固定はしない、と決めた通り）。
    for (const f of floaters) f.mesh.rotateOnAxis(f.spinAxis, f.spinSpeed * delta)
    controls.update()
    renderer.render(scene, camera)
    if (running) raf = requestAnimationFrame(tick)
  }

  function resume() {
    if (running) return
    running = true
    clock.getDelta() // pause 中に溜まった経過時間を捨てる（再開直後の巨大delta回転を防ぐ）
    raf = requestAnimationFrame(tick)
  }

  function pause() {
    running = false
    cancelAnimationFrame(raf)
  }

  resume()

  return {
    pause,
    resume,
    dispose() {
      pause()
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      sphere.geometry.dispose()
      ;(sphere.material as THREE.Material).dispose()
      for (const f of floaters) disposeFloatingObject(f)
    },
  }
}
