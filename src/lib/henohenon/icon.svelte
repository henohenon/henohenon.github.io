<script lang="ts">
  // Introduction の Icon。抽選（1回きり）は呼び出し側（IndexView）が持つ。
  // ex トグルで再マウントされても同じ画像のままにするため、ここでは抽選しない。
  let { src }: { src: string } = $props()
</script>

<img class="face" src={src} alt="へのへのん" />

<style>
  /* .face の view-transition-name／querySelector('.face') 依存は zoom.ts と app.css の warp 節が持つ。
     サイズは app.css の .introduction が持つ --icon-size（Gallery Icon の1.3倍）に委ねる。
     intro-caption-card（Icon 直下に置く）も同じ変数から位置を逆算しているので、
     ここを直接変えると2箇所がズレる。変えるなら --icon-size 側で。 */
  .face {
    display: block;
    width: var(--icon-size);
    height: auto;
  }
</style>
