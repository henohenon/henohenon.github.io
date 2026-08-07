import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    // GitHub Pages（ユーザーサイト・ルート）向けに全ルートを静的プリレンダ。
    adapter: adapter(),
  },
}
