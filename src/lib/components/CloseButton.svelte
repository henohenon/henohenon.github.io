<script lang="ts">
  // キャプションカードの閉じる（×）。当たり判定は正方形で広め（padding を貫通）。
  // noscroll: 遷移でスクロール位置を保持する（ex→Home 用）。
  let {
    href,
    label = '閉じる',
    noscroll = false,
  }: { href: string; label?: string; noscroll?: boolean } = $props()
</script>

<a class="close" {href} aria-label={label} data-sveltekit-noscroll={noscroll ? '' : undefined}>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
</a>
