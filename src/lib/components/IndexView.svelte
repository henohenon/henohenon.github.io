<script lang="ts">
  // index / about 共通ビュー。about のときは Introduction の内容が変化する
  // （frame.md: 基本は index と同じで Introduction のみ差し替え）。
  import { exhibits } from '$lib/exhibits/data'
  import Header from './Header.svelte'
  import Footer from './Footer.svelte'

  let { about = false }: { about?: boolean } = $props()
</script>

<Header home={about} />

<section class="introduction">
  <pre class="face">へ　へ
の　の
　ん</pre>
  <div class="text-caption">
    {#if about}
      <p>へのへのんについて。</p>
      <p>（About の内容はこれから作り込みます）</p>
    {:else}
      <p>初めまして、へのへのんと申します。</p>
      <p>
        ここではポートフォリオを兼ねて、自分の作品を展示しています。興味を持っていただけたり、ワクワクしていただければ幸いです。
      </p>
    {/if}
  </div>
</section>

<section class="gallery">
  {#each exhibits as e (e.id)}
    <a class="exhibit" href="/focus/{e.id}">
      <div class="icon"></div>
      <div class="title-caption"><span class="no">{e.no}</span><p>{e.title}</p></div>
    </a>
  {/each}
</section>

<Footer />
