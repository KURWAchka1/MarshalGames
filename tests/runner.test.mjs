import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunner, stepRunner, jumpRunner, FLOOR } from '../public/js/games/runner-model.js';

test('runner supports exactly two air jumps and restores them after landing', () => {
  const state = createRunner(); state.status = 'playing'; state.obstacles = []; state.spawnIn = 1e6;
  assert.equal(jumpRunner(state), true); stepRunner(state, 1/120);
  assert.ok(state.player.y < FLOOR-state.player.height);
  assert.equal(jumpRunner(state), true); assert.equal(jumpRunner(state), false);
  assert.equal(state.player.jumps, 2);
  state.jumpBuffer = 0;
  for (let i=0;i<240;i++) stepRunner(state,1/120);
  assert.equal(state.player.y+state.player.height,FLOOR); assert.equal(state.player.jumps,0);
});
test('runner collision ends the game and a high jump clears a short obstacle', () => {
  const state = createRunner(); state.status='playing'; state.obstacles=[{x:state.player.x,width:30,height:50}]; stepRunner(state,1/120); assert.equal(state.status,'lost');
  const airborne=createRunner(); airborne.status='playing'; airborne.player.y=200; airborne.obstacles=[{x:airborne.player.x,width:30,height:50}]; stepRunner(airborne,1/120); assert.equal(airborne.status,'playing');
});
test('runner obstacle generation has bounded size, safe intervals, and capped speed', () => {
  const state=createRunner(); state.status='playing'; state.spawnIn=0; state.obstacles=[];
  stepRunner(state,1/120,()=>.99);
  assert.ok(state.spawnIn>=1.1&&state.spawnIn<=1.7); assert.ok(state.obstacles[0].height<=85); assert.ok(state.obstacles[0].width<=53);
  state.distance=1e6; state.obstacles=[]; state.spawnIn=1e6; stepRunner(state,1/120); assert.equal(state.speed,400);
});
