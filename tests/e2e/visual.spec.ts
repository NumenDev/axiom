import { test, expect } from '@playwright/test'
import path from 'node:path'

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [1024, 768],
  [720, 540],
] as const) {
  test('renders welcome and logic at ' + width + ' × ' + height, async ({ page }, info) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(page.getByText('Local preferences', { exact: true })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    for (const view of ['welcome', 'logic']) {
      if (view === 'logic') {
        await page.getByRole('button', { name: 'Open playground' }).click()
        await page.getByLabel('Operator', { exact: true }).selectOption('implies')
        await expect(page.getByLabel('Evaluated result')).toHaveText('False')
      }
      expect(await page.locator('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
        true,
      )
      const image = await page.screenshot()
      await info.attach(view + '-' + width, { body: image, contentType: 'image/png' })
      if (process.env.AXIOM_SCREENSHOTS) {
        const { writeFile } = await import('node:fs/promises')
        await writeFile(
          path.join(process.env.AXIOM_SCREENSHOTS, view + '-' + width + '.png'),
          image,
        )
      }
    }
  })
}
