<script lang="ts">
  // Icon クリックで index 上にその場展開する Emanation。three.js 一式は初期バンドルに
  // 載せず、mount 時（＝about に入った時点）に動的 import する。先読みは呼び出し側
  // （IndexView）がアイドル時間に行うので、ここに来る頃には大抵読み込み済み。
  import { onMount } from 'svelte'
  import type { EmanationScene } from './emanationScene'

  let canvas: HTMLCanvasElement
  let ready = $state(false)

  onMount(() => {
    let cancelled = false
    let scene: EmanationScene | undefined

    import('./emanationScene').then(({ createEmanationScene }) => {
      if (cancelled) return
      scene = createEmanationScene(canvas)
      ready = true
    })

    return () => {
      cancelled = true
      scene?.dispose()
    }
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
