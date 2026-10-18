import test from 'node:test';
import assert from 'node:assert/strict';
import { lights, toggleLights, solveLights } from '../public/js/games/lights.js';
import { pairs } from '../public/js/games/pairs.js';
import { sliding, adjacentIndices, isSolvable } from '../public/js/games/sliding.js';
import { loadGame, saveGame } from '../public/js/storage.js';

function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
}

test('all generated lights fields can actually be solved at every size', () => {
  for (const level of lights.levels) for (let seed = 1; seed <= 80; seed++) {
    const initial = lights.create(level.id, seeded(seed));
    assert.equal(lights.valid(initial, level.id), true);
    assert.equal(lights.won(initial), false);
    const solution = solveLights(initial.board, initial.size);
    assert.ok(Array.isArray(solution));
    const result = solution.reduce((state, index) => lights.move(state, index), initial);
    assert.equal(lights.won(result), true, `size ${initial.size}, seed ${seed}`);
  }
});

test('lights only toggles direct neighbours and undo restores the field', () => {
  assert.deepEqual(toggleLights(Array(9).fill(0), 0, 3), [1, 1, 0, 1, 0, 0, 0, 0, 0]);
  const initial = lights.create('normal', seeded(81));
  assert.deepEqual(lights.undo(lights.move(initial, 5)), initial);
  assert.deepEqual(lights.restart(lights.move(initial, 5)), initial);
  assert.equal(lights.move(initial, -1), initial);
});

test('lights detects an unsolvable layout and handles zero entropy random sources', () => {
  assert.equal(solveLights([1, ...Array(15).fill(0)], 4), null);
  for (const random of [() => 0, () => 0.99]) assert.equal(lights.won(lights.create('normal', random)), false);
});

test('sliding generator preserves parity for 300 fields at both sizes', () => {
  for (const level of sliding.levels) for (let seed = 1; seed <= 300; seed++) {
    const state = sliding.create(level.id, seeded(seed));
    assert.equal(sliding.valid(state, level.id), true);
    assert.equal(isSolvable(state.board, state.size), true);
    assert.equal(sliding.won(state), false);
  }
});

test('sliding rejects impossible boards, allows only adjacent moves, and restores undo', () => {
  assert.equal(isSolvable([2, 1, 3, 4, 5, 6, 7, 8, 0], 3), false);
  assert.equal(isSolvable([2, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0], 4), false);
  const initial = sliding.create('normal', seeded(23));
  const empty = initial.board.indexOf(0);
  const index = adjacentIndices(empty, 4)[0];
  assert.deepEqual(sliding.undo(sliding.move(initial, index)), initial);
  assert.deepEqual(sliding.restart(sliding.move(initial, index)), initial);
  assert.equal(sliding.move(initial, empty), initial);
  const nearWin = { size: 3, board: [1, 2, 3, 4, 5, 6, 7, 0, 8], initial: [1, 2, 3, 4, 5, 6, 7, 0, 8], moves: 0, history: [] };
  assert.equal(sliding.won(sliding.move(nearWin, 8)), true);
});

test('pairs resolves mismatches, blocks extra cards and completes every level', () => {
  for (const level of pairs.levels) {
    let state = pairs.create(level.id, seeded(42));
    assert.equal(pairs.valid(state, level.id), true);
    const first = 0;
    const different = state.deck.findIndex(value => value !== state.deck[first]);
    state = pairs.move(pairs.move(state, first), different);
    assert.equal(state.open.length, 2);
    assert.equal(state.moves, 1);
    assert.equal(pairs.move(state, state.deck.length - 1), state);
    state = pairs.settle(state);
    assert.deepEqual(state.open, []);
    for (let value = 0; value < state.deck.length / 2; value++) {
      const indices = state.deck.flatMap((item, i) => item === value ? [i] : []);
      state = pairs.move(pairs.move(state, indices[0]), indices[1]);
      assert.equal(pairs.valid(state, level.id), true);
      assert.equal(pairs.move(state, indices[0]), state);
    }
    assert.equal(pairs.won(state), true);
  }
});

test('pairs does not count clicking the same card twice as a match', () => {
  const initial = pairs.create('easy', seeded(33));
  const once = pairs.move(initial, 0);
  assert.equal(pairs.move(once, 0), once);
  assert.equal(once.moves, 0);
  assert.equal(pairs.move(initial, -1), initial);
});

test('save validation rejects corrupted data and inaccessible storage never blocks play', () => {
  const data = new Map();
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  for (const game of [lights, pairs, sliding]) {
    const level = game.defaultLevel;
    const state = game.create(level, seeded(7));
    assert.equal(saveGame(game, level, state), true);
    assert.deepEqual(loadGame(game), { version: 1, level, state });
    const key = `marshal-games:v1:${game.id}`;
    data.set(key, '{invalid');
    assert.equal(loadGame(game), null);
    data.set(key, JSON.stringify({ version: 1, level: '<script>', state }));
    assert.equal(loadGame(game), null);
    data.set(key, JSON.stringify({ version: 1, level, state: { ...state, moves: -1 } }));
    assert.equal(loadGame(game), null);
  }
  globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.equal(loadGame(lights), null);
  assert.equal(saveGame(lights, 'normal', lights.create('normal')), false);
  delete globalThis.localStorage;
});
