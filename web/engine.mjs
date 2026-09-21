// Exact enumeration. Counts are integers <= C(48,5), safely below 2^53.
const ranks = '23456789TJQKA', suits = 'cdhs';
export function parseCards(text) {
  if (typeof text !== 'string') throw Error('Cards must be text, such as As Kh.');
  text = text.replace(/[♣♦♥♠]/g, s => suits['♣♦♥♠'.indexOf(s)]).replace(/[\s,]+/g, '').toUpperCase();
  const cards = [];
  while (text.length) {
    const m = /^(10|[2-9TJQKA])([CDHS])/.exec(text);
    if (!m) throw Error(`Invalid card text near ${text}.`);
    cards.push(ranks.indexOf(m[1] === '10' ? 'T' : m[1]) * 4 + suits.indexOf(m[2].toLowerCase()));
    text = text.slice(m[0].length);
  }
  if (new Set(cards).size !== cards.length) throw Error('Duplicate cards are not allowed.');
  return cards;
}
function straight(mask) {
  const runs = mask & (mask >> 1) & (mask >> 2) & (mask >> 3) & (mask >> 4);
  return runs ? 37 - Math.clz32(runs) : ((mask & 0x100f) === 0x100f ? 5 : 0);
}
function pack(category, values) {
  let score = category;
  for (let i = 0; i < 5; i++) score = score * 15 + (values[i] || 0);
  return score;
}
export function evaluate(cards) {
  const count = new Array(13).fill(0), suit = [0, 0, 0, 0];
  let mask = 0;
  for (const card of cards) {
    const r = card >> 2, bit = 1 << r;
    count[r]++; suit[card & 3] |= bit; mask |= bit;
  }
  let flush = 0;
  for (const s of suit) {
    let n = s, size = 0;
    while (n) { n &= n - 1; size++; }
    if (size >= 5) { flush = s; break; }
  }
  if (flush && straight(flush)) return pack(8, [straight(flush)]);
  const all = [], pairs = [], trips = [];
  let quad = 0;
  for (let r = 12; r >= 0; r--) {
    if (count[r]) all.push(r + 2);
    if (count[r] >= 2) pairs.push(r + 2);
    if (count[r] >= 3) trips.push(r + 2);
    if (count[r] === 4) quad = r + 2;
  }
  if (quad) return pack(7, [quad, all.find(r => r !== quad)]);
  if (trips.length) {
    const pair = pairs.find(r => r !== trips[0]);
    if (pair) return pack(6, [trips[0], pair]);
  }
  if (flush) {
    const values = [];
    for (let r = 12; r >= 0; r--) if (flush & (1 << r)) values.push(r + 2);
    return pack(5, values);
  }
  if (straight(mask)) return pack(4, [straight(mask)]);
  if (trips.length) return pack(3, [trips[0], ...all.filter(r => r !== trips[0]).slice(0, 2)]);
  if (pairs.length >= 2) return pack(2, [pairs[0], pairs[1], all.find(r => r !== pairs[0] && r !== pairs[1])]);
  if (pairs.length) return pack(1, [pairs[0], ...all.filter(r => r !== pairs[0]).slice(0, 3)]);
  return pack(0, all.slice(0, 5));
}
function fraction(n, d) {
  let a = n, b = d;
  while (b) [a, b] = [b, a % b];
  return { fraction: d / a === 1 ? String(n / a) : `${n / a}/${d / a}`, decimal: n / d };
}
function choose(n, k) {
  let result = 1;
  for (let i = 1; i <= k; i++) result = result * (n - i + 1) / i;
  return Math.round(result);
}
export function calculate(input, progress = () => {}) {
  const [h1, h2, board, dead] = ['hand1', 'hand2', 'board', 'dead'].map(k => parseCards(input[k] ?? ''));
  if (h1.length !== 2 || h2.length !== 2) throw Error('Each player needs exactly two hole cards.');
  if (![0, 3, 4, 5].includes(board.length)) throw Error('Board must contain 0, 3, 4, or 5 cards.');
  const known = [...h1, ...h2, ...board, ...dead], used = new Set(known);
  if (used.size !== known.length) throw Error('Hands, board and dead cards must not overlap.');
  const available = Array.from({ length: 52 }, (_, i) => i).filter(i => !used.has(i));
  const k = 5 - board.length, n = available.length;
  if (n < k) throw Error('Not enough cards remain to complete the board.');
  const total = choose(n, k), indices = Array.from({ length: k }, (_, i) => i);
  const a = [...h1, ...board], b = [...h2, ...board], start = a.length;
  let wins = 0, losses = 0, ties = 0, done = 0;
  progress({ done, total });
  while (true) {
    for (let i = 0; i < k; i++) a[start + i] = b[start + i] = available[indices[i]];
    const x = evaluate(a), y = evaluate(b);
    if (x > y) wins++; else if (x < y) losses++; else ties++;
    done++;
    if (done % 8192 === 0) progress({ done, total });
    let i = k - 1;
    while (i >= 0 && indices[i] === n - k + i) i--;
    if (i < 0) break;
    indices[i]++;
    for (let j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1;
  }
  if (done !== total) throw Error('Internal counting error.');
  return { method: 'exact_enumeration', complete: true, wins, losses, ties, total,
    unseen_cards: n, cards_to_come: k, sample_space: `C(${n}, ${k})`,
    win_probability: fraction(wins, total), loss_probability: fraction(losses, total),
    tie_probability: fraction(ties, total), equity: fraction(2 * wins + ties, 2 * total),
    opponent_equity: fraction(2 * losses + ties, 2 * total) };
}
