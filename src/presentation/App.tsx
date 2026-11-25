import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import {
  BookOpen,
  ChevronRight,
  Command,
  Files,
  FolderClosed,
  Map,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Search,
  Settings2,
  Terminal,
  X,
} from 'lucide-react'
import { usePreferences } from './usePreferences'
import { type SizeKey } from '../application/preferences'
import { Commands, Settings } from './Dialog'
import { Logic, initialLogic, type LogicState, truth } from './Logic'
import { logicText } from './logicText'
import { Explorer, Inspector, Status } from './Panels'
import { Reference } from './Reference'
import { Welcome } from './Welcome'
import { pages, type Page } from './navigation'
import { IconButton, Splitter } from './primitives'

function useNarrow(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const sync = () => setMatch(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [query])
  return match
}
const makeEvent = (message: string) => ({ message, time: new Date() })
export default function App() {
  const { layout, setLayout, status } = usePreferences()
  const [active, setActive] = useState<Page>('welcome')
  const [tabs, setTabs] = useState<Page[]>(['welcome'])
  const [logic, setLogic] = useState(initialLogic)
  const [dialog, setDialog] = useState<'commands' | 'settings' | null>(null)
  const [drawer, setDrawer] = useState<'explorer' | 'inspector' | null>(null)
  const [events, setEvents] = useState(() => [makeEvent('Local workspace opened.')])
  const drawerTrigger = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (drawer) document.querySelector<HTMLElement>('.side.drawer button')?.focus()
  }, [drawer])
  const content = useRef<HTMLElement>(null)
  const narrowExplorer = useNarrow('(max-width: 800px)')
  const narrowInspector = useNarrow('(max-width: 1120px)')
  const explorer = narrowExplorer ? drawer === 'explorer' : layout.explorer
  const inspector = narrowInspector ? drawer === 'inspector' : layout.inspector
  const note = useCallback(
    (message: string) => setEvents((prev) => [...prev.slice(-99), makeEvent(message)]),
    [],
  )
  const focusRequested = useRef(false)
  const focusContent = () => {
    focusRequested.current = true
  }
  useLayoutEffect(() => {
    if (focusRequested.current) {
      focusRequested.current = false
      content.current?.focus()
    }
  })
  const open = useCallback((id: Page) => {
    setTabs((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setActive(id)
    setDrawer(null)
    focusContent()
  }, [])
  useEffect(() => {
    if (content.current) content.current.scrollTop = 0
  }, [active])
  function closeTab(id: Page) {
    if (id === 'welcome') return
    const others = tabs.filter((p) => p !== id)
    setTabs(others)
    if (id === active) open(others[Math.max(0, tabs.indexOf(id) - 1)] ?? 'welcome')
  }
  const toggle = useCallback(
    (key: 'explorer' | 'inspector' | 'console') => {
      if ((key === 'explorer' && narrowExplorer) || (key === 'inspector' && narrowInspector)) {
        if (!drawer && document.activeElement instanceof HTMLElement)
          drawerTrigger.current = document.activeElement
        if (drawer === key) drawerTrigger.current?.focus()
        setDrawer((v) => (v === key ? null : key))
      } else setLayout((v) => ({ ...v, [key]: !v[key] }))
    },
    [narrowExplorer, narrowInspector, setLayout, drawer],
  )
  useEffect(() => {
    function keys(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && drawer) {
        setDrawer(null)
        drawerTrigger.current?.focus()
        return
      }
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (key === 'k') {
        e.preventDefault()
        setDialog((v) => (v === 'commands' ? null : 'commands'))
      }
      if (!dialog && (key === 'b' || key === 'j')) {
        e.preventDefault()
        toggle(key === 'b' ? 'explorer' : 'console')
      }
    }
    window.addEventListener('keydown', keys)
    return () => window.removeEventListener('keydown', keys)
  }, [dialog, drawer, toggle])
  function resize(key: SizeKey, value: number) {
    setLayout((prev) => ({ ...prev, [key]: value }))
  }
  function navigateTabs(e: KeyboardEvent, id: Page) {
    const at = tabs.indexOf(id)
    const targets: Record<string, number> = {
      ArrowLeft: (at - 1 + tabs.length) % tabs.length,
      ArrowRight: (at + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }
    if (e.key === 'Delete' && id !== 'welcome') {
      e.preventDefault()
      closeTab(id)
      return
    }
    const index = targets[e.key]
    if (index === undefined) return
    e.preventDefault()
    const next = tabs[index]!
    setActive(next)
    document.getElementById('tab-' + next)?.focus()
  }
  function changeLogic(next: LogicState) {
    setLogic(next)
    note(
      logicText[next.op].name +
        ' evaluated · P = ' +
        truth(next.assignment.p) +
        ', Q = ' +
        truth(next.assignment.q) +
        '.',
    )
  }
  const storageLabel = {
    loading: 'Loading preferences',
    ready: 'Local preferences',
    session: 'Session only · storage unavailable',
    error: 'Preferences could not be saved',
  }[status]
  const style = {
    '--left': explorer && !narrowExplorer ? layout.explorerWidth + 'px' : '0px',
    '--right': inspector && !narrowInspector ? layout.inspectorWidth + 'px' : '0px',
    '--log-height': layout.console ? layout.consoleHeight + 'px' : '0px',
  } as CSSProperties
  const ViewIcon = pages[active].icon
  return (
    <div
      inert={status === 'loading'}
      aria-busy={status === 'loading'}
      className={'app' + (layout.compact ? ' compact' : '')}
      style={style}
    >
      <header className="topbar">
        <div className="brand">
          <img src="/axiom.svg" alt="" width="27" height="27" />
          <strong>AXIOM</strong>
        </div>
        <span className="product-name">Mathematical Research Environment</span>
        <div className="bar-actions">
          <button className="command-trigger" onClick={() => setDialog('commands')}>
            <Search size={14} />
            <span>Command palette</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="layout-buttons">
            <IconButton
              label="Toggle explorer"
              aria-pressed={explorer}
              icon={PanelLeft}
              onClick={() => toggle('explorer')}
            />
            <IconButton
              label="Toggle session log"
              aria-pressed={layout.console}
              icon={PanelBottom}
              onClick={() => toggle('console')}
            />
            <IconButton
              label="Toggle inspector"
              aria-pressed={inspector}
              icon={PanelRight}
              onClick={() => toggle('inspector')}
            />
          </div>
        </div>
      </header>
      <nav className="activity" aria-label="Activity bar">
        <IconButton
          label="Workspace explorer"
          icon={Files}
          aria-pressed={explorer}
          onClick={() => toggle('explorer')}
        />
        <IconButton label="Open workspace guide" icon={BookOpen} onClick={() => open('guide')} />
        <IconButton label="Open module roadmap" icon={Map} onClick={() => open('roadmap')} />
        <div className="activity-bottom">
          <IconButton label="Open commands" icon={Command} onClick={() => setDialog('commands')} />
          <IconButton
            label="Preferences"
            icon={Settings2}
            disabled={status === 'loading'}
            onClick={() => setDialog('settings')}
          />
        </div>
      </nav>
      {drawer &&
        ((narrowExplorer && drawer === 'explorer') ||
          (narrowInspector && drawer === 'inspector')) && (
          <button
            className="scrim"
            aria-label="Close panel"
            onClick={() => {
              setDrawer(null)
              focusContent()
            }}
          />
        )}
      {explorer && (
        <aside
          aria-label="Workspace explorer"
          className={'explorer side' + (narrowExplorer ? ' drawer' : '')}
        >
          <Explorer active={active} open={open} />
          {!narrowExplorer && (
            <Splitter
              name="Explorer width"
              sizeKey="explorerWidth"
              value={layout.explorerWidth}
              onChange={(v) => resize('explorerWidth', v)}
            />
          )}
        </aside>
      )}
      <section className="workbench" aria-label="Workspace">
        <div className="tabstrip" role="tablist" aria-label="Open pages">
          {tabs.map((id) => {
            const Icon = pages[id].icon
            return (
              <div className={'tab-wrap ' + (id === active ? 'selected' : '')} key={id}>
                <button
                  role="tab"
                  id={'tab-' + id}
                  aria-selected={id === active}
                  aria-controls={'pane-' + id}
                  tabIndex={id === active ? 0 : -1}
                  onKeyDown={(e) => navigateTabs(e, id)}
                  onClick={() => {
                    setActive(id)
                    setDrawer(null)
                  }}
                >
                  <Icon size={14} />
                  {pages[id].title}
                </button>
                {id !== 'welcome' && (
                  <IconButton
                    icon={X}
                    label={'Close ' + pages[id].title}
                    onClick={() => closeTab(id)}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="breadcrumb">
          <FolderClosed size={13} />
          <span>Local workspace</span>
          <ChevronRight size={12} />
          <ViewIcon size={13} />
          <span>{pages[active].title}</span>
        </div>
        {tabs
          .filter((id) => id !== active)
          .map((id) => (
            <div role="tabpanel" id={'pane-' + id} aria-labelledby={'tab-' + id} hidden key={id} />
          ))}
        <main ref={content} tabIndex={-1} aria-label={pages[active].title}>
          <div role="tabpanel" id={'pane-' + active} aria-labelledby={'tab-' + active}>
            {active === 'welcome' ? (
              <Welcome open={open} />
            ) : active === 'logic' ? (
              <Logic state={logic} update={changeLogic} />
            ) : (
              <Reference roadmap={active === 'roadmap'} />
            )}
          </div>
        </main>
        {layout.console && (
          <section className="session-log" aria-label="Session log">
            <Splitter
              name="Session log height"
              sizeKey="consoleHeight"
              value={layout.consoleHeight}
              onChange={(v) => resize('consoleHeight', v)}
            />
            <div className="log-head">
              <Terminal size={14} />
              Session log <span className="log-count">{events.length}</span>
              <IconButton label="Hide session log" icon={X} onClick={() => toggle('console')} />
            </div>
            <div className="log-lines">
              {events
                .slice()
                .reverse()
                .map((event, i) => (
                  <div key={events.length - i}>
                    <time>{event.time.toLocaleTimeString('en-GB', { hour12: false })}</time>
                    <span>{event.message}</span>
                  </div>
                ))}
            </div>
          </section>
        )}
      </section>
      {inspector && (
        <aside
          aria-label="Inspector"
          className={'inspector side' + (narrowInspector ? ' drawer' : '')}
        >
          <Inspector active={active} state={logic} close={() => toggle('inspector')} />
          {!narrowInspector && (
            <Splitter
              name="Inspector width"
              sizeKey="inspectorWidth"
              value={layout.inspectorWidth}
              onChange={(v) => resize('inspectorWidth', v)}
            />
          )}
        </aside>
      )}
      <Status notice={storageLabel} active={active} />
      {dialog === 'commands' && (
        <Commands
          open={open}
          close={() => setDialog(null)}
          settings={() => setDialog('settings')}
          toggleLog={() => toggle('console')}
        />
      )}
      {dialog === 'settings' && (
        <Settings layout={layout} change={setLayout} close={() => setDialog(null)} />
      )}
    </div>
  )
}
