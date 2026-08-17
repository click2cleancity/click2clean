import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Web App Manifest must use the same path prefix as Vite `base`, or iOS "Add to Home Screen"
 * opens `start_url` at site root (404 on GitHub project pages).
 */
function webManifestPlugin(): Plugin {
  let base = '/'
  return {
    name: 'web-manifest-base',
    configResolved(resolved) {
      base = resolved.base
    },
    closeBundle() {
      const root = base.endsWith('/') ? base : `${base}/`
      const icon = `${root}favicon.svg`.replace(/([^:]\/)\/+/g, '$1')
      const manifest = {
        name: 'Click to Clean',
        short_name: 'Click to Clean',
        description: 'Report civic issues and help build cleaner streets.',
        start_url: root,
        scope: root,
        display: 'standalone',
        background_color: '#e0f2fe',
        theme_color: '#2563eb',
        icons: [
          {
            src: icon,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      }
      const out = path.resolve(process.cwd(), 'dist', 'manifest.webmanifest')
      fs.mkdirSync(path.dirname(out), { recursive: true })
      fs.writeFileSync(out, JSON.stringify(manifest, null, 2))
    },
  }
}

// https://vite.dev/config/
// Base path is served from the root ('/') by default — correct for Vercel/Netlify.
// For GitHub Pages project sites, set VITE_BASE=/click2clean/ at build time.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss(), webManifestPlugin()],
})
