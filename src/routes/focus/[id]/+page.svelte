<script lang="ts">
  // Focus：展示 1 点を集中して見る画面。スクロール不要の固定 1 枚。
  // Main は当面「仮 or 空」（リンクのみ）。作品別演出は Phase 5。
  import type { PageData } from './$types'
  import { nav } from '$lib/nav.svelte'
  import TitleCaption from '$lib/components/TitleCaption.svelte'
  import CloseButton from '$lib/components/CloseButton.svelte'
  import KotohakobiMain from '$lib/components/KotohakobiMain.svelte'

  let { data }: { data: PageData } = $props()
  const e = $derived(data.exhibit)
</script>

<section class="focus">
  <aside class="details-caption caption-card">
    <CloseButton href="{nav.from}#{e.id}" />
    <p class="detail">{e.detail}</p>
    <p class="role">{e.role}</p>
    <ul class="tech">
      {#each e.tech as t (t)}<li>{t}</li>{/each}
    </ul>
    {#if e.more}<p class="more">{e.more}</p>{/if}
  </aside>

  <main class="focus-main">
    {#if e.id === 'kotohakobi'}
      <!-- 荷物一覧（listScene 移植）。箱＝使用技術＋デカ箱に画面AA／中央に「見に行く」ボタン。 -->
      <KotohakobiMain link={e.link} texts={e.tech} />
    {:else if e.link}
      <a class="focus-link" href={e.link} target="_blank" rel="noopener">{e.title} を開く</a>
    {/if}
  </main>

  <a class="title-link" href="{nav.from}#{e.id}" aria-label="Gallery へ戻る">
    <TitleCaption no={e.no} title={e.title} viewName={`title-${e.id}`} />
  </a>
</section>
