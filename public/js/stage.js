import { controlIcon } from './symbols.js';

export function createStage(host, options) {
  const { width = 720, height = 540 } = options;
  const events = new AbortController();
  const signal = events.signal;
  host.innerHTML = `<section class="stage-card"><div class="stage-stats" aria-label="Состояние игры"></div><div class="canvas-frame"><canvas tabindex="0" aria-label="${options.label}" role="img" aria-describedby="game-instruction"></canvas><div class="stage-overlay"><div class="stage-overlay-panel"><h2></h2><p></p><button type="button" class="button button-primary stage-start">Начать</button></div></div></div><div class="stage-controls"><button type="button" class="icon-button stage-pause" aria-label="Пауза" title="Пауза">${controlIcon('pause')}</button></div></section>`;
  const canvas = host.querySelector('canvas');
  const context = canvas.getContext('2d');
  const overlay = host.querySelector('.stage-overlay');
  const startButton = host.querySelector('.stage-start');
  const pauseButton = host.querySelector('.stage-pause');
  const keys = new Set();
  let paused = false, previousMode = '', statsKey = '', frame, lastTime, accumulator = 0, destroyed = false;
  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    canvas.style.aspectRatio = `${width}/${height}`; context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { signal });
  function sync() {
    const status = options.status();
    const mode = paused && status === 'playing' ? 'paused' : status;
    if (mode !== previousMode) {
      overlay.hidden = mode === 'playing';
      const ended = mode === 'won' || mode === 'lost';
      overlay.querySelector('h2').textContent = mode === 'paused' ? 'Пауза' : mode === 'ready' ? (options.readyTitle?.() || options.label) : options.result().title;
      overlay.querySelector('p').textContent = ended ? options.result().description : '';
      startButton.textContent = mode === 'paused' ? 'Продолжить' : ended ? 'Ещё раз' : 'Начать';
      pauseButton.setAttribute('aria-label', paused ? 'Продолжить' : 'Пауза');
      pauseButton.title = paused ? 'Продолжить' : 'Пауза';
      pauseButton.innerHTML = controlIcon(paused ? 'play' : 'pause'); pauseButton.disabled = status !== 'playing';
      if ((ended || mode === 'ready') && previousMode === 'playing') { if (ended) options.announce?.(`${options.result().title}. ${options.result().description}`); startButton.focus({ preventScroll: true }); }
      previousMode = mode;
    }
    const stats = options.stats();
    const key = JSON.stringify(stats);
    if (key !== statsKey) { host.querySelector('.stage-stats').innerHTML = stats.map(stat => `<span><small>${stat.label}</small><strong>${stat.value}</strong></span>`).join(''); statsKey = key; }
  }
  function activate() {
    if (paused) paused = false;
    else if (options.status() === 'ready') options.start();
    else if (['won', 'lost'].includes(options.status())) { options.restart(); options.start(); }
    lastTime = undefined; accumulator = 0; keys.clear(); canvas.focus({ preventScroll: true }); sync();
  }
  startButton.addEventListener('click', activate, { signal });
  function pause() { if (options.status() !== 'playing') return; paused = true; keys.clear(); options.cancelInput?.(); sync(); }
  function togglePause() { if (paused) activate(); else pause(); }
  pauseButton.addEventListener('click', togglePause, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, { signal });
  window.addEventListener('blur', pause, { signal });
  canvas.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'Escape', 'p', 'P'].includes(event.key)) event.preventDefault();
    if (event.key === 'Escape' || event.key.toLowerCase() === 'p' || event.code === 'KeyP') { if (!event.repeat) togglePause(); return; }
    if ((paused || options.status() === 'ready') && [' ', 'Enter'].includes(event.key)) { if (!event.repeat) activate(); return; }
    if (paused) return;
    keys.add(event.key); keys.add(event.code); if (!event.repeat) options.key?.(event.key,event.code);
  }, { signal });
  window.addEventListener('keyup', event => { keys.delete(event.key); keys.delete(event.code); }, { signal });
  function point(event) { const b = canvas.getBoundingClientRect(); return { x: (event.clientX - b.left) * width / b.width, y: (event.clientY - b.top) * height / b.height }; }
  canvas.addEventListener('pointerdown', event => { event.preventDefault(); if (paused || options.status() !== 'playing') return; canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId); options.pointer?.('down', point(event), event); }, { signal });
  canvas.addEventListener('pointermove', event => { if (!paused && options.status() === 'playing') options.pointer?.('move', point(event), event); }, { signal });
  canvas.addEventListener('pointerup', event => options.pointer?.('up', point(event), event), { signal });
  canvas.addEventListener('pointercancel', () => options.cancelInput?.(), { signal });
  function tick(time) {
    if (destroyed) return;
    if (lastTime !== undefined && !paused && options.status() === 'playing') {
      accumulator += Math.min((time - lastTime) / 1000, 0.05);
      while (accumulator >= 1 / 120 && options.status() === 'playing') { options.step(1 / 120, keys); accumulator -= 1 / 120; }
    } else accumulator = 0;
    lastTime = time; options.draw(context, time / 1000); sync(); frame = requestAnimationFrame(tick);
  }
  sync(); frame = requestAnimationFrame(tick);
  return {
    restart() { paused = false; keys.clear(); options.cancelInput?.(); options.restart(); lastTime = undefined; previousMode = ''; sync(); },
    pause,
    destroy() { destroyed = true; cancelAnimationFrame(frame); events.abort(); keys.clear(); },
  };
}

export function roundRect(context, x, y, width, height, radius, fill) {
  context.fillStyle = fill; context.beginPath(); context.roundRect(x, y, width, height, radius); context.fill();
}
