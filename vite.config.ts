import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { spawn, type ChildProcess } from 'child_process'
import http from 'http'

/**
 * Vite plugin that automatically starts and manages the Scrapling
 * Python scraper backend alongside the Vite development and preview servers.
 */
function scraperServerPlugin(): Plugin {
  let scraperProcess: ChildProcess | null = null

  const isServerRunning = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const req = http.get('http://127.0.0.1:5001/api/scraper/health', (res) => {
        resolve(res.statusCode === 200)
      })
      req.on('error', () => resolve(false))
      req.setTimeout(800, () => {
        req.destroy()
        resolve(false)
      })
    })
  }

  const startScraper = async () => {
    const running = await isServerRunning()
    if (running) {
      console.log('[Scraper] Backend is already running on http://127.0.0.1:5001')
      return
    }

    console.log('[Scraper] Starting Scrapling backend alongside Vite on port 5001...')
    scraperProcess = spawn('python', ['scraper_server.py'], {
      stdio: 'inherit',
      shell: true,
      windowsHide: true,
    })

    scraperProcess.on('error', (err) => {
      console.error('[Scraper Error] Failed to start Python scraper:', err)
    })
  }

  const stopScraper = () => {
    if (scraperProcess && !scraperProcess.killed) {
      console.log('[Scraper] Shutting down scraper backend...')
      if (process.platform === 'win32' && scraperProcess.pid) {
        spawn('taskkill', ['/pid', String(scraperProcess.pid), '/f', '/t'], { stdio: 'ignore' })
      } else {
        scraperProcess.kill('SIGTERM')
      }
      scraperProcess = null
    }
  }

  return {
    name: 'vite-plugin-scraper-server',
    configureServer(server) {
      startScraper()
      server.httpServer?.on('close', stopScraper)
      process.on('exit', stopScraper)
      process.on('SIGINT', stopScraper)
      process.on('SIGTERM', stopScraper)
    },
    configurePreviewServer(server) {
      startScraper()
      server.httpServer?.on('close', stopScraper)
      process.on('exit', stopScraper)
      process.on('SIGINT', stopScraper)
      process.on('SIGTERM', stopScraper)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), scraperServerPlugin()],
  server: {
    proxy: {
      '/api/scraper': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
})
