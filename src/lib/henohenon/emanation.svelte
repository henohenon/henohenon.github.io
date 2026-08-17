<script lang="ts">
  // Icon クリックで index 上にその場展開する Emanation。呼び出し側（IndexView）は
  // Icon と Emanation を常に両方マウントしたまま opacity で出し分ける
  // （display:none は避ける。three.js/Babylon.js 双方で、非表示中の resize が
  // WebGL context を壊しうると報告されているため。ai-log 参照）。
  // そのためここでも「ex のたびに作り直す」のではなく、初回だけ動的 import ＋
  // シーン生成し、以降は pause/resume を使い回す。three.js 一式は初期バンドルに
  // 載せない（先読みは呼び出し側がアイドル時間に行うので、ここに来る頃には大抵
  // 読み込み済み）。
  import { onDestroy } from 'svelte'
  import type { EmanationScene } from './emanationScene'

  let { ex }: { ex: boolean } = $props()

  let canvas: HTMLCanvasElement
  let ready = $state(false)
  let scene: EmanationScene | undefined
  let loading: Promise<void> | null = null
  let destroyed = false

  function ensureScene() {
    loading ??= import('./emanationScene').then(({ createEmanationScene }) => {
      if (destroyed) return
      scene = createEmanationScene(canvas)
      ready = true
    })
    return loading
  }

  $effect(() => {
    if (ex) {
      if (scene) scene.resume()
      else void ensureScene()
    } else {
      scene?.pause()
    }
  })

  onDestroy(() => {
    destroyed = true
    scene?.dispose()
  })
</script>

<canvas class:ready bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.3s ease;
    touch-action: none;
  }

  canvas.ready {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    canvas {
      transition: none;
    }
  }
</style>
