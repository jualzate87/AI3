import { chromium } from 'playwright'

const BASE = 'http://localhost:5176'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

async function navState(label) {
  const expanded = await page.locator('text=Check menu').count()
  const collapsedBtn = await page.locator('[aria-label="Expand check menu"]').count()
  console.log(`${label}: header=${expanded} expandBtn=${collapsedBtn}`)
  return { expanded, collapsedBtn }
}

// Sidebar layout — nav should start collapsed.
await page.goto(`${BASE}/#/ai-review?layout=sidebar`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const sidebar = await navState('sidebar')
await page.screenshot({ path: 'qa-shots/sidebar-nav-collapsed.png' })

// Expand it by hand — the toggle still works.
await page.locator('[aria-label="Expand check menu"]').first().click()
await page.waitForTimeout(300)
await navState('sidebar after manual expand')

// Standalone check return — nav should still start expanded.
await page.goto(`${BASE}/#/check-return`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
const standalone = await navState('check-return standalone')
await page.screenshot({ path: 'qa-shots/check-return-nav-expanded.png' })

await browser.close()

const ok = sidebar.collapsedBtn === 1 && sidebar.expanded === 0 && standalone.expanded > 0
console.log(ok ? 'PASS' : 'FAIL')
process.exit(ok ? 0 : 1)
