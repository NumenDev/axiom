import {
  checked,
  engine,
  isName,
  limits,
  reject,
  type Expression,
  type Op,
  type Span,
} from './contracts.ts'
import { freeNames } from './parser.ts'
import { validate } from './interchange.ts'
import { calculate, literal, reduced, wire, type Rational, type Fraction } from './rational.ts'
export type Binding = Readonly<{ name: string; value: string }>
export function bindingValue(text: string) {
  return checked(() => {
    if (typeof text !== 'string' || text.length > 2 * limits.digits + 3)
      reject('invalid-binding', 'Binding text is missing or too long.')
    if (!/^[+-]?\d+(?:\.\d+|\/[+-]?\d+)?$/.test(text))
      reject('invalid-binding', 'Use a signed integer, decimal or integer/integer fraction.')
    const [numerator, denominator] = text.split('/')
    if (
      [numerator, denominator].some(
        (part) => part && part.replace(/[+.-]/g, '').length > limits.digits,
      )
    )
      reject('resource-limit', `Binding terms allow ${limits.digits} digits.`)
    if (!denominator) return literal(numerator!)
    if (!BigInt(denominator)) reject('invalid-binding', 'A binding denominator must be nonzero.')
    return reduced(BigInt(numerator!), BigInt(denominator))
  })
}
export interface Step {
  node: number
  span: Span
  operation: 'literal' | 'substitute' | 'positive' | 'negate' | Op
  inputs: Fraction[]
  output: Fraction
}
export type ExactResult = {
  kind: 'exact'
  domain: 'integer' | 'rational'
  value: Fraction
  engine: typeof engine
}
export function evaluateExpression(input: unknown, bindings: readonly Binding[] = []) {
  return checked(() => run(validate(input), bindings))
}
function run(expr: Expression, bindings: readonly Binding[]) {
  if (!Array.isArray(bindings)) reject('invalid-binding', 'Expected a list of name/value bindings.')
  if (bindings.length > limits.bindings || freeNames(expr).length > limits.bindings)
    reject('resource-limit', 'Too many bindings.')
  const env = new Map<string, Rational>()
  for (let i = 0; i < bindings.length; i++) {
    const entry: unknown = Object.getOwnPropertyDescriptor(bindings, i)?.value
    if (!entry || typeof entry !== 'object')
      reject('invalid-binding', 'Expected a name/value binding.')
    const name: unknown = Object.getOwnPropertyDescriptor(entry, 'name')?.value
    const value: unknown = Object.getOwnPropertyDescriptor(entry, 'value')?.value
    if (
      typeof name !== 'string' ||
      !isName(name) ||
      typeof value !== 'string' ||
      Reflect.ownKeys(entry).length !== 2
    )
      reject('invalid-binding', 'Expected an identifier and exact numeric text.')
    if (env.has(name))
      reject('invalid-binding', `Duplicate binding for ${name}.`, { binding: name })
    const found = bindingValue(value)
    if (!found.ok) reject(found.error.code, found.error.message, { binding: name })
    env.set(name, found.value)
  }
  const values: Rational[] = [],
    trace: Step[] = []
  // Reserve the result envelope and its largest possible final fraction before emitting records.
  let remaining = limits.serialized - 160 - 2 * Math.ceil(limits.bits * Math.LOG10E * Math.LN2)
  let operations = 0
  for (const [id, node] of expr.nodes.entries()) {
    if (++operations > limits.operations)
      reject('resource-limit', 'Evaluation operation budget exhausted.', { span: node.span })
    let output: Rational, operation: Step['operation']
    let inputs: Rational[] = []
    switch (node.kind) {
      case 'group':
        values.push(values[node.child]!)
        continue
      case 'integer':
        output = { n: BigInt(node.value), d: 1n }
        operation = 'literal'
        break
      case 'decimal':
        output = { n: BigInt(node.numerator), d: BigInt(node.denominator) }
        operation = 'literal'
        break
      case 'identifier': {
        const bound = env.get(node.name)
        if (!bound)
          reject('unbound-variable', `Supply an exact value for ${node.name}.`, {
            span: node.span,
            binding: node.name,
          })
        output = bound
        operation = 'substitute'
        break
      }
      case 'unary': {
        const child = values[node.child]!
        inputs = [child]
        operation = node.op === '-' ? 'negate' : 'positive'
        output = node.op === '-' ? { n: -child.n, d: child.d } : child
        break
      }
      case 'binary': {
        const left = values[node.left]!,
          right = values[node.right]!
        inputs = [left, right]
        operation = node.op
        const value = checked(() => calculate(node.op, left, right))
        if (!value.ok) reject(value.error.code, value.error.message, { span: node.span })
        output = value.value
      }
    }
    if (trace.length >= limits.trace)
      reject('resource-limit', 'Trace step budget exhausted.', { span: node.span })
    const step = {
      node: id,
      span: node.span,
      operation,
      inputs: inputs.map(wire),
      output: wire(output),
    }
    remaining -= JSON.stringify(step).length + 1
    if (remaining < 0)
      reject('resource-limit', 'The exact trace exceeds its serialized output budget.', {
        span: node.span,
      })
    values.push(output)
    trace.push(step)
  }
  const value = values[values.length - 1]!
  const result: ExactResult = {
    kind: 'exact',
    domain: value.d === 1n ? 'integer' : 'rational',
    engine,
    value: wire(value),
  }
  return { result, trace }
}
