import { chromium } from 'playwright'

const BASE = 'http://localhost:5176'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })

async function openHandoff(fromId, toName, expectedStatus) {
  await page.goto(`${BASE}/#/check-return`, { waitUntil: 'networkidle' })
  await page.evaluate((currentUserId) => {
    const state = {
      assigneeId: currentUserId,
      currentUserId,
      statusId: currentUserId === 'sarah' ? 'preparation' : 'review',
    }
    localStorage.setItem('protoc3-return-workflow', JSON.stringify(state))
  }, fromId)
  await page.reload({ waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'Select assignee' }).click()
  await page.getByRole('option', { name: toName }).click()

  await page.getByText(`Hand off return to ${toName}`).waitFor()
  await page.getByText(`Add optional notes for ${toName} and review the AI summary before you send.`).waitFor()
  await page.getByText(`Update return status to ${expectedStatus}`).waitFor()
  await page.getByLabel(`Notes for ${toName.split(' ')[0]}`).waitFor()
  await page.getByText('Notes appear in comments and the reviewer summary.').waitFor()
  await page.getByText(`Quick summary for ${toName}`).waitFor()
  await page.getByRole('button', { name: 'Cancel handoff' }).waitFor()
  await page.getByRole('button', { name: 'Hand off return' }).waitFor()
}

await openHandoff('jake', 'Sarah Chen', 'return preparation')
await page.screenshot({ path: 'qa-shots/handoff-modal-sarah.png' })
await page.getByRole('button', { name: 'Close' }).click()
await page.getByText('Hand off return to Sarah Chen').waitFor({ state: 'detached' })
const afterCancel = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('protoc3-return-workflow')),
)
if (afterCancel.assigneeId !== 'jake') throw new Error('Close applied the handoff')

await openHandoff('sarah', 'Jake Morrison', 'review')
await page.screenshot({ path: 'qa-shots/handoff-modal-jake.png' })
await page.getByRole('button', { name: 'Hand off return' }).click()
const afterAssign = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('protoc3-return-workflow')),
)
if (afterAssign.assigneeId !== 'jake' || afterAssign.statusId !== 'review') {
  throw new Error('Recipient or suggested status was not applied')
}

console.log('PASS: recipient copy follows the selected handoff in both directions')
await browser.close()
