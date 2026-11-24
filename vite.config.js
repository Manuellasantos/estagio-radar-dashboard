/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CSP só no build (o servidor de desenvolvimento usa scripts inline para HMR).
const CSP = "default-src 'self'; connect-src https://api.github.com; img-src 'self' data:; " +
  "style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'"

const csp = {
  name: 'csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
}

// Somente no `npm run dev` com LOCAL_DATA=<pasta>: serve os dados locais em /local-data (nunca no build).
import fs from 'node:fs'
import path from 'node:path'
const localData = {
  name: 'local-data',
  apply: 'serve',
  configureServer(server) {
    const dir = process.env.LOCAL_DATA
    if (!dir) return
    server.middlewares.use('/local-data/', (req, res) => {
      const file = path.join(dir, path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^([.][.][/\\])+/, ''))
      if (!file.startsWith(path.resolve(dir)) || !fs.existsSync(file)) { res.statusCode = 404; return res.end() }
      res.setHeader('Content-Type', 'application/json')
      fs.createReadStream(file).pipe(res)
    })
  },
}

export default defineConfig({
  plugins: [react(), csp, localData],
  define: { __LOCAL_DATA__: JSON.stringify(!!process.env.LOCAL_DATA && process.env.NODE_ENV !== 'production') },
  base: '/estagio-radar-dashboard/',
})
