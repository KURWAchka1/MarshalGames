export const RW = 900, RH = 500, FLOOR = 400;
export function createRunner() {
  return { status: 'ready', distance: 0, speed: 260, spawnIn: 1.4, jumpBuffer: 0, player: { x: 140, y: FLOOR - 62, width: 46, height: 62, vy: 0, jumps: 0 }, obstacles: [{ x: RW + 40, width: 32, height: 48 }] };
}
function performJump(state) { const p = state.player; p.vy = p.jumps ? -500 : -540; p.jumps++; state.jumpBuffer = 0; }
export function jumpRunner(state) {
  if (state.status !== 'playing') return false;
  state.jumpBuffer = .12;
  if (state.player.jumps >= 2) return false;
  performJump(state); return true;
}
export function stepRunner(state, dt, random = Math.random) {
  if (state.status !== 'playing') return;
  const p = state.player;
  state.speed = Math.min(400, 260 + state.distance * .12);
  state.distance += state.speed * dt / 10;
  state.jumpBuffer = Math.max(0, state.jumpBuffer - dt);
  p.vy += 1500 * dt; p.y += p.vy * dt;
  if (p.y + p.height >= FLOOR) { p.y = FLOOR - p.height; p.vy = 0; p.jumps = 0; if (state.jumpBuffer > 0) performJump(state); }
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) { state.obstacles.push({ x: RW + 40, width: 28 + Math.floor(random() * 25), height: 42 + Math.floor(random() * 43) }); state.spawnIn = 1.1 + random() * .6; }
  for (const obstacle of state.obstacles) {
    obstacle.x -= state.speed * dt;
    if (p.x + p.width - 7 > obstacle.x + 2 && p.x + 7 < obstacle.x + obstacle.width - 2 && p.y + p.height - 4 > FLOOR - obstacle.height + 3) { state.status = 'lost'; }
  }
  state.obstacles = state.obstacles.filter(obstacle => obstacle.x + obstacle.width > -20);
}
