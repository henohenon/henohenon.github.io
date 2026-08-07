<script lang="ts">
  // Focus の Main 枠。展示ごとの本体を引き当てて嵌める。
  // ExhibitIcon が .icon を持つのと対に、.focus-main の枠はここが持つ。
  // 中身は媒体がばらばら（canvas / video / DOM）なので共通の抽象は置かず、
  // props だけ exhibit 丸ごとに揃えて、必要な項目は各コンポーネントが自分で取る。
  import type { Component } from 'svelte'
  import type { Exhibit, MainProps } from '$lib/exhibits'
  import KotohakobiMain from '$lib/kotohakobi/main.svelte'
  import GlobeXploreMain from '$lib/globexplore/main.svelte'

  // 展示ごとの Main。作ったらここに 1 行足す。
  // 未登録の展示は空のままになる（分岐を書く必要はない）。
  const MAINS: Record<string, Component<MainProps>> = {
    kotohakobi: KotohakobiMain,
    globexplore: GlobeXploreMain,
  }

  let { exhibit }: { exhibit: Exhibit } = $props()
  const Main = $derived(MAINS[exhibit.slug])
</script>

<main class="focus-main">
  {#if Main}<Main {exhibit} />{/if}
</main>
