import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { IconButton } from './primitives'
import { pages, type OpenPage, type Page } from './navigation'
import { defaults, type Preferences } from '../application/preferences'

export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const node = ref.current
    const trigger = document.activeElement
    node?.showModal()
    node?.querySelector<HTMLElement>('[data-initial-focus]')?.focus()
    return () => {
      node?.close()
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="dialog-body">
        <div className="dialog-head">
          <h2>{title}</h2>
          <IconButton label="Close dialog" icon={X} onClick={onClose} />
        </div>
        {children}
      </div>
    </dialog>
  )
}

export function Commands({
  open,
  settings,
  close,
  toggleLog,
}: {
  open: OpenPage
  settings: () => void
  close: () => void
  toggleLog: () => void
}) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const commands = [
    ...(Object.keys(pages) as Page[]).map((id) => ({
      title: pages[id].title,
      run: () => {
        close()
        open(id)
      },
    })),
    { title: 'Workspace preferences', run: settings },
    {
      title: 'Toggle session log',
      run: () => {
        close()
        toggleLog()
      },
    },
  ]
  const found = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.trim().toLowerCase()),
  )
  return (
    <Dialog title="Command palette" onClose={close}>
      <div className="command-input">
        <Search size={16} />
        <input
          data-initial-focus
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls="command-options"
          aria-activedescendant={found[cursor] ? 'command-option-' + cursor : undefined}
          aria-label="Find a command"
          placeholder="Find a page or command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCursor(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              setCursor((i) =>
                found.length
                  ? (i + (e.key === 'ArrowDown' ? 1 : -1) + found.length) % found.length
                  : 0,
              )
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              found[cursor]?.run()
            }
          }}
        />
      </div>
      <div
        className="command-results"
        role="listbox"
        id="command-options"
        aria-label="Matching commands"
      >
        {found.map((c, i) => (
          <button
            role="option"
            id={'command-option-' + i}
            aria-selected={i === cursor}
            tabIndex={-1}
            className={i === cursor ? 'chosen' : ''}
            key={c.title}
            onClick={c.run}
          >
            {c.title}
            <ArrowRight size={14} />
          </button>
        ))}
        {!found.length && <p>No matching commands.</p>}
      </div>
    </Dialog>
  )
}
export function Settings({
  layout,
  change,
  close,
}: {
  layout: Preferences
  change: (p: Preferences) => void
  close: () => void
}) {
  return (
    <Dialog title="Workspace preferences" onClose={close}>
      <div className="settings">
        {(
          [
            ['explorer', 'Dock explorer on wide windows'],
            ['inspector', 'Dock inspector on wide windows'],
            ['console', 'Session log'],
            ['compact', 'Compact spacing'],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="checkbox"
              checked={layout[key]}
              onChange={(e) => change({ ...layout, [key]: e.target.checked })}
            />
          </label>
        ))}
        <button className="secondary" onClick={() => change({ ...defaults })}>
          Restore default layout
        </button>
      </div>
    </Dialog>
  )
}
