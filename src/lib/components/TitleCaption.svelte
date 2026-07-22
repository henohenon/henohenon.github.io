<script lang="ts">
  // タイトルキャプション：作品名 + 番号。Gallery の Exhibit と Focus で共有。
  let { no, title }: { no: string; title: string } = $props()
</script>

<div class="title-caption"><span class="no">{no}</span><p>{title}</p></div>
