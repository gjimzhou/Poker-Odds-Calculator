# Local interfaces and Python API

[Documentation index](README.md) · [Project](../README.md)

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

