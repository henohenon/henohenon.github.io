<script lang="ts">
  // index / about 共通ビュー。about のときは Introduction の内容が変化する
  // （frame.md: 基本は index と同じで Introduction のみ差し替え）。
  import { exhibits } from '$lib/exhibits/data'
  import Header from './Header.svelte'
  import Footer from './Footer.svelte'
  import TitleCaption from './TitleCaption.svelte'

  let { about = false }: { about?: boolean } = $props()
</script>

{#if !about}
  <Header />
{/if}

<section class="introduction">
  {#if about}
    <!-- About の右上テキスト（introduction.md）。※自己紹介・資格/skills は今後。 -->
    <nav class="intro-links caption-card">
      <a href="https://x.com/henohenon_8282" target="_blank" rel="noopener">X</a>
      <a href="https://github.com/henohenon" target="_blank" rel="noopener">GitHub</a>
      <a href="https://henohenon-no.pages.dev/henohenon/" target="_blank" rel="noopener">More</a>
    </nav>
  {/if}

  {#snippet face()}
    <pre class="face">へ　へ
の　の
　ん</pre>
  {/snippet}

  <!-- frame.md: タイポグラフィをクリックで遷移。index→About / About→Home。 -->
  <a class="face-link" href={about ? '/' : '/about'} aria-label={about ? 'Home へ' : 'About へ'}>
    {@render face()}
  </a>

  {#if about}
    <!-- Introduction は展示 00。About ではタイトルとして扱う。 -->
    <TitleCaption no="00" title="へのへのん" />
  {:else}
    <div class="text-caption">
      <p>初めまして、へのへのんと申します。</p>
      <p>ここではポートフォリオを兼ねて、自分の作品を展示しています。<br />興味を持っていただけたり、ワクワクしていただければ幸いです。</p>
    </div>
  {/if}
</section>

<section class="gallery">
  {#each exhibits as e (e.id)}
    <a class="exhibit" href="/focus/{e.id}">
      <div class="icon"></div>
      <TitleCaption no={e.no} title={e.title} />
    </a>
  {/each}
</section>

<Footer />
