"""Count every legal unordered board once, with integer arithmetic.

This is exact enumeration, not a universal closed-form equity formula.
Card IDs are rank * 4 + suit, ranks 2..A and suits c,d,h,s.
"""

from dataclasses import dataclass
from fractions import Fraction
from itertools import combinations
from math import comb
import re

RANKS = "23456789TJQKA"
SUITS = "cdhs"
CATEGORIES = ("high card", "one pair", "two pair", "three of a kind",
              "straight", "flush", "full house", "four of a kind",
              "straight flush")
_TOKEN = re.compile(r"(10|[2-9TJQKA])([CDHS])", re.IGNORECASE)


def parse_cards(text):
    """Parse 'As Kh', 'AsKh', '10h,9h', or Unicode suit symbols.

    Empty text is allowed for board/dead cards. Duplicates are rejected.
    """
    if not isinstance(text, str):
        raise ValueError("Cards must be a string, e.g. 'As Kh'.")
    for symbol, suit in zip("♣♦♥♠", SUITS):
        text = text.replace(symbol, suit)
    compact = re.sub(r"[\s,]+", "", text)
    cards = []
    pos = 0
    while pos < len(compact):
        match = _TOKEN.match(compact, pos)
        if match is None:
            raise ValueError(f"Invalid card text near {compact[pos:]!r}.")
        rank, suit = match.groups()
        rank = "T" if rank == "10" else rank.upper()
        cards.append(RANKS.index(rank) * 4 + SUITS.index(suit.lower()))
        pos = match.end()
    if len(set(cards)) != len(cards):
        raise ValueError("Duplicate cards are not allowed.")
    return tuple(cards)


def _validated_cards(cards):
    if isinstance(cards, str):
        return parse_cards(cards)
    try:
        cards = tuple(cards)
    except TypeError as exc:
        raise ValueError("Cards must be text or an iterable of card IDs.") from exc
    if any(type(c) is not int or not 0 <= c < 52 for c in cards):
        raise ValueError("Card IDs must be integers from 0 to 51.")
    if len(set(cards)) != len(cards):
        raise ValueError("Duplicate cards are not allowed.")
    return cards


def _straight_high(mask):
    # Consecutive bits indicate the LOW end of each five-rank run.
    runs = mask & (mask >> 1) & (mask >> 2) & (mask >> 3) & (mask >> 4)
    if runs:
        return runs.bit_length() + 5
    return 5 if mask & 0x100F == 0x100F else 0  # A2345


def _evaluate(cards):
    """Direct best-five ranking for 5..7 cards, descending tuple order."""
    counts = [0] * 13
    suits = [0] * 4
    mask = 0
    for card in cards:
        rank = card >> 2
        bit = 1 << rank
        counts[rank] += 1
        suits[card & 3] |= bit
        mask |= bit
    flush = next((s for s in suits if s.bit_count() >= 5), 0)
    if flush:
        straight = _straight_high(flush)
        if straight:
            return (8, straight)
    quads = [r + 2 for r in range(12, -1, -1) if counts[r] == 4]
    if quads:
        quad = quads[0]
        return (7, quad, max(r + 2 for r in range(13) if counts[r] and r + 2 != quad))
    trips = [r + 2 for r in range(12, -1, -1) if counts[r] >= 3]
    pairs = [r + 2 for r in range(12, -1, -1) if counts[r] >= 2]
    if trips:
        others = [r for r in pairs if r != trips[0]]
        if others:
            return (6, trips[0], others[0])
    if flush:
        return (5, *(r + 2 for r in range(12, -1, -1) if flush & (1 << r)))[:6]
    straight = _straight_high(mask)
    if straight:
        return (4, straight)
    ranks = [r + 2 for r in range(12, -1, -1) if counts[r]]
    if trips:
        return (3, trips[0], *[r for r in ranks if r != trips[0]][:2])
    if len(pairs) >= 2:
        return (2, pairs[0], pairs[1], next(r for r in ranks if r not in pairs[:2]))
    if pairs:
        return (1, pairs[0], *[r for r in ranks if r != pairs[0]][:3])
    return (0, *ranks[:5])


def evaluate(cards):
    """Return (category, tiebreakers...) for the best five of 5..7 cards.

    Larger tuples win. Categories are 0 (high card) through 8 (straight
    flush), ranks 2..14. Royal flush is (8, 14); a wheel is (4, 5).
    """
    cards = _validated_cards(cards)
    if len(cards) not in (5, 6, 7):
        raise ValueError("Evaluation requires 5, 6, or 7 cards.")
    return _evaluate(cards)


@dataclass(frozen=True)
class EquityResult:
    wins: int
    losses: int
    ties: int
    total: int
    unseen: int
    cards_to_come: int

    @property
    def win_probability(self):
        return Fraction(self.wins, self.total)

    @property
    def loss_probability(self):
        return Fraction(self.losses, self.total)

    @property
    def tie_probability(self):
        return Fraction(self.ties, self.total)

    @property
    def equity(self):
        return Fraction(2 * self.wins + self.ties, 2 * self.total)

    @property
    def opponent_equity(self):
        return 1 - self.equity

    def as_dict(self):
        """JSON-safe exact fractions plus convenience decimal values."""
        result = {"method": "exact_enumeration", "complete": True,
                  "wins": self.wins, "losses": self.losses, "ties": self.ties,
                  "total": self.total, "unseen_cards": self.unseen,
                  "cards_to_come": self.cards_to_come,
                  "sample_space": f"C({self.unseen}, {self.cards_to_come})"}
        for name in ("win_probability", "loss_probability", "tie_probability",
                     "equity", "opponent_equity"):
            value = getattr(self, name)
            result[name] = {"fraction": str(value), "decimal": float(value)}
        return result


def calculate(hand1, hand2, board="", dead=""):
    """Exact showdown probabilities for two known Hold'em hands.

    Each hand has two cards; board has 0, 3, 4, or 5 cards. Dead cards are
    known unavailable cards (including exposed folded cards). Unknown
    folded/burn cards should not be supplied. All groups must be disjoint.
    Returns rational probabilities and raw integer counts, never estimates.
    """
    hand1, hand2, board, dead = map(_validated_cards, (hand1, hand2, board, dead))
    if len(hand1) != 2 or len(hand2) != 2:
        raise ValueError("Each player must have exactly two hole cards.")
    if len(board) not in (0, 3, 4, 5):
        raise ValueError("Board must contain 0, 3, 4, or 5 cards.")
    known = hand1 + hand2 + board + dead
    if len(set(known)) != len(known):
        raise ValueError("Hole cards, board, and dead cards must not overlap.")
    available = tuple(c for c in range(52) if c not in known)
    missing = 5 - len(board)
    if len(available) < missing:
        raise ValueError("Not enough unseen cards to complete the board.")
    total = comb(len(available), missing)
    wins = losses = ties = 0
    first, second = hand1 + board, hand2 + board
    for runout in combinations(available, missing):
        a, b = _evaluate(first + runout), _evaluate(second + runout)
        if a > b:
            wins += 1
        elif a < b:
            losses += 1
        else:
            ties += 1
    assert wins + losses + ties == total
    return EquityResult(wins, losses, ties, total, len(available), missing)
