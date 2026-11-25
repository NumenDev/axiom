export type Operator = 'and' | 'or' | 'not' | 'implies' | 'iff'
export const operators: readonly Operator[] = ['and', 'or', 'not', 'implies', 'iff']
export type Assignment = Readonly<{ p: boolean; q: boolean }>
export type ExactBoolean = Readonly<{ kind: 'exact'; value: boolean; engine: 'boolean/1' }>
export type MathError = Readonly<{ code: 'unknown-operator' | 'invalid-assignment' }>
export type Evaluation = { ok: true; result: ExactBoolean } | { ok: false; error: MathError }

const definitions: Record<Operator, (a: Assignment) => boolean> = {
  and: ({ p, q }) => p && q,
  or: ({ p, q }) => p || q,
  not: ({ p }) => !p,
  implies: ({ p, q }) => !p || q,
  iff: ({ p, q }) => p === q,
}

export function evaluate(operator: Operator, assignment: Assignment): ExactBoolean {
  return { kind: 'exact', value: definitions[operator](assignment), engine: 'boolean/1' }
}

// Use this checked entry point when inputs come from serialized or otherwise untyped data.
export function evaluateInput(operator: unknown, assignment: unknown): Evaluation {
  if (typeof operator !== 'string' || !Object.hasOwn(definitions, operator))
    return { ok: false, error: { code: 'unknown-operator' } }
  if (
    typeof assignment !== 'object' ||
    assignment === null ||
    !('p' in assignment) ||
    !('q' in assignment) ||
    typeof assignment.p !== 'boolean' ||
    typeof assignment.q !== 'boolean'
  )
    return { ok: false, error: { code: 'invalid-assignment' } }
  return { ok: true, result: evaluate(operator as Operator, { p: assignment.p, q: assignment.q }) }
}

export function truthTable(operator: Operator) {
  return [true, false].flatMap((p) =>
    [true, false].map((q) => ({ p, q, result: evaluate(operator, { p, q }) })),
  )
}
