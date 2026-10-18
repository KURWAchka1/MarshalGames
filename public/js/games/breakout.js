import { createStage, roundRect } from '../stage.js';
import { createBreakout, launchBreakout, stepBreakout, BW, BH } from './breakout-model.js';

const colors = ['#f39e6a', '#e9c975', '#6ec4b4', '#90a7e5', '#b39ad8', '#e4a9b9'];
export const breakout = {
  id: 'breakout', title: 'Рикошет', category: 'arcade', tag: 'Аркада', theme: 'breakout',
  instruction: 'Отбивай мяч платформой и разбей все блоки. Пройди три уровня. Если мяч упадёт, потеряешь одну из трёх жизней.',
  keyboard: 'Мышь или касание — движение платформы. Стрелки влево/вправо — с клавиатуры. P или Escape — пауза.',
  preview: '<svg viewBox="0 0 100 80"><rect x="4" y="5" width="92" height="70" rx="7" fill="#182c3f"/><g fill="#f39e6a"><rect x="15" y="16" width="20" height="8" rx="2"/><rect x="40" y="16" width="20" height="8" rx="2"/><rect x="65" y="16" width="20" height="8" rx="2"/></g><g fill="#6ec4b4"><rect x="15" y="28" width="20" height="8" rx="2"/><rect x="40" y="28" width="20" height="8" rx="2"/></g><circle cx="64" cy="49" r="4" fill="white"/><rect x="34" y="63" width="35" height="5" rx="2" fill="#dce8ff"/></svg>',
  mount(host, { announce }) {
    let state = createBreakout();
    let targetX;
    const trail = [];
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const stage = createStage(host, {
      width: BW, height: BH, label: 'Рикошет', announce,
      status: () => state.status,
      start: () => launchBreakout(state),
      restart: () => { state = createBreakout(); targetX = undefined; trail.length = 0; },
      stats: () => [{ value: state.score, label: 'очки' }, { value: `${state.level + 1}/3`, label: 'уровень' }, { value: state.lives, label: 'жизни' }],
      result: () => ({ title: state.status === 'won' ? 'Все блоки разбиты' : 'Мячи закончились', description: `Очки: ${state.score}` }),
      pointer(type, point) { if (type === 'down' || type === 'move') targetX = point.x; },
      cancelInput() { targetX = undefined; },
      step(dt, keys) {
        const direction = Number(keys.has('ArrowRight') || keys.has('d')) - Number(keys.has('ArrowLeft') || keys.has('a'));
        if (direction) targetX = undefined;
        stepBreakout(state, dt, { direction, targetX });
        trail.push({ x: state.ball.x, y: state.ball.y }); if (trail.length > 12) trail.shift();
        if (state.status !== 'playing') trail.length = 0;
      },
      draw(ctx) {
        ctx.fillStyle = '#142638'; ctx.fillRect(0, 0, BW, BH);
        ctx.strokeStyle = '#243b50'; ctx.lineWidth = 1;
        ctx.strokeRect(18, 20, BW - 36, BH - 38);
        for (const brick of state.bricks) {
          if (!brick.hp) continue;
          roundRect(ctx, brick.x, brick.y + 3, brick.width, brick.height, 4, '#0a1826');
          roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 4, colors[brick.row]);
          if (brick.hp > 1) roundRect(ctx, brick.x + 9, brick.y + 8, brick.width - 18, 3, 1, '#ffffff88');
        }
        if (!motionPreference.matches) trail.forEach((point, i) => { ctx.fillStyle = `rgba(211,232,255,${i / trail.length * .24})`; ctx.beginPath(); ctx.arc(point.x, point.y, state.ball.radius * i / trail.length, 0, Math.PI * 2); ctx.fill(); });
        roundRect(ctx, state.paddle.x - state.paddle.width / 2, state.paddle.y, state.paddle.width, state.paddle.height, 6, '#dce8ff');
        roundRect(ctx, state.paddle.x - state.paddle.width / 2 + 8, state.paddle.y + 3, state.paddle.width - 16, 2, 1, '#ffffff');
        ctx.fillStyle = '#fff7df'; ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2); ctx.fill();
      },
    });
    return stage;
  },
};
