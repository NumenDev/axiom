export interface MathModule {
  readonly id: 'logic'
  readonly name: string
  readonly field: string
  readonly description: string
  readonly capabilities: readonly ('evaluate-boolean' | 'truth-table')[]
}

export const logicModule = {
  id: 'logic',
  name: 'Logic Playground',
  field: 'Discrete mathematics',
  description:
    'Evaluate propositions, compare logical operators, and explore complete truth tables.',
  capabilities: ['evaluate-boolean', 'truth-table'],
} as const satisfies MathModule

export const modules: readonly MathModule[] = [logicModule]
