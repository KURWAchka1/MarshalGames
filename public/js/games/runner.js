import { createStage, roundRect } from '../stage.js';
import { createRunner, stepRunner, jumpRunner, RW, RH, FLOOR } from './runner-model.js';

export const runner = {
  id: 'runner', title: 'Рывок', category: 'runner', tag: 'Раннер', theme: 'runner',
  instruction: 'Перепрыгивай препятствия. В воздухе можно прыгнуть ещё один раз. Скорость постепенно растёт, но интервалы между препятствиями оставляют время на приземление.',
  keyboard: 'Пробел, стрелка вверх, W или касание поля — прыжок. P или Escape — пауза.',
  preview: '<svg viewBox="0 0 100 80"><rect x="4" y="5" width="92" height="70" rx="7" fill="#dfebe4"/><path d="M10 63h80" stroke="#536d60" stroke-width="3"/><rect x="28" y="29" width="22" height="28" rx="6" fill="#354d45"/><rect x="34" y="35" width="17" height="7" rx="2" fill="#bbded1"/><rect x="70" y="45" width="12" height="17" rx="2" fill="#ce795b"/></svg>',
  mount(host, { announce }) {
    let state = createRunner();
    return createStage(host, {
      width: RW, height: RH, label: 'Рывок', announce,
      status: () => state.status, start: () => { state.status = 'playing'; }, restart: () => { state = createRunner(); },
      stats: () => [{ value: `${Math.floor(state.distance)} м`, label: 'Дистанция' }, { value: Math.max(0, 2 - state.player.jumps), label: 'Прыжки' }],
      result: () => ({ title: 'Столкновение', description: `Дистанция: ${Math.floor(state.distance)} м` }),
      pointer(type) { if (type === 'down') jumpRunner(state); },
      key(key,code) { if ([' ', 'Enter', 'ArrowUp'].includes(key)||code==='KeyW') jumpRunner(state); },
      step: dt => stepRunner(state, dt),
      draw(ctx, time) {
        ctx.fillStyle = '#e1ebe5'; ctx.fillRect(0, 0, RW, RH);
        ctx.fillStyle = '#f1d5b8'; ctx.beginPath(); ctx.arc(728, 102, 46, 0, Math.PI * 2); ctx.fill();
        const scroll = state.distance * 10;
        ctx.fillStyle = '#c8d9cf';
        for (let i = -1; i < 5; i++) { const x = i * 330 - scroll * .12 % 330; ctx.beginPath(); ctx.moveTo(x - 30, FLOOR); ctx.lineTo(x + 90, 220); ctx.lineTo(x + 260, FLOOR); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = '#d2e0d7';
        for (let i = -1; i < 5; i++) { const x = i * 270 - scroll * .25 % 270; ctx.beginPath(); ctx.arc(x + 100, FLOOR + 25, 126, Math.PI, 0); ctx.fill(); }
        ctx.fillStyle = '#dae4dc'; ctx.fillRect(0, FLOOR, RW, RH - FLOOR);
        ctx.fillStyle = '#839e8d'; ctx.fillRect(0, FLOOR, RW, 3);
        ctx.fillStyle = '#c0d1c4'; for (let i = 0; i < 14; i++) ctx.fillRect(i * 80 - scroll % 80, FLOOR + 38, 28, 3);
        for (const obstacle of state.obstacles) {
          roundRect(ctx, obstacle.x, FLOOR - obstacle.height, obstacle.width, obstacle.height, 5, '#c77a5e');
          roundRect(ctx, obstacle.x + 5, FLOOR - obstacle.height + 7, 4, obstacle.height - 15, 2, '#e5a58b');
          ctx.fillStyle = '#a85f49'; ctx.fillRect(obstacle.x + 6, FLOOR - 12, obstacle.width - 12, 3);
        }
        const p = state.player;
        const altitude = FLOOR - p.y - p.height;
        ctx.fillStyle = `rgba(62,83,71,${Math.max(.04,.16-altitude*.0007)})`; ctx.beginPath(); ctx.ellipse(p.x+p.width/2, FLOOR+5, Math.max(10,25-altitude*.06), 5, 0, 0, Math.PI*2); ctx.fill();
        ctx.save(); ctx.translate(p.x+p.width/2,p.y+p.height/2); ctx.rotate(Math.max(-.1,Math.min(.1,p.vy*.00016)));
        roundRect(ctx,-p.width/2,-p.height/2,p.width,p.height-5,12,'#3d584e');
        roundRect(ctx,-p.width/2+8,-p.height/2+12,p.width-9,16,5,'#bce0cf');
        ctx.fillStyle='#415e54'; ctx.fillRect(p.width/2-10,-p.height/2+17,4,6);
        const foot = p.jumps ? 0 : Math.sin(state.distance*2)*5;
        roundRect(ctx,-17,p.height/2-8+foot,12,9,3,'#2c4239'); roundRect(ctx,6,p.height/2-8-foot,12,9,3,'#2c4239');
        ctx.restore();
        if (p.jumps) { for (let i = 0; i < 2; i++) { ctx.fillStyle = i < 2-p.jumps ? '#476c5b' : '#476c5b33'; ctx.beginPath(); ctx.arc(p.x+17+i*12,p.y-14,3,0,Math.PI*2); ctx.fill(); } }
      },
    });
  },
};
