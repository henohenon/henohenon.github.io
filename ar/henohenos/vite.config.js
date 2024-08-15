import { defineConfig } from "vite";

export default defineConfig({
  root: "./src",
  base: "./",
  publicDir: "public",
  server: {
    host: "0.0.0.0",
    port: 8000,
    watch: {
      usePolling: true, // ポーリングを有効にする
    },
  },
  build: {
    outDir: "../dist",
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "mediapipe-hands": ["@mediapipe/hands"],
        },
      },
    },
  },
});
