<script lang="ts">
  // index / about 共通ビュー。about のときは Introduction の内容が変化する
  // （frame.md: 基本は index と同じで Introduction のみ差し替え）。
  import { exhibits } from '$lib/exhibits/data'
  import { afterNavigate } from '$app/navigation'
  import { markExhibitOrigin, centerHashExhibit } from '$lib/transition'
  import Header from './Header.svelte'
  import Footer from './Footer.svelte'
  import TitleCaption from './TitleCaption.svelte'
  import CloseButton from './CloseButton.svelte'

  let { about = false }: { about?: boolean } = $props()

  // #id 付きで到着したら、スクロール復元より後に中央着地させ直す。
  afterNavigate(centerHashExhibit)
</script>

{#if !about}
  <Header />
{/if}

<section class="introduction">
  {#if about}
    <!-- About の右上テキスト（introduction.md）。※自己紹介・資格/skills は今後。 -->
    <nav class="intro-links caption-card">
      <CloseButton href="/" noscroll />
      <div class="intro-links-row">
        <a href="https://x.com/henohenon_8282" target="_blank" rel="noopener">X</a>
        <a href="https://github.com/henohenon" target="_blank" rel="noopener">GitHub</a>
        <a href="https://henohenon-no.pages.dev/henohenon/" target="_blank" rel="noopener">More</a>
      </div>
    </nav>
  {/if}

  {#snippet face()}
    <pre class="face">へ　へ
の　の
　ん</pre>
  {/snippet}

  <!-- frame.md: index の顔クリックで About へ（スクロール保持）。
       About 側は caption / × で戻れるので、顔はリンクにしない。 -->
  <div class="face-area">
    {#if about}
      {@render face()}
    {:else}
      <a class="face-link" href="/about" aria-label="About へ" data-sveltekit-noscroll>
        {@render face()}
      </a>
    {/if}
  </div>

  {#if about}
    <!-- Introduction は展示 00。About ではタイトル＝Home への戻りリンク。 -->
    <a class="title-link" href="/" aria-label="Home へ戻る" data-sveltekit-noscroll>
      <TitleCaption no="00" title="へのへのん" />
    </a>
  {:else}
    <div class="text-caption">
      <p>初めまして、へのへのんと申します。</p>
      <p>ここではポートフォリオを兼ねて、自分の作品を展示しています。<br />興味を持っていただけたり、ワクワクしていただければ幸いです。</p>
    </div>
  {/if}
</section>

<section class="gallery">
  {#each exhibits as e (e.id)}
    <div class="exhibit" id={e.id}>
      <a
        class="icon-link"
        href="/focus/{e.id}"
        aria-label={e.title}
        onclick={(event) => markExhibitOrigin(event, about)}
      >
        <div class="icon"></div>
      </a>
      <a class="title-link" href="/focus/{e.id}" onclick={(event) => markExhibitOrigin(event, about)}>
        <TitleCaption no={e.no} title={e.title} viewName={`title-${e.id}`} />
      </a>
    </div>
  {/each}
</section>

<Footer />
