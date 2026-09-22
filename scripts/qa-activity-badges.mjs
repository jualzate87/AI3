import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

/** Activity feed badges should use the light tinted fills from Figma, not solid green/yellow. */
const BASE = process.env.QA_BASE ?? 'http://localhost:5176/'
mkdirSync('qa-shots', { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

await page.goto(`${BASE}#/check-return`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

await page.getByRole('button', { name: 'activity', exact: true }).first().click()
await page.waitForTimeout(800)

const panel = page.locator('#activity-feed-panel')
await panel.waitFor({ state: 'visible' })

const badges = await panel.locator('[class*="entryTypeBadge"]').evaluateAll(els =>
  els.slice(0, 8).map(el => {
    const cs = getComputedStyle(el)
    return { label: el.textContent, background: cs.backgroundColor, color: cs.color }
  }),
)
console.log(JSON.stringify(badges, null, 2))

await panel.screenshot({ path: 'qa-shots/activity-badges.png' })

await browser.close()
