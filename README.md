# Heads-up Exact · Poker Odds Calculator

Exact Texas Hold’em showdown odds for **two players with known hole cards**. Choose the hands, add any known board and dead cards, and see wins, ties and each player’s expected share of the pot.

**[Open the calculator →](https://gjimzhou.github.io/Poker-Odds-Calculator/)** · [使用说明 / Guide](https://gjimzhou.github.io/Poker-Odds-Calculator/#guide) · [Documentation](docs/README.md)

## Start in the browser

1. Select two cards for each player.
2. Choose preflop, flop, turn or river and fill the known board.
3. Add dead cards only if their identities are known.
4. Calculate; use the examples to explore a draw, blocked outs or a split pot.

English and Chinese are built in. Calculations run on your device in a Worker, with progress and cancellation. No account or server is needed. Public-site page statistics are described in [Analytics](docs/analytics.md); card inputs are not sent to that service.

## What “exact” means

The engine enumerates every legal remaining board. It uses no random sampling; rounded percentages are accompanied by exact counts and fractions. Equity includes half of a tied pot. This is fixed-hand heads-up showdown equity: it does not model unknown opponent ranges, future folds, betting, rake or side pots.

Preflop without dead cards means 1,712,304 boards, so it takes longer than a turn or river calculation. [Read the mathematics and assumptions](docs/mathematics.md).

## Choose an interface

| Need | Entry point |
| --- | --- |
| Use it now | [Public web app](https://gjimzhou.github.io/Poker-Odds-Calculator/) |
| Serve the static app locally | `python -m http.server 8765 --directory web` |
| Use the local Python interface | `python -m poker_odds.server` |
| Calculate in a terminal | `python -m poker_odds 'As Ah' 'Kc Kd'` |
| Use the library | [Python API and examples](docs/usage.md#python-api) |

Python 3.10+; the Python engine has no runtime package dependencies. Open local interfaces through HTTP rather than `file://`.

## Maintain the project

`web/` contains the public website, `poker_odds/` the Python implementation, `tests/` the independent verification suite, and `docs/` the guides. The default branch is **`master`**, and GitHub Pages publishes `web/`.

[Development and tests](docs/development.md) · [All documentation](docs/README.md) · [Report an issue](https://github.com/gjimzhou/Poker-Odds-Calculator/issues)
