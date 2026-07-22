<script lang="ts">
  // ヘッダー：右上 About（/about）。index でのみ表示。
  // frame.md: Introduction を通過した後のみ fixed 表示する。
  import { onMount } from 'svelte'

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
</script>

<header class="site-header" class:visible>
  <a class="about-link" href="/about" data-sveltekit-noscroll>About</a>
</header>
