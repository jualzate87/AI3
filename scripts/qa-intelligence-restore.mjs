import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.QA_BASE ?? 'https://jualzate87.github.io/AI3/'
const OUT = 'qa-shots'
mkdirSync(OUT, { recursive: true })

const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => m.type() === 'error' && errors.push(m.text()))

const go = async hash => {
  await page.goto(`${BASE}#/${hash}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
}

// 1. First open — expect the welcome screen.
await go('ai-review')
await page.waitForTimeout(2000)
await shot(page, '01-welcome')
const welcomeText = await page.locator('body').innerText()

// 2. Generate the catch-up summary and let it finish streaming.
const catchUp = page.getByRole('button', { name: /review summary/i }).first()
await catchUp.click()
await page.waitForTimeout(16000)
await shot(page, '02-catchup-generated')
const generated = await page.locator('body').innerText()

// 3. Close the panel, then reopen — expect the finished summary, not the welcome screen.
await go('check-return')
await page.waitForTimeout(800)
await go('ai-review')
await page.waitForTimeout(1500)
await shot(page, '03-reopened-restored')
const restored = await page.locator('body').innerText()

// 4. New chat — expect the welcome screen back.
const newChat = page.getByRole('button', { name: /new chat/i }).first()
const newChatCount = await newChat.count()
if (newChatCount) {
  await newChat.click()
  await page.waitForTimeout(2500)
}
await shot(page, '04-after-new-chat')
const afterNewChat = await page.locator('body').innerText()

const has = (t, s) => t.toLowerCase().includes(s.toLowerCase())

console.log(
  JSON.stringify(
    {
      firstOpenShowsWelcome:
        has(welcomeText, 'review summary') && !has(welcomeText, 'Approve return'),
      generatedHasSummary: has(generated, 'Approve return'),
      restoredHasSummary: has(restored, 'Approve return'),
      afterNewChatShowsWelcome:
        has(afterNewChat, 'review summary') && !has(afterNewChat, 'Approve return'),
      restoredInstantly: restored.length > welcomeText.length * 1.5,
      restoredMatchesGenerated: restored.length > generated.length * 0.8,
      newChatButtonFound: newChatCount > 0,
      newChatReturnsToWelcome: afterNewChat.length < restored.length * 0.6,
      lengths: {
        welcome: welcomeText.length,
        generated: generated.length,
        restored: restored.length,
        afterNewChat: afterNewChat.length,
      },
      errors,
    },
    null,
    2,
  ),
)

await browser.close()
