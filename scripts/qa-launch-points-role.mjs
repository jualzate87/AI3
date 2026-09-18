import { chromium } from 'playwright'

const BASE = 'http://localhost:5176'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

async function listPoints() {
  await page.getByRole('button', { name: 'Launch points' }).click()
  await page.waitForTimeout(300)
  const titles = await page.locator('[role="dialog"][aria-label="Launch points"] li').allInnerTexts()
  await page.keyboard.press('Escape')
  await page.mouse.click(5, 5)
  await page.waitForTimeout(200)
  return titles.map(t => t.split('\n')[1])
}

// A fresh session already has a current user (Sarah), so exactly one join option shows throughout.
const cases = [
  ['fresh — defaults to Sarah', null, 'Sarah'],
  ['after joining as Jake', 'jake', 'Jake'],
  ['after joining as Sarah', 'sarah', 'Sarah'],
]

let failed = false
for (const [label, currentUserId, expectHidden] of cases) {
  await page.goto(`${BASE}/#/check-return`, { waitUntil: 'networkidle' })
  if (currentUserId) {
    await page.evaluate(id => {
      localStorage.setItem(
        'protoc3-return-workflow',
        JSON.stringify({ assigneeId: id, statusId: 'review', currentUserId: id }),
      )
    }, currentUserId)
    await page.reload({ waitUntil: 'networkidle' })
  }
  const titles = await listPoints()
  const joinTitles = titles.filter(t => t?.startsWith('Join as'))
  console.log(`${label}: ${joinTitles.join(' | ') || '(none)'}`)

  if (joinTitles.some(t => t.includes(expectHidden))) {
    console.log(`  FAIL: should not offer to join as ${expectHidden}`)
    failed = true
  }
  if (joinTitles.length !== 1) {
    console.log(`  FAIL: expected 1 join option, got ${joinTitles.length}`)
    failed = true
  }
}

await browser.close()
console.log(failed ? 'FAIL' : 'PASS')
process.exit(failed ? 1 : 0)
