import { chromium } from 'playwright'

/**
 * Verification is per person, not a chain: each actor sees their own
 * "Mark as verified" button until they have verified, plus read-only marks
 * for anyone else who already verified. Mirrors Figma "Multi-verification flow".
 */
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })

const shots = []

async function openAs(userId) {
  const page = await context.newPage()
  await page.addInitScript(id => {
    const raw = localStorage.getItem('protoc3-return-workflow')
    const parsed = raw ? JSON.parse(raw) : {}
    localStorage.setItem(
      'protoc3-return-workflow',
      JSON.stringify({ ...parsed, currentUserId: id, assigneeId: id }),
    )
  }, userId)
  await page.goto('http://localhost:5176/#/data-review-popout?role=preparer', {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: /^1099-Rs/ }).first().click()
  await page.waitForTimeout(600)
  return page
}

async function snapshot(page, label) {
  const verifyBtn = await page.getByRole('button', { name: 'Mark as verified' }).count()
  const marks = await page.locator('[aria-label*="erified by"]').allTextContents()
  console.log(`${label}: markAsVerified=${verifyBtn} marks=[${marks.join(', ')}]`)
  await page.screenshot({ path: `qa-shots/verify-flow-${label}.png` })
  shots.push(label)
}

// Step 1 - preparer, nothing verified: button, no marks
let page = await openAs('sarah')
await snapshot(page, '1-preparer-unverified')

// Step 2 - preparer verifies: own mark with chevron, no button
await page.getByRole('button', { name: 'Mark as verified' }).click()
await page.waitForTimeout(600)
await snapshot(page, '2-preparer-verified')
await page.close()

// Step 3 - reviewer opens the same doc: preparer mark + their own button
page = await openAs('jake')
await snapshot(page, '3-reviewer-sees-preparer-mark')

// Step 4 - reviewer verifies too: both marks
await page.getByRole('button', { name: 'Mark as verified' }).click()
await page.waitForTimeout(600)
await snapshot(page, '4-both-verified')
await page.close()

// Regression - reviewer on a doc the preparer never verified must still get the button
page = await openAs('jake')
await page.getByRole('button', { name: /^1099-NECs/ }).first().click()
await page.waitForTimeout(600)
await snapshot(page, '5-reviewer-first-verifier')
await page.close()

await browser.close()
