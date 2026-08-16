<script lang="ts">
  // Introduction の Icon。抽選（1回きり）は呼び出し側（IndexView）が持つ。
  // about トグルで再マウントされても同じ画像のままにするため、ここでは抽選しない。
  let { src }: { src: string } = $props()
</script>

<img class="face" src={src} alt="へのへのん" />

<style>
  /* .face の view-transition-name／querySelector('.face') 依存は zoom.ts と app.css の warp 節が持つ。
     ここではサイズだけ決める。 */
  .face {
    display: block;
    width: clamp(160px, 26vw, 300px);
    height: auto;
  }
</style>
