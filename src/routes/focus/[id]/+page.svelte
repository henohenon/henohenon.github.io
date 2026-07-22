<script lang="ts">
  // Focus：展示 1 点を集中して見る画面。スクロール不要の固定 1 枚。
  // Main は当面「仮 or 空」（リンクのみ）。作品別演出は Phase 5。
  import type { PageData } from './$types'
  import TitleCaption from '$lib/components/TitleCaption.svelte'

  let { data }: { data: PageData } = $props()
  const e = $derived(data.exhibit)
</script>

<section class="focus">
  <aside class="details-caption">
    <a class="close" href="/" aria-label="閉じる">×</a>
    <p class="detail">{e.detail}</p>
    <p class="role">{e.role}</p>
    <ul class="tech">
      {#each e.tech as t (t)}<li>{t}</li>{/each}
    </ul>
    {#if e.more}<p class="more">{e.more}</p>{/if}
  </aside>

  <main class="focus-main">
    {#if e.link}
      <a class="focus-link" href={e.link} target="_blank" rel="noopener">{e.title} を開く</a>
    {/if}
  </main>

  <TitleCaption no={e.no} title={e.title} />
</section>
