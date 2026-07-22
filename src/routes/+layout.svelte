<script lang="ts">
  import '../app.css'
  import { onNavigate } from '$app/navigation'
  import { routeTransition } from '$lib/transition'

  let { children } = $props()

  onNavigate(routeTransition)
</script>

{@render children()}
