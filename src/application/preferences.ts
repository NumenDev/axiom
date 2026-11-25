import { invoke, isTauri } from '@tauri-apps/api/core'

export const defaults = {
  version: 1 as const,
  explorer: true,
  inspector: true,
  console: false,
  explorerWidth: 238,
  inspectorWidth: 268,
  consoleHeight: 146,
  compact: false,
}
export type Preferences = typeof defaults
export type SizeKey = 'explorerWidth' | 'inspectorWidth' | 'consoleHeight'
export const bounds: Record<SizeKey, readonly [number, number]> = {
  explorerWidth: [190, 320],
  inspectorWidth: [224, 350],
  consoleHeight: [96, 270],
}
export function clampSize(key: SizeKey, value: number) {
  const [min, max] = bounds[key]
  return Math.min(max, Math.max(min, Math.round(value)))
}
export function decode(value: unknown): Preferences {
  const next = { ...defaults }
  if (!value || typeof value !== 'object') return next
  const record = value as Record<string, unknown>
  if (typeof record.version === 'number' && record.version > 1)
    throw new Error('Newer preferences version')
  if (record.version !== 1) return next
  for (const key of ['explorer', 'inspector', 'console', 'compact'] as const) {
    if (typeof record[key] === 'boolean') next[key] = record[key]
  }
  for (const key of ['explorerWidth', 'inspectorWidth', 'consoleHeight'] as const) {
    const size = record[key]
    if (typeof size === 'number' && Number.isFinite(size)) next[key] = clampSize(key, size)
  }
  return next
}
const storageKey = 'axiom.preferences.v1'
export const desktop = isTauri()
export interface PreferenceStore {
  load(): Promise<Preferences>
  save(value: Preferences): Promise<void>
}
function loadBrowserPreferences() {
  const raw = localStorage.getItem(storageKey)
  let parsed: unknown = null
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { ...defaults }
    }
  }
  return decode(parsed)
}
export const preferences: PreferenceStore = {
  async load() {
    if (desktop) return decode(await invoke('load_preferences'))
    return loadBrowserPreferences()
  },
  async save(value) {
    if (desktop) await invoke('save_preferences', { preferences: value })
    else {
      loadBrowserPreferences()
      localStorage.setItem(storageKey, JSON.stringify(value))
    }
  },
}
