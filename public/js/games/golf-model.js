export const GW=720,GH=480,FRICTION=1.05;
export const COURSES=[
  {start:{x:90,y:240},hole:{x:620,y:240},walls:[]},
  {start:{x:90,y:360},hole:{x:610,y:110},walls:[{x:330,y:180,width:24,height:260}]},
  {start:{x:80,y:400},hole:{x:640,y:90},walls:[{x:210,y:24,width:22,height:280},{x:450,y:190,width:22,height:266}]},
  {start:{x:100,y:90},hole:{x:620,y:390},walls:[{x:260,y:100,width:80,height:100},{x:440,y:270,width:90,height:90},{x:140,y:320,width:70,height:70}]},
  {start:{x:80,y:80},hole:{x:640,y:400},walls:[{x:220,y:70,width:22,height:290},{x:400,y:170,width:22,height:285},{x:560,y:24,width:22,height:240}]},
];
export const golfCourse=state=>state.layout||COURSES[state.course%COURSES.length];
export function makeGolfCourse(random=Math.random,previous=0){
  const template=(previous+1+Math.min(COURSES.length-2,Math.floor(random()*(COURSES.length-1))))%COURSES.length;
  const source=COURSES[template],flipX=random()<.5,flipY=random()<.5;
  const point=p=>({x:flipX?GW-p.x:p.x,y:flipY?GH-p.y:p.y});
  return{template,start:point(source.start),hole:point(source.hole),walls:source.walls.map(w=>({...w,x:flipX?GW-w.x-w.width:w.x,y:flipY?GH-w.y-w.height:w.y}))};
}
export function createGolf(){const c=COURSES[0];return{status:'ready',course:0,strokes:0,ball:{...c.start,vx:0,vy:0,radius:9},angle:0,power:420,holeDelay:0};}
export const golfAtRest=state=>Math.hypot(state.ball.vx,state.ball.vy)<5&&!state.holeDelay;
export function shootGolf(state,angle=state.angle,power=state.power){
  if(state.status!=='playing'||!golfAtRest(state))return false;
  state.angle=angle;state.power=Math.max(60,Math.min(720,power));state.ball.vx=Math.cos(angle)*state.power;state.ball.vy=Math.sin(angle)*state.power;state.strokes++;return true;
}
function bounceCircle(ball,wall){
  const nearX=Math.max(wall.x,Math.min(ball.x,wall.x+wall.width)),nearY=Math.max(wall.y,Math.min(ball.y,wall.y+wall.height));
  const dx=ball.x-nearX,dy=ball.y-nearY,d=Math.hypot(dx,dy);if(d>=ball.radius)return;
  let nx,ny,penetration;
  if(d>0){nx=dx/d;ny=dy/d;penetration=ball.radius-d;}
  else{const choices=[{d:ball.x-wall.x,nx:-1,ny:0},{d:wall.x+wall.width-ball.x,nx:1,ny:0},{d:ball.y-wall.y,nx:0,ny:-1},{d:wall.y+wall.height-ball.y,nx:0,ny:1}].sort((a,b)=>a.d-b.d);nx=choices[0].nx;ny=choices[0].ny;penetration=choices[0].d+ball.radius;}
  ball.x+=nx*(penetration+.01);ball.y+=ny*(penetration+.01);const dot=ball.vx*nx+ball.vy*ny;if(dot<0){ball.vx-=1.82*dot*nx;ball.vy-=1.82*dot*ny;}
}
export function stepGolf(state,dt,random=Math.random){
  if(state.status!=='playing')return;
  if(state.holeDelay){state.holeDelay=Math.max(0,state.holeDelay-dt);if(!state.holeDelay){state.layout=makeGolfCourse(random,golfCourse(state).template??state.course%COURSES.length);state.course++;const c=state.layout;state.ball={...c.start,vx:0,vy:0,radius:9};state.angle=Math.atan2(c.hole.y-c.start.y,c.hole.x-c.start.x);state.power=420;state.status='playing';}return;}
  const b=state.ball,c=golfCourse(state);b.x+=b.vx*dt;b.y+=b.vy*dt;
  for(const wall of c.walls)bounceCircle(b,wall);
  const min=24+b.radius,maxX=GW-24-b.radius,maxY=GH-24-b.radius;
  if(b.x<min){b.x=min;b.vx=Math.abs(b.vx)*.82;}if(b.x>maxX){b.x=maxX;b.vx=-Math.abs(b.vx)*.82;}
  if(b.y<min){b.y=min;b.vy=Math.abs(b.vy)*.82;}if(b.y>maxY){b.y=maxY;b.vy=-Math.abs(b.vy)*.82;}
  const friction=Math.exp(-FRICTION*dt);b.vx*=friction;b.vy*=friction;
  if(Math.hypot(b.vx,b.vy)<5){b.vx=0;b.vy=0;}
  if(Math.hypot(b.x-c.hole.x,b.y-c.hole.y)<13&&Math.hypot(b.vx,b.vy)<180){b.x=c.hole.x;b.y=c.hole.y;b.vx=0;b.vy=0;state.holeDelay=.6;}
}
