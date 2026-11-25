import { test, expect } from '@playwright/test'

test('welcome, evaluation, reference navigation and keyboard commands', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Welcome to AXIOM' })).toBeVisible()
  await page.getByRole('button', { name: 'Open playground' }).click()
  await page.getByLabel('Operator', { exact: true }).selectOption('implies')
  await expect(page.getByLabel('Evaluated result')).toHaveText('False')
  await page.getByRole('switch', { name: 'P' }).press('Space')
  await expect(page.getByLabel('Evaluated result')).toHaveText('True')
  await expect(page.locator('tr[aria-current=true]')).toContainText('04')
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('combobox', { name: 'Find a command' })).toBeFocused()
  await page.keyboard.type('guide')
  await page.getByRole('combobox', { name: 'Find a command' }).press('Enter')
  await expect(page.getByRole('heading', { name: 'Workspace guide' })).toBeVisible()
  await page.getByRole('button', { name: 'Close Workspace guide' }).click()
  await expect(page.getByRole('tab', { name: 'Logic Playground' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(errors).toEqual([])
})

test('panel preferences and keyboard resize survive reload', async ({ page }) => {
  await page.goto('/')
  const split = page.getByRole('separator', { name: 'Explorer width' })
  await split.press('ArrowRight')
  await expect(split).toHaveAttribute('aria-valuenow', '250')
  await page.getByRole('button', { name: 'Hide inspector', exact: true }).click()
  await page.keyboard.press('Control+j')
  await expect(page.getByRole('region', { name: 'Session log' })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('axiom.preferences.v1') ?? '{}').console),
    )
    .toBe(true)
  await page.reload()
  await expect(page.getByRole('region', { name: 'Session log' })).toBeVisible()
  await expect(split).toHaveAttribute('aria-valuenow', '250')
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toHaveCount(0)
})

test('smaller windows expose panel drawers and a usable table', async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 540 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Toggle explorer', exact: true }).click()
  await page.getByRole('button', { name: 'Logic Playground', exact: true }).click()
  await expect(page.getByRole('table')).toBeVisible()
  await page.getByRole('button', { name: 'Toggle inspector', exact: true }).click()
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toContainText('Boolean')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})
