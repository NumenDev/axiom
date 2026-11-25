import { expect, it } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/presentation/App'
import { logicText } from '../src/presentation/logicText'
import { operators } from '../src/domain/logic'
it('connects each operator, both switches, selected rows, and exact results', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Open playground' }))
  const result = screen.getByLabelText('Evaluated result')
  expect(result).toHaveTextContent('False')
  await user.click(screen.getByRole('switch', { name: 'Q' }))
  expect(result).toHaveTextContent('True')
  for (const op of operators) {
    await user.selectOptions(screen.getByLabelText('Operator', { exact: true }), op)
    expect(screen.getByRole('table')).toHaveAccessibleName(new RegExp(logicText[op].name))
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(5)
  }
  await user.click(screen.getByTitle('Select assignment 3'))
  expect(screen.getByRole('switch', { name: 'P' })).not.toBeChecked()
  expect(screen.getByRole('switch', { name: 'Q' })).toBeChecked()
  expect(screen.getByRole('row', { current: true })).toHaveTextContent('03Selected')
  expect(result).toHaveTextContent('False')
  await user.click(screen.getByLabelText('Toggle session log'))
  expect(screen.getByRole('region', { name: 'Session log' })).toHaveTextContent(
    'Biconditional evaluated',
  )
})
it('navigates through commands and tabs and restores focus when a dialog closes', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /Command palette/ }))
  await user.type(screen.getByRole('combobox', { name: 'Find a command' }), 'roadmap{Enter}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Module roadmap' })).toBeVisible()
  await user.click(screen.getByRole('tab', { name: 'Module roadmap' }))
  await user.keyboard('{ArrowLeft}')
  expect(screen.getByRole('tab', { name: 'Welcome' })).toHaveFocus()
  await user.keyboard('{End}{Delete}')
  expect(screen.queryByRole('tab', { name: 'Module roadmap' })).toBeNull()
  const trigger = screen.getByRole('button', { name: 'Preferences' })
  await user.click(trigger)
  await user.click(screen.getByRole('checkbox', { name: 'Compact spacing' }))
  await user.click(screen.getByRole('button', { name: 'Close dialog' }))
  expect(trigger).toHaveFocus()
  await waitFor(() =>
    expect(localStorage.getItem('axiom.preferences.v1')).toContain('"compact":true'),
  )
})
it('keeps computing when stored preferences require a newer client', async () => {
  localStorage.setItem('axiom.preferences.v1', '{"version":2}')
  const user = userEvent.setup()
  render(<App />)
  expect(await screen.findByText(/Session only/)).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Open playground' }))
  expect(screen.getByLabelText('Evaluated result')).toHaveTextContent('False')
  expect(localStorage.getItem('axiom.preferences.v1')).toBe('{"version":2}')
})
