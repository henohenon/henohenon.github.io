<script lang="ts">
  // GlobeXplore の Icon（Gallery のドローン）。three.js で static/globexplore/drone.glb を描く。
  // 枠（.icon）と遷移まわりの配線は ExhibitIcon が持つので、ここは絵と入力だけを担う。
  // three もモデルも初期バンドルには載せず、Gallery が視界に入ってから動的 import する
  // （Gallery は Introduction の 1 画面下にあるので、これで実際に後回しになる）。
  // 待機は完全静止。ホバーの間だけ浮いて、ジンバルが傾いて、プロペラが回る。
  import { onMount } from 'svelte'
  import type { DroneIcon } from '$lib/globexplore/drone'

  let host: HTMLDivElement
  let canvas: HTMLCanvasElement
  let drone: DroneIcon | undefined
  let hovering = false
  /** 読み込めたか。空の canvas がちらつかないよう、描けてからフェードで出す。 */
  let ready = $state(false)

  onMount(() => {
    let cancelled = false
    // 取得した資源は disposers に積み、cleanup で逆順に解放する。
    // await の途中で unmount されても、そこまでに積んだ分は確実に片付く。
    const disposers: Array<() => void> = []

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        void load()
      },
      // スクロールで見えるより一足先に取りに行き、着いたときには描けている状態にする。
      { rootMargin: '200px' },
    )
    io.observe(host)
    disposers.push(() => io.disconnect())

    async function load() {
      const { createDroneIcon } = await import('$lib/globexplore/drone')
      if (cancelled) return
      // 読めなければ空枠のまま。アイコンが出ないだけで Gallery は成立する。
      const icon = await createDroneIcon(canvas).catch(() => undefined)
      if (!icon) return
      if (cancelled) {
        icon.dispose()
        return
      }
      disposers.push(() => icon.dispose())
      drone = icon
      ready = true
      // 読み込みを跨いでホバーされていたら、その場で追いつかせる。
      if (hovering) icon.enter()
    }

    return () => {
      cancelled = true
      while (disposers.length) disposers.pop()!()
    }
  })

  function onEnter() {
    hovering = true
    drone?.enter()
  }
  function onLeave() {
    hovering = false
    drone?.leave()
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="drone" bind:this={host} onpointerenter={onEnter} onpointerleave={onLeave}>
  <canvas bind:this={canvas} class:ready aria-hidden="true"></canvas>
</div>

<style>
  /* ExhibitIcon の .icon 枠いっぱいに広がる。 */
  .drone {
    width: 100%;
    height: 100%;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.3s ease;
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
