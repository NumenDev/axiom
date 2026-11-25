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
