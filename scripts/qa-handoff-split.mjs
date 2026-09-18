import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'qa-shots')
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.addInitScript(() => {
  localStorage.removeItem('protoc3-return-workflow')
})

await page.goto('http://localhost:5176/#/check-return', { waitUntil: 'networkidle' })

const formsHeader = page.getByRole('button', { name: 'Forms' }).first()
await formsHeader.waitFor({ state: 'visible' })
const formsExpanded = await formsHeader.getAttribute('aria-expanded')
const searchFormsVisible = await page.getByPlaceholder('Search forms').isVisible().catch(() => false)

await page.locator('[aria-label="Check return navigation"]').screenshot({
  path: path.join(outDir, 'check-menu-forms-collapsed.png'),
})

await page.getByRole('button', { name: 'Select assignee' }).click()
await page.getByRole('option', { name: 'Jake Morrison' }).click()

const dialog = page.getByRole('dialog')
await dialog.waitFor({ state: 'visible' })
await dialog.screenshot({ path: path.join(outDir, 'handoff-split-default.png') })

const notes = dialog.locator('#handoff-notes')
const summaryToggle = dialog.getByRole('button', { name: /Quick summary/ })
const notesVisible = await notes.isVisible()
const instructionsVisible = await dialog
  .getByText(/Add anything Jake should know in the notes/i)
  .isVisible()
const summaryExpanded = await summaryToggle.getAttribute('aria-expanded')
const reviewedReadyVisible = await dialog.getByText('Checked and ready').isVisible().catch(() => false)

await summaryToggle.click()
await dialog.getByText('Checked and ready').waitFor({ state: 'visible' })
await dialog.screenshot({ path: path.join(outDir, 'handoff-split-summary-open.png') })

const report = {
  formsExpanded,
  searchFormsVisible,
  notesVisible,
  instructionsVisible,
  summaryExpandedOnOpen: summaryExpanded,
  reviewedReadyVisibleOnOpen: reviewedReadyVisible,
}
await writeFile(path.join(outDir, 'handoff-split-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))

if (formsExpanded !== 'false' || searchFormsVisible) {
  throw new Error('Forms section is not closed by default')
}
if (!notesVisible) {
  throw new Error('Notes field missing')
}
if (!instructionsVisible) {
  throw new Error('Opening instructions missing')
}
if (summaryExpanded === 'true' || reviewedReadyVisible) {
  throw new Error('Summary accordion is open by default')
}

await browser.close()
