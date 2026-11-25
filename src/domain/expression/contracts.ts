export const schema = 'axiom.expression/1'
export const engine = 'expression/1'
export const limits = Object.freeze({
  source: 2048,
  tokens: 512,
  name: 32,
  digits: 96,
  depth: 32,
  nodes: 255,
  bindings: 32,
  exponent: 1024,
  bits: 2048,
  operations: 255,
  trace: 255,
  serialized: 65536,
})
export type Span = Readonly<{ start: number; end: number }>
export type Op = '+' | '-' | '*' | '/' | '^'
export type Node = Readonly<
  { span: Span } & (
    | { kind: 'integer'; value: string }
    | { kind: 'decimal'; numerator: string; denominator: string }
    | { kind: 'identifier'; name: string }
    | { kind: 'group'; child: number }
    | { kind: 'unary'; op: '+' | '-'; child: number }
    | { kind: 'binary'; op: Op; left: number; right: number }
  )
>
export interface Expression {
  readonly schema: typeof schema
  readonly source: string
  readonly nodes: readonly Node[]
}
export type Code =
  | 'lexical-error'
  | 'syntax-error'
  | 'unsupported-syntax'
  | 'invalid-literal'
  | 'invalid-binding'
  | 'unbound-variable'
  | 'division-by-zero'
  | 'indeterminate-operation'
  | 'unsupported-domain'
  | 'invalid-serialization'
  | 'unsupported-schema'
  | 'resource-limit'
export interface Diagnostic {
  code: Code
  message: string
  span?: Span
  expected?: string
  actual?: string
  binding?: string
}
export type Checked<T> = { ok: true; value: T } | { ok: false; error: Diagnostic }
// Private control flow inside a checked phase. Programming errors retain their stack.
class Rejection {
  readonly diagnostic: Diagnostic
  constructor(diagnostic: Diagnostic) {
    this.diagnostic = diagnostic
  }
}
export function reject(
  code: Code,
  message: string,
  details: Omit<Diagnostic, 'code' | 'message'> = {},
): never {
  throw new Rejection({ code, message, ...details })
}
export function checked<T>(run: () => T): Checked<T> {
  try {
    return { ok: true, value: run() }
  } catch (e) {
    if (e instanceof Rejection) return { ok: false, error: e.diagnostic }
    throw e
  }
}
export const isName = (s: string) => s.length <= limits.name && /^[A-Za-z_][A-Za-z_0-9]*$/u.test(s)
