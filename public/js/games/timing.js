import { createStage } from '../stage.js';
import { createTiming, stepTiming, attemptTiming } from './timing-model.js';

export const timing = {
  id: 'timing', title: 'Точный момент', category: 'reflex', tag: 'Реакция', theme: 'timing',
  instruction: 'Нажимай, когда указатель находится в выделенной дуге. Нужно двенадцать попаданий. Три промаха заканчивают попытку. Скорость и направление меняются по ходу игры.',
  keyboard: 'Пробел, Enter или касание поля — попытка. P или Escape — пауза.',
  preview: '<svg viewBox="0 0 100 80"><rect x="4" y="5" width="92" height="70" rx="7" fill="#29263e"/><circle cx="50" cy="40" r="23" fill="none" stroke="#49435f" stroke-width="5"/><path d="M35 23a23 23 0 0 1 34 5" fill="none" stroke="#86d0b7" stroke-width="6" stroke-linecap="round"/><circle cx="72" cy="47" r="5" fill="#f5ac83"/></svg>',
  mount(host, { announce }) {
    let state = createTiming();
    function attempt() { const result = attemptTiming(state); if (result) announce(result === 'hit' ? `Попадание ${state.hits} из 12` : `Промах ${state.misses} из 3`); }
    return createStage(host, {
      label: 'Точный момент', announce,
      status: () => state.status, start: () => { state.status = 'playing'; }, restart: () => { state = createTiming(); },
      stats: () => [{ value: `${state.hits}/12`, label: 'Попадания' }, { value: `${state.misses}/3`, label: 'Промахи' }],
      result: () => ({ title: state.status === 'won' ? 'Серия завершена' : 'Три промаха', description: `Попаданий: ${state.hits} из 12` }),
      pointer(type) { if (type === 'down') attempt(); },
      key(key) { if (key === ' ' || key === 'Enter') attempt(); },
      step: dt => stepTiming(state, dt),
      draw(ctx) {
        const x = 360, y = 270, radius = 166;
        ctx.fillStyle = '#26233b'; ctx.fillRect(0, 0, 720, 540);
        ctx.strokeStyle = '#39354f'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, radius + 36, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 48; i++) {
          const angle = i * Math.PI / 24;
          ctx.strokeStyle = '#46415e'; ctx.lineWidth = i % 4 === 0 ? 2 : 1;
          ctx.beginPath(); ctx.moveTo(x + Math.cos(angle) * (radius + 23), y + Math.sin(angle) * (radius + 23)); ctx.lineTo(x + Math.cos(angle) * (radius + 29), y + Math.sin(angle) * (radius + 29)); ctx.stroke();
        }
        ctx.strokeStyle = '#48415e'; ctx.lineWidth = 14;
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#8ad4b8'; ctx.lineWidth = 17; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x, y, radius, state.target - state.width / 2, state.target + state.width / 2); ctx.stroke(); ctx.lineCap = 'butt';
        const px = x + Math.cos(state.angle) * radius, py = y + Math.sin(state.angle) * radius;
        ctx.strokeStyle = '#f1b58c55'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(state.angle) * 85, y + Math.sin(state.angle) * 85); ctx.lineTo(px, py); ctx.stroke();
        ctx.fillStyle = '#f5b88c'; ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f1eff8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 64px "Golos Text", sans-serif'; ctx.fillText(String(state.hits).padStart(2, '0'), x, y - 6);
        ctx.font = '17px "Golos Text", sans-serif'; ctx.fillStyle = '#aca5c4'; ctx.fillText('из 12', x, y + 45);
        if (state.feedbackTime > 0) {
          ctx.globalAlpha = Math.min(1, state.feedbackTime * 3); ctx.fillStyle = state.feedback === 'hit' ? '#8ad4b8' : '#f5a7a7'; ctx.font = '500 18px "Golos Text", sans-serif'; ctx.fillText(state.feedback === 'hit' ? `Точность ${state.accuracy}%` : 'Мимо', x, 498); ctx.globalAlpha = 1;
        }
      },
    });
  },
};
