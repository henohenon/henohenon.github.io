<script lang="ts">
  // フッター：index / about のみ。※ X リンクは Phase 3 で追加。
  // 著作権表記は制作年（2026）を基点に、現在年が進んだら範囲表記へ。
  const created = 2026
  const now = new Date().getFullYear()
  const years = now > created ? `${created}–${now}` : `${created}`
</script>

<footer class="footer">
  <p>&copy; {years} henohenon</p>
</footer>
