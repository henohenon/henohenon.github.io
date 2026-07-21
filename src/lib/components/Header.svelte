<script lang="ts">
  // ヘッダー：右上 About（/about）。About ページでは Home（/）へ。
  // ※「Introduction 通過後のみ fixed 表示」は Phase 3 で対応。
  let { home = false }: { home?: boolean } = $props()
</script>

<header class="site-header">
  <a class="about-link" href={home ? '/' : '/about'}>{home ? 'Home' : 'About'}</a>
</header>
