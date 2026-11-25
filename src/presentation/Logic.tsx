import { CircleCheck, Network } from 'lucide-react'
import { evaluate, operators, truthTable, type Assignment, type Operator } from '../domain/logic'
import { Formula } from './primitives'
import { logicText } from './logicText'

export interface LogicState {
  op: Operator
  assignment: Assignment
}
export const initialLogic: LogicState = { op: 'and', assignment: { p: true, q: false } }
export const truth = (value: boolean) => (value ? 'True' : 'False')

export function Logic({ state, update }: { state: LogicState; update: (s: LogicState) => void }) {
  const { op, assignment } = state
  const spec = logicText[op]
  const result = evaluate(op, assignment)
  return (
    <div className="page logic-page">
      <div className="eyebrow">
        <Network size={14} /> Discrete mathematics
      </div>
      <h1>Logic Playground</h1>
      <p className="lede">Explore the effect of an operator on two Boolean propositions.</p>
      <div className="section-heading">
        <h2>Expression</h2>
        <span className="meta">CLASSICAL LOGIC</span>
      </div>
      <div className="expression">
        <label className="field-label" htmlFor="operator">
          Operator
        </label>
        <select
          id="operator"
          value={op}
          onChange={(e) => update({ ...state, op: e.target.value as Operator })}
        >
          {operators.map((id) => (
            <option key={id} value={id}>
              {logicText[id].name} ({logicText[id].symbol})
            </option>
          ))}
        </select>
        <div className="evaluation">
          <Formula tex={spec.tex} />
          <span className="eval-equals">=</span>
          <output className={result.value ? 'true' : 'false'} aria-label="Evaluated result">
            {truth(result.value)}
          </output>
          <span className="exact-label">
            <CircleCheck size={13} /> Exact
          </span>
        </div>
        <p>{spec.rule}</p>
      </div>
      <fieldset className="assignments">
        <legend>Assignment</legend>
        {(['p', 'q'] as const).map((key) => (
          <label key={key}>
            <Formula tex={key.toUpperCase()} />
            <button
              type="button"
              role="switch"
              aria-label={key.toUpperCase()}
              aria-checked={assignment[key]}
              onClick={() =>
                update({ ...state, assignment: { ...assignment, [key]: !assignment[key] } })
              }
            >
              <span className="switch-track" />
              {truth(assignment[key])}
            </button>
          </label>
        ))}
      </fieldset>
      <div className="section-heading">
        <h2>Truth table</h2>
        <span className="meta">4 ASSIGNMENTS</span>
      </div>
      <table className="truth-table">
        <caption className="sr-only">
          Complete truth table for {spec.name}. The active row matches the current assignment.
        </caption>
        <thead>
          <tr>
            <th scope="col">Assignment</th>
            <th scope="col">
              <Formula tex="P" />
            </th>
            <th scope="col">
              <Formula tex="Q" />
            </th>
            <th scope="col">
              <Formula tex={spec.tex} />
            </th>
          </tr>
        </thead>
        <tbody>
          {truthTable(op).map(({ p, q, result: r }, i) => {
            const active = p === assignment.p && q === assignment.q
            return (
              <tr
                key={i}
                className={active ? 'current' : ''}
                aria-current={active ? 'true' : undefined}
              >
                <th scope="row">
                  <button
                    title={'Select assignment ' + (i + 1)}
                    onClick={() => update({ ...state, assignment: { p, q } })}
                  >
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {active && <small>Selected</small>}
                  </button>
                </th>
                <td>{truth(p)}</td>
                <td>{truth(q)}</td>
                <td className={r.value ? 'true' : 'false'}>{truth(r.value)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
