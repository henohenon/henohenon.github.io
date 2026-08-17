<script lang="ts">
  // Gallery の Icon 枠。展示ごとの絵を引き当てて外枠に嵌める。
  //
  // .icon の div はここが持つ。transitions/zoom.ts の setOrigin が
  // querySelector('.icon') でズーム原点（＝アイコン中心）を取るため、
  // この要素が Exhibit 内に必ず 1 つ存在することが遷移演出の前提になっている。
  // 中身のコンポーネントはこの契約を知らなくてよく、絵を描くことだけに集中できる。
  import type { Component } from 'svelte'
  import { markExhibitOrigin } from '$lib/transitions'
  import GlobexploreIcon from '$lib/globexplore/icon.svelte'
  import KotohakobiIcon from '$lib/kotohakobi/icon.svelte'

  // 展示ごとの Icon。作ったらここに 1 行足す。
  // 未登録の展示は自動でグレーの空枠になる（分岐を書く必要はない）。
  const ICONS: Record<string, Component> = {
    globexplore: GlobexploreIcon,
    kotohakobi: KotohakobiIcon,
  }

  let { slug, title, ex }: { slug: string; title: string; ex: boolean } = $props()
  const Icon = $derived(ICONS[slug])
</script>

<a
  class="icon-link"
  href="/focus/{slug}"
  aria-label={title}
  onclick={(event) => markExhibitOrigin(event, ex)}
>
  <div class="icon" class:placeholder={!Icon}>
    {#if Icon}<Icon />{/if}
  </div>
</a>
