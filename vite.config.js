import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    open: true,
  },
  build: {
    // gh-pages
    outDir: "docs",
  }
})
