import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 代理所有以 /api 开头的请求
      '/api': {
        target: 'http://c369ec45.natappfree.cc',
        changeOrigin: true, // 改变请求头中的 origin
        secure: false, // 如果是 https 接口，需要配置这个参数
        // 后端路径包含 /api，不需要重写路径
      },
      // 代理设计接口路径 /design/api/
      '/design': {
        target: 'http://c369ec45.natappfree.cc',
        changeOrigin: true,
        secure: false
      },
      // 代理绘画接口路径 /painting/api/
      '/painting': {
        target: 'http://c369ec45.natappfree.cc',
        changeOrigin: true,
        secure: false
      },
      // 代理摄影接口路径 /photography/api/
      '/photography': {
        target: 'http://c369ec45.natappfree.cc',
        changeOrigin: true,
        secure: false
      },
      // 代理微电影接口路径 /micro-film/api/
      '/micro-film': {
        target: 'http://c369ec45.natappfree.cc',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
