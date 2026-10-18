import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSES,createGolf,shootGolf,stepGolf,golfAtRest,FRICTION} from '../public/js/games/golf-model.js';
test('golf first hole is reachable with a direct aimed shot and advances after capture',()=>{
  const s=createGolf();s.status='playing';const distance=COURSES[0].hole.x-s.ball.x;
  assert.equal(shootGolf(s,0,distance*FRICTION+35),true);assert.equal(shootGolf(s),false);
  for(let i=0;i<1200&&s.status==='playing';i++)stepGolf(s,1/120);
  assert.equal(s.course,1);assert.equal(s.status,'ready');assert.equal(s.strokes,1);
});
test('golf friction stops the ball, walls reflect, and bounds contain every shot',()=>{
  const s=createGolf();s.status='playing';shootGolf(s,Math.PI,600);for(let i=0;i<1200;i++)stepGolf(s,1/120);assert.ok(golfAtRest(s));assert.ok(s.ball.x>=33&&s.ball.y>=33);
  s.course=1;s.ball={x:310,y:300,vx:400,vy:0,radius:9};stepGolf(s,.03);assert.ok(s.ball.vx<0);assert.ok(s.ball.x<330);
});
test('every golf course has a traversable route for the ball around its walls',()=>{
  for(const c of COURSES){
    const free=(x,y)=>x>=33&&x<=687&&y>=33&&y<=447&&!c.walls.some(w=>x>w.x-10&&x<w.x+w.width+10&&y>w.y-10&&y<w.y+w.height+10);
    const start=[Math.round(c.start.x/10),Math.round(c.start.y/10)],goal=[Math.round(c.hole.x/10),Math.round(c.hole.y/10)];const queue=[start],seen=new Set([start.join(',')]);let found=false;
    for(let i=0;i<queue.length;i++){const[x,y]=queue[i];if(Math.abs(x-goal[0])+Math.abs(y-goal[1])<=1){found=true;break;}for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(!seen.has(key)&&free(nx*10,ny*10)){seen.add(key);queue.push([nx,ny]);}}}
    assert.ok(found,'blocked golf course');
  }
});
test('the final golf hole produces a terminal win and rejects further shots',()=>{const s=createGolf();s.course=4;s.status='playing';s.ball={...COURSES[4].hole,vx:0,vy:0,radius:9};stepGolf(s,1/120);stepGolf(s,.7);assert.equal(s.status,'won');assert.equal(shootGolf(s),false);});
