<script lang="ts">
  // index / ex 共通ビュー。ex は「別ページ」ではなく `/?ex` の表示モード
  // （Gallery は完全同一、変わるのは Introduction のキャプションとヘッダーだけ）。
  // query のみの変化ではページコンポーネントが破棄されないので DOM が保持され、
  // キャプションのテキストを textMorph で greeting↔title へ書き換えられる。
  import type { Action } from 'svelte/action'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
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

  // プリレンダ時は searchParams を読めない（＝常に挨拶状態で出力）。ex 判定は
  // クライアントのみ。直リンク `/?ex` は挨拶 HTML → ハイドレーション後に確定する。
  const ex = $derived(browser && page.url.searchParams.has('ex'))

  // Icon の抽選はページ滞在中1回だけ（ex トグルで {#if} 越しに再マウントされても
  // 引き直さない）。const で browser 分岐するだけだと、hydration は「差が無い」前提で
  // 属性を上書きしないため DEFAULT_ICON のまま固定されてしまう（ex の boot-ex と
  // 同じ理由）。$state + onMount で明示的に client 側だけ引き直す。
  let iconSrc = $state(DEFAULT_ICON)
  onMount(() => {
    iconSrc = pickRandomIcon()
  })

  // Emanation（three.js 一式）の先読み。Icon は常にファーストビューにあるため、
  // クリック（ex 到達）を待たずアイドル時間に裏で温めておく。間に合わなくても
  // Emanation 側の canvas フェードインが多少の遅れを吸収する（要素の存在は待たない）。
  onMount(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200))
    idle(() => void import('$lib/henohenon/emanationScene'))
  })

  // 常駐キャプションのテキスト制御。action の mount/update 分離で「初回は morph せず、
  // 以降の ex 変化だけ morph」を表現する（initialized フラグ不要）。
  //   mount（＝初回）: 現値へ即確定。?ex 直開きで隠していた boot-ex もここで解除。
  //   update（＝以降の変化のみ）: 現在の内容から目標へ morph（進行中はキャンセルして張り直し）。
  const introText: Action<HTMLElement, boolean> = (node, initial) => {
    node.textContent = initial ? INTRO_TITLE : INTRO_GREETING
    document.documentElement.classList.remove('boot-ex')
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

{#if !ex}
  <Header />
{/if}

<section class="introduction">
  <!-- ex の右上テキスト（henohenon.md）。※自己紹介・資格/skills は今後。
       Icon/Emanation と同じ理由（ai-log 参照）で {#if} による DOM 生成/破棄はやめ、
       常駐 + class:hidden（opacity）で出し分ける。 -->
  <nav class="intro-links caption-card card" class:hidden={!ex} aria-hidden={!ex}>
    <CloseButton href="/" noscroll />
    <div class="intro-links-row">
      <a href="https://x.com/henohenon_8282" target="_blank" rel="noopener">X</a>
      <a href="https://github.com/henohenon" target="_blank" rel="noopener">GitHub</a>
      <a href="https://henohenon-no.pages.dev/henohenon/" target="_blank" rel="noopener">More</a>
    </div>
  </nav>

  <!-- frame.md: index の顔クリックで ex モードへ（スクロール保持）。
       ex に入ると Icon は Emanation（henohenon.md）に置き換わる。その場展開なので
       別ページには飛ばない。ex 側は caption / × で戻れるので、顔はリンクにしない。

       intro-group は Exhibit（Icon＋TitleCaption を flex column + gap で並べる構造）を
       参考にした外枠。Icon と Emanation は毎回作り直さず常にどちらもマウントしたまま、
       class:hidden（opacity。display:none は避ける。理由は ai-log 参照）で出し分ける。
       emanation-area は position:absolute で intro-group いっぱいに広がるので、
       Icon／キャプションの flex column 配置には影響しない。
       キャプションの DOM は index/ex を通じて同一要素のまま（テキスト morph のため）。 -->
  <div class="intro-group">
    <a
      class="face-link"
      class:hidden={ex}
      aria-hidden={ex}
      href="?ex"
      aria-label="About へ"
      data-sveltekit-noscroll
    >
      <HenohenonIcon src={iconSrc} />
    </a>

    <div class="emanation-area" class:hidden={!ex} aria-hidden={!ex}>
      <Emanation {ex} />
    </div>

    <!-- 常駐キャプション。index=挨拶（非リンク的）/ ex=タイトル（Home へ戻る）。
         tag は常に <a> で固定＝DOM 保持のため（切替時に <p> を remount させない）。
         index の href="?ex" は顔と同じく ex モードへのトグル。 -->
    <a
      class="intro-caption-card card"
      class:ex
      href={ex ? '/' : '?ex'}
      aria-label={ex ? 'Home へ戻る' : 'About へ'}
      data-sveltekit-noscroll
    >
      <p use:introText={ex}>{INTRO_GREETING}</p>
    </a>
  </div>
</section>

<section class="gallery">
  {#each exhibits as e (e.slug)}
    <div class="exhibit" id={e.slug}>
      <ExhibitIcon slug={e.slug} title={e.title} {ex} />
      <a class="title-link" href="/focus/{e.slug}" onclick={(event) => markExhibitOrigin(event, ex)}>
        <TitleCaption no={exhibitNo(e.slug)} title={e.title} viewName={`title-${e.slug}`} />
      </a>
    </div>
  {/each}
</section>

<Footer />
