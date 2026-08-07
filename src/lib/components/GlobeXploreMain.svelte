<script lang="ts">
  // GlobeXplore Focus の Main。背景に飛行映像、中央にリンクボタン。
  let { links }: { links: { label: string; href: string }[] } = $props()

  // poster（＝動画の 1 フレーム目）を先に出し、**十分にバッファできてから**再生に入る。
  // autoplay 属性だと再生可能になった時点で走り出して途中で止まりうるので、使わずに
  // canplaythrough を待って play() する。読めなければ poster のまま＝それで完成形。
  let video: HTMLVideoElement | undefined = $state()

  function start() {
    // 動きを減らす設定の人には再生しない（poster のまま）。
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    video?.play().catch(() => {}) // 失敗しても poster が残るので握りつぶす。
  }
</script>

<div class="gx-main">
  <!-- muted は自動再生の条件。playsinline は iOS で全画面に乗っ取られないため。 -->
  <video
    bind:this={video}
    class="gx-video"
    poster="/globexplore/flight.avif"
    muted
    playsinline
    loop
    preload="auto"
    oncanplaythrough={start}
  >
    <source src="/globexplore/flight.mp4" type="video/mp4" />
  </video>

  <ul class="gx-links">
    {#each links as l, i (l.href)}
      <!-- docs「2 枚貼りて〜／斜めだよなー」＝横並びから段差をつけて斜めに見せる。 -->
      <li style="--i: {i}">
        <a href={l.href} target="_blank" rel="noopener">
          <span class="label">{l.label}</span>
          <!-- 「あの右上矢印と□のやつ」＝外部リンクアイコン。 -->
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 4h6v6" />
            <path d="M20 4 11 13" />
            <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
          </svg>
        </a>
      </li>
    {/each}
  </ul>
</div>

<style>
  /* ワードマークのフォント。Figma のロゴ指定は Helvetica Bold(700) だが、Helvetica は
     Web フォント配信のライセンスが別途必要なため、字形を継ぐ TeX Gyre Heros を使う
     （Helvetica → Nimbus Sans L → Heros。G のスパーなど Helvetica の特徴を保持）。
     使う文字だけの woff2 サブセット（2.9KB）＝ pnpm subset:heros で再生成。 */
  @font-face {
    font-family: 'Heros GX';
    src: url('../globexplore/fonts/heros-gx.subset.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  .gx-main {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  /* 背景の飛行映像。poster も同じ絵なので、再生開始の瞬間は視覚的に無音。 */
  .gx-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* poster が未読込の一瞬だけ出る下地。白地から浮かないよう白のまま。 */
    background: #fff;
  }

  .gx-links {
    position: relative;
    z-index: 1;
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15em;
    font-size: clamp(2rem, 6.5vw, 5.5rem);
  }

  /* 縦に並べて、中央を軸に左右へ少しずらす（1 枚目を左・2 枚目を右）。 */
  .gx-links li {
    transform: translateX(calc((var(--i) - 0.5) * 0.5em));
  }

  /* 背景も枠も持たない、白い大きな文字だけ。末尾に外部リンクアイコン。 */
  .gx-links a {
    position: relative;
    display: inline-flex;
    /* アイコンは下揃え。SVG は baseline を持たないので下端がベースラインに載る。 */
    align-items: baseline;
    gap: 0.13em;
    color: #fff;
    text-decoration: none;
    /* フォールバックは Helvetica/Arial。どちらも Heros とメトリック互換なので、
       サブセット読み込み前後で字送りがほぼ変わらない（swap のガタつきが出ない）。 */
    font-family: 'Heros GX', Helvetica, Arial, sans-serif;
    font-size: 1em;
    /* Figma のロゴ指定に合わせる：Bold(700) / line-height 100% / letter-spacing 0%。
       ただし単語間だけ 13%（Figma の "Span (whitespace)" 指定）＝ word-spacing。 */
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0;
    word-spacing: 0.13em;
    white-space: nowrap;
  }

  /* 下線は text-decoration ではなく自前で引く。inline-flex の中では装飾が
     フレックスアイテム（＝アイコン）に伝播せず、文字の下までしか出ないため。 */
  .gx-links a::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0.08em;
    height: 0.06em;
    background: currentColor;
    opacity: 0;
  }

  .gx-links a:hover::after,
  .gx-links a:focus-visible::after {
    opacity: 1;
  }

  /* 文字サイズに追従（em 基準）。線幅は viewBox 内なので相似で保たれる。 */
  .gx-links svg {
    width: 0.58em;
    height: 0.58em;
    flex: none;
    fill: none;
    stroke: currentColor;
    /* 線比率は CloseButton の × と揃える（viewBox 24 に対して 2 ＝ 8.3%）。
       このサイトのアイコンの線質はこれ 1 種類なので、ここだけ太くすると浮く。
       文字に対する存在感は太さではなく上の width/height（サイズ）で調整する。 */
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
