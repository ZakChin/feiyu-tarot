/**
 * Pure logic for the daily tarot plugin: drawing, topic detection, verdict
 * scoring, reading composition and storage sanitising. No DOM, no globals.
 */

export const STORAGE_KEY = 'dsh.tarot.v1';
export const POSITIONS = ['past', 'present', 'future'];
export const POSITION_ZH = { past: '过去', present: '现在', future: '未来' };
export const TIERS = ['yes', 'leanYes', 'mixed', 'no'];
export const LIMITS = { keepDays: 30, keepCount: 60 };

const FORTUNE_WEIGHT = { good: 2, neutral: 0, shadow: -2 };
const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(value) {
  return value < 10 ? '0' + value : String(value);
}

/** Local calendar day, e.g. 2026-11-08. */
export function dateKey(date) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

/** Trim, collapse control characters and cap the character count. */
export function trimText(raw, max) {
  const cleaned = String(raw === undefined || raw === null ? '' : raw)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const chars = Array.from(cleaned);
  return chars.length > max ? chars.slice(0, max).join('') : cleaned;
}

function shuffle(deck, rng) {
  const pool = deck.slice();
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = pool[i];
    pool[i] = pool[j];
    pool[j] = swap;
  }
  return pool;
}

/** Draw three unique cards; each orientation is an independent coin flip. */
export function drawCards(deck, rng = Math.random) {
  if (!Array.isArray(deck) || deck.length < 3) {
    throw new Error('daily-tarot: deck needs at least three cards');
  }
  return shuffle(deck, rng)
    .slice(0, 3)
    .map((card) => ({ cardId: card.id, reversed: rng() < 0.5 }));
}

function signature(cards) {
  return cards
    .map((slot) => slot.cardId + (slot.reversed ? 'r' : 'u'))
    .sort()
    .join('|');
}

/** Like drawCards, but avoids repeating the previous spread verbatim. */
export function pickDistinct(deck, previous, rng = Math.random) {
  let cards = drawCards(deck, rng);
  if (!Array.isArray(previous) || previous.length !== 3) return cards;
  const prev = signature(previous);
  for (let attempt = 0; attempt < 8 && signature(cards) === prev; attempt += 1) {
    cards = drawCards(deck, rng);
  }
  return cards;
}

export function newId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (error) {
    /* fall through */
  }
  return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Build a persistable draw record from raw form values. */
export function makeDraw(input) {
  const now = input.now === undefined || input.now === null ? Date.now() : Number(input.now);
  return {
    id: input.id || newId(),
    at: now,
    dateKey: dateKey(new Date(now)),
    querent: trimText(input.querent, 24),
    question: trimText(input.question, 60),
    topic: input.topic || 'general',
    cards: (input.cards || []).map((slot) => ({ cardId: slot.cardId, reversed: !!slot.reversed }))
  };
}

/** First topic whose detect keyword appears in the question, else general. */
export function detectTopic(question, topics) {
  const text = String(question === undefined || question === null ? '' : question).toLowerCase();
  if (!text.trim()) return 'general';
  for (const topic of topics || []) {
    if (!topic || topic.id === 'general' || !Array.isArray(topic.detect)) continue;
    for (const keyword of topic.detect) {
      const needle = String(keyword === undefined || keyword === null ? '' : keyword).toLowerCase();
      if (needle && text.includes(needle)) return topic.id;
    }
  }
  return 'general';
}

/** Score a spread: good +2, neutral 0, shadow -2. */
export function scoreReading(cards, deckById) {
  const entries = (cards || []).map((slot, index) => {
    const card = deckById.get(slot.cardId) || null;
    const orientation = slot.reversed ? 'reversed' : 'upright';
    const fortune = card && card.fortune ? card.fortune[orientation] : 'neutral';
    return {
      index,
      card,
      orientation,
      fortune,
      weight: Object.prototype.hasOwnProperty.call(FORTUNE_WEIGHT, fortune) ? FORTUNE_WEIGHT[fortune] : 0
    };
  });
  const score = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const tier = score >= 4 ? 'yes' : score === 2 ? 'leanYes' : score === 0 ? 'mixed' : 'no';
  let support = 0;
  let challenge = Math.max(0, entries.length - 1);
  entries.forEach((entry, index) => {
    if (entry.weight > entries[support].weight) support = index;
    if (entry.weight < entries[challenge].weight) challenge = index;
  });
  return { entries, score, tier, support: entries[support] || null, challenge: entries[challenge] || null };
}

function hashString(value) {
  let hash = 5381;
  const text = String(value || '');
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministically pick two distinct actions for a draw id. */
export function pickActions(actions, seed) {
  const list = (Array.isArray(actions) ? actions : []).filter(
    (item) => typeof item === 'string' && item.length > 0
  );
  if (list.length <= 2) return list.slice(0, 2);
  const hash = hashString(seed);
  const first = hash % list.length;
  const step = 1 + ((hash >>> 4) % (list.length - 1));
  return [list[first], list[(first + step) % list.length]];
}

function formatTemplate(template, vars) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (vars[key] === undefined || vars[key] === null) return match;
    return String(vars[key]);
  });
}

/**
 * Compose the complete reading for a draw.
 * options: { deckById, topicsById, t, locale }
 */
export function buildReading(draw, options) {
  const deckById = options.deckById;
  const topicsById = options.topicsById;
  const t = options.t;
  const locale = options.locale || 'zh';
  const topic = topicsById.get(draw.topic) || topicsById.get('general');
  if (!topic) return null;
  const scored = scoreReading(draw.cards, deckById);
  if (!scored.support || !scored.challenge || scored.entries.some((entry) => !entry.card)) return null;

  const querentLabel = draw.querent || t('someone.self');
  const questionLabel = draw.question || t('question.none');
  const cards = scored.entries.map((entry) => {
    const position = POSITIONS[entry.index];
    const card = entry.card;
    const orientation = entry.orientation;
    const keywords = card.keywords[orientation] || [];
    const frame = topic.frames && topic.frames[position] ? topic.frames[position][orientation] : '';
    const assertion = formatTemplate(frame, {
      card: card.name,
      kw1: keywords[0],
      kw2: keywords[1],
      kw3: keywords[2],
      position: POSITION_ZH[position],
      querent: querentLabel,
      question: questionLabel
    });
    return {
      position,
      positionLabel: t('position.' + position),
      card,
      reversed: !!draw.cards[entry.index].reversed,
      orientation,
      orientationLabel: t(orientation === 'reversed' ? 'orientation.reversed' : 'orientation.upright'),
      name: locale === 'en' ? card.nameEn : card.name,
      keywords,
      text: card.text[orientation] || '',
      assertion,
      fortune: entry.fortune,
      foil: entry.fortune === 'good'
    };
  });

  const verdictTemplate = topic.verdicts && topic.verdicts[scored.tier] ? topic.verdicts[scored.tier] : '';
  const paragraph = formatTemplate(verdictTemplate, {
    querent: querentLabel,
    question: questionLabel,
    supportCard: scored.support.card.name,
    challengeCard: scored.challenge.card.name
  });

  const keywords = [];
  cards.forEach((entry) => {
    entry.keywords.forEach((word) => {
      if (keywords.indexOf(word) === -1) keywords.push(word);
    });
  });

  return {
    cards,
    topic,
    tier: scored.tier,
    score: scored.score,
    support: scored.support.card,
    challenge: scored.challenge.card,
    verdict: { tier: scored.tier, label: t('verdict.' + scored.tier), paragraph },
    actions: pickActions(topic.actions ? topic.actions[scored.tier] : [], draw.id),
    keywords: keywords.slice(0, 6),
    querent: querentLabel,
    question: questionLabel,
    rawQuestion: draw.question,
    rawQuerent: draw.querent
  };
}

/** Validate one stored draw; returns null when it cannot be trusted. */
export function sanitizeDraw(raw, deckById, topicsById) {
  if (!raw || typeof raw !== 'object') return null;
  if (!Array.isArray(raw.cards) || raw.cards.length !== 3) return null;
  const seen = new Set();
  const cards = [];
  for (const slot of raw.cards) {
    if (!slot || typeof slot !== 'object') return null;
    const card = deckById.get(slot.cardId);
    if (!card || seen.has(card.id)) return null;
    seen.add(card.id);
    cards.push({ cardId: card.id, reversed: !!slot.reversed });
  }
  const at = Number(raw.at);
  if (!Number.isFinite(at) || at <= 0) return null;
  const date = new Date(at);
  const storedDate =
    typeof raw.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dateKey)
      ? raw.dateKey
      : dateKey(date);
  const topic =
    typeof raw.topic === 'string' && topicsById.has(raw.topic) ? raw.topic : 'general';
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    at,
    dateKey: storedDate,
    querent: trimText(raw.querent, 24),
    question: trimText(raw.question, 60),
    topic,
    cards
  };
}

export function pruneDraws(draws, now, limits) {
  const keepDays = (limits && limits.keepDays) || LIMITS.keepDays;
  const keepCount = (limits && limits.keepCount) || LIMITS.keepCount;
  const cutoff = now - keepDays * DAY_MS;
  return (Array.isArray(draws) ? draws : [])
    .filter((draw) => draw && Number.isFinite(draw.at) && draw.at >= cutoff)
    .slice(0, keepCount);
}

/** Drop invalid or duplicate entries and cap the history. */
export function sanitizeStore(raw, deckById, topicsById, now = Date.now()) {
  const list = raw && Array.isArray(raw.draws) ? raw.draws : [];
  const draws = [];
  const ids = new Set();
  for (const entry of list) {
    const clean = sanitizeDraw(entry, deckById, topicsById);
    if (!clean || ids.has(clean.id)) continue;
    ids.add(clean.id);
    draws.push(clean);
  }
  draws.sort((a, b) => b.at - a.at);
  return { version: 1, draws: pruneDraws(draws, now) };
}

export function appendDraw(draws, draw, now = Date.now()) {
  return pruneDraws([draw, ...draws], now);
}

export function loadStore(storage) {
  if (!storage) return { version: 1, draws: [] };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, draws: [] };
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.draws) ? parsed : { version: 1, draws: [] };
  } catch (error) {
    return { version: 1, draws: [] };
  }
}

export function saveStore(storage, store) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (error) {
    return false;
  }
}
