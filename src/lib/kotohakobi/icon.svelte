<script lang="ts">
  // コトハコビの Icon（Gallery のハコ）。座標は本体ロゴ `allo-app/src/assets/kotohakobi-icon.svg` 準拠。
  //   箱本体＝閉じた四角（上辺も常設）／中に「コ」（常時表示）。
  //   上辺の上に 2 枚のフタ（帯・長さは上辺の半分で中央合わせ）。閉じ＝上辺に重なって隠れ、
  //   ホバーで各上角を蝶番に「斜め上・外へ」跳ね上げ（左 −120°/右 +120°・buildButton 準拠）。
  //   上ぶちは開いても残る。※コの出入り・ビクン等は今は無し。
  // 枠（.icon）と遷移まわりの配線は ExhibitIcon が持つので、ここは絵と音だけを担う。
  // ホバー中だけ例の音を鳴らす（§6 ギミック）。ホバーするたびに頭からリセットして鳴らす方式。
  // Tone は初期バンドルに載せず初回ホバーで遅延 import。外すと止まって巻き戻す。
  let seqMod: ReturnType<typeof import('$lib/kotohakobi/sequence').getSequence> | undefined
  let loading: Promise<void> | null = null
  let hovering = false

  function loadSeq() {
    loading ??= import('$lib/kotohakobi/sequence').then((m) => {
      seqMod = m.getSequence()
    })
    return loading
  }
  // enter/leave 中の非同期を跨いでも、最新の hovering を正として揃える。
  function apply() {
    if (!seqMod) return
    if (hovering) void seqMod.enter()
    else seqMod.leave()
  }
  async function onEnter() {
    hovering = true
    await loadSeq()
    apply()
  }
  async function onLeave() {
    hovering = false
    await loadSeq()
    apply()
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hako" onpointerenter={onEnter} onpointerleave={onLeave}>
  <svg viewBox="0 0 256 256" aria-hidden="true">
    <!-- 箱本体：閉じた四角（上辺も残す）。フタが開いても上ぶちは常に見える。 -->
    <path class="box" d="M41.163 43.35L41.163 217.774L211.337 217.774L211.337 43.35Z" />

    <!-- 上フタ 2 枚（帯）。長さは上辺の半分（中央 126.25 で合わさる）。閉＝上辺に重なって隠れる。
         ホバーで各上角を蝶番に「上へ外へ」開いて 2 本に割れる。 -->
    <path class="lid lid-l" d="M41.163 43.35L126.25 43.35" />
    <path class="lid lid-r" d="M211.337 43.35L126.25 43.35" />

    <!-- 「コ」：上バー＋右縦バー＋下バー（ロゴの輪郭矩形）。常時表示。 -->
    <g class="ko">
      <rect x="72.62" y="69.09" width="111.06" height="20.96" />
      <rect x="150.16" y="79.56" width="33.52" height="101.43" />
      <rect x="72.62" y="170.51" width="111.06" height="20.96" />
    </g>
  </svg>
</div>

<style>
  /* ExhibitIcon の .icon 枠いっぱいに広がる。 */
  .hako {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
  }

  svg {
    /* 枠いっぱいより一回り小さく。中心（＝ズーム原点）は place-items で維持。 */
    width: 70%;
    height: 70%;
    overflow: visible; /* 開いたフタがはみ出せるように。 */
  }

  .box,
  .lid,
  .ko rect {
    fill: none;
    stroke: #111;
    stroke-width: 7.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .ko rect {
    stroke-width: 7.4;
  }

  /* フタ：各上角を蝶番に。閉(0°)=上辺に重なる / 開=「斜め上・外へ」跳ね上げ（120°・buildButton 準拠）。
     hover で開き、離すと閉じる（約 0.2 秒）。 */
  .lid {
    transform-box: fill-box;
    transform: rotate(0deg);
    transition: transform 0.22s ease;
  }
  .lid-l {
    transform-origin: left center; /* 左上角が蝶番 → 斜め上・外(左)へ */
  }
  .lid-r {
    transform-origin: right center; /* 右上角が蝶番 → 斜め上・外(右)へ */
  }

  .hako:hover .lid-l {
    transform: rotate(-120deg);
  }
  .hako:hover .lid-r {
    transform: rotate(120deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .lid {
      transition: none;
    }
  }
</style>
