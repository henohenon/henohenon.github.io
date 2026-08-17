<script lang="ts">
  // ヘッダー：右上の「上へ戻る」ボタン。index でのみ表示。
  // frame.md: Introduction を通過した後のみ fixed 表示する。
  // ※ 以前はここから About（Emanation）へ直接ジャンプできたが、その導線は撤去。
  //   index の Icon クリックのみが About への入口。
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

  function toTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
</script>

<header class="site-header" class:visible>
  <button class="top-link" type="button" onclick={toTop}>Top</button>
</header>
