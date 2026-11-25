import { BookOpen, Map } from 'lucide-react'
import { Formula } from './primitives'
export const phases = [
  'Foundation and Logic Playground',
  'Mathematical expressions and deterministic evaluation',
  'Propositional logic and set theory',
  'Notebooks and reproducible experiments',
  'Hypothesis testing and counterexamples',
  'Graph theory and algorithm analysis',
  'Linear algebra and visualization',
  'Calculus and numerical mathematics',
  'Probability, statistics and number theory',
  'Formal proof and Lean',
  'Automata, formal languages and computability',
  'Knowledge graph and academic study',
  'Optional local AI-assisted tutoring',
  'Distribution and release engineering',
]
export function Reference({ roadmap }: { roadmap: boolean }) {
  const Icon = roadmap ? Map : BookOpen
  return (
    <article className="page reference-page">
      <div className="eyebrow">
        <Icon size={14} /> Research resources
      </div>
      <h1>{roadmap ? 'Module roadmap' : 'Workspace guide'}</h1>
      {roadmap ? (
        <>
          <p className="lede">
            The workspace currently includes Logic Playground and Expression Workbench. Later phases
            are planned.
          </p>
          <ol className="roadmap">
            {phases.map((phase, i) => (
              <li key={phase}>
                <span className="phase-no">{String(i + 1).padStart(2, '0')}</span>
                <strong>{phase}</strong>
                <small>{i < 2 ? 'Available' : 'Planned'}</small>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <p className="lede">A field guide to working in AXIOM.</p>
          <h2>Explore an assignment</h2>
          <p>
            Open Logic Playground in the explorer. Choose a connective and toggle P or Q. The
            highlighted row shows that assignment in the complete truth table. Select another row to
            inspect it.
          </p>
          <h2>Inspect an expression</h2>
          <p>
            Open Expression Workbench, enter a numeric expression, and supply values for its
            variables. Press Ctrl or ⌘ with Enter in the editor to evaluate. Select a tree node or a
            trace step to inspect its source and value. Expressions last for this session.
          </p>
          <h2>Move around the workspace</h2>
          <p>
            Use Tab to move between controls. In the tab strip, use the arrow keys to switch pages
            and Delete to close a reference or environment. Use the toolbar to show or hide panels.
            A focused divider responds to the arrow keys.
          </p>
          <dl className="guide-keys">
            <dt>Command palette</dt>
            <dd>
              <kbd>Ctrl / ⌘</kbd> <kbd>K</kbd>
            </dd>
            <dt>Toggle explorer</dt>
            <dd>
              <kbd>Ctrl / ⌘</kbd> <kbd>B</kbd>
            </dd>
            <dt>Toggle session log</dt>
            <dd>
              <kbd>Ctrl / ⌘</kbd> <kbd>J</kbd>
            </dd>
            <dt>Dismiss a dialog</dt>
            <dd>
              <kbd>Esc</kbd>
            </dd>
          </dl>
          <h2>Results and storage</h2>
          <p>
            Results carry an exactness label and an engine version in the inspector. The Boolean
            domain contains only true and false. Each evaluation follows the same rule for the same
            inputs.
          </p>
          <p>
            Panel sizes, visibility, and density are saved locally. Open pages, assignments, and the
            session log last for the current session.
          </p>
          <h2>The welcome figure</h2>
          <p>
            Figure 01 is an orthographic projection of a ring torus, sampled along its two angular
            coordinates. The major radius is 2 and the minor radius is 0.78.
          </p>
          <div className="guide-formula">
            <Formula tex={'r=2+0.78\\cos v,\\quad (x,y,z)=(r\\cos u,r\\sin u,0.78\\sin v)'} />
          </div>
        </>
      )}
    </article>
  )
}
