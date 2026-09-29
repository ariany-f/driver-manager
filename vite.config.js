import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { driveApiPlugin } from './server/driveApi.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), driveApiPlugin(env)],
    optimizeDeps: {
      include: ['pdfjs-dist'],
    },
    server: {
      watch: {
        ignored: ['**/.git/**', '**/node_modules/**', '**/.env', '**/.env.*', '**/data/**'],
      },
    },
  }
})
