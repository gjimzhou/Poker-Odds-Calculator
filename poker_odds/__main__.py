"""Run with python -m poker_odds 'As Ah' 'Kc Kd' --board '2c 3d 4h'."""

import argparse
import json
import sys
from .core import calculate


def main():
    parser = argparse.ArgumentParser(description="Exact heads-up Hold'em odds (full enumeration, no simulation).")
    parser.add_argument("hand1", help="First player's two cards, e.g. 'As Ah'")
    parser.add_argument("hand2", help="Second player's two cards, e.g. 'Kc Kd'")
    parser.add_argument("--board", default="", help="0, 3, 4, or 5 public cards")
    parser.add_argument("--dead", default="", help="Known unavailable cards, e.g. 'Ks Kh'")
    parser.add_argument("--json", action="store_true", help="Print counts and exact rational probabilities as JSON")
    args = parser.parse_args()
    if not args.board.strip():
        print("Enumerating every legal preflop board; this can take tens of seconds.", file=sys.stderr)
    try:
        r = calculate(args.hand1, args.hand2, args.board, args.dead)
    except ValueError as exc:
        parser.error(str(exc))
    if args.json:
        print(json.dumps(r.as_dict(), indent=2))
        return
    print(f"Exact enumeration: C({r.unseen}, {r.cards_to_come}) = {r.total:,} boards")
    print(f"Player 1 wins: {r.wins:,}; player 2 wins: {r.losses:,}; ties: {r.ties:,}")
    for label, p in (("Player 1 win", r.win_probability), ("Player 2 win", r.loss_probability),
                     ("Tie", r.tie_probability), ("Player 1 equity", r.equity),
                     ("Player 2 equity", r.opponent_equity)):
        print(f"{label}: {p} = {float(p):.6%}")


if __name__ == "__main__":
    main()
