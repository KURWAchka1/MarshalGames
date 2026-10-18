import { pairs } from './games/pairs.js';
import { adjacentIndices } from './games/sliding.js';
import { games } from './registry.js';
import { loadGame, saveGame, hasProgress } from './storage.js';
import { symbol, symbolNames, arrow, controlIcon } from './symbols.js';

const main = document.querySelector('#main');
const announcer = document.querySelector('#announcer');
let current = null;
let settleTimer;
let hintTimer;
let filter = 'all';
let search = '';
let navigating = false;

const announce = message => { announcer.textContent = message; };

function preview(id) {
  if (id === 'lights') return `<div class="mini-board mini-lights">${[1, 0, 1, 1, 1, 0, 0, 1, 1].map(on => `<i class="${on ? 'on' : ''}"></i>`).join('')}</div>`;
  if (id === 'pairs') return `<div class="mini-board mini-pairs">${[0, -1, -1, 0, 2, -1].map((value, i) => `<i class="${value < 0 ? 'back' : `face color-${i}`}" >${value < 0 ? '<span>+</span>' : symbol(value)}</i>`).join('')}</div>`;
  return `<div class="mini-board mini-sliding">${[1, 2, 3, 4, 0, 6, 7, 5, 8].map(value => `<i class="${value ? '' : 'empty'}">${value || ''}</i>`).join('')}</div>`;
}

function gameCard(game) {
  const saved = game.mount ? null : loadGame(game);
  const continuing = saved && hasProgress(game, saved.state);
  return `<a class="game-card ${game.theme}-card" href="#/play/${game.id}" data-category="${game.category}" data-title="${game.title.toLocaleLowerCase('ru')} ${game.tag.toLocaleLowerCase('ru')}">
    <div class="card-art" aria-hidden="true">${game.preview || preview(game.id)}</div>
    <div class="card-copy"><h2>${game.title}</h2><span class="game-tag">${game.tag}</span></div>
    <span class="card-action"><span>${continuing ? 'Продолжить' : 'Играть'}</span> ${arrow}</span>
  </a>`;
}

function renderHome() {
  current = null;
  document.title = 'Marshal Games';
  main.className = 'wrap home';
  main.innerHTML = `<section class="catalog" id="games" aria-labelledby="catalog-title">
    <div class="catalog-heading"><h1 id="catalog-title">Игры <span class="catalog-count" id="catalog-count">${games.length}</span></h1><label class="search-field"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="game-search" type="search" placeholder="Найти игру" aria-label="Поиск игр" autocomplete="off"></label></div>
    <div class="filters" role="group" aria-label="Категория игр">${[['all', 'Все игры'], ...[...new Map(games.map(game => [game.category, game.tag])).entries()]].map(([id, label]) => `<button type="button" data-filter="${id}" aria-pressed="${filter === id}">${label}</button>`).join('')}</div>
    <div class="game-grid">${games.map(gameCard).join('')}</div>
    <div class="catalog-empty" id="catalog-empty" hidden><p>Игр не найдено</p><button type="button" class="button button-secondary" id="clear-search">Сбросить поиск</button></div>
  </section>`;
  main.querySelector('#game-search').value = search;
  main.querySelector('#game-search').addEventListener('input', event => { search = event.target.value; applyFilter(); });
  main.querySelector('#clear-search').addEventListener('click', () => { search = ''; filter = 'all'; main.querySelector('#game-search').value = ''; applyFilter(); main.querySelector('#game-search').focus(); });
  applyFilter();
  main.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    applyFilter();
    announce(`Показано игр: ${games.filter(game => filter === 'all' || game.category === filter).length}`);
  }));
}

function applyFilter() {
  const query = search.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
  main.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  let count = 0;
  main.querySelectorAll('[data-category]').forEach(card => { card.hidden = (filter !== 'all' && card.dataset.category !== filter) || !card.dataset.title.replaceAll('ё', 'е').includes(query); if (!card.hidden) count++; });
  main.querySelector('#catalog-count').textContent = count;
  main.querySelector('#catalog-empty').hidden = count > 0;
  main.querySelector('.game-grid').hidden = count === 0;
}

function gameHeader(game) {
  return `<a href="#/" class="back-link">← Все игры</a><div class="play-heading"><h1>${game.title}</h1><div class="play-heading-actions"><button type="button" class="button button-secondary" id="new-game">${game.newLabel || 'Новая игра'}</button><div class="help-control"><button class="icon-button" type="button" id="help-button" aria-label="Как играть" aria-expanded="false" aria-controls="help-popover">${controlIcon('help')}</button><section class="help-popover" id="help-popover" aria-label="Правила игры" hidden><h2>Как играть</h2><p id="game-instruction">${game.instruction}</p><p class="help-keyboard">${game.keyboard}</p><p class="save-note" id="save-note"></p></section></div></div></div>`;
}

function bindHelp() {
  const helpControl = main.querySelector('.help-control');
  helpControl.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') setHelpOpen(true); });
  helpControl.addEventListener('pointerleave', () => { if (!current.helpPinned && !helpControl.contains(document.activeElement)) setHelpOpen(false); });
  helpControl.addEventListener('focusin', () => setHelpOpen(true));
  helpControl.addEventListener('focusout', event => { if (!helpControl.contains(event.relatedTarget)) { current.helpPinned = false; setHelpOpen(false); } });
  main.querySelector('#help-button').addEventListener('click', () => { current.helpPinned = !current.helpPinned; setHelpOpen(current.helpPinned); });
}

function renderExperience(game) {
  document.title = `${game.title} — Marshal Games`;
  main.className = `wrap play-page experience-page theme-${game.id}`;
  current = { game, helpPinned: false };
  main.innerHTML = `${gameHeader(game)}<div id="game-host" class="experience-host"></div>`;
  main.querySelector('#save-note').hidden = true;
  current.controller = game.mount(main.querySelector('#game-host'), { announce });
  main.querySelector('#new-game').addEventListener('click', () => current.controller.restart());
  bindHelp();
}

function persist() {
  if (!current) return;
  const saved = saveGame(current.game, current.level, current.state);
  const note = main.querySelector('#save-note');
  if (note) note.textContent = saved ? 'Прогресс сохраняется в этом браузере' : 'Сохранение недоступно. Можно играть, пока открыта страница.';
}

function renderPlay(game) {
  const saved = loadGame(game);
  const level = saved?.level || game.defaultLevel;
  const resume = saved && hasProgress(game, saved.state);
  current = { game, level, state: resume ? saved.state : game.create(level, Math.random, saved?.state?.initial), hint: null, helpPinned: false };
  document.title = `${game.title} — Marshal Games`;
  main.className = `wrap play-page theme-${game.id}`;
  main.innerHTML = `${gameHeader(game)}
    <div class="play-layout"><section class="game-stage" aria-label="Игровое поле">
      <div class="game-toolbar"><div class="levels" role="group" aria-label="Размер поля">${game.levels.map(item => `<button type="button" data-level="${item.id}" aria-pressed="${item.id === level}">${item.label}</button>`).join('')}</div><div class="game-stats"><span><strong id="move-count">0</strong> <span>${game.id === 'pairs' ? 'попыток' : 'ходов'}</span></span><span><strong id="progress-count">0</strong> <span id="progress-label"></span></span></div></div>
      <div class="board-wrap"><div class="board-area"><div class="board board-${game.id}" id="board" role="group" aria-label="${game.title}" aria-describedby="game-instruction"></div>
      <section class="game-result" id="game-result" aria-labelledby="result-title" hidden><div class="result-panel"><h2 id="result-title">${game.victory}</h2><p id="result-description"></p><button class="button button-primary" id="play-again" type="button">Новая игра ${arrow}</button></div></section></div></div>
      <div class="board-actions"><button class="icon-button" id="restart-game" type="button" title="Начать заново" aria-label="Начать заново">${controlIcon('restart')}</button>${game.undo ? `<button class="icon-button" id="undo-move" type="button" title="Отменить ход" aria-label="Отменить ход">${controlIcon('undo')}</button>` : ''}${game.hint ? `<button class="icon-button" id="hint" type="button" title="Подсказка" aria-label="Подсказка">${controlIcon('hint')}</button>` : ''}</div>
    </section></div>
    <dialog id="confirm-dialog" class="confirm-dialog" aria-labelledby="confirm-title"><form method="dialog"><span class="dialog-symbol" aria-hidden="true">↻</span><h2 id="confirm-title">Начать заново?</h2><p id="confirm-description"></p><div class="dialog-actions"><button class="button button-secondary" value="cancel">Продолжить игру</button><button class="button button-primary" id="confirm-action" value="confirm">Начать</button></div></form></dialog>`;

  main.querySelector('#new-game').addEventListener('click', () => confirmChange('Текущее поле будет заменено новым.', () => startNew(current.level)));
  main.querySelector('#restart-game').addEventListener('click', () => confirmChange('Ходы сбросятся, а раскладка останется той же.', () => {
    clearPending();
    current.state = game.restart(current.state);
    current.hint = null;
    updateBoard(true);
    announce('Начальная раскладка восстановлена');
  }));
  main.querySelector('#play-again').addEventListener('click', () => startNew(current.level));
  main.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.level !== current.level) confirmChange('Откроется новое поле выбранного размера.', () => startNew(button.dataset.level));
  }));
  main.querySelector('#undo-move')?.addEventListener('click', () => {
    clearPending();
    current.state = game.undo(current.state);
    current.hint = null;
    updateBoard();
    announce('Последний ход отменён');
  });
  main.querySelector('#hint')?.addEventListener('click', () => {
    clearTimeout(hintTimer);
    current.hint = game.hint(current.state);
    updateBoard();
    if (Number.isInteger(current.hint)) announce(`Подсказка: строка ${Math.floor(current.hint / current.state.size) + 1}, столбец ${current.hint % current.state.size + 1}`);
    hintTimer = setTimeout(() => { if (current) { current.hint = null; updateBoard(); } }, 5000);
  });
  main.querySelector('#board').addEventListener('click', event => {
    const cell = event.target.closest('[data-cell]');
    if (cell) makeMove(Number(cell.dataset.cell));
  });
  main.querySelector('#board').addEventListener('keydown', onBoardKey);
  bindHelp();
  updateBoard(true);
  scheduleSettle();
}

function setHelpOpen(open) {
  const popover = main.querySelector('#help-popover');
  if (!popover) return;
  popover.hidden = !open;
  main.querySelector('#help-button').setAttribute('aria-expanded', String(open));
}

function confirmChange(description, action) {
  if ((!current.state.moves && !current.state.open?.length) || current.game.won(current.state)) { action(); return; }
  const dialog = main.querySelector('#confirm-dialog');
  main.querySelector('#confirm-description').textContent = description;
  dialog.addEventListener('close', () => { if (dialog.returnValue === 'confirm') action(); }, { once: true });
  dialog.returnValue = '';
  dialog.showModal();
}

function clearPending() {
  clearTimeout(settleTimer);
  clearTimeout(hintTimer);
}

function startNew(level) {
  clearPending();
  current.level = level;
  current.state = current.game.create(level, Math.random, current.state.initial);
  current.hint = null;
  main.querySelectorAll('[data-level]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.level === level)));
  updateBoard(true);
  announce('Новое поле готово');
}

function scheduleSettle() {
  clearTimeout(settleTimer);
  if (current?.game.id === 'pairs' && current.state.open.length === 2) {
    const session = current;
    settleTimer = setTimeout(() => {
      if (current !== session) return;
      current.state = pairs.settle(current.state);
      updateBoard();
    }, 950);
  }
}

function makeMove(index) {
  if (!current || current.game.won(current.state)) return;
  const { game, state } = current;
  const next = game.move(state, index);
  if (next === state) return;
  current.state = next;
  current.hint = null;
  updateBoard();
  if (game.id === 'pairs' && next.open.length === 2) announce('Разные знаки. Попробуй ещё');
  if (game.id === 'pairs' && next.found.length > state.found.length) announce('Пара найдена');
  scheduleSettle();
  if (game.won(next)) {
    announce(`${game.victory} ${game.id === 'pairs' ? 'Попыток' : 'Ходов'}: ${next.moves}`);
    main.querySelector('#play-again').focus({ preventScroll: true });
  }
}

function updateBoard(rebuild = false) {
  const { game, state } = current;
  const board = main.querySelector('#board');
  const values = state.board || state.deck;
  board.style.setProperty('--size', state.size);
  if (rebuild || board.children.length !== values.length) {
    board.innerHTML = values.map((_, i) => `<button type="button" class="cell" data-cell="${i}" tabindex="${i ? -1 : 0}"></button>`).join('');
  }
  const won = game.won(state);
  board.inert = won;
  const empty = game.id === 'sliding' ? state.board.indexOf(0) : -1;
  [...board.children].forEach((cell, i) => {
    const rowCol = `Строка ${Math.floor(i / state.size) + 1}, столбец ${i % state.size + 1}`;
    if (game.id === 'lights') {
      cell.className = `cell light-cell ${values[i] ? 'is-on' : ''} ${current.hint === i ? 'is-hint' : ''}`;
      cell.innerHTML = '<span class="light-dot" aria-hidden="true"></span>';
      cell.setAttribute('aria-label', `${rowCol}: ${values[i] ? 'горит' : 'погашена'}`);
      cell.setAttribute('aria-pressed', String(Boolean(values[i])));
    } else if (game.id === 'pairs') {
      const matched = state.found.includes(values[i]);
      const open = matched || state.open.includes(i);
      cell.className = `cell pair-cell color-${values[i]} ${open ? 'is-open' : ''} ${matched ? 'is-matched' : ''}`;
      cell.innerHTML = `<span class="pair-back" aria-hidden="true">+</span><span class="pair-face" aria-hidden="true">${symbol(values[i])}</span>`;
      cell.setAttribute('aria-label', `${rowCol}: ${open ? symbolNames[values[i]] : 'закрытая карточка'}${matched ? ', пара найдена' : ''}`);
      cell.setAttribute('aria-pressed', String(open));
      cell.setAttribute('aria-disabled', String(matched || won));
    } else {
      const movable = adjacentIndices(empty, state.size).includes(i);
      cell.className = `cell sliding-cell ${values[i] ? '' : 'is-empty'} ${values[i] === i + 1 ? 'is-correct' : ''} ${movable ? 'is-movable' : ''}`;
      cell.textContent = values[i] || '';
      cell.setAttribute('aria-label', values[i] ? `Плитка ${values[i]}${movable ? ', можно сдвинуть' : ''}` : 'Пустая клетка');
      cell.setAttribute('aria-disabled', String(!movable || won));
    }
    if (game.id !== 'pairs' && game.id !== 'sliding') cell.setAttribute('aria-disabled', String(won));
  });
  main.querySelector('#move-count').textContent = state.moves;
  const progress = game.progress(state);
  main.querySelector('#progress-count').textContent = progress.value;
  main.querySelector('#progress-label').textContent = progress.label;
  const result = main.querySelector('#game-result');
  result.hidden = !won;
  board.classList.toggle('is-won', won);
  main.querySelector('#result-description').textContent = `${game.id === 'pairs' ? 'Попыток' : 'Ходов'}: ${state.moves}`;
  const undo = main.querySelector('#undo-move');
  if (undo) undo.disabled = !state.history.length;
  const hint = main.querySelector('#hint');
  if (hint) hint.disabled = won;
  persist();
}

function onBoardKey(event) {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) || event.ctrlKey || event.metaKey || event.altKey) return;
  const cell = event.target.closest('[data-cell]');
  if (!cell) return;
  event.preventDefault();
  const { game, state } = current;
  const offsets = { ArrowUp: -state.size, ArrowDown: state.size, ArrowLeft: -1, ArrowRight: 1 };
  if (game.id === 'sliding') {
    const empty = state.board.indexOf(0);
    const target = empty + offsets[event.key];
    if (adjacentIndices(empty, state.size).includes(target)) {
      makeMove(target);
      if (!game.won(current.state)) focusCell(target);
    }
    return;
  }
  const index = Number(cell.dataset.cell);
  let target = index + offsets[event.key];
  const length = (state.board || state.deck).length;
  if (event.key === 'ArrowLeft' && index % state.size === 0 || event.key === 'ArrowRight' && index % state.size === state.size - 1) return;
  if (target >= 0 && target < length) focusCell(target);
}

function focusCell(index) {
  main.querySelectorAll('[data-cell]').forEach(cell => { cell.tabIndex = Number(cell.dataset.cell) === index ? 0 : -1; });
  main.querySelector(`[data-cell="${index}"]`)?.focus({ preventScroll: true });
}

function route() {
  clearPending();
  current?.controller?.destroy();
  const match = /^#\/play\/([a-z]+)$/.exec(location.hash);
  const game = match && games.find(item => item.id === match[1]);
  if (game?.mount) renderExperience(game);
  else if (game) renderPlay(game);
  else renderHome();
  if (navigating) {
    if (location.hash === '#games') main.querySelector('#games')?.scrollIntoView({ behavior: 'instant' });
    else { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }
  navigating = true;
}

document.querySelector('#random-game').addEventListener('click', () => {
  const choices = games.filter(game => game.id !== current?.game.id);
  location.hash = `/play/${choices[Math.floor(Math.random() * choices.length)].id}`;
});
window.addEventListener('hashchange', route);
document.addEventListener('pointerdown', event => {
  const help = main.querySelector('.help-control');
  if (help && !help.contains(event.target)) { current.helpPinned = false; setHelpOpen(false); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && main.querySelector('#help-popover:not([hidden])')) {
    current.helpPinned = false;
    main.querySelector('#help-button').focus();
    setHelpOpen(false);
  }
});
route();
