# Development

Use Node.js 24 or newer, pnpm 11.25.0, stable Rust with Cargo, rustfmt and Clippy. Install the Linux dependencies listed in the README and Tauri prerequisite guide. System package management belongs to the machine owner. A local display server is needed for an interactive desktop launch. [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

From the repository root, install dependencies with `pnpm install --frozen-lockfile`. Start the native application with `pnpm desktop dev`, or the browser preview with `pnpm dev`. The dev server listens on loopback port 1420. Run one development server at a time.

| Command                                                                                   | Checks or produces                                                     |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `pnpm typecheck`                                                                          | Strict TypeScript across source and tests                              |
| `pnpm lint`                                                                               | ESLint, including React hook rules                                     |
| `pnpm format:check`                                                                       | Prettier for source, configuration and documentation                   |
| `pnpm test`                                                                               | Pure Node mathematical oracle and jsdom interface/storage tests        |
| `pnpm exec playwright install chromium`                                                   | Browser used by the integration suite                                  |
| `pnpm test:e2e`                                                                           | Real browser navigation, keyboard, persistence and four viewport sizes |
| `pnpm build`                                                                              | Type check and production assets in `dist/`                            |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check`                                  | Rust formatting                                                        |
| `cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` | Native linting                                                         |
| `cargo test --locked --manifest-path src-tauri/Cargo.toml`                                | SQLite migrations and storage tests                                    |
| `pnpm desktop build --no-bundle -- --locked`                                              | Native release executable                                              |

On a supported Linux CI worker, Playwright's `install --with-deps chromium` also provisions browser system libraries. To use an already installed Chromium-family binary, set `AXIOM_CHROMIUM` to its executable path. Set `AXIOM_SCREENSHOTS` to an existing directory to keep the welcome and logic PNGs from the visual tests.

After an initial successful native build, an offline rebuild can use `pnpm install --offline --frozen-lockfile` and `pnpm desktop build --no-bundle -- --locked --offline`. Builds require the local package stores to contain the locked dependencies. A built executable loads bundled assets directly.

To isolate native layout data on Linux, point `XDG_DATA_HOME` to a temporary directory before launch. Browser tests use fresh browser contexts. Keep screenshots free of personal content. The phase report records actual commands, evidence and outstanding manual checks.

## Verify the expression engine

Run `python3 scripts/expression-fixtures.py` to regenerate the checked-in oracle and compare it with Git. The generator uses Python's standard-library Fraction and seed 20261125. Normal tests consume the checked-in data. Run `node scripts/expression-bench.mjs` with Node 24 or newer for per-workload parse and checked evaluation distributions, trace bytes, outcomes and process-level peak RSS. The benchmark imports the domain directly.

In the browser suite, the Expression Workbench scenarios exercise the real welcome, commands, editing, error recovery, clipboard, large notation, drawers, source selection and trace. Set `AXIOM_SCREENSHOTS` to an existing directory for evidence captures. For a native smoke, launch a locked release with a temporary XDG data profile, open the workbench using Ctrl+K, and evaluate the initial example with Ctrl+Enter from the editor. Verify 25/2 and use Ctrl+J to exercise the preference command. Separate tests should cover native compositor startup and renderer interactions.

The native adapter now uses rusqlite 0.41 with bundled SQLite. The adapter requires Rust 1.89 or later. Run `cargo audit --file src-tauri/Cargo.lock` and `pnpm audit --prod` to check both dependency graphs. Record informational warnings separately from vulnerability counts.
