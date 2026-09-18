import { chromium } from 'playwright'

const BASE = 'http://localhost:5176'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })

for (const [name, form] of [['schedule-a','schA'],['schedule-1','sch1'],['summary','summary']]) {
  await page.goto(`${BASE}/#/check-return?form=${form}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const row = page.locator('tr[data-field-row]').first()
  if (!(await row.count())) {
    console.log(`${name}: no rows found`)
    continue
  }
  await row.scrollIntoViewIfNeeded()
  const box = await row.boundingBox()
  await row.hover()
  await page.waitForTimeout(250)
  await page.screenshot({
    path: `qa-shots/row-marks-${name}.png`,
    clip: { x: 360, y: Math.max(0, box.y - 70), width: 1050, height: 250 },
  })
  console.log(`${name}: captured`)
}

console.log('PASS')
await browser.close()
