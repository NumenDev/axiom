# Mathematical correctness

Phase 01 uses classical two-valued propositional logic. P and Q range independently over the Booleans. Negation applies to P. The truth table still includes both values of Q so switching between operators preserves assignment identity.

| P   | Q   | P ∧ Q | P ∨ Q | ¬P  | P → Q | P ↔ Q |
| --- | --- | ----- | ----- | --- | ----- | ----- |
| T   | T   | T     | T     | F   | T     | T     |
| T   | F   | F     | T     | F   | F     | F     |
| F   | T   | F     | T     | T   | T     | F     |
| F   | F   | F     | F     | T   | T     | T     |

Disjunction is inclusive. Material implication equals ¬P ∨ Q, including both false-antecedent cases. Biconditional compares truth values for equality. These operations are exact, deterministic, total and require no floating-point conversion. The oracle is independent of the implementation. Changing a connective requires checking the definition, enumeration order, displayed expression and all four test cases.

## Result evidence

| Kind                  | Required evidence                                             |
| --------------------- | ------------------------------------------------------------- |
| Exact                 | Domain, representation and deterministic operation            |
| Symbolic              | Well-formed expression, bindings, transformation conditions   |
| Approximation         | Method, precision, tolerance or justified error bound         |
| Empirical observation | Experiment definition, sample, seeds and engine versions      |
| Conjecture            | Statement, assumptions and explicit unverified status         |
| Formally verified     | Formal statement, checker version and accepted proof artifact |

Both engines produce exact results. The expression engine uses reduced rationals and an integer domain label when the denominator equals one. The operator grammar, checked AST and limits are specified separately. [Expression language v1](expressions.md)

Future modules must describe domain errors and runtime failures separately. A finite sample of observations cannot establish a general theorem. Document the mathematical assumptions, prove or test invariants, and make limitations visible at the point of use.
