import { useMemo, type ButtonHTMLAttributes, type PointerEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import katex from 'katex'
import { bounds, clampSize, type SizeKey } from '../application/preferences'

export function IconButton({
  label,
  icon: Icon,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: LucideIcon }) {
  return (
    <button type="button" className="icon-button" title={label} aria-label={label} {...props}>
      <Icon size={16} />
    </button>
  )
}

export function Formula({ tex }: { tex: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { trust: false, strict: 'error', output: 'htmlAndMathml' }),
    [tex],
  )
  return <span className="formula" dangerouslySetInnerHTML={{ __html: html }} />
}
export function Splitter({
  name,
  sizeKey,
  value,
  onChange,
}: {
  name: string
  sizeKey: SizeKey
  value: number
  onChange: (n: number) => void
}) {
  const horizontal = sizeKey === 'consoleHeight'
  const sign = sizeKey === 'explorerWidth' ? 1 : -1
  function drag(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const el = e.currentTarget
    const origin = horizontal ? e.clientY : e.clientX
    const move = (p: globalThis.PointerEvent) =>
      onChange(clampSize(sizeKey, value + sign * ((horizontal ? p.clientY : p.clientX) - origin)))
    const stop = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('lostpointercapture', stop)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('lostpointercapture', stop)
  }
  return (
    <div
      role="separator"
      className={'splitter ' + (horizontal ? 'horizontal' : 'vertical')}
      aria-label={name}
      tabIndex={0}
      aria-valuemin={bounds[sizeKey][0]}
      aria-valuemax={bounds[sizeKey][1]}
      aria-valuenow={value}
      aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      onPointerDown={drag}
      onKeyDown={(e) => {
        const keys = horizontal ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']
        const direction = keys.indexOf(e.key)
        if (direction >= 0) {
          e.preventDefault()
          onChange(clampSize(sizeKey, value + sign * (direction ? 12 : -12)))
        }
      }}
    />
  )
}
