<script lang="ts">
  // index / about 共通ビュー。about は「別ページ」ではなく `/?about` の表示モード
  // （Gallery は完全同一、変わるのは Introduction のキャプションとヘッダーだけ）。
  // query のみの変化ではページコンポーネントが破棄されないので DOM が保持され、
  // キャプションのテキストを textMorph で greeting↔title へ書き換えられる。
  import type { Action } from 'svelte/action'
  import { browser } from '$app/environment'
  import { blur } from 'svelte/transition'
  import { page } from '$app/state'
  import { exhibits } from '$lib/exhibits/data'
  import { markExhibitOrigin } from '$lib/transition'
  import { INTRO_GREETING, INTRO_TITLE } from '$lib/intro'
  import { morphText } from '$lib/textMorph'
  import Header from './Header.svelte'
  import Footer from './Footer.svelte'
  import TitleCaption from './TitleCaption.svelte'
  import CloseButton from './CloseButton.svelte'
  import HakoIcon from './HakoIcon.svelte'

  // プリレンダ時は searchParams を読めない（＝常に挨拶状態で出力）。about 判定は
  // クライアントのみ。直リンク `/?about` は挨拶 HTML → ハイドレーション後に確定する。
  const about = $derived(browser && page.url.searchParams.has('about'))

  // 常駐キャプションのテキスト制御。action の mount/update 分離で「初回は morph せず、
  // 以降の about 変化だけ morph」を表現する（initialized フラグ不要）。
  //   mount（＝初回）: 現値へ即確定。?about 直開きで隠していた boot-about もここで解除。
  //   update（＝以降の変化のみ）: 現在の内容から目標へ morph（進行中はキャンセルして張り直し）。
  const introText: Action<HTMLElement, boolean> = (node, initial) => {
    node.textContent = initial ? INTRO_TITLE : INTRO_GREETING
    document.documentElement.classList.remove('boot-about')
    let cancel = () => {}
    return {
      update(next) {
        cancel()
        cancel = morphText(node, node.textContent ?? '', next ? INTRO_TITLE : INTRO_GREETING)
      },
      destroy: () => cancel(),
    }
  }
</script>

{#if !about}
  <Header />
{/if}

<section class="introduction">
  {#if about}
    <!-- About の右上テキスト（introduction.md）。※自己紹介・資格/skills は今後。
         VT を切ったので入退場は Svelte transition で「にじみ出る/引く」（blur+fade）。 -->
    <nav class="intro-links caption-card" transition:blur={{ duration: 500, amount: 14 }}>
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

  <!-- frame.md: index の顔クリックで About モードへ（スクロール保持）。
       About 側は caption / × で戻れるので、顔はリンクにしない。 -->
  <div class="face-area">
    {#if about}
      {@render face()}
    {:else}
      <a class="face-link" href="?about" aria-label="About へ" data-sveltekit-noscroll>
        {@render face()}
      </a>
    {/if}
  </div>

  <!-- 常駐キャプション。index=挨拶（非リンク的）/ about=タイトル（Home へ戻る）。
       tag は常に <a> で固定＝DOM 保持のため（切替時に <p> を remount させない）。
       index の href="?about" は顔と同じく About モードへのトグル。 -->
  <a
    class="intro-caption-card"
    href={about ? '/' : '?about'}
    aria-label={about ? 'Home へ戻る' : 'About へ'}
    data-sveltekit-noscroll
  >
    <p use:introText={about}>{INTRO_GREETING}</p>
  </a>
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
        {#if e.id === 'kotohakobi'}
          <HakoIcon />
        {:else}
          <div class="icon"></div>
        {/if}
      </a>
      <a class="title-link" href="/focus/{e.id}" onclick={(event) => markExhibitOrigin(event, about)}>
        <TitleCaption no={e.no} title={e.title} viewName={`title-${e.id}`} />
      </a>
    </div>
  {/each}
</section>

<Footer />
