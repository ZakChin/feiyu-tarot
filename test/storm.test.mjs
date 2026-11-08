import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clamp,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  makeParticles,
  mulberry32
} from '../src/storm.js';

test('clamp and lerp behave at the edges', () => {
  assert.equal(clamp(-1, 0, 1), 0);
  assert.equal(clamp(2, 0, 1), 1);
  assert.equal(clamp(0.4, 0, 1), 0.4);
  assert.equal(lerp(0, 10, 0), 0);
  assert.equal(lerp(0, 10, 1), 10);
  assert.equal(lerp(0, 10, 0.25), 2.5);
});

test('easing curves are pinned at both ends', () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(1), 1);
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  let previous = -1;
  for (let step = 0; step <= 20; step += 1) {
    const value = easeOutCubic(step / 20);
    assert.ok(value >= previous);
    previous = value;
  }
});

test('mulberry32 is deterministic and makeParticles is stable', () => {
  const first = mulberry32(42);
  const second = mulberry32(42);
  assert.equal(first(), second());

  const a = makeParticles(42, 7);
  const b = makeParticles(42, 7);
  assert.equal(a.length, 42);
  assert.deepEqual(a, b);
  for (const particle of a) {
    assert.ok(particle.radius > 0);
    assert.ok(particle.speed !== 0);
  }
});
