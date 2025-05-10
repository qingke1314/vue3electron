import vue from '@vitejs/plugin-vue';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/gateway': {
        target: 'http://localhost:3000',
        changeOrigin: true, // 是否改变源，后端收到的请求头中host会是目标地址
        rewrite: (path) => path.replace(/^\/gateway/, ''), // 将gateway去掉，否则后端收到的请求路径是/gateway/user/login
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        //additionalData: `@use "@/styles/element/index.scss" as *;`,
      },
    },
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    electron([
      {
        // Main-Process entry.
        entry: 'electron/main.ts',
        // Optional: Configure transpiling options for main process
        vite: {
          // build: {
          //   outDir: "dist-electron",
          //   lib: {
          //     entry: "electron/main.ts",
          //     formats: ["cjs"], // 确保输出 CJS
          //     fileName: () => "main.cjs",
          //   },
          // },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          // 当预加载脚本构建完成时，通知渲染进程重新加载页面。
          // 重新加载页面的行为由 vite-plugin-electron-renderer 实现。
          options.reload();
        },
        // Optional: Configure transpiling options for preload script
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                format: 'cjs', // 强制主进程代码为 CommonJS
              },
            },
          },
        },
      },
    ]),
    // Use Node.js API in the Renderer-process
    renderer(),
  ],
});
