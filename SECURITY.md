# Security

For a sensitive issue, use GitHub's private **Report a vulnerability** entry in this repository's Security tab when available. If private reporting is unavailable, open an issue requesting a private contact channel and omit sensitive details. Include the affected revision, platform, impact and expected security property in the private report.

The supported development line is the current main branch. Review changes to the Tauri command surface, window capabilities, navigation, CSP, persistence inputs and mathematical rendering. The release webview serves bundled assets. Its two application commands accept typed preferences and return bounded application errors. The native host owns its data directory and SQL.

Treat expression source, binding text and serialized ASTs as untrusted data. The exact expression engine checks grammar, canonical source/tree agreement, numeric budgets and output sizes. Rendering translates parsed ASTs into application-controlled KaTeX notation with trust disabled. Expression sessions are in memory. [Expression boundaries](docs/mathematics/expressions.md)

AXIOM has no notebook executor, network client plugin, shell plugin or dynamically loaded modules. New computation runtimes require a reviewed isolation design. Keep personal datasets, database files and credentials out of reports, screenshots and patches.
