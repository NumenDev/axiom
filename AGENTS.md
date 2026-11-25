# Working on AXIOM

Read the [architecture](docs/architecture/README.md), [decisions](docs/decisions/README.md), and current [phase report](docs/reports/PHASE_01_REPORT.md) before changing a boundary. The [roadmap](docs/ROADMAP.md) describes future work. Implement a new phase only when authorized.

- Put total, deterministic mathematical functions in `src/domain`. State each domain and assumption. Give each result an explicit kind. Test all finite cases against independent expectations.
- Use strict TypeScript and typed Rust commands. Keep platform APIs, storage, and React out of mathematical functions. Register working environments in the static module registry.
- Use the established spacing, type, color and focus conventions. Ship actionable controls, accessible names, keyboard paths and honest empty states. Check changes in a rendered workspace at desktop and reduced window sizes.
- Store preferences through the application adapter. Validate native inputs. Preserve newer schemas and keep migrations transactional. Never accept a filesystem path, SQL, shell command or executable input from a mathematical expression.
- Use the two lockfiles. Keep runtime dependencies local and justify each addition. Keep credentials, paths, user databases and private notes outside version control.
- Document changes to mathematics, public contracts, design, migrations and setup alongside implementation. Record significant tradeoffs in the decision log. Move deferred work and verification gaps into the relevant phase report.
- Run the commands in the [development guide](docs/development/README.md). For changes to an integration, exercise the normal entry point in addition to its unit tests.
- Before committing, inspect the staged patch, files and generated assets. A completed phase has working software, passing or explicitly blocked gates, an honest report, meaningful commits and a clean working tree.
