# Exact enumeration and assumptions

[Documentation index](README.md) · [Project](../README.md)

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

## Existing exact tools

[PokerStove](https://github.com/andrewprock/pokerstove) provides poker
evaluation/enumeration software.
[OMPEval](https://github.com/zekyll/OMPEval) supports both full enumeration
and Monte Carlo, with optimized C++ evaluation and suit-isomorphism caching.
Neither is a dependency here. They illustrate the distinction between exact
enumeration and random simulation; this project keeps the narrower fixed-hand
heads-up interface and exact rational output.
