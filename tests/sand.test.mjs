import test from 'node:test';
import assert from 'node:assert/strict';
import { createSand,paintSand,paintSandLine,stepSand } from '../public/js/games/sand-model.js';

test('sand simulation conserves all materials and keeps stone fixed',()=>{
  const state=createSand(30,30);paintSandLine(state,{x:3,y:26},{x:26,y:26},1,3);paintSand(state,10,5,3,1);paintSand(state,18,7,3,2);
  const counts=()=>[1,2,3].map(type=>state.cells.filter(x=>x===type).length);const initial=counts();const stones=[...state.cells].flatMap((x,i)=>x===3?[i]:[]);
  for(let i=0;i<150;i++)stepSand(state);
  assert.deepEqual(counts(),initial);assert.equal(state.count,initial.reduce((a,b)=>a+b,0));assert.ok(stones.every(i=>state.cells[i]===3));
});
test('sand sinks in water and water can flow sideways without disappearing',()=>{
  const state=createSand(7,7);state.cells[2*7+3]=1;state.cells[3*7+3]=2;state.count=2;stepSand(state,()=>.4);
  assert.equal(state.cells[3*7+3],1);assert.equal(state.cells.filter(x=>x===2).length,1);
  const pool=createSand(5,5);paintSandLine(pool,{x:0,y:4},{x:4,y:4},1,3);paintSand(pool,2,2,0,2);for(let i=0;i<20;i++)stepSand(pool);assert.equal(pool.cells.filter(x=>x===2).length,1);
});
test('sand brush clips to edges, interpolates strokes, and erases accurately',()=>{
  const state=createSand(20,20);paintSandLine(state,{x:-5,y:5},{x:25,y:5},1,1);assert.ok(state.count>20);assert.equal(state.cells.length,400);
  paintSand(state,10,5,20,0);assert.equal(state.count,0);assert.ok(state.cells.every(x=>x===0));
});
