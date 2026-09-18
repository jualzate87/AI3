import { chromium } from 'playwright'

const BASE = 'http://localhost:5176'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })

await page.goto(`${BASE}/#/ai-review`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// welcome -> diagnostics -> processing, each advanced by sending a chat message.
const chat = page.getByRole('textbox').last()
await chat.fill('Run the full review')
await chat.press('Enter')
await page.waitForTimeout(6000)
await chat.fill('Fix everything you can')
await chat.press('Enter')

const attention = page.locator('#ai-review-attention-title')
await attention.waitFor({ timeout: 90000 })
await page.waitForTimeout(2000)

const order = await page.evaluate(() => {
  const card = document.querySelector('#ai-review-attention-title')?.closest('section')
  const fixes = [...document.querySelectorAll('div')]
    .reverse()
    .find(d => d.firstElementChild?.textContent?.trim().startsWith('Fixes Progress'))
  if (!card || !fixes) return { error: 'missing nodes' }
  return {
    fixesTop: Math.round(fixes.getBoundingClientRect().top + window.scrollY),
    attentionTop: Math.round(card.getBoundingClientRect().top + window.scrollY),
    attentionRendersAfterFixes: Boolean(
      card.compareDocumentPosition(fixes) & Node.DOCUMENT_POSITION_PRECEDING,
    ),
  }
})

await attention.scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path: 'qa-shots/attention-card-order.png' })

console.log(JSON.stringify(order, null, 2))
console.log('PASS')
await browser.close()
