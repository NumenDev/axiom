import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
async function capture(page: Page, info: TestInfo, name: string) {
  await page.evaluate(() => document.fonts.ready)
  const image = await page.screenshot()
  await info.attach(name, { body: image, contentType: 'image/png' })
  if (process.env.AXIOM_SCREENSHOTS)
    await writeFile(path.join(process.env.AXIOM_SCREENSHOTS, name + '.png'), image)
}
async function open(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open workbench' }).click()
}
test('welcome, exact reading, AST selection, bindings, trace and clipboard', async ({
  page,
  context,
}, info) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page)
  const value = page.getByLabel('Exact result', { exact: true })
  const editor = page.getByLabel('Expression source')
  await editor.press('Control+Enter')
  await expect(value).toHaveText('25/2')
  await expect(page.locator('.math-preview math')).toHaveCount(1)
  await capture(page, info, 'expression-result')
  await page.getByRole('button', { name: 'Copy result' }).click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('25/2')
  await page.getByRole('button', { name: /Power #3/ }).click()
  const inspector = page.getByRole('complementary', { name: 'Inspector' })
  await expect(inspector).toContainText('Syntax node #3')
  await expect(inspector).toContainText('x^2')
  await page.getByTitle('Select range in editor').click()
  expect(
    await editor.evaluate((el: HTMLTextAreaElement) =>
      el.value.substring(el.selectionStart, el.selectionEnd),
    ),
  ).toBe('x^2')
  await page.locator('.analysis-view').scrollIntoViewIfNeeded()
  await capture(page, info, 'expression-tree')
  await editor.fill('3*y^2 + 1/2')
  await expect(value).toHaveCount(0)
  await editor.press('Control+Enter')
  await expect(page.getByRole('alert')).toContainText('unbound-variable')
  await expect(page.getByRole('list', { name: 'Syntax tree nodes' })).toBeVisible()
  await page.getByLabel('Binding for y').fill('1/0')
  await page.getByRole('button', { name: 'Evaluate', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('invalid-binding')
  await page.getByLabel('Binding for y').fill('2')
  await editor.press('Control+Enter')
  await expect(value).toHaveText('25/2')
  await page.getByRole('button', { name: 'Evaluation trace', exact: true }).click()
  await page.locator('.trace-list button').nth(3).click()
  await expect(inspector).toContainText('y^2')
  await page.locator('.trace-list button').last().scrollIntoViewIfNeeded()
  await capture(page, info, 'expression-trace')
  await page.getByLabel('Binding for y').fill('3')
  await expect(value).toHaveCount(0)
  await expect(page.locator('.trace-list')).toHaveCount(0)
  await editor.press('Control+Enter')
  await expect(value).toHaveText('55/2')
  await page.getByRole('button', { name: 'Logic Playground', exact: true }).click()
  await expect(page.getByLabel('Evaluated result')).toHaveText('False')
  await page.getByRole('tab', { name: 'Expression Workbench' }).click()
  await expect(value).toHaveText('55/2')
})
test('corrects syntax, diagnoses domains, and recovers from an oversized edit', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await open(page)
  const editor = page.getByLabel('Expression source')
  for (const [source, code] of [
    ['2x', 'unsupported-syntax'],
    ['(2+', 'syntax-error'],
    ['0^0', 'indeterminate-operation'],
    ['1/(2-2)', 'division-by-zero'],
  ]) {
    await editor.fill(source!)
    await editor.press('Control+Enter')
    await expect(page.getByRole('alert')).toContainText(code!)
  }
  await capture(page, info, 'expression-diagnostic')
  await editor.fill('2'.repeat(2050))
  await expect(page.getByRole('alert')).toContainText('Edit declined')
  await editor.press('Control+Enter')
  await expect(page.getByRole('alert')).toContainText('division-by-zero')
  await editor.fill('0.1 + 0.2')
  await editor.press('Control+Enter')
  await expect(page.getByLabel('Exact result', { exact: true })).toHaveText('3/10')
  await editor.fill('(-2)^2 / (2/3)')
  await editor.press('Control+Enter')
  await page.getByRole('button', { name: 'Evaluation trace', exact: true }).click()
  await expect(page.locator('.trace-list')).toContainText('(-2) ^ 2')
  await expect(page.locator('.trace-list')).toContainText('4 ÷ (2/3)')
  expect(errors).toEqual([])
})
test('keyboard-only reduced workspace supports commands, evaluation, inspection and drawers', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 720, height: 540 })
  await page.goto('/')
  await expect(page.getByText('Local preferences', { exact: true })).toBeVisible()
  await page.keyboard.press('Control+k')
  await page.keyboard.type('Expression Workbench')
  await page.keyboard.press('Enter')
  const editor = page.getByLabel('Expression source')
  async function tabTo(locator: ReturnType<typeof page.getByLabel>) {
    for (let i = 0; i < 70; i++) {
      if (await locator.evaluate((el) => el === document.activeElement)) return
      await page.keyboard.press('Tab')
    }
    throw Error('Control unreachable by Tab')
  }
  await tabTo(editor)
  await page.keyboard.press('Control+a')
  await page.keyboard.type('2^-3')
  await page.keyboard.press('Control+Enter')
  await expect(page.getByLabel('Exact result', { exact: true })).toHaveText('1/8')
  await capture(page, info, 'expression-reduced')
  const treeNode = page.getByRole('button', { name: /Negation #/ })
  await tabTo(treeNode)
  await page.keyboard.press('Space')
  const toggle = page.getByRole('button', { name: 'Toggle inspector', exact: true })
  await tabTo(toggle)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toContainText('Negation')
  await page.keyboard.press('Escape')
  await expect(toggle).toBeFocused()
  expect(await page.locator('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})
test('large valid trees and deep notation remain inspectable', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await open(page)
  function balanced(count: number): string {
    if (count === 1) return '1'
    const left = count >> 1
    return '(' + balanced(left) + '+' + balanced(count - left) + ')'
  }
  const editor = page.getByLabel('Expression source')
  for (const source of [
    balanced(64) + '+' + balanced(22),
    '1/('.repeat(15) + '1' + ')'.repeat(15),
    'a_1 + __proto__',
    Array(30).fill('1').join('^'),
  ]) {
    await editor.fill(source)
    await expect(page.locator('.math-preview math')).toHaveCount(1)
    expect(await page.locator('.katex-error').count()).toBe(0)
    if (!source.includes('a_1')) {
      await editor.press('Control+Enter')
      await expect(page.getByLabel('Exact result', { exact: true })).toHaveCount(1)
    }
  }
  expect(errors).toEqual([])
})
