import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'qa-shots')
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

for (const form of ['1040', 'sch1']) {
  await page.goto(`http://localhost:5176/#/check-return-popout?form=${form}`, {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(outDir, `form-${form}-rows.png`) })
}

await browser.close()
console.log('saved')
