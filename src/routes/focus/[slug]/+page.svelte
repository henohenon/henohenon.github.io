<script lang="ts">
  // Focus：展示 1 点を集中して見る画面。スクロール不要の固定 1 枚。
  // Main は展示ごとに差し替える（下の slug 分岐）。未実装の展示は空のまま。
  import type { PageData } from './$types'
  import { nav } from '$lib/nav.svelte'
  import { exhibitNo } from '$lib/exhibits'
  import TitleCaption from '$lib/components/TitleCaption.svelte'
  import CloseButton from '$lib/components/CloseButton.svelte'
  import KotohakobiMain from '$lib/components/KotohakobiMain.svelte'
  import GlobeXploreMain from '$lib/components/GlobeXploreMain.svelte'

  let { data }: { data: PageData } = $props()
  const e = $derived(data.exhibit)
</script>

<section class="focus">
  <aside class="details-caption caption-card">
    <CloseButton href="{nav.from}#{e.slug}" />
    <p class="summary">{e.summary}</p>
    <p class="detail">{e.detail}</p>
    <ul class="tags">
      {#each e.tags as t (t)}<li>{t}</li>{/each}
    </ul>
    {#if e.more}
      <a class="more" href={e.more} target="_blank" rel="noopener">More</a>
    {/if}
  </aside>

  <main class="focus-main">
    {#if e.slug === 'kotohakobi'}
      <!-- 荷物一覧（listScene 移植）。箱＝使用技術＋デカ箱に画面AA／中央に「見に行く」ボタン。 -->
      <KotohakobiMain texts={e.tags} />
    {:else if e.slug === 'globexplore'}
      <!-- 背景に飛行映像（poster 先出し）、中央にリンクボタン 2 つ（Steam / Pro）。 -->
      <GlobeXploreMain />
    {/if}
  </main>

  <a class="title-link" href="{nav.from}#{e.slug}" aria-label="Gallery へ戻る">
    <TitleCaption no={exhibitNo(e.slug)} title={e.title} viewName={`title-${e.slug}`} />
  </a>
</section>
