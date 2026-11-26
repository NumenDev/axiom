# Expression language v1

The engine evaluates exact rational numbers with finite, explicit resource budgets. Its identity is `expression/1`. Each integer is a rational with denominator one.

```ebnf
expression = sum, EOF ;
sum        = product, { ("+" | "-"), product } ;
product    = signed, { ("*" | "/"), signed } ;
signed     = ("+" | "-"), signed | power ;
power      = atom, [ "^", signed ] ;
atom       = number | name | "(", sum, ")" ;
number     = digits, [ ".", digits ] ;
digits     = digit, { digit } ;
name       = ( letter | "_" ), { letter | digit | "_" } ;
```

Letters and digits are ASCII. Names are case-sensitive. Space, tab, LF and CR may separate tokens. A sign is an operator. Leading zeros are legal in source. Multiplication requires `*`. Scientific notation, functions, factorials, comments and implicit products are outside the grammar. Offsets count UTF-16 code units from zero, start inclusive and end exclusive, matching text control selection.

Sums and products fold left. Power binds above prefix signs and takes a signed right operand. Thus `-2^2` gives −4, `(-2)^2` gives 4, `2^-3` gives 1/8 and `2^3^2` gives 512. Decimal digits give a fraction over a power of ten, so `0.1 + 0.2` gives 3/10. The denominator is positive and both terms are coprime. Zero is 0/1. Division requires a nonzero divisor. Exponents must evaluate to integers. Zero to a negative power would divide by zero. This engine reports 0^0 as indeterminate. Other mathematical contexts use different conventions.

Bindings are a list of unique name/value pairs. Values are an optionally signed integer or finite decimal, or a signed integer divided by an optionally signed nonzero integer. The binding text contains no whitespace. A missing name has no numeric value. Parsing and free-name discovery are independent of evaluation. With x = 2, `3*x^2 + 1/2` gives 25/2.

## Interchange

A document has exactly `schema: "axiom.expression/1"`, `source` and `nodes`. The array is in left-to-right postorder. A node's zero-based array index is its ID within that document. The final node is the root. Each node has `kind` and a `span` object with integer `start` and `end`. The remaining fields are:

| Kind       | Fields                                                    |
| ---------- | --------------------------------------------------------- |
| integer    | value (unsigned canonical integer string)                 |
| decimal    | numerator, denominator (unsigned reduced integer strings) |
| identifier | name                                                      |
| group      | child (node index)                                        |
| unary      | op (+ or -), child                                        |
| binary     | op (+, -, *, / or ^), left, right                         |

Parentheses have a node and include both delimiters in their span. Whitespace between tokens remains in the source. Import rebuilds the expected tree from the bounded source and checks every field. This validates arity, order, reachability, spans, operators, identifiers, canonical numbers and resource limits together. Export checks the supplied data against the same contract and emits fresh data. Matching source and nodes establish identical syntax records. Distinct source may produce the same value under particular bindings.

A successful evaluation returns an exact result with engine, domain (integer or rational), and value {numerator, denominator} using signed canonical numerator and positive denominator strings. Its trace records node, span, operation, input fractions and output fraction in evaluation order. Array position gives chronology. Groups forward their child's value. Each literal, substitution and arithmetic operation emits one record. These records describe numeric execution under the supplied bindings.

## Checked entry points

`tokenize(source)`, `parse(source)`, `serialize(document)`, `deserialize(json)` and `evaluateExpression(document, bindings)` return either `{ok:true,value}` or `{ok:false,error}`. The first error in deterministic scan, parse, binding or evaluation order ends that operation. Successful parsing has no binding prerequisite. Names such as `constructor` and `__proto__` have ordinary variable semantics.

Wire text is ASCII JSON. Escaped strings are decoded before comparison. The only unquoted JSON numbers are offsets and node indices. Their spelling must be an unsigned decimal integer with no leading zeros except zero itself. Object members may appear in any order. Duplicate keys, unknown members, missing fields, out-of-order or cyclic references and source/tree disagreement are rejected. The maximum wire-container depth is four. Across languages, use bounded JSON text as the untrusted interchange entry point. In-process object APIs accept ordinary inert records and arrays. JavaScript Proxies belong to the caller's executable code boundary. Comparing canonical fractions for equality requires comparing the two canonical strings.

`value.result` contains the exact value and `value.trace` is an ordered array. Operations are `literal`, `substitute`, `positive`, `negate`, or a binary operator token. Literal and substitution records have no numeric operands. A substitution's node identifies its variable and its output is the bound value. Unary and binary inputs follow source order. Each record contains `node`, `span`, `operation`, `inputs` and `output`. Output and inputs are fraction objects. For a grouped root the last step still yields the expression's value. The engine discards partial results on failure.

| Stable diagnostic code  | Meaning                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| lexical-error           | Source contains an unsupported character or has the wrong type                      |
| invalid-literal         | Decimal punctuation does not match the grammar                                      |
| syntax-error            | Operand, delimiter or end of input expected                                         |
| unsupported-syntax      | Adjacent operands, implicit multiplication, scientific notation or call-like syntax |
| invalid-binding         | Malformed name/value pair, duplicate assignment or zero binding denominator         |
| unbound-variable        | Identifier needs an explicit assignment                                             |
| division-by-zero        | Division or a negative power requires a nonzero divisor                             |
| indeterminate-operation | Zero raised to zero                                                                 |
| unsupported-domain      | Exponent has a nonunit denominator                                                  |
| invalid-serialization   | Malformed, ambiguous or inconsistent v1 data                                        |
| unsupported-schema      | Unknown wire version                                                                |
| resource-limit          | A source, evaluation or output budget was exceeded                                  |

Each error carries a code and message. A source span locates a token or subexpression when available. Syntax errors also identify the expected and actual input. Binding errors may carry the binding name. Signs, grouping and order remain visible in the AST after a numeric domain error.

## Resource budgets

| Resource                                                   |            Maximum |
| ---------------------------------------------------------- | -----------------: |
| Source length in UTF-16 code units                         |              2,048 |
| Tokens excluding EOF                                       |                512 |
| Identifier length                                          |                 32 |
| Digits in a literal or each integer term of a binding      |                 96 |
| Parser nesting and actual AST height                       |                 32 |
| AST nodes / evaluation node visits / trace records         |           255 each |
| Binding names                                              |                 32 |
| Absolute integer exponent                                  |              1,024 |
| Bits in an intermediate numerator or denominator magnitude |              2,048 |
| Serialized document or complete evaluation output          | 65,536 ASCII bytes |

The internal limits are centralized in `contracts.ts`. Input text, tokens and recursive entries have independent guards. Both left folds and recursive expressions must satisfy the tree-height limit. Multiplication cancels common factors before bounded multiplication. Addition uses a common denominator factor and checks intermediate products and sums. Power consumes exponent bits by repeated squaring. A bounded intermediate can fail even when further algebraic manipulation would produce a small result. Each accepted trace record consumes output budget and leaves room for the final fraction. No elapsed-time check interrupts a BigInt instruction.
