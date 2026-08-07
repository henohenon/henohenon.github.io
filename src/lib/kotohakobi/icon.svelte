<script lang="ts">
  // コトハコビの Icon（Gallery のハコ）。絵は iconCanvas.ts が canvas に描く。
  //   箱本体＝閉じた四角（上辺も常設）／中に「コ」（常時表示）。
  //   上辺の上に 2 枚のフタ。閉＝上辺に重なって隠れ、ホバーで各上角を蝶番に跳ね上げ。
  //   ※コの出入り・ビクン等は今は無し。
  // SVG ではなく canvas なのは Focus Main と質感（ラスタの粒）を揃えるため。理由は iconCanvas.ts。
  // 枠（.icon）と遷移まわりの配線は ExhibitIcon が持つので、ここは絵と音だけを担う。
  // ホバー中だけ例の音を鳴らす（§6 ギミック）。ホバーするたびに頭からリセットして鳴らす方式。
  // Tone は初期バンドルに載せず初回ホバーで遅延 import。外すと止まって巻き戻す。
  import { createIconRenderer, type IconRenderer } from '$lib/kotohakobi/iconCanvas'

  let seqMod: ReturnType<typeof import('$lib/kotohakobi/sequence').getSequence> | undefined
  let loading: Promise<void> | null = null
  let hovering = false

  let canvas: HTMLCanvasElement
  let renderer: IconRenderer | undefined

  // $effect はブラウザでしか走らないので、prerender 時に canvas を触らない。
  $effect(() => {
    renderer = createIconRenderer(canvas)
    return () => {
      renderer?.dispose()
      renderer = undefined
    }
  })

  function loadSeq() {
    loading ??= import('$lib/kotohakobi/sequence').then((m) => {
      seqMod = m.getSequence()
    })
    return loading
  }
  // enter/leave 中の非同期を跨いでも、最新の hovering を正として揃える。
  function apply() {
    if (!seqMod) return
    if (hovering) void seqMod.enter()
    else seqMod.leave()
  }
  async function onEnter() {
    hovering = true
    renderer?.setOpen(true) // 絵は音のロードを待たない。
    await loadSeq()
    apply()
  }
  async function onLeave() {
    hovering = false
    renderer?.setOpen(false)
    await loadSeq()
    apply()
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hako" onpointerenter={onEnter} onpointerleave={onLeave}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
  /* ExhibitIcon の .icon 枠いっぱいに広がる。 */
  .hako {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
  }

  canvas {
    /* 枠いっぱいより一回り小さく。中心（＝ズーム原点）は place-items で維持。
       バッキング解像度は iconCanvas.ts が CSS サイズ × DPR で追従させる。 */
    width: 70%;
    height: 70%;
  }
</style>
