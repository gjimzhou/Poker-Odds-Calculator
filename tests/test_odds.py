import json
import os
import random
import subprocess
import sys
import unittest
from collections import Counter
from fractions import Fraction
from itertools import combinations

from poker_odds import calculate, evaluate, parse_cards
from poker_odds.core import _evaluate


def reference_five(cards):
    """Independent five-card classifier, used only as a test oracle."""
    ranks = sorted((c // 4 + 2 for c in cards), reverse=True)
    groups = sorted(((n, r) for r, n in Counter(ranks).items()), reverse=True)
    flush = len({c % 4 for c in cards}) == 1
    straight = 0
    if len(set(ranks)) == 5:
        if ranks[0] - ranks[-1] == 4:
            straight = ranks[0]
        elif ranks == [14, 5, 4, 3, 2]:
            straight = 5
    if flush and straight:
        return (8, straight)
    shape = [n for n, _ in groups]
    ordered = tuple(r for _, r in groups)
    if shape == [4, 1]:
        return (7, *ordered)
    if shape == [3, 2]:
        return (6, *ordered)
    if flush:
        return (5, *ranks)
    if straight:
        return (4, straight)
    if shape == [3, 1, 1]:
        return (3, *ordered)
    if shape == [2, 2, 1]:
        return (2, *ordered)
    if shape == [2, 1, 1, 1]:
        return (1, *ordered)
    return (0, *ranks)


def reference_best(cards):
    return max(map(reference_five, combinations(cards, 5)))


class EvaluatorTests(unittest.TestCase):
    def test_categories_and_tiebreakers(self):
        cases = {
            "As Ks Qs Js Ts 2d 3c": (8, 14),
            "As 2s 3s 4s 5s Kd Qd": (8, 5),
            "2c 2d 2h 2s As Kd Qd": (7, 2, 14),
            "Ac Ad Ah Kc Kd 2s 3s": (6, 14, 13),
            "Ac Ad Ah Kc Kd Kh 3s": (6, 14, 13),
            "Ac Jc 9c 7c 4c 3c 2c": (5, 14, 11, 9, 7, 4),
            "As 2d 3c 4h 5d 5c Kc": (4, 5),
            "As 2d 3c 4h 5d 6c Kc": (4, 6),
            "2c 2d 2h As Kd Qs Jd": (3, 2, 14, 13),
            "Ac Ad Kc Kd Qc Qd 2s": (2, 14, 13, 12),
            "2c 2d As Kd Qs 9s 8c": (1, 2, 14, 13, 12),
            "Ac Kd Qh 9s 7c 4h 2d": (0, 14, 13, 12, 9, 7),
        }
        for cards, expected in cases.items():
            with self.subTest(cards=cards):
                self.assertEqual(evaluate(cards), expected)

    def test_direct_evaluator_against_independent_best_five(self):
        rng = random.Random(28713)  # Test generation only; engine never samples.
        for size in (5, 6, 7):
            for _ in range(1000):
                cards = rng.sample(range(52), size)
                self.assertEqual(evaluate(cards), reference_best(cards))



class EquityTests(unittest.TestCase):
    def test_known_turn(self):
        # Kings win only on either remaining king; no possible straight/flush.
        r = calculate('As Ah', 'Kc Kd', '2c 7d 9h Js')
        self.assertEqual((r.wins, r.losses, r.ties, r.total), (42, 2, 0, 44))
        self.assertEqual(r.equity, Fraction(21, 22))
        d = calculate('As Ah', 'Kc Kd', '2c 7d 9h Js', 'Ks Kh')
        self.assertEqual((d.wins, d.losses, d.ties, d.total), (42, 0, 0, 42))

    def test_river_board_plays_and_dead_cards(self):
        r = calculate('2s 3s', '4c 5d', 'As Ks Qs Js Ts', '6c 7c')
        self.assertEqual((r.wins, r.losses, r.ties, r.total), (0, 0, 1, 1))
        self.assertEqual(r.equity, Fraction(1, 2))
        r = calculate('As Ah', 'Kc Kd', '2c 7d 9h Js Ac')
        self.assertEqual(r.equity, 1)

    def test_flop_against_independent_oracle(self):
        h1, h2, b, d = map(parse_cards, ('As Qs', '9c 9d', 'Js Ts 9h', 'Ks 2h'))
        r = calculate(h1, h2, b, d)
        counts = Counter()
        for runout in combinations(set(range(52)) - set(h1 + h2 + b + d), 2):
            a, z = reference_best(h1 + b + runout), reference_best(h2 + b + runout)
            counts[(a > z) - (a < z)] += 1
        self.assertEqual((r.wins, r.losses, r.ties, r.total),
                         (counts[1], counts[-1], counts[0], 903))
        self.assertEqual(calculate(h1, h2, b).total, 990)

    def test_swap_suit_and_order_invariance(self):
        h1, h2, b, d = map(parse_cards, ('As Qs', '9c 9d', 'Js Ts 9h', 'Ks 2h'))
        a = calculate(h1, h2, b, d)
        z = calculate(h2, h1, b, d)
        self.assertEqual((a.wins, a.losses, a.ties), (z.losses, z.wins, z.ties))
        self.assertEqual(a.equity + z.equity, 1)
        def permute(cards):
            return tuple((c // 4) * 4 + (c % 4 + 1) % 4 for c in reversed(cards))
        self.assertEqual(a, calculate(*map(permute, (h1, h2, b, d))))

    def test_restricted_preflop(self):
        h1, h2, b = map(parse_cards, ('As Ah', 'Kc Kd', '2c 7d 9h Js Ac'))
        dead = tuple(set(range(52)) - set(h1 + h2 + b))
        r = calculate(h1, h2, dead=dead)
        self.assertEqual((r.wins, r.total), (1, 1))

    def test_parsing_and_validation(self):
        self.assertEqual(parse_cards('a♠,10♥'), parse_cards('AsTh'))
        bad = [('As', 'Kd Kh', '', ''), ('As As', 'Kd Kh', '', ''),
               ('As Ah', 'Kd Kh', '2c 3c', ''), ('As Ah', 'Kd Kh', '', 'As'),
               ('As Ah', 'Kd Kh', 'Kd 3c 4c', ''), ('Ax Ah', 'Kd Kh', '', ''),
               ('As Ah', 'As Kh', '', ''), ('As Ah', 'Kd Kh', '', '3c 3c')]
        for args in bad:
            with self.subTest(args=args), self.assertRaises(ValueError):
                calculate(*args)
        for cards in ((True, 4), (-1, 4), (52, 4), (1.5, 4)):
            with self.assertRaises(ValueError):
                calculate(cards, 'Kd Kh')
        with self.assertRaises(ValueError):
            calculate((0, 1), (2, 3), dead=tuple(range(4, 49)))
        with self.assertRaises(ValueError):
            evaluate('As Ah')

    def test_cli(self):
        p = subprocess.run([sys.executable, '-m', 'poker_odds', 'As Ah', 'Kc Kd',
                            '--board', '2c 7d 9h Js', '--dead', 'Ks Kh', '--json'],
                           text=True, capture_output=True, check=True)
        data = json.loads(p.stdout)
        self.assertEqual(data['equity']['fraction'], '1')
        self.assertEqual(data['total'], 42)
        self.assertEqual(data['method'], 'exact_enumeration')
        p = subprocess.run([sys.executable, '-m', 'poker_odds', 'As', 'Kc Kd'],
                           text=True, capture_output=True)
        self.assertEqual(p.returncode, 2)


@unittest.skipUnless(os.getenv('POKER_SLOW_TESTS') == '1', 'Set POKER_SLOW_TESTS=1 for exhaustive validation')
class ExhaustiveTests(unittest.TestCase):
    def test_all_five_card_frequencies(self):
        counts = Counter(_evaluate(cards)[0] for cards in combinations(range(52), 5))
        self.assertEqual([counts[i] for i in range(9)],
                         [1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40])

    def test_preflop_full_deck_symmetry(self):
        # Swapping clubs<->hearts and diamonds<->spades exchanges the players.
        # Thus both players have exactly equal equity, including split pots.
        r = calculate('Ac Ad', 'Ah As')
        self.assertEqual(r.total, 1712304)
        self.assertEqual(r.wins, r.losses)
        self.assertEqual(r.equity, Fraction(1, 2))


if __name__ == '__main__':
    unittest.main()
