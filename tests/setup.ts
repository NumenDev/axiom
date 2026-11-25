import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
const dom = (globalThis as typeof globalThis & { jsdom: { window: Window } }).jsdom
vi.stubGlobal('localStorage', dom.window.localStorage)
afterEach(() => {
  cleanup()
  localStorage.clear()
})
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (media: string) => ({
    media,
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }),
})
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}
