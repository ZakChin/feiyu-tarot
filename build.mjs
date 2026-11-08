/**
 * Build client.js from the readable sources under src/.
 *
 * The Client module loader only resolves a fixed set of browser modules, so
 * the 78 cards, the topic packs and the translations are inlined here and the
 * sources are concatenated into one factory body.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const CARD_FILES = [
  ['major.json', 22],
  ['wands.json', 14],
  ['cups.json', 14],
  ['swords.json', 14],
  ['pentacles.json', 14]
];
const SUITS = { wands: true, cups: true, swords: true, pentacles: true };
const FORTUNES = { good: true, neutral: true, shadow: true };
const TIERS = ['yes', 'leanYes', 'mixed', 'no'];
const TOPIC_IDS = ['love', 'career', 'wealth', 'study', 'social', 'health', 'decision', 'general'];
const ALLOWED_PLACEHOLDERS = {
  querent: true,
  question: true,
  card: true,
  kw1: true,
  kw2: true,
  kw3: true,
  position: true,
  supportCard: true,
  challengeCard: true
};

function fail(message) {
  throw new Error('[daily-tarot] ' + message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readJson(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  assert(fs.existsSync(absolute), 'missing file ' + relativePath);
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function countText(text) {
  return Array.from(String(text)).filter((char) => !/\s/.test(char) && !/[A-Za-z0-9]/.test(char)).length;
}

function validatePlaceholders(text, where) {
  const matches = String(text).matchAll(/\{(\w+)\}/g);
  for (const match of matches) {
    assert(ALLOWED_PLACEHOLDERS[match[1]], where + ' uses unknown placeholder {' + match[1] + '}');
  }
}

function loadCards() {
  const cards = [];
  const ids = new Set();
  let majorCount = 0;
  for (const [file, expected] of CARD_FILES) {
    const list = readJson(path.join('src', 'cards', file));
    assert(Array.isArray(list), file + ' must be a JSON array');
    assert(list.length === expected, file + ' must contain ' + expected + ' cards, got ' + list.length);
    for (const card of list) {
      assert(isNonEmptyString(card.id), file + ': card id missing');
      assert(!ids.has(card.id), 'duplicate card id ' + card.id);
      ids.add(card.id);
      cards.push(card);
      assert(isNonEmptyString(card.name), card.id + ': name missing');
      assert(isNonEmptyString(card.nameEn), card.id + ': nameEn missing');
      assert(card.arcana === 'major' || card.arcana === 'minor', card.id + ': bad arcana');
      if (card.arcana === 'major') {
        majorCount += 1;
        assert(Number.isInteger(card.number) && card.number >= 0 && card.number <= 21, card.id + ': bad number');
      } else {
        assert(SUITS[card.suit], card.id + ': bad suit');
        assert(Number.isInteger(card.rank) && card.rank >= 1 && card.rank <= 14, card.id + ': bad rank');
      }
      for (const orientation of ['upright', 'reversed']) {
        const words = card.keywords && card.keywords[orientation];
        assert(Array.isArray(words) && words.length === 3, card.id + ': ' + orientation + ' needs 3 keywords');
        for (const word of words) {
          assert(isNonEmptyString(word), card.id + ': empty keyword');
        }
        const fortune = card.fortune && card.fortune[orientation];
        assert(FORTUNES[fortune], card.id + ': bad ' + orientation + ' fortune');
        const text = card.text && card.text[orientation];
        assert(isNonEmptyString(text), card.id + ': missing ' + orientation + ' text');
        const length = countText(text);
        assert(length >= 30 && length <= 160, card.id + ': ' + orientation + ' text is ' + length + ' chars');
      }
    }
  }
  assert(majorCount === 22, 'expected 22 major arcana, got ' + majorCount);
  assert(cards.length === 78, 'expected 78 cards, got ' + cards.length);
  return cards;
}

function loadTopics() {
  const topics = readJson('src/topics.json');
  assert(Array.isArray(topics), 'topics.json must be an array');
  assert(topics.length === TOPIC_IDS.length, 'expected ' + TOPIC_IDS.length + ' topics');
  const ids = new Set(topics.map((topic) => topic.id));
  for (const id of TOPIC_IDS) assert(ids.has(id), 'missing topic ' + id);
  for (const topic of topics) {
    assert(isNonEmptyString(topic.id), 'topic id missing');
    assert(isNonEmptyString(topic.labelKey), topic.id + ': labelKey missing');
    assert(topic.labelKey === 'topic.' + topic.id, topic.id + ': labelKey must be topic.' + topic.id);
    assert(Array.isArray(topic.detect), topic.id + ': detect must be an array');
    if (topic.id !== 'general') {
      assert(topic.detect.length >= 2, topic.id + ': needs at least two detect keywords');
    }
    for (const position of ['past', 'present', 'future']) {
      const frame = topic.frames && topic.frames[position];
      assert(frame && frame.upright && frame.reversed, topic.id + ': missing ' + position + ' frames');
      for (const orientation of ['upright', 'reversed']) {
        const text = frame[orientation];
        assert(isNonEmptyString(text), topic.id + ': empty ' + position + '/' + orientation + ' frame');
        assert(text.includes('{card}'), topic.id + ': ' + position + '/' + orientation + ' needs {card}');
        assert(/\{kw[123]\}/.test(text), topic.id + ': ' + position + '/' + orientation + ' needs a keyword slot');
        validatePlaceholders(text, topic.id + ' ' + position + '/' + orientation);
        const length = countText(text);
        assert(length >= 40 && length <= 200, topic.id + ': ' + position + '/' + orientation + ' frame is ' + length + ' chars');
      }
    }
    for (const tier of TIERS) {
      const verdict = topic.verdicts && topic.verdicts[tier];
      assert(isNonEmptyString(verdict), topic.id + ': missing verdict ' + tier);
      assert(verdict.includes('{supportCard}'), topic.id + ': verdict ' + tier + ' needs {supportCard}');
      assert(verdict.includes('{challengeCard}'), topic.id + ': verdict ' + tier + ' needs {challengeCard}');
      validatePlaceholders(verdict, topic.id + ' verdict ' + tier);
      const actions = topic.actions && topic.actions[tier];
      assert(Array.isArray(actions) && actions.length >= 2, topic.id + ': needs at least two ' + tier + ' actions');
      for (const action of actions) {
        assert(isNonEmptyString(action), topic.id + ': empty action');
        validatePlaceholders(action, topic.id + ' action');
      }
    }
  }
  return topics;
}

function loadDictionaries() {
  const dicts = {};
  for (const id of ['en', 'zh']) {
    const data = readJson(path.join('locale', id + '.json'));
    assert(data.meta && isNonEmptyString(data.meta.title), id + ': meta.title missing');
    assert(isNonEmptyString(data.meta.description), id + ': meta.description missing');
    const ui = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') ui[key] = value;
    }
    assert(Object.keys(ui).length > 20, id + ': too few UI strings');
    dicts[id] = ui;
  }
  const enKeys = Object.keys(dicts.en).sort();
  const zhKeys = Object.keys(dicts.zh).sort();
  assert(enKeys.length === zhKeys.length, 'locale key counts differ: en=' + enKeys.length + ' zh=' + zhKeys.length);
  for (let index = 0; index < enKeys.length; index += 1) {
    assert(enKeys[index] === zhKeys[index], 'locale keys differ at ' + enKeys[index] + ' / ' + zhKeys[index]);
  }
  return dicts;
}

const SOURCE_ORDER = ['i18n.js', 'logic.js', 'sound.js', 'storm.js', 'view.js', 'entry.js'];

function stripModuleSyntax(source) {
  return source
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+/gm, '');
}

function loadSource(name) {
  const source = fs.readFileSync(path.join(SRC, name), 'utf8');
  const body = stripModuleSyntax(source);
  assert(!/^\s*(import|export)\s/m.test(body), name + ' still contains module syntax');
  return body.trim();
}

function main() {
  const cards = loadCards();
  const topics = loadTopics();
  const dicts = loadDictionaries();
  const parts = SOURCE_ORDER.map(loadSource);

  const banner = [
    '/* Generated by build.mjs — edit src/ instead. */',
    'window.__ModuleLoader__.load({',
    "  id: '@local/daily-tarot',",
    '  factory(require) {',
    "    'use strict';",
    "    const React = require('react');",
    '    const h = React.createElement;',
    ''
  ].join('\n');

  const injected = [
    'const CARDS = ' + JSON.stringify(cards) + ';',
    'const TOPICS = ' + JSON.stringify(topics) + ';',
    'const DICTS = ' + JSON.stringify(dicts) + ';'
  ].join('\n\n');

  const footer = ['', '    return createPlugin();', '  }', '});', ''].join('\n');
  const output = banner + '\n' + injected + '\n\n' + parts.join('\n\n') + '\n' + footer;
  fs.writeFileSync(path.join(ROOT, 'client.js'), output, 'utf8');
  console.log(
    '[daily-tarot] client.js written: ' +
      cards.length +
      ' cards, ' +
      topics.length +
      ' topics, ' +
      Object.keys(dicts.zh).length +
      ' strings, ' +
      (output.length / 1024).toFixed(1) +
      ' KiB'
  );
}

main();
