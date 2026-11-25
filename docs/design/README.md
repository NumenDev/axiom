# Workspace design system

The dark desktop shell uses a 49 px activity rail, 39 px tab strip and a 26 px status line. The central document owns its scroll area. Dividers support dragging and arrow keys. At 1120 px or below, the inspector opens on demand. At 800 px or below the explorer also becomes a drawer. The desktop minimum is 720 × 540 logical pixels.

| Role        | Token                | Use                                     |
| ----------- | -------------------- | --------------------------------------- |
| Canvas      | `--bg` · #121615     | Reading and mathematical work           |
| Panel       | `--panel` · #171b1a  | Navigation, inspector, log              |
| Text        | `--text` · #e5e9e4   | Headings and primary values             |
| Secondary   | `--soft` · #b4bdb5   | Explanations                            |
| Muted       | `--muted` · #939f96  | Supporting labels                       |
| Accent      | `--accent` · #a3d9b7 | Focus, selection and affirmative values |
| Mathematics | `--math` · #b3c6e9   | Expressions and variables               |
| False value | `--warm` · #dfb99b   | Textual Boolean false                   |

Plex Sans sets interface copy. Plex Mono distinguishes technical metadata, sizes and keyboard shortcuts. KaTeX supplies mathematical glyphs and MathML. The identity line uses the system serif italic. Font assets ship locally. Theme roles live in CSS custom properties. A light palette requires its own visual and contrast review.

Use the existing icon button, formula renderer and splitter. Keep Lucide stroke weights consistent. Space related controls in 4–8 px increments and delimit sections with a single rule. Labels and state changes include text or semantics as well as color. Provide a visible keyboard focus ring, a named switch or button and a reachable way to dismiss each overlay.

The welcome plate plots a mathematical torus. Its caption corresponds to the parameters in the workspace guide. The logic view puts the expression, exactness, selected assignment and complete truth table in the same reading order. Future approximations need a visible precision or error statement. Formal verification needs an inspectable proof artifact. The UI may only advertise modules present in the shipped registry.
