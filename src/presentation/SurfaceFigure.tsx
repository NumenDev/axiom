import { memo } from 'react'

// The two screen basis vectors are orthogonal unit vectors. Depth increases toward the viewer.
const tau = 2 * Math.PI
const azimuth = (24 * Math.PI) / 180
const tilt = (26 * Math.PI) / 180
const sa = Math.sin(azimuth),
  ca = Math.cos(azimuth)
const st = Math.sin(tilt),
  ct = Math.cos(tilt)
function project(x: number, y: number, z: number) {
  return [165 + 44 * (x * ca - y * sa), 100 + 44 * ((x * sa + y * ca) * st - z * ct)]
}
function wireframe() {
  const paths = { front: '', back: '' }
  function trace(angles: (t: number) => [number, number], samples: number) {
    let previous = '',
      lastSide = ''
    for (let i = 0; i <= samples; i++) {
      const [u, v] = angles((tau * i) / samples)
      const cu = Math.cos(u),
        su = Math.sin(u),
        cv = Math.cos(v),
        sv = Math.sin(v)
      const radius = 2 + 0.78 * cv
      const point = project(radius * cu, radius * su, 0.78 * sv)
        .map((n) => n.toFixed(2))
        .join(',')
      const facing = cv * (cu * sa + su * ca) * ct + sv * st
      const side = facing >= 0 ? 'front' : 'back'
      if (previous) paths[side] += (side === lastSide ? '' : 'M' + previous) + 'L' + point
      previous = point
      lastSide = i === 0 ? '' : side
    }
  }
  for (let i = 0; i < 36; i++) trace((t) => [(tau * i) / 36, t], 40)
  for (let i = 0; i < 16; i++) trace((t) => [t, (tau * i) / 16], 80)
  return paths
}
const mesh = wireframe()
const axes = [
  { name: 'x', end: project(3.65, 0, 0) },
  { name: 'y', end: project(0, 3.65, 0) },
  { name: 'z', end: project(0, 0, 2.1) },
]
export const SurfaceFigure = memo(function SurfaceFigure() {
  return (
    <figure className="surface-figure">
      <svg viewBox="0 0 330 188" role="img" aria-label="Wireframe projection of a ring torus">
        <defs>
          <pattern id="figure-grid" width="15" height="15" patternUnits="userSpaceOnUse">
            <path d="M15 0H0V15" fill="none" stroke="#425447" strokeWidth=".65" />
          </pattern>
        </defs>
        <rect width="330" height="188" fill="url(#figure-grid)" />
        {axes.map(({ name, end: [x, y] }) => (
          <g key={name}>
            <path
              d={`M165 100L${x} ${y}`}
              stroke="#7f9384"
              fill="none"
              strokeWidth=".8"
              strokeDasharray="3 3"
            />
            <text x={x! + 3} y={y! - 3} fill="#a9baae" fontSize="9" fontFamily="monospace">
              {name}
            </text>
          </g>
        ))}
        <g fill="none">
          <path d={mesh.back} stroke="#516b59" strokeWidth=".64" />
          <path d={mesh.front} stroke="#a4d9b0" strokeWidth=".9" />
        </g>
        <path
          d="M3 13V3H13 M317 3H327V13 M3 175V185H13 M317 185H327V175"
          fill="none"
          stroke="#839589"
          strokeWidth=".8"
        />
      </svg>
      <figcaption>
        <span className="fig-index">FIG. 01</span> RING TORUS <span className="figure-rule" />
      </figcaption>
    </figure>
  )
})
