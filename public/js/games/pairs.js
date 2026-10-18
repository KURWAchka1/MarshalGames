export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const pairs = {
  id: 'pairs', title: 'Найди пару', category: 'memory', tag: 'Память', theme: 'pairs',
  description: 'Иллюстрированный лесной атлас на память.',
  instruction: 'Открывай по две карточки и находи одинаковых животных. Совпавшая пара останется открытой. Постарайся запомнить остальные.',
  preview:'<div class="specimen-preview"><i></i><span class="wildlife-art" style="--animal-x:0%;--animal-y:0%"></span><span class="wildlife-art" style="--animal-x:66.6667%;--animal-y:0%"></span></div>',
  keyboard: 'Стрелки — выбор карточки. Enter или пробел — открыть.',
  levels: [{ id: 'easy', label: '6 пар', count: 6, size: 4 }, { id: 'normal', label: '8 пар', count: 8, size: 4 }, { id: 'hard', label: '10 пар', count: 10, size: 5 }],
  defaultLevel: 'normal',
  create(level, random = Math.random) {
    const { size, count } = this.levels.find(item => item.id === level);
    const values = Array.from({ length: count }, (_, i) => i);
    return { size, deck: shuffle([...values, ...values], random), found: [], open: [], moves: 0 };
  },
  valid(state, level) {
    const spec = this.levels.find(item => item.id === level);
    if (!spec || state?.size !== spec.size || !Array.isArray(state.deck) || state.deck.length !== spec.count * 2) return false;
    if (!state.deck.every(value => Number.isInteger(value) && value >= 0 && value < spec.count)) return false;
    if (!Array.from({ length: spec.count }, (_, i) => i).every(value => state.deck.filter(x => x === value).length === 2)) return false;
    return Number.isSafeInteger(state.moves) && state.moves >= 0 &&
      Array.isArray(state.found) && new Set(state.found).size === state.found.length &&
      state.found.every(x => Number.isInteger(x) && x >= 0 && x < spec.count) &&
      Array.isArray(state.open) && state.open.length <= 2 && new Set(state.open).size === state.open.length &&
      state.open.every(i => Number.isInteger(i) && i >= 0 && i < state.deck.length && !state.found.includes(state.deck[i])) &&
      (state.open.length < 2 || state.deck[state.open[0]] !== state.deck[state.open[1]]);
  },
  move(state, index) {
    if (!Number.isInteger(index) || index < 0 || index >= state.deck.length || state.open.length === 2 || state.open.includes(index) || state.found.includes(state.deck[index])) return state;
    const open = [...state.open, index];
    if (open.length === 1) return { ...state, open };
    if (state.deck[open[0]] === state.deck[open[1]]) return { ...state, found: [...state.found, state.deck[index]], open: [], moves: state.moves + 1 };
    return { ...state, open, moves: state.moves + 1 };
  },
  settle: state => ({ ...state, open: [] }),
  restart: state => ({ ...state, found: [], open: [], moves: 0 }),
  won: state => state.found.length === state.deck.length / 2,
  progress: state => ({ value: `${state.found.length}/${state.deck.length / 2}`, label: 'пар' }),
  victory: 'Все пары найдены',
};
