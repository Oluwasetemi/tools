/**
 * PartyKit browser diagnostic script.
 * Run with: node scripts/debug-partykit.mjs
 * Requires both dev servers running: bun run dev:all
 */
import { chromium } from '@playwright/test'

const TARGET = 'http://localhost:3000/party/polls'
const WAIT_MS = 5000

const wsConnections = []
const consoleMessages = []
const jsErrors = []

console.log(`\n[DEBUG-PK] Opening ${TARGET} in headless Chromium...\n`)

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()

// Capture ALL WebSocket connections
context.on('websocket', ws => {
  const entry = { url: ws.url(), frames: [], opened: false, closed: false, closeCode: null }
  wsConnections.push(entry)
  console.log(`[DEBUG-PK] WS OPENED: ${ws.url()}`)

  ws.on('framesent', f => entry.frames.push({ dir: '→', data: f.payload?.toString?.()?.slice(0, 100) }))
  ws.on('framereceived', f => {
    const text = f.payload?.toString?.()
    entry.frames.push({ dir: '←', data: text?.slice(0, 100) })
    console.log(`[DEBUG-PK] WS RECEIVED: ${text?.slice(0, 150)}`)
  })
  ws.on('close', () => {
    entry.closed = true
    console.log(`[DEBUG-PK] WS CLOSED: ${ws.url()}`)
  })
  ws.on('socketerror', err => {
    console.log(`[DEBUG-PK] WS ERROR on ${ws.url()}: ${err}`)
  })
})

const page = await context.newPage()

// Capture all console output
page.on('console', msg => {
  const text = `[${msg.type().toUpperCase()}] ${msg.text()}`
  consoleMessages.push(text)
  if (msg.type() === 'error' || msg.text().includes('[poll') || msg.text().includes('[partykit') || msg.text().includes('[DEBUG')) {
    console.log(`[DEBUG-PK] CONSOLE ${text}`)
  }
})

// Capture uncaught JS errors
page.on('pageerror', err => {
  jsErrors.push(err.message)
  console.log(`[DEBUG-PK] PAGE ERROR: ${err.message}`)
})

// Capture failed requests
page.on('requestfailed', req => {
  if (req.url().includes('parties') || req.url().includes('partykit')) {
    console.log(`[DEBUG-PK] REQUEST FAILED: ${req.url()} — ${req.failure()?.errorText}`)
  }
})

try {
  await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 15000 })
} catch (e) {
  if (e.message.includes('ERR_CONNECTION_REFUSED')) {
    console.error('\n[DEBUG-PK] ⚠ Dev server not running. Start with: bun run dev:all\n')
    await browser.close()
    process.exit(1)
  }
  throw e
}
console.log(`\n[DEBUG-PK] Page loaded. Waiting ${WAIT_MS}ms for sockets to settle...\n`)
await page.waitForTimeout(WAIT_MS)

// Read the debug bar text
const debugBarText = await page.$eval(
  'div[style*="background: #1A1008"]',
  el => el.innerText
).catch(() => 'DEBUG BAR NOT FOUND')

console.log('\n━━━━━━━━━━━━━━━━━━━━━━ REPORT ━━━━━━━━━━━━━━━━━━━━━━')
console.log(`Debug bar: ${debugBarText}`)
console.log(`\nWebSocket connections (${wsConnections.length} total):`)
wsConnections.forEach((ws, i) => {
  console.log(`  ${i + 1}. ${ws.url}`)
  console.log(`     closed=${ws.closed} | frames=${ws.frames.length}`)
  ws.frames.slice(0, 3).forEach(f => console.log(`     ${f.dir} ${f.data}`))
})
console.log(`\nJS errors (${jsErrors.length}):`)
jsErrors.forEach(e => console.log(`  ✘ ${e}`))
console.log(`\nAll console messages (${consoleMessages.length}):`)
consoleMessages.forEach(m => console.log(`  ${m}`))
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

await browser.close()
