import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 部署：base 需与仓库名一致（https://<user>.github.io/npc-deputy-system/）。
// 本地开发时 Vite 会把根路径重定向到该 base。
export default defineConfig({
  base: '/npc-deputy-system/',
  plugins: [react()],
  server: { port: 5173 },
});