import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://henohenon.github.io",
  trailingSlash: "never",
  build: {
    format: "file",
  },
});
