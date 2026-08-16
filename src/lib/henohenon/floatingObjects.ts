// Emanation の浮遊オブジェクト（Phase C）。v1 は種類を問わず canvas/画像テクスチャを
// 貼った平面に統一する（ai-log/spec-and-plan-henohenon.md §2）。クリック操作は無し、
// 自由な向きでゆっくり自転しながら漂うだけ。
import * as THREE from 'three'
import { RANDOM_ICONS } from './icons'

// TBD-skills: 実データ未確定。骨格確認用の仮ラベル（差し替え待ち）。
const TMP_SKILL_LABELS = ['skill', 'skill', 'skill', 'skill']

// TBD-overflow: 確定しているのは exhibits.ts でコメントアウト中の make-with-puppet のみ。
const OVERFLOW_TITLES = ['Make with Puppet']

const ICON_COUNT = 8
const RADIUS = 3.2

export type FloatingObject = {
  mesh: THREE.Mesh
  spinAxis: THREE.Vector3
  spinSpeed: number
}

function textTexture(text: string): { texture: THREE.CanvasTexture; aspect: number } {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const font = 'bold 64px system-ui, sans-serif'
  ctx.font = font
  const width = Math.ceil(ctx.measureText(text).width) + 64
  const height = 128
  canvas.width = width
  canvas.height = height
  // canvas をリサイズすると font 指定がリセットされるので引き直す。
  ctx.font = font
  ctx.fillStyle = '#fff7dd'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#ffcc55'
  ctx.shadowBlur = 24
  ctx.fillText(text, width / 2, height / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return { texture, aspect: width / height }
}

function planeMesh(texture: THREE.Texture, aspect: number, height: number): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(height * aspect, height)
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0,
  })
  return new THREE.Mesh(geometry, material)
}

// フィボナッチ球面配置。個数が違っても均等に散らばり、重なりにくい。
function spherePoint(index: number, total: number, radius: number): THREE.Vector3 {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const y = 1 - (index / Math.max(1, total - 1)) * 2
  const r = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = golden * index
  return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
}

function randomSpinAxis(): THREE.Vector3 {
  return new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
}

export function createFloatingObjects(loader: THREE.TextureLoader): FloatingObject[] {
  const iconUrls = [...RANDOM_ICONS].sort(() => Math.random() - 0.5).slice(0, ICON_COUNT)
  const total = TMP_SKILL_LABELS.length + OVERFLOW_TITLES.length + iconUrls.length
  const objects: FloatingObject[] = []

  for (const label of [...TMP_SKILL_LABELS, ...OVERFLOW_TITLES]) {
    const { texture, aspect } = textTexture(label)
    const mesh = planeMesh(texture, aspect, 0.6)
    mesh.position.copy(spherePoint(objects.length, total, RADIUS))
    objects.push({ mesh, spinAxis: randomSpinAxis(), spinSpeed: 0.1 + Math.random() * 0.15 })
  }

  for (const url of iconUrls) {
    const texture = loader.load(url)
    texture.colorSpace = THREE.SRGBColorSpace
    const mesh = planeMesh(texture, 1, 0.8)
    mesh.position.copy(spherePoint(objects.length, total, RADIUS))
    objects.push({ mesh, spinAxis: randomSpinAxis(), spinSpeed: 0.1 + Math.random() * 0.15 })
  }

  return objects
}

export function disposeFloatingObject(object: FloatingObject) {
  object.mesh.geometry.dispose()
  const material = object.mesh.material as THREE.MeshStandardMaterial
  material.map?.dispose()
  material.dispose()
}
