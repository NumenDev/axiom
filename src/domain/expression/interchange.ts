import { checked, limits, reject, schema, type Expression } from './contracts.ts'
import { parse } from './parser.ts'
function invalid(): never {
  return reject(
    'invalid-serialization',
    'Expected a v1 data-only record matching its source and postorder nodes.',
  )
}
// Inspect own data descriptors only. Never invoke getters or user-provided serialization hooks.
function field(input: unknown, key: string): unknown {
  if (input === null || typeof input !== 'object') return invalid()
  const descriptor = Object.getOwnPropertyDescriptor(input, key)
  if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return invalid()
  return descriptor.value
}
function compare(input: unknown, expected: unknown): void {
  if (typeof expected !== 'object' || expected === null) {
    if (input !== expected) invalid()
    return
  }
  if (typeof input !== 'object' || input === null) invalid()
  if (Array.isArray(expected)) {
    if (
      !Array.isArray(input) ||
      Object.getPrototypeOf(input) !== Array.prototype ||
      input.length !== expected.length ||
      Reflect.ownKeys(input).length !== expected.length + 1
    )
      invalid()
  } else {
    const proto: unknown = Object.getPrototypeOf(input)
    if (
      (proto !== Object.prototype && proto !== null) ||
      Reflect.ownKeys(input).length !== Object.keys(expected).length
    )
      invalid()
  }
  for (const [key, value] of Object.entries(expected)) compare(field(input, key), value)
}
export function validate(input: unknown): Expression {
  const version = field(input, 'schema')
  if (typeof version !== 'string') invalid()
  if (version !== schema) reject('unsupported-schema', 'This reader supports axiom.expression/1.')
  const source = field(input, 'source'),
    nodes = field(input, 'nodes')
  if (typeof source !== 'string' || !Array.isArray(nodes)) invalid()
  if (nodes.length > limits.nodes || source.length > limits.source)
    reject('resource-limit', 'Serialized expression exceeds the source or node budget.')
  const parsed = parse(source)
  if (!parsed.ok) {
    if (parsed.error.code === 'resource-limit') reject('resource-limit', parsed.error.message)
    invalid()
  }
  compare(input, parsed.value)
  return parsed.value
}
export function serialize(input: unknown) {
  return checked(() => {
    const json = JSON.stringify(validate(input))
    // Valid expression documents contain ASCII only.
    if (json.length > limits.serialized)
      reject('resource-limit', 'Serialized expression is too large.')
    return json
  })
}
// The deepest wire object is document → nodes → node → span. Reject deeper
// containers and duplicate keys before materializing the input tree.
function checkEnvelope(json: string) {
  const containers: (Set<string> | null)[] = []
  for (let i = 0; i < json.length; i++) {
    const ch = json[i]
    if (ch === '"') {
      const start = i
      while (++i < json.length && json[i] !== '"') if (json[i] === '\\') i++
      let next = i + 1
      while (next < json.length && ' \t\r\n'.includes(json[next]!)) next++
      if (json[next] === ':') {
        const names = containers.at(-1)
        if (!names) invalid()
        let key: string
        try {
          key = JSON.parse(json.slice(start, i + 1))
        } catch {
          return invalid()
        }
        if (names.has(key)) invalid()
        names.add(key)
      }
    } else if (ch && /[0-9.-]/.test(ch)) {
      // All unquoted v1 numbers are source offsets or node indices. Check their
      // spelling before the host JSON decoder can round a fraction to an integer.
      const start = i
      while (i + 1 < json.length && /[0-9eE.+-]/.test(json[i + 1]!)) i++
      const digits = json.slice(start, i + 1)
      if (digits.length > String(limits.source).length || !/^(0|[1-9][0-9]*)$/.test(digits))
        invalid()
    } else if (ch === '{' || ch === '[') {
      if (containers.length >= 4)
        reject('resource-limit', 'Serialized records exceed the wire nesting limit.')
      containers.push(ch === '{' ? new Set() : null)
    } else if (ch === '}' || ch === ']') containers.pop()
  }
}
export function deserialize(json: string) {
  return checked(() => {
    if (typeof json !== 'string') invalid()
    if (json.length > limits.serialized)
      reject('resource-limit', 'Serialized expression is too large.')
    // Both the grammar and the wire alphabet are ASCII (JSON escapes are accepted).
    if (/[^\p{ASCII}]/u.test(json)) invalid()
    checkEnvelope(json)
    let value: unknown
    try {
      value = JSON.parse(json)
    } catch {
      return invalid()
    }
    return validate(value)
  })
}
