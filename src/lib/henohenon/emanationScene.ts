// Emanation の 3D シーン本体。Phase B は光る球＋ドラッグ回転のみ（浮遊オブジェクトは Phase C）。
// ドラッグでカメラが球を中心に周回する（OrbitControls 相当。zoom/pan は無効化）。
// ai-log/spec-and-plan-henohenon.md §2「見て回る」を狙う。
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export type EmanationScene = {
  dispose(): void
}

export function createEmanationScene(canvas: HTMLCanvasElement): EmanationScene {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 6)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // 光る球。自己発光（emissive）なので外部ライト無しでも存在感が出る。
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffcc55, emissiveIntensity: 1.6 }),
  )
  scene.add(sphere)

  // 浮遊オブジェクト（Phase C）が「光に当てられている」ようにするための光源を今のうちに置く。
  const light = new THREE.PointLight(0xffe8b0, 3, 20)
  scene.add(light)
  scene.add(new THREE.AmbientLight(0xffffff, 0.15))

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

  let raf = 0
  const tick = () => {
    controls.update()
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  tick()

  return {
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      sphere.geometry.dispose()
      ;(sphere.material as THREE.Material).dispose()
    },
  }
}
