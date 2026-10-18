import test from 'node:test';
import assert from 'node:assert/strict';
import { createBreakout, launchBreakout, stepBreakout, makeBricks, BH } from '../public/js/games/breakout-model.js';

test('breakout launches only from ready and reflects from walls', () => {
  const state = createBreakout(); launchBreakout(state, () => .4);
  assert.equal(state.status, 'playing');
  state.ball.x = 9; state.ball.y = 300; state.ball.vx = -150;
  stepBreakout(state, 1 / 120);
  assert.ok(state.ball.vx > 0);
  state.ball.y = 9; state.ball.vy = -300; stepBreakout(state, 1 / 120);
  assert.ok(state.ball.vy > 0);
});
test('paddle deflects the ball and never leaves the field', () => {
  const state = createBreakout(); launchBreakout(state);
  state.ball.x = state.paddle.x + 40; state.ball.y = state.paddle.y - 9.5; state.ball.vx = 0; state.ball.vy = 300;
  stepBreakout(state, 1 / 120);
  assert.ok(state.ball.vy < 0); assert.ok(state.ball.vx > 0);
  for (let i = 0; i < 200; i++) stepBreakout(state, 1 / 120, { targetX: -500 });
  assert.ok(state.paddle.x >= state.paddle.width / 2);
});
test('bricks score once per hit and new layouts continue beyond the previous limit', () => {
  const state = createBreakout(); launchBreakout(state);
  const brick = state.bricks[0]; state.ball.x = brick.x + 20; state.ball.y = brick.y + brick.height + 9.2; state.ball.vy = -300; state.ball.vx = 0;
  stepBreakout(state, 1 / 120);
  assert.equal(brick.hp, 0); assert.equal(state.score, 25); assert.ok(state.ball.vy > 0);
  state.bricks.forEach(b => { b.hp = 0; }); stepBreakout(state, 1 / 120);
  assert.equal(state.level, 1); assert.equal(state.status, 'playing');
  for(let i=0;i<100;i++){state.transition=0;state.bricks.forEach(b=>b.hp=0);stepBreakout(state,1/120);assert.equal(state.status,'playing');assert.ok(state.bricks.length<=48);assert.ok(state.bricks.every(b=>b.y+b.height<250));assert.ok(Number.isFinite(state.ball.vy));}
  assert.equal(state.level,101);
});
test('three lost balls end the game; ended games no longer simulate', () => {
  const state = createBreakout();
  for (let i = 0; i < 3; i++) { launchBreakout(state); state.ball.y = BH + 20; state.ball.vy = 300; stepBreakout(state, 1 / 120); }
  assert.equal(state.status, 'lost'); assert.equal(state.lives, 0);
  const snapshot = structuredClone(state); stepBreakout(state, 1); assert.deepEqual(state, snapshot);
});
test('portrait breakout keeps bricks, paddle, and ball inside its own playfield',()=>{const s=createBreakout(420,600);for(let n=0;n<40;n++){const bricks=makeBricks(n,()=>n%4/4,420);assert.ok(bricks.length>10&&bricks.length<=36);assert.ok(bricks.every(b=>b.x>=0&&b.x+b.width<=420&&b.y+b.height<250));}launchBreakout(s);s.ball.x=415;s.ball.y=350;s.ball.vx=100;stepBreakout(s,1/120,{targetX:1000});assert.ok(s.ball.vx<0);assert.ok(s.paddle.x<=420-s.paddle.width/2);assert.equal(s.ball.radius,10);});
