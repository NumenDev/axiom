# Architecture decisions

Decisions 001–006 record the Phase 01 foundation. Decisions 007–009 extend the design for Phase 02. Revisit a decision when its stated constraint changes.

## 001 · Desktop stack

Accepted. A Tauri 2 host owns one local webview. React, strict TypeScript and Vite provide the interface. Electron would give a uniform bundled browser at a higher distribution cost. A browser-only application would need a second solution for native data ownership. The design targets Arch Linux and keeps an isolated browser preview for interface development.

## 002 · Engine boundary

Accepted. The finite Boolean engine is a pure TypeScript module. It shares a process with its caller because evaluation is total and bounded to four assignments. A Rust round trip for each toggle or a Python interpreter would add failure modes without improving exactness. A typed operator ID and a pair of Booleans are the entire expression vocabulary. Rendering, persistence, locale strings and IPC stay outside the engine. A future parser will require its own versioned expression representation.

## 003 · Local persistence

Accepted. Rust owns an application-data SQLite file with one preferences row. Transactions protect schema migration, and SQLite serializes writes. A typed command pair keeps SQL and paths out of the webview. Compared with a JSON file, SQLite provides explicit schema compatibility and atomic updates without custom file replacement. The standalone browser uses origin-local storage for its own preferences.

## 004 · Mathematical correctness

Accepted. Every evaluation carries its result kind and engine version. Phase 01 produces exact Booleans. Test each connective against an independent four-row oracle. Implication is material implication and disjunction is inclusive. Future symbolic values, approximations, observations, conjectures and verified statements require distinct contracts and evidence before they can be displayed.

## 005 · Module extensibility

Accepted. A static, typed registry describes shipped environments and their capabilities. Navigation and the welcome screen consume it. A dynamic plugin loader would introduce an execution boundary and compatibility protocol before there is a second engine. Planned environments live in a read-only roadmap.

## 006 · Computation isolation

Accepted. The current vocabulary has no executable input and a fixed evaluation bound. Future untrusted computation requires a separate restricted process, a versioned data-only protocol, cancellation IDs, wall-clock deadlines, memory and output limits, and termination on timeout. Interactive notebook execution is deferred until isolation can be verified on each target OS.

## 007 · Expression parser and source identity

Accepted for Phase 02. Recursive descent maps each precedence level to a grammar production. Iterative left folds and a signed right operand for power express the asymmetric precedence of unary minus. Pratt parsing and precedence climbing would suit a larger operator table, but require additional binding-power conventions for these five operators. Keep parentheses and original text for the source inspector.

## 008 · Exact numbers and execution boundary

Accepted. Use reduced BigInt fractions in the pure TypeScript domain, with decimal strings on the wire. Integer powers use bounded repeated squaring. Check arithmetic and output budgets during evaluation. Retain the Boolean API and register the rational engine separately. Neither requires native IPC. Version any future changes to language meaning or wire identity.

## 009 · Interchange and trace

Accepted. Flat postorder nodes make references, child-before-parent evaluation and source selection explicit. The validated source determines the entire table. Re-parsing during import costs a bounded extra parse and prevents a document from displaying one expression while evaluating another. Record inputs and outputs at the point of calculation. A trace omits redundant group records and never needs a full expression copy per operation.
