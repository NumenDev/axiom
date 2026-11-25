"""Regenerate the development oracle using Python's Fraction and a fixed PRNG."""
from fractions import Fraction
import json
from pathlib import Path
from random import Random

rng = Random(20261125)
rows = []
for _ in range(96):
    a, b, c = [Fraction(rng.randrange(-3000, 3001), rng.randrange(1, 97)) for _ in range(3)]
    power = rng.choice([-3, -2, -1, 0, 1, 2, 3])
    if b == 0 or c == 0:
        continue
    source = f"(({a}) + ({b})) * (({c}) ^ {power}) / ({b})"
    result = (a + b) * c ** power / b
    rows.append([source, str(result.numerator), str(result.denominator)])
path = Path(__file__).resolve().parents[1] / "tests/fixtures/expression-fractions.json"
path.write_text(json.dumps(rows, indent=2) + "\n")
