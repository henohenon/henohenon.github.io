<script lang="ts">
  // ヘッダー：右上 About（`/?about` モード）。index でのみ表示。
  // frame.md: Introduction を通過した後のみ fixed 表示する。
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  let visible = $state(false)

  onMount(() => {
    const onScroll = () => {
      // Introduction は 100svh。6 割ほどスクロールしたら出現。
      visible = window.scrollY > window.innerHeight * 0.6
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  })

  // ヘッダー About は「下（Gallery）まで来た後」に押される。位置維持で about モードへ
  // 切替（query のみ変化＝DOM 保持）→ トップへスムーススクロール（＝下から上へ上がる）。
  // Gallery は index/about で同一なので、スクロールで自然に About イントロが現れる。
  async function toAbout(event: MouseEvent) {
    event.preventDefault()
    await goto('?about', { noScroll: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
</script>

<header class="site-header" class:visible>
  <a class="about-link" href="?about" onclick={toAbout}>About</a>
</header>
