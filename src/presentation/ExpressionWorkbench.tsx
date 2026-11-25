import { useRef, useState } from 'react'
import {
  Braces,
  Check,
  Copy,
  CornerDownLeft,
  GitBranch,
  ListOrdered,
  Play,
  ScanLine,
  TriangleAlert,
} from 'lucide-react'
import { engine, limits, type Expression, type Span } from '../domain/expression/contracts'
import { bindingValue, type Step } from '../domain/expression/evaluate'
import { examples, exactText, nodeLabel, notation, type Session } from './expressionModel'
import { Formula } from './primitives'
import './expression.css'

function SyntaxTree({
  expr,
  selected,
  select,
}: {
  expr: Expression
  selected: number
  select: (id: number) => void
}) {
  function branch(id: number, depth: number) {
    const n = expr.nodes[id]!
    const children = n.kind === 'binary' ? [n.left, n.right] : 'child' in n ? [n.child] : []
    const label = nodeLabel(n),
      token =
        'op' in n ? n.op : n.kind === 'group' ? '( )' : expr.source.slice(n.span.start, n.span.end)
    const button = (
      <button type="button" aria-pressed={id === selected} onClick={() => select(id)}>
        <code>{token}</code>
        <span>{label}</span>
        <small>#{id}</small>
      </button>
    )
    return (
      <li key={id}>
        {button}
        {children.length > 0 &&
          (expr.nodes.length > 35 && depth >= 2 ? (
            <details>
              <summary>Operands</summary>
              <ul>{children.map((child) => branch(child, depth + 1))}</ul>
            </details>
          ) : (
            <ul>{children.map((child) => branch(child, depth + 1))}</ul>
          ))}
      </li>
    )
  }
  return (
    <ul className="syntax-tree" aria-label="Syntax tree nodes">
      {branch(expr.nodes.length - 1, 0)}
    </ul>
  )
}
const symbols = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  '^': '^',
  negate: '−',
  positive: '+',
  literal: 'Literal',
  substitute: 'Bind',
}
function Trace({
  steps,
  expr,
  selected,
  select,
}: {
  steps: Step[]
  expr: Expression
  selected: number
  select: (id: number) => void
}) {
  const [count, setCount] = useState(12)
  return (
    <>
      <ol className="trace-list">
        {steps.slice(0, count).map((step, i) => {
          const symbol = symbols[step.operation]
          const operation =
            step.inputs.length === 2
              ? step.inputs.map(exactText).join(' ' + symbol + ' ')
              : step.inputs.length === 1
                ? symbol + '(' + exactText(step.inputs[0]!) + ')'
                : expr.source.slice(step.span.start, step.span.end)
          return (
            <li key={step.node}>
              <button aria-pressed={step.node === selected} onClick={() => select(step.node)}>
                <small>{String(i + 1).padStart(2, '0')}</small>
                <span>{nodeLabel(expr.nodes[step.node]!)}</span>
                <code>{operation}</code>
                <span aria-label="yields">→</span>
                <strong>{exactText(step.output)}</strong>
              </button>
            </li>
          )
        })}
      </ol>
      {count < steps.length && (
        <button className="secondary" onClick={() => setCount(count + 12)}>
          Show more steps ({steps.length - count} remaining)
        </button>
      )}
    </>
  )
}
function CopyResult({ value }: { value: string }) {
  const [status, setStatus] = useState('')
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setStatus('Copied')
    } catch {
      setStatus('Select and copy the exact value below.')
    }
  }
  return (
    <span className="copy-result">
      <button className="secondary" onClick={copy}>
        {status === 'Copied' ? <Check size={13} /> : <Copy size={13} />}Copy result
      </button>
      <small role="status">{status}</small>
      {status && status !== 'Copied' && (
        <input
          aria-label="Copy exact value"
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
        />
      )}
    </span>
  )
}
export function ExpressionWorkbench({ s, note }: { s: Session; note: (message: string) => void }) {
  const [view, setView] = useState<'tree' | 'trace'>('tree')
  const editor = useRef<HTMLTextAreaElement>(null)
  const result = s.outcome?.ok ? s.outcome.value : null
  const selected = s.selection ?? (s.expr ? s.expr.nodes.length - 1 : -1)
  const span =
    s.error?.span ?? (s.selection !== null ? s.expr?.nodes[s.selection]?.span : undefined)
  function highlight(range: Span) {
    editor.current?.focus()
    editor.current?.setSelectionRange(range.start, range.end)
  }
  function evaluate() {
    note(s.evaluate() ? 'Exact expression evaluated.' : 'Expression needs attention.')
  }
  return (
    <article className="page expression-page">
      <div className="eyebrow mint">
        <Braces size={15} /> Mathematical foundations
      </div>
      <div className="expression-title">
        <h1>Expression Workbench</h1>
        <span className="meta">Session only</span>
      </div>
      <div className="example-line">
        <label>
          Example{' '}
          <select value={s.example ?? ''} onChange={(e) => s.load(Number(e.target.value))}>
            <option value="" disabled>
              Custom expression
            </option>
            {examples.map((item, i) => (
              <option key={item.name} value={i}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {s.example !== null && <p className="concept">{examples[s.example]!.explanation}</p>}
      </div>
      <div className="expression-sheet">
        <div className="editor-head">
          <label className="field-label" htmlFor="expression-source">
            Expression source
          </label>
          <details className="syntax-help">
            <summary>Syntax reference</summary>
            <p>
              Use + − * / ^ and parentheses. Type an ASCII hyphen for minus. Write 2*x for
              multiplication. Names use ASCII letters, digits and underscore and begin with a letter
              or underscore.
            </p>
          </details>
        </div>
        <textarea
          id="expression-source"
          ref={editor}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          rows={1}
          value={s.source}
          aria-invalid={!!s.error && !s.error.binding}
          aria-describedby={s.error ? 'expression-diagnostic' : undefined}
          onChange={(e) => s.edit(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              evaluate()
            }
          }}
        />
        {span && (
          <div className="source-location">
            <button onClick={() => highlight(span)} title="Select range in editor">
              <ScanLine size={14} /> [{span.start}, {span.end})
            </button>
            <code>
              {s.source.slice(Math.max(0, span.start - 16), span.start)}
              <mark>{s.source.slice(span.start, span.end) || '▏'}</mark>
              {s.source.slice(span.end, span.end + 16)}
            </code>
          </div>
        )}
        <div className="expression-controls">
          {s.names.length > 0 && (
            <div className="bindings">
              <span className="field-label">Bindings</span>
              {s.names.slice(0, limits.bindings).map((name) => {
                const value = s.bindings.find((b) => b.name === name)?.value ?? ''
                const invalid = value && !bindingValue(value).ok
                return (
                  <label key={name}>
                    <code>{name} =</code>
                    <input
                      aria-label={'Binding for ' + name}
                      value={value}
                      placeholder="Required"
                      aria-invalid={!!invalid}
                      onChange={(e) => s.bind(name, e.target.value)}
                      maxLength={2 * limits.digits + 4}
                    />
                    {invalid && <small>Use a number or fraction</small>}
                  </label>
                )
              })}
              {s.names.length > limits.bindings && (
                <small>At most {limits.bindings} variables can be bound.</small>
              )}
            </div>
          )}
          <div className="compute-bar">
            <button className="primary" onClick={evaluate}>
              <Play size={13} />
              Evaluate
            </button>
            <kbd>
              Ctrl / ⌘ <CornerDownLeft size={11} />
            </kbd>
          </div>
        </div>
        {s.error && (
          <div className="math-diagnostic" id="expression-diagnostic" role="alert">
            <TriangleAlert size={16} />
            <div>
              <strong>{s.error.message}</strong>
              <code>{s.error.code}</code>
            </div>
          </div>
        )}
        {s.expr && (
          <div className="math-reading">
            <div>
              <div className="field-label">Mathematical preview</div>
              <div className="math-preview" aria-label="Mathematical preview" tabIndex={0}>
                <Formula tex={notation(s.expr)} />
              </div>
            </div>
            <div className="exact-reading">
              <div className="field-label">Exact result</div>
              {result ? (
                <>
                  <output aria-label="Exact result">{exactText(result.result.value)}</output>
                  <small>
                    {result.result.domain} · {engine}
                  </small>
                </>
              ) : (
                <p>{s.error ? 'Evaluation unavailable' : 'Awaiting evaluation'}</p>
              )}
            </div>
          </div>
        )}
      </div>
      {result && (
        <div className="result-actions">
          <span>Rational arithmetic · integer exponents</span>
          <CopyResult key={exactText(result.result.value)} value={exactText(result.result.value)} />
        </div>
      )}
      <section className="analysis-view" aria-label="Computation inspection">
        <div className="analysis-nav">
          <div role="group" aria-label="Inspection view">
            <button aria-pressed={view === 'tree'} onClick={() => setView('tree')}>
              <GitBranch size={15} />
              Syntax tree
            </button>
            <button aria-pressed={view === 'trace'} onClick={() => setView('trace')}>
              <ListOrdered size={16} />
              Evaluation trace
            </button>
          </div>
          <span className="meta">
            {view === 'tree'
              ? (s.expr?.nodes.length ?? 0) + ' nodes'
              : (result?.trace.length ?? 0) + ' steps'}
          </span>
        </div>
        {view === 'tree' ? (
          s.expr ? (
            <SyntaxTree expr={s.expr} selected={selected} select={s.select} />
          ) : (
            <p>Correct the expression to inspect its syntax tree.</p>
          )
        ) : result && s.expr ? (
          <Trace
            key={s.source}
            steps={result.trace}
            expr={s.expr}
            selected={selected}
            select={s.select}
          />
        ) : (
          <p>Evaluate a valid expression to inspect its numeric operations.</p>
        )}
      </section>
    </article>
  )
}
export function ExpressionInspector({ s }: { s: Session }) {
  const id = s.selection ?? (s.expr ? s.expr.nodes.length - 1 : -1),
    n = s.expr?.nodes[id]
  let evaluatedId = id
  let current = n
  while (current?.kind === 'group') {
    evaluatedId = current.child
    current = s.expr?.nodes[evaluatedId]
  }
  const step = s.outcome?.ok
    ? s.outcome.value.trace.find((item) => item.node === evaluatedId)
    : undefined
  const props = [
    ['Node type', n?.kind],
    ['Operator', n && 'op' in n ? n.op : undefined],
    ['Source span', n ? `[${n.span.start}, ${n.span.end})` : undefined],
    [
      'Binding',
      n?.kind === 'identifier'
        ? s.bindings.find((b) => b.name === n.name)?.value || 'Required'
        : undefined,
    ],
    ['Value', step ? exactText(step.output) : undefined],
  ]
  return (
    <div className="inspector-body expression-inspector">
      <section className="inspect-block">
        <div className="eyebrow">
          <GitBranch size={14} />
          Selection
        </div>
        <div className="object-name">
          <span className="object-icon">
            <Braces size={18} />
          </span>
          <div>
            <strong>{n ? nodeLabel(n) : 'Expression source'}</strong>
            <small>{n ? 'Syntax node #' + id : 'Editing'}</small>
          </div>
        </div>
        {n && <code className="inspected-source">{s.source.slice(n.span.start, n.span.end)}</code>}
        <dl className="properties">
          {props
            .filter(([, value]) => value !== undefined)
            .map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
      </section>
      <section className="inspect-block">
        <div className="eyebrow">Evaluation context</div>
        <dl className="properties">
          <div>
            <dt>Domain</dt>
            <dd>Rational numbers</dd>
          </div>
          <div>
            <dt>Engine</dt>
            <dd>{engine}</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd>In memory</dd>
          </div>
        </dl>
      </section>
      <section className="inspect-block">
        <div className="eyebrow">{s.error ? 'Diagnostic' : 'Assumptions'}</div>
        {s.error ? (
          <>
            <p>{s.error.message}</p>
            <code>{s.error.code}</code>
          </>
        ) : (
          <p>
            Variables take explicit exact values. Powers require integer exponents and division
            requires a nonzero divisor.
          </p>
        )}
      </section>
    </div>
  )
}
