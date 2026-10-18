export const TAU = Math.PI * 2;
export const normalizeAngle = angle => ((angle % TAU) + TAU) % TAU;
export const angleDistance = (a, b) => Math.abs(((normalizeAngle(a) - normalizeAngle(b) + Math.PI * 3) % TAU) - Math.PI);
export function createTiming(random = Math.random) {
  return { status: 'ready', angle: -Math.PI / 2, target: random() * TAU, width: .88, speed: 1.65, direction: 1, hits: 0, misses: 0, cooldown: 0, feedback: '', feedbackTime: 0, accuracy: 0 };
}
export function stepTiming(state, dt) {
  if (state.status !== 'playing') return;
  state.angle = normalizeAngle(state.angle + state.speed * state.direction * dt);
  state.cooldown = Math.max(0, state.cooldown - dt);
  state.feedbackTime = Math.max(0, state.feedbackTime - dt);
}
export function attemptTiming(state, random = Math.random) {
  if (state.status !== 'playing' || state.cooldown > 0) return null;
  state.cooldown = .24; state.feedbackTime = .65;
  const error = angleDistance(state.angle, state.target);
  if (error <= state.width / 2) {
    state.hits++; state.feedback = 'hit'; state.accuracy = Math.round((1 - error / (state.width / 2)) * 100);
    state.speed = Math.min(4.1,1.65 + state.hits * .075);
    state.width = Math.max(.42, .88 - state.hits * .015);
    if (state.hits % 2 === 0) state.direction *= -1;
    state.target = normalizeAngle(state.angle + state.direction * (1.05 + random() * 3.2));
    return 'hit';
  }
  state.misses++; state.feedback = 'miss';
  if (state.misses === 3) state.status = 'lost';
  return 'miss';
}
