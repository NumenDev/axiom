import { describe, expect, it } from 'vitest'
import { limits, schema, type Checked } from '../src/domain/expression/contracts'
import { tokenize } from '../src/domain/expression/lexer'
import { parse, freeNames } from '../src/domain/expression/parser'
import { deserialize, serialize } from '../src/domain/expression/interchange'
import { bindingValue, evaluateExpression, type Binding } from '../src/domain/expression/evaluate'
import { reduced, gcd } from '../src/domain/expression/rational'
import fixtures from './fixtures/expression-fractions.json'
function good<T>(check: Checked<T>): T {
  if (!check.ok) throw Error(JSON.stringify(check.error))
  return check.value
}
function ast(source: string) {
  return good(parse(source))
}
function run(source: string, bindings: Binding[] = []) {
  return evaluateExpression(ast(source), bindings)
}
function result(source: string, bindings: Binding[] = []) {
  return good(run(source, bindings)).result.value
}
function failure(check: Checked<unknown>, code: string) {
  expect(check).toMatchObject({ ok: false, error: { code } })
}
describe('lexing and complete parsing', () => {
  it('retains lexemes and UTF-16 offsets, including EOF', () => {
    expect(good(tokenize(' \tx_2\r\n+ 00.10'))).toEqual([
      { kind: 'name', lexeme: 'x_2', span: { start: 2, end: 5 } },
      { kind: '+', lexeme: '+', span: { start: 7, end: 8 } },
      { kind: 'number', lexeme: '00.10', span: { start: 9, end: 14 } },
      { kind: 'end', lexeme: '', span: { start: 14, end: 14 } },
    ])
    expect(tokenize('1+😀')).toMatchObject({
      ok: false,
      error: { code: 'lexical-error', span: { start: 2, end: 4 } },
    })
  })
  it.each(['2x', '2(x)', '(2)(3)', 'x y', 'f(1)', '1e-3'])('rejects adjacency in %s', (s) =>
    failure(parse(s), 'unsupported-syntax'),
  )
  it.each(['', '2+', ')', '2)', '()', '(2', '2**3', '1 // 2'])(
    'rejects incomplete or trailing syntax in %s',
    (s) => failure(parse(s), 'syntax-error'),
  )
  it.each(['.1', '1.', '1.2.3', '.'])('rejects malformed number %s', (s) =>
    failure(parse(s), 'invalid-literal'),
  )
  it.each(['3!', 'é', 'x\u00a0+1', '2−1'])('rejects unsupported characters in %s', (s) =>
    failure(parse(s), 'lexical-error'),
  )
  it('retains parentheses, source spans, operand order and unique free names', () => {
    expect(ast(' -(02.50 + x)').nodes).toEqual([
      { kind: 'decimal', numerator: '5', denominator: '2', span: { start: 3, end: 8 } },
      { kind: 'identifier', name: 'x', span: { start: 11, end: 12 } },
      { kind: 'binary', op: '+', left: 0, right: 1, span: { start: 3, end: 12 } },
      { kind: 'group', child: 2, span: { start: 2, end: 13 } },
      { kind: 'unary', op: '-', child: 3, span: { start: 1, end: 13 } },
    ])
    expect(freeNames(ast('A+a+A+_2'))).toEqual(['A', 'a', '_2'])
    expect(
      ast('2^3^2')
        .nodes.slice(-2)
        .map((n) => n.kind === 'binary' && [n.left, n.right]),
    ).toEqual([
      [1, 2],
      [0, 3],
    ])
  })
})
describe('independent exact expectations', () => {
  it.each([
    ['2 + 3 * 4', '14', '1'],
    ['(2 + 3) * 4', '20', '1'],
    ['2 ^ 3 ^ 2', '512', '1'],
    ['-2 ^ 2', '-4', '1'],
    ['(-2) ^ 2', '4', '1'],
    ['2 ^ -3', '1', '8'],
    ['8 / 4 / 2', '1', '1'],
    ['10 - 3 - 2', '5', '1'],
    ['--2', '2', '1'],
    ['1 + -2', '-1', '1'],
    ['0.1+0.2', '3', '10'],
    ['1/3+1/6', '1', '2'],
    ['6/8', '3', '4'],
    ['2/-4', '-1', '2'],
    ['-2/-4', '1', '2'],
    ['999999999999999999 + 1', '1000000000000000000', '1'],
    ['(2/3)^-2', '9', '4'],
    ['-0.000 / -23', '0', '1'],
    ['-2^2 - (-2)^2', '-8', '1'],
    ['+2^+3', '8', '1'],
    ['(-2)^-3', '-1', '8'],
    ['0^2', '0', '1'],
  ])('%s', (s, numerator, denominator) => expect(result(s!)).toEqual({ numerator, denominator }))
  it('agrees with Python Fraction fixtures', () => {
    for (const [s, numerator, denominator] of fixtures)
      expect(result(s!), s).toEqual({ numerator, denominator })
  })
  it.each([
    ['1/0', 'division-by-zero'],
    ['0^0', 'indeterminate-operation'],
    ['0^-1', 'division-by-zero'],
    ['4^0.5', 'unsupported-domain'],
  ])('diagnoses %s', (s, code) => failure(run(s!), code!))
  it('resolves explicit values and cannot inherit a binding', () => {
    expect(result('3*x^2+1/2', [{ name: 'x', value: '2' }])).toEqual({
      numerator: '25',
      denominator: '2',
    })
    for (const name of ['constructor', '__proto__', 'toString']) {
      failure(run(name), 'unbound-variable')
      expect(result(name, [{ name, value: '-2/-4' }])).toEqual({ numerator: '1', denominator: '2' })
    }
    const b = { name: 'X', value: '01.20' }
    failure(run('x', [b]), 'unbound-variable')
    failure(run('X', [b, b]), 'invalid-binding')
    failure(run('X', [{ name: '2x', value: '1' }]), 'invalid-binding')
    failure(run('X', Array(limits.bindings + 1).fill(b)), 'resource-limit')
    for (const value of ['12/0', '', '1+2', 'x', ' 1', '2e3', '3/2.5'])
      failure(bindingValue(value), 'invalid-binding')
  })
  it('preserves rational field laws over a finite signed grid', () => {
    for (let i = -5; i <= 5; i++)
      for (let j = -3; j <= 3; j++) {
        const a = '(' + i + '/7)',
          b = '(' + j + '/3)',
          c = '(-3/2)'
        const identities = [
          [a + '+' + b, b + '+' + a],
          [a + '*' + b, b + '*' + a],
          ['(' + a + '+' + b + ')+' + c, a + '+(' + b + '+' + c + ')'],
          ['(' + a + '*' + b + ')*' + c, a + '*(' + b + '*' + c + ')'],
          [a + '*(' + b + '+' + c + ')', a + '*' + b + '+' + a + '*' + c],
          [a + '+0', a],
          [a + '*1', a],
          [a + '+-' + a, '0'],
        ]
        if (i) identities.push([a + '*(1/' + a + ')', '1'])
        for (const [left, right] of identities) expect(result(left!)).toEqual(result(right!))
        const r = reduced(BigInt(i * j), -9n)
        expect(reduced(r.n, r.d)).toEqual(r)
        expect(r.d > 0n).toBe(true)
        expect(gcd(r.n, r.d)).toBe(1n)
      }
  })
})
describe('interchange and trace', () => {
  it('round trips decimal source, canonical numbers and stable IDs', () => {
    const wire = good(serialize(ast('2')))
    for (const number of ['1.00000000000000001', '1e0', '1.0', '-0']) {
      failure(deserialize(wire.replace('"end":1', '"end":' + number)), 'invalid-serialization')
    }
    const original = ast(' (+001.20 / a) ')
    const json = good(serialize(original))
    expect(good(deserialize(json))).toEqual(original)
    expect(good(serialize(good(deserialize(json))))).toBe(json)
  })
  it('rejects mismatched fields, executable members, accessors, cycles and non-data objects', () => {
    const doc = ast('2+3')
    for (const change of [
      { kind: 'unknown' },
      { op: '%' },
      { right: 3 },
      { left: 2 },
      { right: null },
      { span: { start: 99, end: 1 } },
      { extra: false },
    ]) {
      const nodes = [...doc.nodes]
      nodes[2] = { ...nodes[2], ...change } as (typeof nodes)[number]
      failure(deserialize(JSON.stringify({ ...doc, nodes })), 'invalid-serialization')
    }
    for (const value of ['02', '+2', '-0', 2, 2n, () => 2, NaN]) {
      failure(
        serialize({ ...doc, nodes: [{ ...doc.nodes[0], value }, ...doc.nodes.slice(1)] }),
        'invalid-serialization',
      )
    }
    const decimal = ast('0.5')
    for (const fields of [
      { numerator: '2', denominator: '4' },
      { denominator: '0' },
      { denominator: '-2' },
    ])
      failure(
        serialize({ ...decimal, nodes: [{ ...decimal.nodes[0], ...fields }] }),
        'invalid-serialization',
      )
    const circular = { ...doc, nodes: [{}] }
    circular.nodes[0] = circular
    for (const value of [
      circular,
      {
        ...doc,
        toJSON() {
          throw Error()
        },
      },
      {
        ...doc,
        get nodes() {
          throw Error()
        },
      },
      Object.create(doc),
      null,
    ])
      failure(serialize(value), 'invalid-serialization')
    failure(deserialize('{'), 'invalid-serialization')
    failure(deserialize('{"schema":1,"schema":"axiom.expression/1"}'), 'invalid-serialization')
    failure(deserialize('['.repeat(9000) + ']'.repeat(9000)), 'resource-limit')
    failure(deserialize('{"schema":2}'), 'invalid-serialization')
    failure(deserialize('{"schema":"future"}'), 'unsupported-schema')
    failure(deserialize(' '.repeat(limits.serialized + 1)), 'resource-limit')
    failure(serialize({ ...doc, nodes: Array(limits.nodes + 1) }), 'resource-limit')
    failure(
      deserialize(
        JSON.stringify({ schema, source: '('.repeat(40) + '1' + ')'.repeat(40), nodes: [] }),
      ),
      'resource-limit',
    )
  })
  it('records actual postorder operands, values and source positions', () => {
    const { result, trace } = good(run('3*x^2+1/2', [{ name: 'x', value: '2' }]))
    expect(
      trace.map((t) => [t.node, t.operation, t.output.numerator, t.output.denominator]),
    ).toEqual([
      [0, 'literal', '3', '1'],
      [1, 'substitute', '2', '1'],
      [2, 'literal', '2', '1'],
      [3, '^', '4', '1'],
      [4, '*', '12', '1'],
      [5, 'literal', '1', '1'],
      [6, 'literal', '2', '1'],
      [7, '/', '1', '2'],
      [8, '+', '25', '2'],
    ])
    expect(trace[3]!.span).toEqual({ start: 2, end: 5 })
    expect(trace[8]!.inputs).toEqual([
      { numerator: '12', denominator: '1' },
      { numerator: '1', denominator: '2' },
    ])
    expect(trace.at(-1)!.output).toEqual(result.value)
    expect(good(run('((+2))')).trace.map((s) => s.operation)).toEqual(['literal', 'positive'])
  })
})
describe('bounded computation', () => {
  it.each([
    '('.repeat(40) + '1' + ')'.repeat(40),
    '-'.repeat(40) + '1',
    '1+'.repeat(2000) + '1',
    '9'.repeat(limits.digits + 1),
    'x'.repeat(limits.name + 1),
    '1+'.repeat(260) + '1',
    '1+'.repeat(33) + '1',
  ])('bounds parser input (%#)', (s) => failure(parse(s), 'resource-limit'))
  it.each(['2^1025', '2^2^10^2', '(2^1024)^2', '(1/(2^1024))^2', '(2^1023/3)*(2^1023/7)*8'])(
    'bounds %s',
    (s) => failure(run(s), 'resource-limit'),
  )
  it('limits trace bytes even when rational arithmetic stays small enough', () => {
    const term = '(2^1024/3^1024)'
    const source = Array(17).fill(term).join('+')
    const output = run(source)
    expect(output).toMatchObject({
      ok: false,
      error: { code: 'resource-limit', message: expect.stringContaining('trace') },
    })
  })
})
