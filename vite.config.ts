import netlify from '@netlify/vite-plugin-tanstack-start'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import viteTsConfigPaths from 'vite-tsconfig-paths'

// Stub server-only Node.js packages in browser bundles so they don't crash
// client-side hydration. These modules are only called inside server functions.
const SERVER_ONLY_MODULES = [
  // PostgreSQL stack — only valid server-side
  'pg', 'pg-pool', 'pg-types', 'pg-protocol', 'pg-connection-string',
  // Drizzle Node.js driver — server-only (pg underneath)
  'drizzle-orm/node-postgres',
  // dotenv imports path/os/crypto — must not reach browser
  'dotenv',
]

function serverOnlyStubPlugin(): Plugin {
  return {
    name: 'server-only-stub',
    enforce: 'pre',
    resolveId(id, _importer, opts) {
      if (!opts?.ssr && SERVER_ONLY_MODULES.some(m => id === m || id.startsWith(`${m}/`))) {
        return '\0virtual:server-only-stub'
      }
    },
    load(id) {
      if (id === '\0virtual:server-only-stub') {
        return [
          'export default {};',
          // pg
          'export const Pool = class {};',
          'export const Client = class {};',
          // stream
          'export const EventEmitter = class {};',
          'export const Transform = class {};',
          'export const Readable = class {};',
          'export const Writable = class {};',
          'export const PassThrough = class {};',
          // string_decoder
          'export const StringDecoder = class {};',
          // dotenv — no-op so existing destructured imports don't crash
          'export const config = () => {};',
          'export const parse = () => ({});',
          // drizzle node-postgres driver
          'export const drizzle = () => ({});',
        ].join('\n')
      }
    },
  }
}


const config = defineConfig({
  define: {
    global: 'globalThis',
  },
  server: {
    // Pre-load all routes at startup so Vite crawls all deps before the first browser
    // request, preventing the lazy re-optimization that re-hashes React and breaks imports.
    warmup: {
      clientFiles: ['./src/routes/**/*.tsx', './src/routes/**/*.ts'],
    },
  },
  optimizeDeps: {
    // Pre-bundle all client-side packages at startup so Vite never triggers
    // a lazy re-optimization that re-hashes React and breaks in-flight imports.
    include: [
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      '@headlessui/react',
      '@setemiojo/utils',
      '@tanstack/react-devtools',
      'clsx',
      'lucide-react',
      'motion/react',
      'partysocket/react',
      'sonner',
      'zod',
      'buffer',
    ],
    exclude: [
      // ESM packages — no pre-bundling needed; excluding prevents any lazy discovery
      // from triggering another optimization pass.
      'drizzle-orm',
      'drizzle-orm/node-postgres',
      'drizzle-orm/pg-core',
      '@neondatabase/serverless',
    ],
  },
  plugins: [
    serverOnlyStubPlugin(),
    // Alias buffer/process/util to browser-compatible versions.
    // Globals disabled — Buffer global is injected via bufferGlobalPlugin instead.
    // Crypto excluded — browser has native crypto, and the Node polyfill drags in
    // cipher-base/readable-stream which crash on process.version.slice().
    // Re-enable the Buffer global shim — with warmup, deps are discovered at startup
    // so there's no in-flight re-optimization that breaks the esbuild banner.
    nodePolyfills({
      include: ['buffer', 'process', 'util'],
      globals: { Buffer: true, global: false, process: false },
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    netlify(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
})

export default config
