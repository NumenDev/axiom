import { useState } from 'react'
import {
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDot,
  Database,
  Folder,
  FolderOpen,
  HardDrive,
  Info,
  Keyboard,
  Layers3,
  ListTree,
  Monitor,
  PanelRightClose,
  SlidersHorizontal,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { pages, type OpenPage, type Page } from './navigation'
import { Formula, IconButton } from './primitives'
import { evaluate } from '../domain/logic'
import { logicText } from './logicText'
import { truth, type LogicState } from './Logic'
import { desktop } from '../application/preferences'
import { modules } from '../application/modules'
import manifest from '../../package.json'

export function Explorer({ active, open }: { active: Page; open: OpenPage }) {
  const [expanded, setExpanded] = useState({ workspace: true, resources: true, discrete: true })
  function group(key: keyof typeof expanded, label: string, Icon: LucideIcon) {
    const Twist = expanded[key] ? ChevronDown : ChevronRight
    return (
      <button
        aria-expanded={expanded[key]}
        className={'group-toggle ' + (key === 'discrete' ? 'subgroup' : '')}
        onClick={() => setExpanded((v) => ({ ...v, [key]: !v[key] }))}
      >
        <Twist size={13} />
        <Icon size={15} />
        {label}
      </button>
    )
  }
  function item(id: Page, child = false) {
    const { icon: Icon, title } = pages[id]
    return (
      <button
        key={id}
        className={'tree-item ' + (child ? 'deep ' : '') + (id === active ? 'active' : '')}
        aria-current={id === active ? 'page' : undefined}
        onClick={() => open(id)}
      >
        <Icon size={15} />
        {title}
      </button>
    )
  }
  return (
    <>
      <div className="panel-title">
        <span>Explorer</span>
        <ListTree size={15} />
      </div>
      <div className="tree">
        {group('workspace', 'Local workspace', FolderOpen)}
        {expanded.workspace && (
          <div className="tree-branch">
            {item('welcome')}
            {group('discrete', 'Discrete mathematics', Folder)}
            {expanded.discrete && modules.map((m) => item(m.id, true))}
          </div>
        )}
        {group('resources', 'Resources', BookOpen)}
        {expanded.resources && (
          <div className="tree-branch">
            {item('guide')}
            {item('roadmap')}
          </div>
        )}
      </div>
      <div className="explorer-foot">
        <HardDrive size={16} />
        <div>
          <strong>Local workspace</strong>
          <small>On this device</small>
        </div>
        <span className="live-dot" />
      </div>
    </>
  )
}
function Property({ name, value }: { name: string; value: string }) {
  return (
    <div>
      <dt>{name}</dt>
      <dd>{value}</dd>
    </div>
  )
}
export function Inspector({
  active,
  state,
  close,
}: {
  active: Page
  state: LogicState
  close: () => void
}) {
  const isLogic = active === 'logic'
  const spec = logicText[state.op]
  const result = evaluate(state.op, state.assignment)
  const Glyph = isLogic ? Workflow : Layers3
  return (
    <>
      <div className="panel-title">
        <span>Inspector</span>
        <IconButton label="Hide inspector" icon={PanelRightClose} onClick={close} />
      </div>
      <div className="inspector-body">
        <section className="inspect-block">
          <div className="eyebrow">
            <Info size={13} />
            {isLogic ? 'Selection' : 'Overview'}
          </div>
          <div className="object-name">
            <span className="object-icon">
              <Glyph size={19} />
            </span>
            <div>
              <strong>{isLogic ? spec.name : 'Local workspace'}</strong>
              <small>{isLogic ? 'Logical operator' : 'Workspace properties'}</small>
            </div>
          </div>
          <dl className="properties">
            {isLogic ? (
              <>
                <Property name="Domain" value="Boolean" />
                <Property name="Arity" value={spec.arity} />
                <Property name="Result kind" value="Exact" />
                <Property name="Engine" value={result.engine} />
              </>
            ) : (
              <>
                <Property name="Environment" value={desktop ? 'Desktop' : 'Web preview'} />
                <Property name="Storage" value={desktop ? 'SQLite' : 'Browser local'} />
                <Property name="Version" value={'v' + manifest.version} />
              </>
            )}
          </dl>
        </section>
        <section className="inspect-block">
          <div className="eyebrow">
            {isLogic ? <CircleDot size={13} /> : <Boxes size={14} />}{' '}
            {isLogic ? 'Evaluation' : 'Environment index'}
          </div>
          {isLogic ? (
            <>
              <div className="inspect-equation">
                <Formula tex={spec.tex} />
              </div>
              <dl className="properties">
                <Property name="P" value={truth(state.assignment.p)} />
                <Property name="Q" value={truth(state.assignment.q)} />
                <Property name="Truth value" value={truth(result.value)} />
              </dl>
            </>
          ) : (
            modules.map((m) => (
              <div key={m.id} className="index-entry">
                <span className="live-dot" />
                <div>
                  <strong>{m.name}</strong>
                  <small>{m.field}</small>
                </div>
              </div>
            ))
          )}
        </section>
        <section className="inspect-block">
          <div className="eyebrow">
            {isLogic ? <SlidersHorizontal size={13} /> : <Keyboard size={14} />}{' '}
            {isLogic ? 'Assumptions' : 'Shortcuts'}
          </div>
          {isLogic ? (
            <p>
              Classical two-valued semantics. P and Q vary independently over the Boolean domain.
            </p>
          ) : (
            <dl className="key-list">
              <div>
                <dt>Commands</dt>
                <dd>
                  <kbd>⌘ / Ctrl K</kbd>
                </dd>
              </div>
              <div>
                <dt>Explorer</dt>
                <dd>
                  <kbd>⌘ / Ctrl B</kbd>
                </dd>
              </div>
              <div>
                <dt>Session log</dt>
                <dd>
                  <kbd>⌘ / Ctrl J</kbd>
                </dd>
              </div>
            </dl>
          )}
        </section>
      </div>
    </>
  )
}

export function Status({ notice, active }: { notice: string; active: Page }) {
  return (
    <footer className="status">
      <span>
        <i className="live-dot" />
        Local session
      </span>
      <span className="status-path">
        <Monitor size={12} />
        {pages[active].title}
      </span>
      <span className="status-end">
        <Database size={12} />
        {notice}
      </span>
      <span>
        <Circle size={8} />v{manifest.version}
      </span>
    </footer>
  )
}
