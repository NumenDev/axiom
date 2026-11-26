export interface MathModule {
  readonly id: 'logic' | 'expression'
  readonly name: string
  readonly field: string
  readonly description: string
  readonly capabilities: readonly (
    'evaluate-boolean' | 'truth-table' | 'evaluate-rational' | 'syntax-tree' | 'evaluation-trace'
  )[]
}

export const logicModule = {
  id: 'logic',
  name: 'Logic Playground',
  field: 'Discrete mathematics',
  description:
    'Evaluate propositions, compare logical operators, and explore complete truth tables.',
  capabilities: ['evaluate-boolean', 'truth-table'],
} as const satisfies MathModule

export const expressionModule = {
  id: 'expression',
  name: 'Expression Workbench',
  field: 'Mathematical foundations',
  description:
    'Evaluate exact rational expressions and inspect their syntax, bindings and computation.',
  capabilities: ['evaluate-rational', 'syntax-tree', 'evaluation-trace'],
} as const satisfies MathModule

export const modules: readonly MathModule[] = [logicModule, expressionModule]
