import { chromium } from 'playwright'

const BASE = 'http://localhost:5176'
const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1447, height: 960 },
  deviceScaleFactor: 3,
})

await page.goto(`${BASE}/#/data-review-popout`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

const btn = page.getByRole('button', { name: 'Mark as verified' }).first()
await btn.waitFor({ timeout: 10000 })

const metrics = await btn.evaluate(el => {
  const group = el.closest('[class*="verifyStatusGroup"]')
  const icon = group.querySelector('button[aria-label*="comment"]')
  const b = el.getBoundingClientRect()
  const i = icon.getBoundingClientRect()
  const svg = icon.querySelector('svg')?.getBoundingClientRect()
  return {
    gap: Math.round(i.left - b.right),
    groupGap: getComputedStyle(group).gap,
    control: `${Math.round(i.width)}x${Math.round(i.height)}`,
    glyph: svg ? `${Math.round(svg.width)}x${Math.round(svg.height)}` : 'n/a',
  }
})

const group = btn.locator('xpath=ancestor::*[contains(@class,"verifyStatusGroup")]')
const box = await group.boundingBox()
await page.screenshot({
  path: 'qa-shots/verify-actions-spacing.png',
  clip: { x: box.x - 16, y: box.y - 12, width: box.width + 40, height: box.height + 24 },
})

console.log(JSON.stringify(metrics, null, 2))
console.log('PASS')
await browser.close()
