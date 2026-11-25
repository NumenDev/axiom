import { limits, reject, type Op } from './contracts.ts'
export type Rational = Readonly<{ n: bigint; d: bigint }>
export type Fraction = Readonly<{ numerator: string; denominator: string }>
export const wire = ({ n, d }: Rational): Fraction => ({
  numerator: String(n),
  denominator: String(d),
})
const abs = (n: bigint) => (n < 0n ? -n : n)
const max = (1n << BigInt(limits.bits)) - 1n
export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a)
  b = abs(b)
  while (b !== 0n) [a, b] = [b, a % b]
  return a
}
export function reduced(n: bigint, d: bigint): Rational {
  if (!d) reject('division-by-zero', 'A rational denominator must be nonzero.')
  const factor = gcd(n, d) * (d < 0n ? -1n : 1n)
  return { n: n / factor, d: d / factor }
}
function tooLarge(): never {
  return reject('resource-limit', `An exact intermediate exceeds ${limits.bits} bits.`)
}
function product(a: bigint, b: bigint) {
  if (b && abs(a) > max / abs(b)) tooLarge()
  return a * b
}
function sum(a: bigint, b: bigint) {
  if (((a > 0n && b > 0n) || (a < 0n && b < 0n)) && abs(a) > max - abs(b)) tooLarge()
  return a + b
}
export function literal(text: string): Rational {
  const point = text.indexOf('.')
  return point < 0
    ? { n: BigInt(text), d: 1n }
    : reduced(BigInt(text.replace('.', '')), 10n ** BigInt(text.length - point - 1))
}
function multiply(a: Rational, b: Rational) {
  const g = gcd(a.n, b.d),
    h = gcd(b.n, a.d)
  return { n: product(a.n / g, b.n / h), d: product(a.d / h, b.d / g) }
}
function inverse(a: Rational) {
  if (a.n === 0n) reject('division-by-zero', 'Division requires a nonzero divisor.')
  return a.n < 0n ? { n: -a.d, d: -a.n } : { n: a.d, d: a.n }
}
function power(a: Rational, b: Rational) {
  if (b.d !== 1n) reject('unsupported-domain', 'This engine requires an integer exponent.')
  if (!a.n && !b.n)
    reject('indeterminate-operation', 'Zero to the zeroth power is indeterminate in this language.')
  let exp = abs(b.n)
  if (exp > BigInt(limits.exponent))
    reject('resource-limit', `Exponent magnitude exceeds ${limits.exponent}.`)
  let base = b.n < 0n ? inverse(a) : a
  let result = { n: 1n, d: 1n }
  while (exp) {
    if (exp % 2n) result = multiply(result, base)
    exp /= 2n
    if (exp) base = multiply(base, base)
  }
  return result
}
export function calculate(op: Op, a: Rational, b: Rational): Rational {
  switch (op) {
    case '^':
      return power(a, b)
    case '*':
      return multiply(a, b)
    case '/':
      return multiply(a, inverse(b))
    default: {
      const g = gcd(a.d, b.d)
      const n = sum(product(a.n, b.d / g), product(op === '+' ? b.n : -b.n, a.d / g))
      const h = gcd(n, g)
      return { n: n / h, d: product(a.d / g, b.d / h) }
    }
  }
}
