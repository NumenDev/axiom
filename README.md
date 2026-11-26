# AXIOM — Mathematical Research Environment

_Explore. Reason. Discover._

AXIOM is an open-source, local-first desktop workspace for mathematical exploration. It gives students and researchers a place to change an assumption, inspect an exact result, and connect a computational experiment to its mathematical definition.

![Expression Workbench evaluating a polynomial at x = 2 to the exact value 25/2](docs/images/phase-02/exact.png)

## Current capabilities

The 0.2.0 development branch includes a Linux desktop application and a standalone browser preview. Expression Workbench parses a bounded mathematical language, evaluates exact integer and rational values, and links each operation to its source, syntax tree and evaluation trace. For example, enter `3*x^2 + 1/2`, bind `x` to `2`, and choose **Evaluate** to obtain `25/2`. Expression sessions live in memory. [Language and wire contract](docs/mathematics/expressions.md)

Logic Playground evaluates conjunction, inclusive disjunction, negation, material implication, and biconditional over two Boolean propositions. Every expression has a complete truth table, an inspectable domain and a versioned exact result.

The workspace includes tabs, an explorer, a contextual inspector, keyboard commands, resizable panels and a session log. Preferences live on the device. The desktop runs offline after installation, including notation and fonts.

## Run from source

Install Git, Node.js 24 or newer, pnpm 11.25.0, stable Rust with Cargo, and the Linux Tauri development libraries. On Arch, the native build needs the base development tools, GTK 3, WebKitGTK 4.1, librsvg and OpenSSL development files. See the platform-specific prerequisite list before installing missing packages. [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

```sh
git clone --branch feat/phase-02-expression-engine https://github.com/NumenDev/axiom.git
cd axiom
pnpm install --frozen-lockfile
pnpm desktop dev
```

For a release executable, run `pnpm desktop build --no-bundle -- --locked` and launch `./src-tauri/target/release/axiom` on Linux. This phase distributes source. The first dependency fetch requires network access.

For interface development alone, run `pnpm dev` and open the loopback address printed by Vite. The browser preview keeps its own layout preferences. Run `pnpm test` for domain and interface tests and `pnpm build` for type checking and the production frontend. The development guide covers native checks, Playwright and offline rebuilds. [Development guide](docs/development/README.md)

## Architecture

React presents the workspace. Application services connect the static module registry and preference store. Pure TypeScript engines evaluate Boolean assignments and rational expressions. Both expose an exact result kind, value and engine identity. Tauri exposes two typed preference commands to its local main window. Rust owns SQLite, migration transactions and input validation. [Architecture](docs/architecture/README.md) · [Decisions](docs/decisions/README.md)

## Direction and status

The long-term direction brings symbolic computation, notebooks, visualization, reproducible experiments and formal proof into one research environment. Propositional logic and set theory are proposed for Phase 03. Phase 02 is prepared for review. [Roadmap](docs/ROADMAP.md) · [Phase 02 evidence and limitations](docs/reports/PHASE_02_REPORT.md)

## Contributing and license

Contributions should include executable correctness evidence and preserve offline operation. AXIOM is released under the MIT license. Third-party code and local fonts retain their respective licenses. [Contributing](CONTRIBUTING.md) · [MIT license](LICENSE) · [Bundled notices](public/licenses)
