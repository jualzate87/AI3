import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

/**
 * Source-doc links in the catch-up summary should match the review experience:
 * blue info chip with the NewWindow icon, not a plain text link.
 */
const BASE = process.env.QA_BASE ?? 'http://localhost:5176/'
mkdirSync('qa-shots', { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto(`${BASE}#/ai-review`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)

await page.getByRole('button', { name: /review summary/i }).first().click()
await page.waitForTimeout(16000)

const chip = page.getByRole('button', { name: /^W-2 \(PDF\) \(opens in a new window\)$/ }).first()
await chip.waitFor({ state: 'visible' })
await chip.scrollIntoViewIfNeeded()

const style = await chip.evaluate(el => {
  const cs = getComputedStyle(el)
  const svg = el.querySelector('svg')
  const svgBox = svg?.getBoundingClientRect()
  return {
    background: cs.backgroundColor,
    color: cs.color,
    borderRadius: cs.borderRadius,
    fontWeight: cs.fontWeight,
    icon: svgBox ? { w: Math.round(svgBox.width), h: Math.round(svgBox.height) } : null,
  }
})

console.log(JSON.stringify(style, null, 2))

await chip.evaluate(el => el.closest('section')?.scrollIntoView({ block: 'center' }))
await page.waitForTimeout(400)
await page.screenshot({ path: 'qa-shots/doc-link-chips.png' })

if (style.background === 'rgba(0, 0, 0, 0)') {
  throw new Error('Doc link is missing the blue chip background')
}
if (!style.icon) {
  throw new Error('Doc link is missing its icon')
}

await browser.close()
