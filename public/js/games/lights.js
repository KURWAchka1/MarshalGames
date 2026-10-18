export function toggleLights(board, index, size) {
  const next = [...board];
  const row = Math.floor(index / size);
  const col = index % size;
  for (const [dr, dc] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < size && c >= 0 && c < size) next[r * size + c] ^= 1;
  }
  return next;
}

// Gaussian elimination over GF(2). Free variables are enumerated to prefer a short solution.
export function solveLights(board, size) {
  const n = size * size;
  const rows = Array.from({ length: n }, (_, i) => {
    const row = new Uint8Array(n + 1);
    const influence = toggleLights(Array(n).fill(0), i, size);
    row.set(influence);
    row[n] = board[i];
    return row;
  });
  const pivots = [];
  let rank = 0;
  for (let col = 0; col < n; col++) {
    const found = rows.findIndex((row, i) => i >= rank && row[col] === 1);
    if (found < 0) continue;
    [rows[rank], rows[found]] = [rows[found], rows[rank]];
    for (let i = 0; i < n; i++) {
      if (i !== rank && rows[i][col]) {
        for (let j = col; j <= n; j++) rows[i][j] ^= rows[rank][j];
      }
    }
    pivots.push(col);
    rank++;
  }
  if (rows.slice(rank).some(row => row[n])) return null;
  const free = Array.from({ length: n }, (_, i) => i).filter(i => !pivots.includes(i));
  let best = null;
  for (let mask = 0; mask < 2 ** free.length; mask++) {
    const solution = Array(n).fill(0);
    free.forEach((col, i) => { solution[col] = (mask >> i) & 1; });
    for (let r = rank - 1; r >= 0; r--) {
      let value = rows[r][n];
      for (const col of free) value ^= rows[r][col] & solution[col];
      solution[pivots[r]] = value;
    }
    const indices = solution.flatMap((value, i) => value ? [i] : []);
    if (!best || indices.length < best.length) best = indices;
  }
  return best;
}

export const lights = {
  id: 'lights', title: 'Погаси свет', category: 'logic', tag: 'Логика', theme: 'lights',
  description: 'Погаси поле, переключая соседние клетки.',
  instruction: 'Нажимай на клетки, чтобы погасить всё поле. Каждый ход переключает выбранную клетку и соседей сверху, снизу, слева и справа.',
  keyboard: 'Стрелки — выбор клетки. Enter или пробел — ход.',
  levels: [{ id: 'easy', label: '3 × 3', size: 3 }, { id: 'normal', label: '4 × 4', size: 4 }, { id: 'hard', label: '5 × 5', size: 5 }],
  defaultLevel: 'normal',
  create(level, random = Math.random) {
    const size = this.levels.find(item => item.id === level).size;
    let board = Array(size * size).fill(0);
    for (let i = 0; i < size * size; i++) if (random() < 0.5) board = toggleLights(board, i, size);
    if (!board.some(Boolean)) board = toggleLights(board, Math.floor(random() * board.length), size);
    return { size, board, initial: [...board], moves: 0, history: [] };
  },
  valid(state, level) {
    const size = this.levels.find(item => item.id === level)?.size;
    if (!size || !state) return false;
    const boardValid = board => Array.isArray(board) && board.length === size * size && board.every(x => x === 0 || x === 1);
    return state?.size === size && boardValid(state.board) && boardValid(state.initial) &&
      state.initial.some(Boolean) && Number.isSafeInteger(state.moves) && state.moves >= 0 &&
      Array.isArray(state.history) && state.history.length <= state.moves && state.history.length <= 200 &&
      state.history.every(i => Number.isInteger(i) && i >= 0 && i < size * size) &&
      solveLights(state.board, size) !== null && solveLights(state.initial, size) !== null;
  },
  move(state, index) {
    if (!Number.isInteger(index) || index < 0 || index >= state.board.length || this.won(state)) return state;
    return { ...state, board: toggleLights(state.board, index, state.size), moves: state.moves + 1, history: [...state.history, index].slice(-200) };
  },
  undo(state) {
    if (!state.history.length) return state;
    return { ...state, board: toggleLights(state.board, state.history.at(-1), state.size), moves: state.moves - 1, history: state.history.slice(0, -1) };
  },
  restart(state) { return { ...state, board: [...state.initial], moves: 0, history: [] }; },
  won: state => !state.board.some(Boolean),
  hint: state => solveLights(state.board, state.size)?.[0],
  progress: state => ({ value: state.board.filter(Boolean).length, label: 'горит' }),
  victory: 'Поле погашено',
};
