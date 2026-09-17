import { chromium } from 'playwright'

const BASE = process.env.QA_BASE ?? 'http://localhost:5175'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

await page.goto(`${BASE}/#/ai-review`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// welcome → diagnostics
await page.getByRole('button', { name: 'Run full review' }).click()
await page.waitForTimeout(12000)
await page.screenshot({ path: 'qa-shots/cards-01-diagnostics.png', fullPage: true })

// diagnostics → fix run
const accept = page.getByRole('button', { name: /accept all/i }).first()
await accept.waitFor({ timeout: 20000 })
await accept.click()

// let the whole fix animation settle
await page.waitForTimeout(26000)
await page.screenshot({ path: 'qa-shots/cards-02-full.png', fullPage: true })

const rail = page.locator('aside[aria-label="Run progress"]')
await rail.waitFor({ timeout: 20000 })
console.log('--- progress rail ---')
console.log(await rail.innerText())
console.log('View links in rail:', await rail.getByRole('link', { name: /^view$/i }).count())
await rail.screenshot({ path: 'qa-shots/cards-03-rail.png' })

const attention = page.locator('section[aria-labelledby="ai-review-attention-title"]')
if (await attention.count()) {
  await attention.scrollIntoViewIfNeeded()
  await attention.screenshot({ path: 'qa-shots/cards-04-attention.png' })
  console.log('--- attention card ---')
  console.log(await attention.innerText())
}

const chip = page.getByRole('button', { name: /get reviewer summary/i })
console.log('reviewer-summary chip count:', await chip.count())

// Both closing cards plus the chip, framed together.
if (await chip.count()) {
  await chip.first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'qa-shots/cards-05-closing.png' })
}

await browser.close()
