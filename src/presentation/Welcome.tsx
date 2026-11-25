import { ArrowRight, BookOpen, Compass, GitFork, Map, Network } from 'lucide-react'
import { modules } from '../application/modules'
import { SurfaceFigure } from './SurfaceFigure'
import type { OpenPage } from './navigation'
export function Welcome({ open }: { open: OpenPage }) {
  return (
    <div className="page welcome-page">
      <div className="eyebrow">
        <Compass size={14} /> Workspace overview
      </div>
      <section className="intro">
        <div className="intro-copy">
          <h1>
            Welcome to <span>AXIOM</span>
          </h1>
          <p className="tagline">Explore. Reason. Discover.</p>
          <p className="lede">
            A local environment for mathematical research and learning. Work with exact results,
            inspect assumptions, and follow the reasoning.
          </p>
        </div>
        <SurfaceFigure />
      </section>
      <section className="env-section">
        <div className="section-heading">
          <h2>Environments</h2>
          <span className="meta">{modules.length.toString().padStart(2, '0')} AVAILABLE</span>
        </div>
        {modules.map((m) => (
          <article className="module" key={m.id}>
            <div className="module-mark">
              <Network size={24} />
            </div>
            <div className="module-copy">
              <div className="eyebrow mint">{m.field}</div>
              <h3>{m.name}</h3>
              <p>{m.description}</p>
              <button className="primary" onClick={() => open(m.id)}>
                {m.id === 'logic' ? 'Open playground' : 'Open workbench'} <ArrowRight size={15} />
              </button>
            </div>
            <GitFork className="module-watermark" size={74} aria-hidden="true" />
          </article>
        ))}
      </section>
      <section className="references">
        <div className="section-heading">
          <h2>Reference</h2>
        </div>
        <button className="resource-row" onClick={() => open('guide')}>
          <BookOpen />
          <span>
            <strong>Workspace guide</strong>
            <small>Navigation, keyboard shortcuts, and local storage</small>
          </span>
          <ArrowRight />
        </button>
        <button className="resource-row" onClick={() => open('roadmap')}>
          <Map />
          <span>
            <strong>Module roadmap</strong>
            <small>Development phases and planned environments</small>
          </span>
          <ArrowRight />
        </button>
      </section>
    </div>
  )
}
