import test from 'node:test';
import assert from 'node:assert/strict';
import { createTiming, stepTiming, attemptTiming, angleDistance, TAU } from '../public/js/games/timing-model.js';

test('timing target correctly spans the angle seam at 0/2π', () => {
  assert.ok(angleDistance(.05, TAU - .05) < .101);
  const state = createTiming(() => 0); state.status = 'playing'; state.angle = TAU - .1;
  assert.equal(attemptTiming(state, () => .4), 'hit');
  assert.equal(state.hits, 1);
});
test('timing rejects double presses, reverses direction, and ends a completed series', () => {
  const state = createTiming(); state.status = 'playing';
  for (let i = 0; i < 12; i++) {
    state.angle = state.target; state.cooldown = 0;
    assert.equal(attemptTiming(state, () => .5), 'hit');
    assert.equal(attemptTiming(state), null);
  }
  assert.equal(state.status, 'won'); assert.equal(state.hits, 12);
  const snapshot = structuredClone(state); stepTiming(state, 2); assert.deepEqual(state, snapshot);
});
test('timing handles misses, cooldown expiry, and paused initial fields', () => {
  const state = createTiming(() => 0);
  assert.equal(attemptTiming(state), null);
  state.status = 'playing';
  for (let i = 0; i < 3; i++) { state.angle = Math.PI; state.cooldown = 0; assert.equal(attemptTiming(state), 'miss'); }
  assert.equal(state.status, 'lost');
  const fresh = createTiming(); fresh.status = 'playing'; fresh.cooldown = .2; stepTiming(fresh, .3); assert.equal(fresh.cooldown, 0);
});
