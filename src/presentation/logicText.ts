import type { Operator } from '../domain/logic'
export const logicText: Record<
  Operator,
  { name: string; symbol: string; tex: string; rule: string; arity: string }
> = {
  and: {
    name: 'Conjunction',
    symbol: '∧',
    tex: 'P \\land Q',
    rule: 'True exactly when both propositions are true.',
    arity: 'Binary',
  },
  or: {
    name: 'Disjunction',
    symbol: '∨',
    tex: 'P \\lor Q',
    rule: 'True when at least one proposition is true, including when both are true.',
    arity: 'Binary',
  },
  not: {
    name: 'Negation',
    symbol: '¬',
    tex: '\\neg P',
    rule: 'Reverses the truth value of P. Changing Q leaves the result unchanged.',
    arity: 'Unary',
  },
  implies: {
    name: 'Implication',
    symbol: '→',
    tex: 'P \\to Q',
    rule: 'False exactly when P is true and Q is false. A false antecedent makes the implication true.',
    arity: 'Binary',
  },
  iff: {
    name: 'Biconditional',
    symbol: '↔',
    tex: 'P \\leftrightarrow Q',
    rule: 'True exactly when P and Q have the same truth value.',
    arity: 'Binary',
  },
}
