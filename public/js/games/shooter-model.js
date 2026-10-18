export const SW=720,SH=540;
export const waveSize=wave=>8+Math.min(16,wave*2);
export function createShooter(width=SW,height=SH){return{status:'ready',width,height,wave:0,spawned:0,nextSpawn:.7,time:0,score:0,kills:0,fire:0,player:{x:width/2,y:height-65,radius:14,hp:3,invulnerable:0},enemies:[],shots:[],threats:[],pickups:[],particles:[]};}
function hurt(state,force=false){const p=state.player;if(p.invulnerable>0&&!force)return;p.hp=Math.max(0,p.hp-1);p.invulnerable=1.2;if(!p.hp)state.status='lost';}
export function spawnEnemy(state,random=Math.random){const heavy=state.wave>0&&state.spawned%4===3;state.enemies.push({x:50+random()*((state.width||SW)-100),y:-30,origin:0,age:0,phase:random()*Math.PI*2,radius:heavy?22:16,hp:heavy?3:1,heavy,fire:1.3+random()*.6});const e=state.enemies.at(-1);e.origin=e.x;state.spawned++;}
export function stepShooter(state,dt,input={},random=Math.random){
  if(state.status!=='playing')return;
  const width=state.width||SW,height=state.height||SH;
  state.time+=dt;const p=state.player;p.invulnerable=Math.max(0,p.invulnerable-dt);
  let dx=input.dx||0,dy=input.dy||0;const length=Math.hypot(dx,dy);
  if(length){p.x+=dx/length*320*dt;p.y+=dy/length*320*dt;}
  else if(input.target){const x=input.target.x-p.x,y=input.target.y-p.y,d=Math.hypot(x,y);if(d){const step=Math.min(d,600*dt);p.x+=x/d*step;p.y+=y/d*step;}}
  p.x=Math.max(25,Math.min(width-25,p.x));p.y=Math.max(35,Math.min(height-27,p.y));
  state.fire-=dt;if(state.fire<=0){state.shots.push({x:p.x,y:p.y-20,radius:4});state.fire=.21;}
  state.nextSpawn-=dt;if(state.nextSpawn<=0&&state.spawned<waveSize(state.wave)){spawnEnemy(state,random);state.nextSpawn=Math.max(.36,.88-state.wave*.04);}
  for(const shot of state.shots)shot.y-=570*dt;
  for(const enemy of state.enemies){
    enemy.age+=dt;enemy.y+=(enemy.heavy?65+Math.min(55,state.wave*4):85+Math.min(120,state.wave*9))*dt;enemy.x=Math.max(25,Math.min(width-25,enemy.origin+Math.sin(enemy.age*1.8+enemy.phase)*(enemy.heavy?20:42)));
    if(enemy.heavy){enemy.fire-=dt;if(enemy.fire<=0){const tx=p.x-enemy.x,ty=p.y-enemy.y,d=Math.hypot(tx,ty)||1;state.threats.push({x:enemy.x,y:enemy.y,vx:tx/d*180,vy:ty/d*180,radius:5});enemy.fire=1.9;}}
    if(Math.hypot(enemy.x-p.x,enemy.y-p.y)<enemy.radius+p.radius){enemy.hp=0;hurt(state);}
    else if(enemy.y-enemy.radius>height){enemy.hp=0;hurt(state,true);}
  }
  for(const shot of state.shots){if(shot.dead)continue;const enemy=state.enemies.find(e=>e.hp>0&&Math.hypot(e.x-shot.x,e.y-shot.y)<e.radius+shot.radius);if(!enemy)continue;shot.dead=true;enemy.hp--;if(enemy.hp===0){state.score+=enemy.heavy?30:10;state.kills++;for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;state.particles.push({x:enemy.x,y:enemy.y,vx:Math.cos(angle)*100,vy:Math.sin(angle)*100,life:.4});}if(state.kills%7===0)state.pickups.push({x:enemy.x,y:enemy.y});}}
  for(const shot of state.threats){shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;if(Math.hypot(shot.x-p.x,shot.y-p.y)<shot.radius+p.radius){shot.dead=true;hurt(state);}}
  for(const pickup of state.pickups){pickup.y+=70*dt;if(state.status==='playing'&&Math.hypot(pickup.x-p.x,pickup.y-p.y)<24){p.hp=Math.min(3,p.hp+1);pickup.dead=true;}}
  for(const particle of state.particles){particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.life-=dt;}
  state.enemies=state.enemies.filter(e=>e.hp>0);state.shots=state.shots.filter(s=>!s.dead&&s.y>-20);state.threats=state.threats.filter(s=>!s.dead&&s.x>-30&&s.x<width+30&&s.y>-30&&s.y<height+30);state.pickups=state.pickups.filter(s=>!s.dead&&s.y<height+20);state.particles=state.particles.filter(s=>s.life>0).slice(-150);
  if(state.status==='playing'&&state.spawned===waveSize(state.wave)&&!state.enemies.length){state.score+=100;state.wave++;state.spawned=0;state.nextSpawn=1.5;p.hp=Math.min(3,p.hp+1);}
}
