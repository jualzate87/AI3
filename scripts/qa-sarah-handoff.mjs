import { chromium } from 'playwright'

const BASE = 'http://localhost:5176'
const browser = await chromium.launch()

async function runHandoff(label, launchTitle, shot) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${BASE}/#/smart-return`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto(`${BASE}/#/smart-return`, { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: /Launch points/ }).click()
  await page.getByText(launchTitle, { exact: false }).first().click()
  await page.waitForTimeout(3000)

  const toast = await page.getByRole('dialog').filter({ hasText: 'handed off' }).first()
  const toastText = await toast.innerText().catch(() => '(no toast)')
  console.log(`\n${label} toast:\n${toastText}`)
  await page.screenshot({ path: `qa-shots/${shot}-toast.png` })

  // Open the catch-up summary from the toast CTA.
  await toast.getByRole('button', { name: /summary/i }).click()
  await page.waitForTimeout(9000)
  const summary = await page.locator('article').first().innerText()
  console.log(`${label} summary headings:`)
  for (const line of summary.split('\n')) {
    if (/^(Notes from|\d\. )/.test(line.trim())) console.log('  ', line.trim())
  }
  await page.screenshot({ path: `qa-shots/${shot}-summary.png`, fullPage: false })
  await page.close()
  return { toastText, summary }
}

const jake = await runHandoff('JAKE', 'Join as Jake', 'jake-handoff')
const sarah = await runHandoff('SARAH', 'Join as Sarah', 'sarah-handoff')

await browser.close()

const ok =
  jake.toastText.includes('Sarah') &&
  sarah.toastText.includes('Jake') &&
  sarah.summary.includes('Jake Morrison') &&
  sarah.summary.includes('Form 1098') &&
  !sarah.summary.includes('as final reviewer')
console.log('\n' + (ok ? 'PASS' : 'FAIL'))
process.exit(ok ? 0 : 1)
