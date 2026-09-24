import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

/**
 * Peel tabs for a doc verified by preparer AND confirmed by reviewer show a
 * single double-check icon, not two overlapping circle checks.
 */
const BASE = process.env.QA_BASE ?? 'http://localhost:5176/'
const STATE_KEY = 'protoc3-data-review-state-v35'
const DOCS = ['1099-div-tokenFinancial', '1099-div-northmarkIndex', '1099-div-beaconDividend']
mkdirSync('qa-shots', { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 3,
})

await page.addInitScript(
  ({ STATE_KEY, DOCS }) => {
    const stamp = name => DOCS.map(d => [d, { by: name, at: 'Sep 23 · 9:00 AM' }])
    localStorage.setItem('protoc-demo-role', 'reviewer')
    localStorage.setItem(
      'protoc3-return-workflow',
      JSON.stringify({ assigneeId: 'jake', statusId: 'review', currentUserId: 'jake' }),
    )
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        verifiedDocsList: stamp('Sarah Chen'),
        reviewerConfirmedDocsList: stamp('Jake Morrison'),
      }),
    )
  },
  { STATE_KEY, DOCS },
)

await page.goto(`${BASE}#/data-review-popout?tab=1099-divs&role=reviewer`, {
  waitUntil: 'networkidle',
})
await page.waitForTimeout(2500)

const peel = page.locator('button', { hasText: 'Beacon Dividend Trust' }).first()
await peel.waitFor({ state: 'visible' })

const icons = await peel.locator('svg').count()
const markup = await peel.evaluate(el => el.querySelector('span')?.className ?? '(no span)')
console.log('svg icons inside a confirmed peel tab:', icons, '| check span class:', markup)

await peel.screenshot({ path: 'qa-shots/peel-double-check.png' })

if (icons > 1) {
  throw new Error(`Expected one check icon on a confirmed peel tab, found ${icons}`)
}

await browser.close()
