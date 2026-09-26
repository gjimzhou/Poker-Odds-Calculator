# Development and verification

[Documentation index](README.md) · [Project](../README.md)

## Evaluation and verification

The evaluator ranks the best five cards directly from rank counts and suit
bitmasks. It covers wheel straights, royal/straight flushes, two triplets,
three pairs, all kickers, board-only hands, and split pots. No old evaluator
or SciPy dependency is retained.

```sh
# Fast API, CLI, local HTTP, input-validation and independent-oracle tests
python -m unittest discover -s tests -v

# Also classify all 2,598,960 five-card hands and evaluate a full preflop case
POKER_SLOW_TESTS=1 python -m unittest discover -s tests -v
```

The fast suite compares 3,000 seeded 5/6/7-card hands to an independent
five-card classifier, compares an entire dead-card flop to that oracle,
checks player/suit/order invariance, and verifies manually countable
turn/river cases. Randomness is used only to generate evaluator test inputs.
The production engine does not sample.

CI also runs a Chromium browser test (`tests/browser.cjs`) covering all four
streets, dead cards, exact displayed results, error recovery, the busy state,
and mobile horizontal overflow. Playwright is an optional test dependency;
the application itself still needs only Python.

Exhaustive tests verify the nine standard five-card category totals and
the exact 50% symmetry of `Ac Ad` versus `Ah As` over all preflop boards.
The pure-Python preflop calculation may take tens of seconds depending on
hardware. Later streets are much smaller. No partial result is labeled exact.


## Repository boundaries

| Directory | Responsibility |
| --- | --- |
| `web/` | Public static app: HTML, styles, app controller, Worker and exact engine |
| `poker_odds/` | Python library, CLI and optional local HTTP interface |
| `tests/` | Independent mathematical oracle, API and browser regressions |
| `docs/` | Usage, mathematics and maintenance |

The default branch is `master`. GitHub Pages publishes only `web/`; it does not deploy the Python server. Keep the browser and Python engines equivalent; changes to shared UI behavior must consider both interfaces. The local Python HTML is intentionally independent of the public Worker runtime.

```sh
python -m http.server 8765 --directory web
node --check web/app.js
python -m unittest discover -s tests -v
```

The public app loads `style.css` and `app.js` as separate files. Worker URLs remain relative to the document, so the GitHub Pages project prefix works. Browser tests run in both `python` and `static` modes in CI.
