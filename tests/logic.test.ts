import { describe, expect, it } from 'vitest'
import { evaluate, evaluateInput, truthTable, type Operator } from '../src/domain/logic'

// Oracle order: TT, TF, FT, FF. Each column is transcribed from the classical definition.
const cases: Record<Operator, boolean[]> = {
  and: [true, false, false, false],
  or: [true, true, true, false],
  not: [false, false, true, true],
  implies: [true, false, true, true],
  iff: [true, false, false, true],
}
const assignments = [
  { p: true, q: true },
  { p: true, q: false },
  { p: false, q: true },
  { p: false, q: false },
]
for (const [op, expected] of Object.entries(cases) as [Operator, boolean[]][]) {
  describe(op, () => {
    assignments.forEach((a, i) =>
      it('evaluates ' + JSON.stringify(a), () => {
        expect(evaluate(op, a)).toEqual({ kind: 'exact', value: expected[i], engine: 'boolean/1' })
        expect(evaluateInput(op, a)).toEqual({ ok: true, result: evaluate(op, a) })
      }),
    )
    it('enumerates the four declared assignments in order', () => {
      expect(truthTable(op)).toEqual(
        assignments.map((a, i) => ({
          ...a,
          result: { kind: 'exact', value: expected[i], engine: 'boolean/1' },
        })),
      )
    })
  })
}
it('rejects unsupported or inherited operator names and invalid operands', () => {
  for (const id of ['xor', '__proto__', 'constructor', 2])
    expect(evaluateInput(id, {})).toEqual({ ok: false, error: { code: 'unknown-operator' } })
  for (const a of [null, {}, { p: true }, { p: 1, q: false }])
    expect(evaluateInput('and', a)).toEqual({ ok: false, error: { code: 'invalid-assignment' } })
})
