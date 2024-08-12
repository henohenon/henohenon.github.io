import { defineConfig } from 'vite';

export default defineConfig({
    root: './src',
    server: {
        host: '0.0.0.0',
        port: 8000,
        watch: {
            usePolling: true,  // ポーリングを有効にする
        },
    },
});