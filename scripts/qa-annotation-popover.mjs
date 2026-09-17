import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'qa-shots')
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

await page.goto('http://localhost:5176/#/data-review-popout?role=preparer', {
  waitUntil: 'networkidle',
})
await page.waitForTimeout(1500)

const commentBtn = page.locator('[aria-label^="Add comment on"]').first()
await commentBtn.waitFor({ state: 'visible', timeout: 15000 })
await commentBtn.click()

const dialog = page.locator('[role="dialog"]').first()
await dialog.waitFor({ state: 'visible' })

const title = await dialog.locator('div').filter({ hasText: /Comment ·/ }).last().innerText()
const triggerValue = await dialog.locator('input').first().inputValue()

const geometry = await dialog.evaluate(root => {
  const input = root.querySelector('input')
  const dot = root.querySelector('span[aria-hidden="true"]')
  const r = el => (el ? el.getBoundingClientRect() : null)
  return { input: r(input), dot: r(dot) }
})
const dotInsideField =
  geometry.dot.left > geometry.input.left && geometry.dot.right < geometry.input.right

await dialog.screenshot({ path: path.join(outDir, 'annotation-popover-closed.png') })

await dialog.locator('input').first().click()
await page.waitForTimeout(400)

const checkmarkCount = await page.locator('[data-testid="menuitem-checkmark"]').count()
const menu = page.locator('ul').filter({ hasText: 'E-file critical flag' }).first()
await menu.screenshot({ path: path.join(outDir, 'annotation-popover-menu.png') })
await page.screenshot({ path: path.join(outDir, 'annotation-popover-open.png') })

const report = { title, triggerValue, dotInsideField, checkmarkCount }
await writeFile(
  path.join(outDir, 'annotation-popover-report.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))

if (checkmarkCount !== 0) throw new Error('Checkmark still rendered')
if (!dotInsideField) throw new Error('Dot is not inside the field container')
if (triggerValue !== 'Note') throw new Error(`Trigger shows "${triggerValue}", expected "Note"`)
if (!/^Comment ·/.test(title)) throw new Error(`Title is "${title}"`)

await browser.close()
