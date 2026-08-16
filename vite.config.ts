import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  // Tailscale serve（tailnet 限定公開）越しに ts.net ホスト名でアクセスするため、
  // dev / preview 双方で *.ts.net を許可（それ以外の Host は従来どおり弾く）。
  // port は他プロジェクトと被らない固定値（henohenon の球の色 #5932FF から）。
  // strictPort により、埋まっていたら別ポートへ逃げず即エラーにする。
  server: { port: 5932, strictPort: true, allowedHosts: ['.ts.net'] },
  preview: { allowedHosts: ['.ts.net'] },
})
