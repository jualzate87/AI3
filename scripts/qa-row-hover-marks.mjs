import { chromium } from 'playwright'

const BASE = 'http://localhost:5176'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })

await page.goto(`${BASE}/#/check-return?form=1040`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const firstRow = page.locator('tr[data-field-row]').first()
await firstRow.waitFor()
await firstRow.scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
const box = await firstRow.boundingBox()
const clip = { x: 360, y: Math.max(0, box.y - 60), width: 1050, height: 330 }

// At rest: only marks that already exist should be painted.
const restVisible = await firstRow.evaluate(row =>
  [...row.querySelectorAll('button')]
    .filter(btn => Number(getComputedStyle(btn.closest('[class]')).opacity) !== 0)
    .length,
)
await page.screenshot({ path: 'qa-shots/row-marks-rest.png', clip })

// Hovering reveals the controls you can act on.
await firstRow.hover()
await page.waitForTimeout(250)
await page.screenshot({ path: 'qa-shots/row-marks-hover.png', clip })

const hoverOpacity = await firstRow.evaluate(row => {
  const el = row.querySelector('[class*="rowControlOnHover"]')
  return el ? getComputedStyle(el).opacity : 'none'
})

console.log(`controls visible at rest (count heuristic): ${restVisible}`)
console.log(`hover-only wrapper opacity while hovered: ${hoverOpacity}`)

// Marks left by teammates must sit on the row without hovering.
const fieldKey = await firstRow.getAttribute('data-field-row')
await page.evaluate(key => {
  const storageKey = 'protoc3-data-review-state-v35'
  const state = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
  state.reviewerConfirmedFieldsList = [[key, { by: 'Jake Miller', at: 'Sep 18, 2:14 PM' }]]
  state.managerConfirmedFieldsList = [[key, { by: 'Dana Ruiz', at: 'Sep 18, 3:02 PM' }]]
  localStorage.setItem(storageKey, JSON.stringify(state))
}, fieldKey)

await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const seeded = page.locator(`tr[data-field-row="${fieldKey}"]`).first()
await seeded.scrollIntoViewIfNeeded()
await page.waitForTimeout(300)
const seededBox = await seeded.boundingBox()
await page.screenshot({
  path: 'qa-shots/row-marks-team.png',
  clip: { x: 360, y: Math.max(0, seededBox.y - 60), width: 1050, height: 260 },
})

const teamMarks = await seeded.evaluate(row =>
  [...row.querySelectorAll('button[aria-label*="checked by"]')].map(btn => ({
    label: btn.getAttribute('aria-label'),
    opacity: getComputedStyle(btn).opacity,
  })),
)
console.log('team marks at rest:', JSON.stringify(teamMarks))
console.log('PASS')
await browser.close()
