import { chromium } from 'playwright'

const BASE = process.env.QA_BASE ?? 'http://localhost:5176/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto(`${BASE}#/smart-return`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

await page.getByRole('button', { name: /launch points/i }).first().click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: /reset demo/i }).first().click()
await page.waitForTimeout(1800)

const toastText = await page.getByText(/demo reset complete/i).count()
const dismiss = await page.getByRole('button', { name: 'Dismiss' }).count()
console.log(JSON.stringify({ toastText, dismiss, url: page.url() }))

if (toastText > 0) {
  throw new Error('Demo reset toast is still showing')
}

await browser.close()
