import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  // Tailscale serve（tailnet 限定公開）越しに ts.net ホスト名でアクセスするため、
  // dev / preview 双方で *.ts.net を許可（それ以外の Host は従来どおり弾く）。
  server: { allowedHosts: ['.ts.net'] },
  preview: { allowedHosts: ['.ts.net'] },
})
