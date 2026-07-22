<script lang="ts">
  import '../app.css'
  import { page } from '$app/state'
  import { fade } from 'svelte/transition'

  let { children } = $props()

  // 初回ハイドレーション時はフェードさせない（プリレンダ済み DOM のちらつき防止）。
  // 以降のクライアント遷移（Exhibit↔Focus など）でのみフェード。
  let ready = $state(false)
  $effect(() => {
    ready = true
  })
</script>

{#key page.url.pathname}
  <div in:fade={{ duration: ready ? 220 : 0 }}>
    {@render children()}
  </div>
{/key}
