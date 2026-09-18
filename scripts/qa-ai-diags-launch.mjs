import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto('http://localhost:5176/#/check-return', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Launch points' }).click()
await page.getByRole('button', { name: /AI Diags/ }).click()

await page.waitForURL(/check-return\?experience=ai-diags/)
await page.getByRole('heading', { name: 'Return review by Intuit Intelligence' }).waitFor()
await page.getByRole('button', { name: /^AI review \d+$/ }).waitFor()
await page.screenshot({ path: 'qa-shots/ai-diags-launch.png', fullPage: true })

console.log(`route: ${page.url()}`)
console.log('PASS')
await browser.close()
