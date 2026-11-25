import { useMemo, useState } from 'react'
import { limits, type Diagnostic, type Expression, type Node } from '../domain/expression/contracts'
import { evaluateExpression, type Binding } from '../domain/expression/evaluate'
import { freeNames, parse } from '../domain/expression/parser'
import type { Fraction } from '../domain/expression/rational'

export const examples = [
  {
    name: 'Variable substitution',
    source: '3*x^2 + 1/2',
    explanation: 'Substitute 2 for x, then square it before multiplying by 3.',
    bindings: [{ name: 'x', value: '2' }],
  },
  {
    name: 'Operator precedence',
    source: '2 + 3 * 4',
    explanation: 'Multiplication takes place before addition.',
  },
  {
    name: 'Parentheses',
    source: '(2 + 3) * 4',
    explanation: 'Parentheses make the sum the left operand of multiplication.',
  },
  {
    name: 'Unary minus',
    source: '-2^2 - (-2)^2',
    explanation: 'The first power gives 4 before negation. The second squares a negative base.',
  },
  {
    name: 'Exact fractions',
    source: '1/3 + 1/6',
    explanation: 'The common denominator is 6. The sum reduces to one half.',
  },
  {
    name: 'Finite decimals',
    source: '0.1 + 0.2',
    explanation:
      'Each decimal is a fraction over ten. Binary floating-point rounding never enters this calculation.',
  },
  {
    name: 'Right-associated powers',
    source: '2^3^2',
    explanation:
      'The exponent is itself a power. Evaluate 3 squared before raising 2 to that exponent.',
  },
  {
    name: 'Division by zero',
    source: '1 / (2 - 2)',
    explanation: 'No rational number multiplied by zero gives one.',
  },
  {
    name: 'Unbound variable',
    source: 'x + 1',
    explanation:
      'The tree already contains x. Its value must be supplied before the sum can be evaluated.',
  },
] satisfies { name: string; source: string; explanation: string; bindings?: Binding[] }[]

export function exactText(v: Fraction) {
  return v.denominator === '1' ? v.numerator : v.numerator + '/' + v.denominator
}
export function nodeLabel(n: Node): string {
  switch (n.kind) {
    case 'binary':
      return {
        '+': 'Addition',
        '-': 'Subtraction',
        '*': 'Multiplication',
        '/': 'Division',
        '^': 'Power',
      }[n.op]
    case 'unary':
      return n.op === '-' ? 'Negation' : 'Unary positive'
    case 'group':
      return 'Parentheses'
    case 'identifier':
      return 'Variable'
    case 'integer':
      return 'Integer'
    case 'decimal':
      return 'Decimal'
  }
}
export function notation(expr: Expression): string {
  const tex: string[] = []
  for (const n of expr.nodes) {
    switch (n.kind) {
      case 'integer':
      case 'decimal':
        tex.push(expr.source.slice(n.span.start, n.span.end))
        break
      case 'identifier':
        tex.push(
          n.name.length === 1 && n.name !== '_'
            ? n.name
            : '\\mathrm{' + n.name.replaceAll('_', '\\_') + '}',
        )
        break
      case 'group':
        tex.push('\\left(' + tex[n.child] + '\\right)')
        break
      case 'unary':
        tex.push(n.op + tex[n.child])
        break
      case 'binary': {
        const left = tex[n.left],
          right = tex[n.right]
        if (n.op === '/') tex.push('\\frac{' + left + '}{' + right + '}')
        else if (n.op === '^') tex.push('{' + left + '}^{' + right + '}')
        else tex.push(left + (n.op === '*' ? '\\cdot ' : n.op) + right)
      }
    }
  }
  return tex[tex.length - 1]!
}
type Outcome = ReturnType<typeof evaluateExpression>
export function useExpression() {
  const [source, setSource] = useState(examples[0]!.source)
  const [example, setExample] = useState<number | null>(0)
  const [bindings, setBindings] = useState<readonly Binding[]>(examples[0]!.bindings!)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [selection, select] = useState<number | null>(null)
  const [inputError, setInputError] = useState<Diagnostic | null>(null)
  const parsed = useMemo(() => parse(source), [source])
  const expr = parsed.ok ? parsed.value : null
  const names = useMemo(() => (expr ? freeNames(expr) : []), [expr])
  const error =
    inputError ?? (!parsed.ok ? parsed.error : outcome && !outcome.ok ? outcome.error : null)
  function edit(next: string) {
    setOutcome(null)
    select(null)
    setExample(null)
    if (next.length > limits.source) {
      setInputError({
        code: 'resource-limit',
        message: `Edit declined. Use at most ${limits.source} characters. The editor still contains the previous text.`,
      })
      return
    }
    setInputError(null)
    setSource(next)
    const nextExpr = parse(next)
    if (nextExpr.ok) {
      const currentNames = freeNames(nextExpr.value)
      setBindings((previous) => previous.filter((b) => currentNames.includes(b.name)))
    }
  }
  function load(index: number) {
    const item = examples[index]!
    setExample(index)
    setSource(item.source)
    setBindings(item.bindings ?? [])
    setOutcome(null)
    select(null)
    setInputError(null)
  }
  function bind(name: string, value: string) {
    setOutcome(null)
    setBindings((previous) => [...previous.filter((b) => b.name !== name), { name, value }])
  }
  function evaluate() {
    if (expr && !inputError) {
      const result = evaluateExpression(
        expr,
        bindings.filter((b) => b.value !== ''),
      )
      setOutcome(result)
      if (!result.ok && result.error.span) {
        const span = result.error.span
        select(expr.nodes.findIndex((n) => n.span.start === span.start && n.span.end === span.end))
      }
      return result.ok
    }
    return false
  }
  return {
    source,
    example,
    bindings,
    outcome,
    selection,
    select,
    error,
    expr,
    names,
    edit,
    load,
    bind,
    evaluate,
  }
}
export type Session = ReturnType<typeof useExpression>
