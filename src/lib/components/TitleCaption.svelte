<script lang="ts">
  // タイトルキャプション：作品名 + 番号。Gallery の Exhibit と Focus で共有。
  // viewName を渡すと view-transition-name が付き、Gallery↔Focus で同要素が移動する。
  let {
    no,
    title,
    viewName,
  }: { no: string; title: string; viewName?: string } = $props()
</script>

<div class="title-caption" style:view-transition-name={viewName} data-vt={viewName}>
  <span class="no">{no}</span><p>{title}</p>
</div>
