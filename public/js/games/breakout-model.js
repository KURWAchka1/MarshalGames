export const BW = 720;
export const BH = 540;
export function makeBricks(level,random=Math.random,width=BW) {
  const pattern=Math.floor(random()*4),rows=4+level%3,columns=width<600?6:8,pitch=(width-72)/columns;
  return Array.from({ length: rows * columns }, (_, i) => ({ x: 36 + (i % columns) * pitch, y: 48 + Math.floor(i / columns) * 29, width:pitch-8, height:20,hp:level>1&&(i+level)%5===0?2:1,row:Math.floor(i/columns) })).filter((b,i)=>pattern===0||pattern===1&&i%columns!==Math.floor(i/columns)%columns||pattern===2&&(i+Math.floor(i/columns))%4!==0||pattern===3&&!(i%columns===0&&i<columns*2));
}
export function createBreakout(width=BW,height=BH) {
  return { status:'ready',width,height,level:0,lives:3,score:0,paddle:{x:width/2,y:height-49,width:width<600?94:124,height:14},ball:{x:width/2,y:height-61,vx:140,vy:-320,radius:width<600?10:9},bricks:makeBricks(0,Math.random,width) };
}
function resetBall(state) { state.ball.x = state.paddle.x; state.ball.y = state.paddle.y - state.ball.radius - 3; state.status = 'ready'; }
export function launchBreakout(state, random = Math.random) {
  if (state.status !== 'ready') return;
  const speed = Math.min(455,345 + state.level * 14);
  const vx = (random() < .5 ? -1 : 1) * (120 + random() * 100);
  state.ball.vx = vx; state.ball.vy = -Math.sqrt(speed * speed - vx * vx); state.status = 'playing';
}
function intersects(ball, rectangle) {
  const x = Math.max(rectangle.x, Math.min(ball.x, rectangle.x + rectangle.width));
  const y = Math.max(rectangle.y, Math.min(ball.y, rectangle.y + rectangle.height));
  return (ball.x - x) ** 2 + (ball.y - y) ** 2 <= ball.radius ** 2;
}
export function stepBreakout(state, dt, input = {}) {
  if (state.status !== 'playing') return;
  const { ball, paddle } = state;
  const width=state.width||BW,height=state.height||BH;
  if (Number.isFinite(input.targetX)) paddle.x += Math.max(-900 * dt, Math.min(900 * dt, input.targetX - paddle.x));
  else paddle.x += (input.direction || 0) * 540 * dt;
  paddle.x = Math.max(paddle.width / 2 + 10, Math.min(width - paddle.width / 2 - 10, paddle.x));
  if(state.transition>0){state.transition=Math.max(0,state.transition-dt);ball.x=paddle.x;ball.y=paddle.y-ball.radius-3;if(!state.transition){state.status='ready';launchBreakout(state);}return;}
  const previous = { x: ball.x, y: ball.y };
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  if (ball.x < ball.radius) { ball.x = ball.radius; ball.vx = Math.abs(ball.vx); }
  if (ball.x > width - ball.radius) { ball.x = width - ball.radius; ball.vx = -Math.abs(ball.vx); }
  if (ball.y < ball.radius) { ball.y = ball.radius; ball.vy = Math.abs(ball.vy); }
  const paddleRect = { x: paddle.x - paddle.width / 2, y: paddle.y, width: paddle.width, height: paddle.height };
  if (ball.vy > 0 && previous.y + ball.radius <= paddle.y + 2 && intersects(ball, paddleRect)) {
    const hit = Math.max(-1, Math.min(1, (ball.x - paddle.x) / (paddle.width / 2)));
    const speed = Math.min(460, Math.hypot(ball.vx, ball.vy) + 3);
    const angle = hit * Math.PI * .36;
    ball.vx = Math.sin(angle) * speed;
    if (Math.abs(ball.vx) < 30) ball.vx = (ball.vx < 0 ? -1 : 1) * 30;
    ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx);
    ball.y = paddle.y - ball.radius - .1;
  }
  for (const brick of state.bricks) {
    if (!brick.hp || !intersects(ball, brick)) continue;
    brick.hp--; state.score += brick.hp ? 10 : 25;
    if (previous.y + ball.radius <= brick.y) { ball.vy = -Math.abs(ball.vy); ball.y = brick.y - ball.radius - .1; }
    else if (previous.y - ball.radius >= brick.y + brick.height) { ball.vy = Math.abs(ball.vy); ball.y = brick.y + brick.height + ball.radius + .1; }
    else if (previous.x < brick.x) { ball.vx = -Math.abs(ball.vx); ball.x = brick.x - ball.radius - .1; }
    else { ball.vx = Math.abs(ball.vx); ball.x = brick.x + brick.width + ball.radius + .1; }
    break;
  }
  if (ball.y - ball.radius > height) {
    state.lives--;
    if (state.lives === 0) state.status = 'lost'; else resetBall(state);
    return;
  }
  if (state.bricks.every(brick => brick.hp === 0)) {
    state.score += 100;
    state.level++; state.bricks = makeBricks(state.level,Math.random,width);state.transition=.8;ball.x=paddle.x;ball.y=paddle.y-ball.radius-3;
  }
}
