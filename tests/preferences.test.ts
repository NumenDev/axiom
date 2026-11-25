import { it, expect } from 'vitest'
import { decode, defaults, preferences } from '../src/application/preferences'
it('restores defaults for missing, old, malformed or out-of-range fields', () => {
  expect(decode(null)).toEqual(defaults)
  expect(decode({ version: 0 })).toEqual(defaults)
  expect(
    decode({
      version: 1,
      explorer: false,
      consoleHeight: 1,
      inspectorWidth: 10000,
      explorerWidth: NaN,
      compact: 'true',
    }),
  ).toEqual({ ...defaults, explorer: false, consoleHeight: 96, inspectorWidth: 350 })
})
it('round trips local preferences and recovers from malformed JSON', async () => {
  expect(await preferences.load()).toEqual(defaults)
  await preferences.save({ ...defaults, console: true })
  expect(await preferences.load()).toEqual({ ...defaults, console: true })
  localStorage.setItem('axiom.preferences.v1', '{')
  expect(await preferences.load()).toEqual(defaults)
})
it('preserves a newer preferences document', async () => {
  localStorage.setItem('axiom.preferences.v1', '{"version":2}')
  await expect(preferences.load()).rejects.toThrow()
  await expect(preferences.save(defaults)).rejects.toThrow()
  expect(localStorage.getItem('axiom.preferences.v1')).toBe('{"version":2}')
})
