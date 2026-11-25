import {
  checked,
  limits,
  reject,
  schema,
  type Expression,
  type Node,
  type Op,
} from './contracts.ts'
import { scan, type Token } from './lexer.ts'
import { literal, wire } from './rational.ts'
export function parse(source: string) {
  return checked(() => parseSource(source))
}
export function parseSource(source: string): Expression {
  const tokens = scan(source)
  const nodes: Node[] = [],
    heights: number[] = []
  let cursor = 0
  const peek = () => tokens[cursor]!
  const take = () => tokens[cursor++]!
  function unexpected(expected: string): never {
    const t = peek()
    if (expected !== 'an operand' && ['(', 'name', 'number'].includes(t.kind))
      reject(
        'unsupported-syntax',
        'Adjacent operands require explicit multiplication (*). Function calls and scientific notation are unsupported.',
        { span: t.span, expected, actual: t.lexeme },
      )
    return reject('syntax-error', `Expected ${expected}, found ${t.lexeme || 'end of input'}.`, {
      span: t.span,
      expected,
      actual: t.lexeme || 'EOF',
    })
  }
  function add(node: Node, height = 1) {
    if (height > limits.depth || nodes.length >= limits.nodes)
      reject(
        'resource-limit',
        `Syntax trees allow ${limits.nodes} nodes and ${limits.depth} levels.`,
        { span: node.span },
      )
    heights.push(height)
    return nodes.push(node) - 1
  }
  function combine(left: number, operator: Token, right: number) {
    return add(
      {
        kind: 'binary',
        op: operator.kind as Op,
        left,
        right,
        span: { start: nodes[left]!.span.start, end: nodes[right]!.span.end },
      },
      1 + Math.max(heights[left]!, heights[right]!),
    )
  }
  function signed(depth: number): number {
    if (depth > limits.depth)
      reject('resource-limit', 'Expression nesting exceeds the parser limit.', {
        span: peek().span,
      })
    const t = peek()
    if (t.kind === '+' || t.kind === '-') {
      take()
      const child = signed(depth + 1)
      return add(
        {
          kind: 'unary',
          op: t.kind,
          child,
          span: { start: t.span.start, end: nodes[child]!.span.end },
        },
        1 + heights[child]!,
      )
    }
    let base: number
    if (t.kind === '(') {
      take()
      const child = sum(depth + 1)
      if (peek().kind !== ')') unexpected("')'")
      base = add(
        { kind: 'group', child, span: { start: t.span.start, end: take().span.end } },
        1 + heights[child]!,
      )
    } else if (t.kind === 'name') {
      take()
      base = add({ kind: 'identifier', name: t.lexeme, span: t.span })
    } else if (t.kind === 'number') {
      take()
      const value = wire(literal(t.lexeme))
      base = add(
        t.lexeme.includes('.')
          ? { kind: 'decimal', ...value, span: t.span }
          : { kind: 'integer', value: value.numerator, span: t.span },
      )
    } else return unexpected('an operand')
    if (peek().kind === '^') return combine(base, take(), signed(depth + 1))
    return base
  }
  function product(depth: number) {
    let left = signed(depth)
    while (peek().kind === '*' || peek().kind === '/') left = combine(left, take(), signed(depth))
    return left
  }
  function sum(depth: number) {
    let left = product(depth)
    while (peek().kind === '+' || peek().kind === '-') left = combine(left, take(), product(depth))
    return left
  }
  sum(1)
  if (peek().kind !== 'end') unexpected('end of input')
  return { schema, source, nodes }
}
export function freeNames(expression: Expression): string[] {
  return [
    ...new Set(expression.nodes.flatMap((node) => (node.kind === 'identifier' ? [node.name] : []))),
  ]
}
