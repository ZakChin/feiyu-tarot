import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  STORAGE_KEY,
  appendDraw,
  buildReading,
  dateKey,
  detectTopic,
  drawCards,
  loadStore,
  makeDraw,
  pickActions,
  pickDistinct,
  sanitizeStore,
  saveStore,
  scoreReading
} from '../src/logic.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

const cards = ['major', 'wands', 'cups', 'swords', 'pentacles'].flatMap((file) =>
  readJson(path.join('src', 'cards', file + '.json'))
);
const topics = readJson('src/topics.json');
const deckById = new Map(cards.map((card) => [card.id, card]));
const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
const t = (key) => key;

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function memStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    dump: () => map
  };
}

test('deck contains 78 unique cards with complete fields', () => {
  assert.equal(cards.length, 78);
  const ids = new Set(cards.map((card) => card.id));
  assert.equal(ids.size, 78);
  for (const card of cards) {
    assert.ok(card.name && card.nameEn);
    for (const orientation of ['upright', 'reversed']) {
      assert.equal(card.keywords[orientation].length, 3);
      assert.ok(['good', 'neutral', 'shadow'].includes(card.fortune[orientation]));
      assert.ok(card.text[orientation].length > 20);
    }
  }
});

test('draws three distinct cards and honours the random sequence', () => {
  const zeros = drawCards(cards, () => 0);
  assert.equal(zeros.length, 3);
  assert.equal(new Set(zeros.map((slot) => slot.cardId)).size, 3);
  assert.ok(zeros.every((slot) => slot.reversed === true));

  const highs = drawCards(cards, () => 0.99);
  assert.ok(highs.every((slot) => slot.reversed === false));
});

test('pickDistinct avoids repeating the previous spread', () => {
  const previous = drawCards(cards, seeded(7));
  const next = pickDistinct(cards, previous, seeded(11));
  const signature = (list) =>
    list
      .map((slot) => slot.cardId + (slot.reversed ? 'r' : 'u'))
      .sort()
      .join('|');
  assert.notEqual(signature(next), signature(previous));
});

test('detectTopic picks the first matching pack', () => {
  const synthetic = [
    { id: 'love', detect: ['喜欢的人', '暧昧'] },
    { id: 'career', detect: ['工作', '面试'] },
    { id: 'general', detect: [] }
  ];
  assert.equal(detectTopic('他喜欢的人是我吗', synthetic), 'love');
  assert.equal(detectTopic('这次面试能不能过', synthetic), 'career');
  assert.equal(detectTopic('', synthetic), 'general');
  assert.equal(detectTopic('今天天气', synthetic), 'general');
});

test('scoreReading maps fortunes to tiers and boundaries', () => {
  const fake = new Map([
    ['a', { id: 'a', fortune: { upright: 'good', reversed: 'shadow' } }],
    ['b', { id: 'b', fortune: { upright: 'neutral', reversed: 'neutral' } }],
    ['c', { id: 'c', fortune: { upright: 'shadow', reversed: 'good' } }]
  ]);
  const slots = (ids) => ids.map((id) => ({ cardId: id, reversed: false }));

  assert.equal(scoreReading(slots(['a', 'a', 'a']), fake).tier, 'yes');
  assert.equal(scoreReading(slots(['a', 'a', 'b']), fake).tier, 'yes');
  assert.equal(scoreReading(slots(['a', 'a', 'c']), fake).tier, 'leanYes');
  assert.equal(scoreReading(slots(['a', 'b', 'c']), fake).tier, 'mixed');
  assert.equal(scoreReading(slots(['b', 'b', 'b']), fake).tier, 'mixed');
  assert.equal(scoreReading(slots(['b', 'b', 'c']), fake).tier, 'no');
  assert.equal(scoreReading(slots(['c', 'c', 'c']), fake).tier, 'no');

  const spread = scoreReading(slots(['a', 'b', 'c']), fake);
  assert.equal(spread.support.card.id, 'a');
  assert.equal(spread.challenge.card.id, 'c');
});

test('pickActions returns two distinct deterministic actions', () => {
  const actions = ['one', 'two', 'three'];
  const first = pickActions(actions, 'draw-1');
  const second = pickActions(actions, 'draw-1');
  assert.deepEqual(first, second);
  assert.equal(first.length, 2);
  assert.notEqual(first[0], first[1]);
  assert.ok(first.every((item) => actions.includes(item)));
});

test('buildReading produces grounded assertions for every card', () => {
  const draw = makeDraw({
    id: 'test-draw',
    cards: drawCards(cards, seeded(3)),
    querent: '阿岚',
    question: '这次换工作能不能成',
    topic: 'career',
    now: Date.UTC(2026, 10, 8, 4, 0, 0)
  });
  const reading = buildReading(draw, { deckById, topicsById, t, locale: 'zh' });
  assert.ok(reading);
  assert.equal(reading.cards.length, 3);
  for (const entry of reading.cards) {
    assert.ok(entry.assertion.includes(entry.card.name));
    assert.ok(entry.assertion.length >= 20);
    assert.equal(entry.keywords.length, 3);
  }
  assert.ok(['yes', 'leanYes', 'mixed', 'no'].includes(reading.tier));
  assert.ok(reading.verdict.paragraph.includes(reading.support.name));
  assert.ok(reading.verdict.paragraph.includes(reading.challenge.name));
  assert.equal(reading.actions.length, 2);
  assert.ok(reading.keywords.length >= 3 && reading.keywords.length <= 6);
});

test('makeDraw trims inputs and stamps a local day', () => {
  const now = new Date(2026, 10, 8, 12, 30).getTime();
  const draw = makeDraw({
    id: 'fixed',
    cards: drawCards(cards, seeded(5)),
    querent: '  a  b  ',
    question: 'x'.repeat(80),
    topic: 'general',
    now
  });
  assert.equal(draw.querent, 'a b');
  assert.equal(draw.question.length, 60);
  assert.equal(draw.dateKey, dateKey(new Date(now)));
});

test('sanitizeStore drops corrupt and duplicate entries', () => {
  const good = makeDraw({ id: 'keep', cards: drawCards(cards, seeded(1)), topic: 'love', now: Date.now() });
  const duplicate = Object.assign({}, good, { id: 'keep' });
  const raw = {
    version: 1,
    draws: [
      good,
      duplicate,
      { id: 'bad-cards', at: Date.now(), cards: [] },
      { id: 'bad-time', at: 'x', cards: good.cards },
      Object.assign({}, good, { id: 'unknown-topic', topic: 'nope' })
    ]
  };
  const store = sanitizeStore(raw, deckById, topicsById);
  const ids = store.draws.map((draw) => draw.id);
  assert.ok(ids.includes('keep'));
  assert.ok(ids.includes('unknown-topic'));
  assert.equal(ids.filter((id) => id === 'keep').length, 1);
  assert.ok(!ids.includes('bad-cards'));
  assert.ok(!ids.includes('bad-time'));
  assert.equal(store.draws.find((draw) => draw.id === 'unknown-topic').topic, 'general');
});

test('appendDraw prunes old spreads and respects the cap', () => {
  const now = Date.now();
  const old = makeDraw({ id: 'old', cards: drawCards(cards, seeded(2)), now: now - 40 * 86400000 });
  const fresh = makeDraw({ id: 'fresh', cards: drawCards(cards, seeded(4)), now });
  const result = appendDraw([old], fresh, now);
  assert.deepEqual(result.map((draw) => draw.id), ['fresh']);
});

test('loadStore and saveStore round-trip through a Storage-like object', () => {
  const storage = memStorage();
  assert.deepEqual(loadStore(storage), { version: 1, draws: [] });
  const draw = makeDraw({ id: 'one', cards: drawCards(cards, seeded(9)), now: Date.now() });
  assert.equal(saveStore(storage, { version: 1, draws: [draw] }), true);
  assert.ok(storage.dump().has(STORAGE_KEY));
  const loaded = loadStore(storage);
  assert.equal(loaded.draws.length, 1);
  assert.equal(loaded.draws[0].id, 'one');

  storage.setItem(STORAGE_KEY, '{not json');
  assert.deepEqual(loadStore(storage), { version: 1, draws: [] });
});
