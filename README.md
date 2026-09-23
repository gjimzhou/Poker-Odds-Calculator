# Heads-up Poker Odds Calculator

Exact Texas Hold'em showdown odds for **two players with known hole cards**.
Supports preflop, flop, turn, river, and optional known **dead cards** (including
exposed cards folded by a third player). No random sampling, external service,
or runtime dependencies. Python 3.10+.

## Hosted website

**Public app:** https://gjimzhou.github.io/Poker-Odds-Calculator/  
**Languages:** English / 中文 (switchable in the UI)

The site is deployed from `web/` to GitHub Pages by
`.github/workflows/pages.yml` whenever `master` changes. The browser-only app
uses static HTML, a JavaScript exact-counting engine, and a Web Worker; it needs
no Python backend. Calculations run on the visitor's device with progress and
cancellation. All counts match the Python engine; preflop performance depends
on the device. This remains exact enumeration, not Monte Carlo or a universal
closed-form formula.

To serve the same site locally, run
`python -m http.server 8765 --directory web` and open
http://localhost:8765. Do not open the HTML as a `file://` URL, because module
workers require an HTTP origin. All browser imports use relative paths, so the
same files work at the GitHub Pages project path
`/Poker-Odds-Calculator/`.

## Run the Python browser interface

From this repository's directory:

```sh
python -m poker_odds.server
```

Open **http://127.0.0.1:8765** in your browser. Enter both hands, the board,
and any dead cards, then calculate. Built-in examples cover all four streets.
Click the illustrated card slots to open the 52-card picker. Cards already used
in another slot are disabled. Choose Preflop/Flop/Turn/River to set the board
size; click an existing card to replace or remove it. Dead cards can be added
in one multi-selection session. No card notation needs to be typed.

Everything runs locally. Stop the server with Ctrl+C. Use `--port 8766` to
choose a different port. The server binds only to localhost and is intended
for local use, not public deployment. Only one calculation runs at a time.

## Command line

```sh
# Preflop: all 1,712,304 legal boards
python -m poker_odds 'As Ah' 'Kc Kd'

# Flop: all 990 legal turn/river combinations
python -m poker_odds 'As Qs' '9c 9d' --board 'Js Ts 9h'

# Turn, with both remaining kings known to be folded
python -m poker_odds 'As Ah' 'Kc Kd' --board '2c 7d 9h Js' --dead 'Ks Kh'

# River, board plays: each player has 50% equity
python -m poker_odds '2s 3s' '4c 5d' --board 'As Ks Qs Js Ts' --json
```

The turn example returns 42 wins, 0 losses, 0 ties, and exactly 100% equity
for player 1. Without `--dead`, player 2 wins on either remaining king:
player 1's equity is exactly **21/22**.

Card text accepts `As Kh`, `AsKh`, `10h,9h`, or `A♠ K♥`, case-insensitively.
Ranks are 2–9/T/J/Q/K/A; suits are c/d/h/s. Quote multi-card shell arguments.
Duplicate or overlapping cards, invalid cards, incorrect hand/board lengths,
and too few remaining cards are rejected.

Installation is optional: `python -m pip install .` also creates the
`poker-odds` command. Running directly from the repository requires no install.

## Python API

```python
from poker_odds import calculate, evaluate

r = calculate('As Ah', 'Kc Kd', board='2c 7d 9h Js', dead='Ks Kh')
print(r.wins, r.losses, r.ties, r.total)  # 42 0 0 42
print(r.equity)                          # Fraction(1, 1), displayed as 1
print(r.opponent_equity)                 # Fraction(0, 1)
print(r.as_dict())                       # JSON-safe counts and rational strings

assert evaluate('As Ks Qs Js Ts 2d 3c') == (8, 14)
```

`win_probability`, `loss_probability`, `tie_probability`, `equity`, and
`opponent_equity` are `fractions.Fraction` values. `wins` and `losses` refer
to player 1. Equity is expected pot share, so ties contribute **one half**.
The JSON output includes exact fraction strings and rounded floating-point
decimal convenience values. The browser shows headline equity to two decimals and outcome probabilities
to six; exact fractions remain available.

## The mathematics — and the closed-form boundary

This project computes **exact probabilities using exhaustive enumeration**.
It is **not** Monte Carlo and **not** a universal closed-form formula for
winning hand counts. This distinction is intentional and visible in the UI,
CLI, API output, and this documentation.

Let `b` be the number of known board cards and `d` the number of known dead
cards. With four distinct known hole cards:

```text
N = 52 - 4 - b - d     (unseen cards)
k = 5 - b             (board cards still needed)
T = C(N, k)           (number of equally likely final boards)
```

| Street | Known board cards | Boards without dead cards |
| --- | ---: | ---: |
| Preflop | 0 | C(48,5) = 1,712,304 |
| Flop | 3 | C(45,2) = 990 |
| Turn | 4 | C(44,1) = 44 |
| River | 5 | C(43,0) = 1 |

For every legal completion, compare each player's best five of seven cards.
Count wins `W`, losses `L`, and ties `S`, with `W + L + S = T`. Then:

```text
P(win) = W/T
P(loss) = L/T
P(tie) = S/T
equity(player 1) = (2W + S)/(2T)
equity(player 2) = (2L + S)/(2T)
```

The denominator and final probabilities follow these combinatorial formulas;
the numerator counts are obtained by visiting every legal board. Unordered
combinations are sufficient because each has the same number of possible
dealing orders, and terminal hand strength is unaffected by that order.
No sampling error or convergence tolerance is involved. Integer counts and
rational arithmetic preserve exactness through to the result.

### Dead cards and assumptions

- Known folded cards are removed completely and do not compete for the pot.
- Unknown folded/burn cards need not be removed: marginalizing their unknown
  identities leaves unseen cards exchangeable under the fair-deck model.
- Do not infer dead cards from a player's fold unless their identities are
  actually known. Behavioral/range information is outside this model.
- This is showdown equity: it does not model future betting, folds, rake,
  side pots, stack sizes, or the profitability of an action.
- It answers final showdown outcomes, not ordered-path questions such as
  “ahead on the turn but behind on the river.”
- The remaining deck must be large enough to complete the board.

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

## Existing exact tools

[PokerStove](https://github.com/andrewprock/pokerstove) provides poker
evaluation/enumeration software.
[OMPEval](https://github.com/zekyll/OMPEval) supports both full enumeration
and Monte Carlo, with optimized C++ evaluation and suit-isomorphism caching.
Neither is a dependency here. They illustrate the distinction between exact
enumeration and random simulation; this project keeps the narrower fixed-hand
heads-up interface and exact rational output.
