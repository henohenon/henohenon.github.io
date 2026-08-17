<script lang="ts">
  // ヘッダー：右上の「Intro（Introduction）へ戻る」ボタン。
  // index は Introduction を通過した後のみ、ex は常に表示する（fixed）。
  // ex 中は Icon が Emanation に化けているので、押すと ex を抜けて index 先頭へ。
  // index 中はスクロールを戻すだけ（ex はそのまま、閉じない）。
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  let { ex }: { ex: boolean } = $props()

  let scrolledPastIntro = $state(false)
  const visible = $derived(ex || scrolledPastIntro)

  onMount(() => {
    const onScroll = () => {
      // Introduction は 100svh。6 割ほどスクロールしたら出現。
      scrolledPastIntro = window.scrollY > window.innerHeight * 0.6
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  })

  async function toIntro(event: MouseEvent) {
    if (ex) {
      event.preventDefault()
      await goto('/', { noScroll: true })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
</script>

<header class="site-header" class:visible>
  <button class="intro-link" type="button" onclick={toIntro}>へのへのん</button>
</header>
