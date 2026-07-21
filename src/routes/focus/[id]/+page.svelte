<script lang="ts">
  // Focus：展示 1 点を集中して見る画面。Main は当面「仮 or 空」。
  // レイアウト/演出の作り込みは Phase 2/5。
  import type { PageData } from './$types'

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
  <div class="title-caption"><span class="no">{e.no}</span><p>{e.title}</p></div>
</section>
