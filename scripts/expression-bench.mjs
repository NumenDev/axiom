import { parse } from '../src/domain/expression/parser.ts'
import { evaluateExpression } from '../src/domain/expression/evaluate.ts'
import { performance } from 'node:perf_hooks'
import { log } from 'node:console'
import process from 'node:process'
import { cpus } from 'node:os'
const balanced = (terms) =>
  terms.length === 1
    ? terms[0]
    : '(' +
      balanced(terms.slice(0, terms.length >> 1)) +
      '+' +
      balanced(terms.slice(terms.length >> 1)) +
      ')'
const names = Array.from({ length: 32 }, (_, i) => 'x' + i)
const bindings = names.map((name, i) => ({ name, value: String(i + 1) + '/7' }))
// The two balanced subtrees contribute 190 and 64 nodes, plus their root sum.
const full = balanced(Array(64).fill('1')) + '+' + balanced(Array(22).fill('1'))
const workloads = [
  ['Short', '3*2^2+1/2'],
  ['Nested', '('.repeat(31) + '1' + ')'.repeat(31)],
  ['Large integer', '9'.repeat(96) + '^6'],
  ['Rational', '(13/17 + 29/31)^-40'],
  ['Many names', balanced(names)],
  ['Large tree', full],
  ['Large exact trace', Array(7).fill('(2^1024/3^1024)').join('+')],
  ['Trace growth', Array(12).fill('(2^1024/3^1024)').join('+')],
  ['Source cap', '1'.padStart(2048)],
  ['Long chain', Array(200).fill('1').join('+')],
  ['Huge power', '2^1024^1024'],
  ['Too long', '1+'.repeat(4000) + '1'],
]
const count = 200
log(process.version, cpus()[0].model, '200 runs after 20 warmups; milliseconds (p50 / p95 / max)')
function stats(samples) {
  if (!samples.length) return '—'
  samples.sort((a, b) => a - b)
  return [
    samples[samples.length >> 1],
    samples[Math.ceil(samples.length * 0.95) - 1],
    samples.at(-1),
  ]
    .map((x) => x.toFixed(3))
    .join(' / ')
}
for (const [title, source] of workloads) {
  const pt = [],
    et = []
  let steps = 0,
    bytes = 0,
    status = '',
    nodes = 0
  for (let i = -20; i < count; i++) {
    const begin = performance.now(),
      parsed = parse(source),
      middle = performance.now()
    if (i >= 0) pt.push(middle - begin)
    if (!parsed.ok) {
      status = parsed.error.code
      continue
    }
    nodes = parsed.value.nodes.length
    const evaluated = evaluateExpression(parsed.value, title === 'Many names' ? bindings : [])
    if (i >= 0) et.push(performance.now() - middle)
    if (evaluated.ok) {
      steps = evaluated.value.trace.length
      bytes = JSON.stringify(evaluated.value.trace).length
      status = 'exact'
    } else status = evaluated.error.code
  }
  log([title, source.length, nodes, stats(pt), stats(et), steps, bytes, status].join(' | '))
}
log('Process peak RSS (KiB, entire Node process):', process.resourceUsage().maxRSS)
