import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

/**
 * A fresh session starts as Sarah with nothing verified — no seeded preparer
 * doc stamps, so the source document view opens with zero green checks.
 */
const BASE = process.env.QA_BASE ?? 'http://localhost:5176/'
mkdirSync('qa-shots', { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

await page.goto(`${BASE}#/data-review-popout`, { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

const stamps = await page.evaluate(() =>
  Object.keys(localStorage)
    .filter(k => k.includes('review-state'))
    .reduce((acc, k) => {
      try {
        const s = JSON.parse(localStorage.getItem(k))
        acc[k] = {
          verifiedDocsList: s.verifiedDocsList?.length ?? 0,
          reviewerConfirmedDocsList: s.reviewerConfirmedDocsList?.length ?? 0,
        }
      } catch {
        acc[k] = 'unparsed'
      }
      return acc
    }, {}),
)
console.log('fresh session:', JSON.stringify(stamps, null, 2))

const progress = await page
  .getByText(/documents verified/i)
  .first()
  .evaluate(el => (el.parentElement ?? el).innerText)
  .catch(() => '(progress label not found)')
  .then(text => text.replace(/\s+/g, ' ').trim())
console.log('progress label:', progress)

await page.screenshot({ path: 'qa-shots/initial-verified-docs.png' })

for (const [key, value] of Object.entries(stamps)) {
  if (typeof value !== 'object') continue
  if (value.verifiedDocsList > 0 || value.reviewerConfirmedDocsList > 0) {
    throw new Error(`Fresh session already has verified documents in ${key}`)
  }
}

if (!progress.startsWith('0 /')) {
  throw new Error(`Expected "0 / N Documents verified", got "${progress}"`)
}

await browser.close()
