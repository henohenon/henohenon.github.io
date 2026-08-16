<script lang="ts">
  // index / about 共通ビュー。about は「別ページ」ではなく `/?about` の表示モード
  // （Gallery は完全同一、変わるのは Introduction のキャプションとヘッダーだけ）。
  // query のみの変化ではページコンポーネントが破棄されないので DOM が保持され、
  // キャプションのテキストを textMorph で greeting↔title へ書き換えられる。
  import type { Action } from 'svelte/action'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import { blur } from 'svelte/transition'
  import { page } from '$app/state'
  import { exhibits, exhibitNo } from '$lib/exhibits'
  import { markExhibitOrigin } from '$lib/transitions'
  import { INTRO_GREETING, INTRO_TITLE } from '$lib/henohenon/intro'
  import { morphText } from '$lib/henohenon/textMorph'
  import { DEFAULT_ICON, pickRandomIcon } from '$lib/henohenon/icons'
  import HenohenonIcon from '$lib/henohenon/icon.svelte'
  import Emanation from '$lib/henohenon/emanation.svelte'
  import Header from './Header.svelte'
  import Footer from './Footer.svelte'
  import TitleCaption from './TitleCaption.svelte'
  import CloseButton from './CloseButton.svelte'
  import ExhibitIcon from './ExhibitIcon.svelte'

  // プリレンダ時は searchParams を読めない（＝常に挨拶状態で出力）。about 判定は
  // クライアントのみ。直リンク `/?about` は挨拶 HTML → ハイドレーション後に確定する。
  const about = $derived(browser && page.url.searchParams.has('about'))

  // Icon の抽選はページ滞在中1回だけ（about トグルで {#if} 越しに再マウントされても
  // 引き直さない）。const で browser 分岐するだけだと、hydration は「差が無い」前提で
  // 属性を上書きしないため DEFAULT_ICON のまま固定されてしまう（about の boot-about と
  // 同じ理由）。$state + onMount で明示的に client 側だけ引き直す。
  let iconSrc = $state(DEFAULT_ICON)
  onMount(() => {
    iconSrc = pickRandomIcon()
  })

  // Emanation（three.js 一式）の先読み。Icon は常にファーストビューにあるため、
  // クリック（about 到達）を待たずアイドル時間に裏で温めておく。間に合わなくても
  // Emanation 側の canvas フェードインが多少の遅れを吸収する（要素の存在は待たない）。
  onMount(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200))
    idle(() => void import('$lib/henohenon/emanationScene'))
  })

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
    <!-- About の右上テキスト（henohenon.md）。※自己紹介・資格/skills は今後。
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

  <!-- frame.md: index の顔クリックで About モードへ（スクロール保持）。
       About に入ると Icon は Emanation（henohenon.md）に置き換わる。その場展開なので
       別ページには飛ばない。About 側は caption / × で戻れるので、顔はリンクにしない。

       intro-group は Exhibit（Icon＋TitleCaption を flex column + gap で並べる構造）を
       参考にした外枠。index では実際に flex column として Icon とキャプションを積む。
       about では Icon が画面全体の Emanation に化けるので、intro-group 自体は
       display:contents で消え、intro-stage / intro-caption-card それぞれの絶対配置に譲る
       （キャプションの DOM は index/about を通じて同一要素のまま。詳細は app.css）。 -->
  <div class="intro-group" class:about>
    <div class="intro-stage" class:about>
      {#if about}
        <div class="emanation-area">
          <Emanation />
        </div>
      {:else}
        <a class="face-link" href="?about" aria-label="About へ" data-sveltekit-noscroll>
          <HenohenonIcon src={iconSrc} />
        </a>
      {/if}
    </div>

    <!-- 常駐キャプション。index=挨拶（非リンク的）/ about=タイトル（Home へ戻る）。
         tag は常に <a> で固定＝DOM 保持のため（切替時に <p> を remount させない）。
         index の href="?about" は顔と同じく About モードへのトグル。 -->
    <a
      class="intro-caption-card"
      class:about
      href={about ? '/' : '?about'}
      aria-label={about ? 'Home へ戻る' : 'About へ'}
      data-sveltekit-noscroll
    >
      <p use:introText={about}>{INTRO_GREETING}</p>
    </a>
  </div>
</section>

<section class="gallery">
  {#each exhibits as e (e.slug)}
    <div class="exhibit" id={e.slug}>
      <ExhibitIcon slug={e.slug} title={e.title} {about} />
      <a class="title-link" href="/focus/{e.slug}" onclick={(event) => markExhibitOrigin(event, about)}>
        <TitleCaption no={exhibitNo(e.slug)} title={e.title} viewName={`title-${e.slug}`} />
      </a>
    </div>
  {/each}
</section>

<Footer />
