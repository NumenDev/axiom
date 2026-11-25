# Architecture

AXIOM currently has one frontend package and one native crate. Dependency direction follows the work each layer owns.

| Boundary          | Inputs                                                    | Outputs and ownership                                                                     |
| ----------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Presentation      | User events, module metadata and typed results            | Accessible React views, KaTeX markup, short-lived selection, tabs and log                 |
| Application       | Workspace choices and decoded preferences                 | Static environment registry, preference store interface and platform adapter              |
| Boolean domain    | An operator ID and Boolean P and Q                        | Exact Boolean with engine identifier, or a structured input error at the checked boundary |
| Expression domain | Source text, v1 syntax records, explicit numeric bindings | Checked parse, versioned exact rational result and bounded trace                          |
| Native host       | Two allowlisted preference commands                       | Validated settings in one application-owned SQLite file                                   |
| Figure rendering  | Two angular parameters and fixed radii                    | Local orthographic SVG projection with front- and back-facing mesh lines                  |

The engine imports neither React nor the application layer. Presentation calls its total functions and renders results. The registered module declares its name, field and capabilities. Adding a shipped module requires a concrete engine, a typed capability, independent tests and a presentation entry point. Planned modules appear only in the roadmap.

## Representation and interoperability

The Phase 01 expression is a closed connective ID applied to P, Q, or both. The domain accepts native Booleans and returns a serializable exact result with `kind`, `value`, and `engine`. The checked input entry point returns `unknown-operator` or `invalid-assignment`. Operator labels, notation, and translations belong to presentation. Each operation is bounded to a single Boolean expression. A table enumerates exactly four assignments.

The expression engine parses text into a v1 postorder node table. Evaluation validates the table against its original source and walks it in order with a Map of explicit bindings. The static registry declares distinct Boolean and rational capabilities. Both results share the structural fields `kind`, `engine` and `value`. Phase 01 Boolean callers retain their original types. The rational result adds a domain and uses decimal strings. Direct calls suffice for these two bounded engines. A future runtime would need its own protocol and isolation. [Expression contract](../mathematics/expressions.md)

## Storage and lifecycle

Desktop startup opens `workspace.sqlite3` in the platform application-data directory for `dev.numendev.axiom`. A transaction initializes schema version 1 and a singleton preferences table. The first user change creates the settings row. Prepared parameters and a fixed path keep user data out of SQL and filesystem selection. Writes serialize through a native mutex and a transaction. Competing sessions use whole-document, last-committed preferences.

Stored visibility, logical sizes and compact spacing are distinct from session-only focus, tab contents, selected assignment and the bounded 100-entry log. Browsers use one versioned origin-local storage entry. A corrupt settings document falls back to defaults. Unsupported versions and inaccessible stores allow session-only use and keep the existing contents intact. Failed saves are visible in the status bar.

A future notebook should persist versioned mathematical objects, ordered cells, bindings, assumptions, engine versions, parameters and reproducibility metadata. Use explicit migrations and an import/export format that can be tested independently of the live database. Introduce these tables with their first functional feature.

## Execution and result semantics

A research runtime must carry cancellation IDs, deadlines, resource budgets and versioned requests. Treat imported notebooks as untrusted data. Parsing must be bounded. A future worker needs process isolation, restricted file and network access, a termination path and recoverable partial results. This release has no interpreter or runtime loader.

Exact, symbolic, approximate, empirical, conjectural and formally verified outputs require distinct contracts and visible labels. See the mathematical guidelines and architectural decisions for the evidence required to introduce another kind. [Mathematical correctness](../mathematics/README.md) · [Decisions](../decisions/README.md)
