import { checked, limits, reject, type Op, type Span } from './contracts.ts'
export type Token = Readonly<{
  kind: 'number' | 'name' | '(' | ')' | Op | 'end'
  lexeme: string
  span: Span
}>
export function tokenize(source: string) {
  return checked(() => scan(source))
}
export function scan(source: string): Token[] {
  if (typeof source !== 'string') reject('lexical-error', 'Expression source must be text.')
  if (source.length > limits.source)
    reject('resource-limit', `Use at most ${limits.source} source characters.`, {
      span: { start: limits.source, end: source.length },
    })
  const tokens: Token[] = []
  let i = 0
  while (i < source.length) {
    const start = i,
      ch = source[i++]!
    if (' \t\r\n'.includes(ch)) continue
    let kind: Token['kind']
    if (/[0-9.]/.test(ch)) {
      while (i < source.length && /[0-9.]/.test(source[i]!)) i++
      const lexeme = source.slice(start, i),
        span = { start, end: i }
      if (!/^\d+(?:\.\d+)?$/.test(lexeme))
        reject('invalid-literal', 'Write digits on both sides of one decimal point.', { span })
      if (lexeme.replace('.', '').length > limits.digits)
        reject('resource-limit', `Numeric literals allow ${limits.digits} digits.`, { span })
      kind = 'number'
    } else if (/[A-Za-z_]/.test(ch)) {
      while (i < source.length && /[A-Za-z0-9_]/.test(source[i]!)) i++
      if (i - start > limits.name)
        reject('resource-limit', `Identifiers allow ${limits.name} characters.`, {
          span: { start, end: i },
        })
      kind = 'name'
    } else if ('+-*/^()'.includes(ch)) kind = ch as Op | '(' | ')'
    else {
      const width = (source.codePointAt(start) ?? 0) > 0xffff ? 2 : 1
      reject(
        'lexical-error',
        'Unsupported character. Identifiers use ASCII letters, digits and underscore.',
        { span: { start, end: start + width }, actual: source.slice(start, start + width) },
      )
    }
    if (tokens.length >= limits.tokens)
      reject('resource-limit', `Expression exceeds ${limits.tokens} tokens.`, {
        span: { start, end: i },
      })
    tokens.push({ kind, lexeme: source.slice(start, i), span: { start, end: i } })
  }
  tokens.push({ kind: 'end', lexeme: '', span: { start: i, end: i } })
  return tokens
}
