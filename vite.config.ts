import { createRequire } from 'node:module'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// GramJS імпортує `crypto` лише в CryptoFile.js. Без підміни туди потрапляє crypto-browserify,
// який повертає Buffer з іншої копії полифілу, ніж глобальний `Buffer`, тож перевірка
// `instanceof Buffer` при серіалізації падає ("Bytes or str expected" на кроці 2FA).
// Підставляємо браузерну WebCrypto-реалізацію самого GramJS, яка використовує глобальний Buffer.
const require = createRequire(import.meta.url)
const gramjsCrypto = require.resolve('telegram/crypto/crypto.js')
const isGramjsCryptoFile = (importer?: string) =>
  !!importer && /[\\/]telegram[\\/]CryptoFile\.js$/.test(importer)

// У збірці `require('buffer')` резолвиться в index.cjs шиму, а глобальний Buffer — в index.js,
// і це дві різні копії класу. Зводимо обидва до ESM-версії.
const BUFFER_SHIM = 'vite-plugin-node-polyfills/shims/buffer'
const bufferShimEsm = require.resolve(BUFFER_SHIM).replace(/index\.cjs$/, 'index.js')

function gramjsBrowserCrypto(): Plugin {
  return {
    name: 'gramjs-browser-crypto',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === BUFFER_SHIM) return bufferShimEsm
      // Alias-плагін Vite спрацьовує раніше, тож `crypto` може вже бути шляхом до crypto-browserify
      if (isGramjsCryptoFile(importer) && (source === 'crypto' || source.includes('crypto-browserify'))) {
        return gramjsCrypto
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/telegram-export/', // Для GitHub Pages
  plugins: [
    gramjsBrowserCrypto(),
    react(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['telegram', 'telegram/sessions'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        {
          name: 'gramjs-browser-crypto',
          setup(build) {
            build.onResolve({ filter: /^crypto$/ }, (args) =>
              isGramjsCryptoFile(args.importer) ? { path: gramjsCrypto } : undefined
            )
          },
        },
      ],
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
