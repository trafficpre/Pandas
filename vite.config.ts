// vite.config.ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  server: {
    proxy: {
      // 后端在 127.0.0.1:8000，保持和你最初一致
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // 视频静态文件（如果用 FastAPI /media）
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
