import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'qa-shots')

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto('http://localhost:5176/#/check-return', { waitUntil: 'networkidle' })
const headerBtn = page.locator('[data-automation-id="view-source-documents-header-cta"]')
await headerBtn.waitFor({ state: 'visible' })
await headerBtn.screenshot({ path: path.join(outDir, 'header-source-documents-button.png') })

await page.goto('http://localhost:5176/#/check-return-popout?form=1040', { waitUntil: 'networkidle' })
const popoutBtn = page.locator('[data-automation-id="review-return-popout-view-source-docs"]')
await popoutBtn.waitFor({ state: 'visible' })
await popoutBtn.screenshot({ path: path.join(outDir, 'popout-source-documents-button.png') })

const refreshBtn = page.locator('[data-automation-id="review-return-popout-refresh-forms"]')
await refreshBtn.screenshot({ path: path.join(outDir, 'popout-refresh-forms-button.png') })

await browser.close()
console.log('Screenshots saved to qa-shots/')
