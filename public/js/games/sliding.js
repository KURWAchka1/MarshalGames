export function adjacentIndices(index, size) {
  const result = [];
  if (index >= size) result.push(index - size);
  if (index < size * (size - 1)) result.push(index + size);
  if (index % size > 0) result.push(index - 1);
  if (index % size < size - 1) result.push(index + 1);
  return result;
}

export function isSolvable(board, size) {
  const tiles = board.filter(Boolean);
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (tiles[i] > tiles[j]) inversions++;
  if (size % 2) return inversions % 2 === 0;
  const rowFromBottom = size - Math.floor(board.indexOf(0) / size);
  return (inversions + rowFromBottom) % 2 === 1;
}

export const sliding = {
  id: 'sliding', title: 'Пятнашки', category: 'logic', tag: 'Логика', theme: 'sliding',
  description: 'Расставь числа по порядку.',
  instruction: 'Собери числа по порядку слева направо, сверху вниз. Пустая клетка должна оказаться в правом нижнем углу. Двигать можно только соседнюю с ней плитку.',
  keyboard: 'Стрелки двигают пустую клетку. Или нажимай на соседние плитки.',
  levels: [{ id: 'easy', label: '3 × 3', size: 3, turns: 35 }, { id: 'normal', label: '4 × 4', size: 4, turns: 90 }],
  defaultLevel: 'easy',
  create(level, random = Math.random) {
    const { size, turns } = this.levels.find(item => item.id === level);
    const board = Array.from({ length: size * size }, (_, i) => (i + 1) % (size * size));
    let empty = board.length - 1;
    let previous = -1;
    for (let i = 0; i < turns; i++) {
      const options = adjacentIndices(empty, size).filter(index => index !== previous);
      const index = options[Math.floor(random() * options.length)];
      [board[empty], board[index]] = [board[index], board[empty]];
      previous = empty;
      empty = index;
    }
    if (board.every((value, i) => value === (i + 1) % board.length)) {
      const index = adjacentIndices(empty, size)[0];
      [board[empty], board[index]] = [board[index], board[empty]];
    }
    return { size, board, initial: [...board], moves: 0, history: [] };
  },
  valid(state, level) {
    const size = this.levels.find(item => item.id === level)?.size;
    if (!size || !state) return false;
    const boardValid = board => Array.isArray(board) && board.length === size * size && new Set(board).size === board.length && board.every(x => Number.isInteger(x) && x >= 0 && x < board.length) && isSolvable(board, size);
    return state?.size === size && boardValid(state.board) && boardValid(state.initial) &&
      Number.isSafeInteger(state.moves) && state.moves >= 0 &&
      Array.isArray(state.history) && state.history.length <= state.moves && state.history.length <= 200 &&
      state.history.every(i => Number.isInteger(i) && i >= 0 && i < size * size);
  },
  move(state, index) {
    const empty = state.board.indexOf(0);
    if (this.won(state) || !adjacentIndices(empty, state.size).includes(index)) return state;
    const board = [...state.board];
    [board[empty], board[index]] = [board[index], board[empty]];
    return { ...state, board, moves: state.moves + 1, history: [...state.history, empty].slice(-200) };
  },
  undo(state) {
    if (!state.history.length) return state;
    const board = [...state.board];
    const empty = board.indexOf(0);
    const index = state.history.at(-1);
    if (!adjacentIndices(empty, state.size).includes(index)) return state;
    [board[empty], board[index]] = [board[index], board[empty]];
    return { ...state, board, moves: state.moves - 1, history: state.history.slice(0, -1) };
  },
  restart: state => ({ ...state, board: [...state.initial], moves: 0, history: [] }),
  won: state => state.board.every((value, i) => value === (i + 1) % state.board.length),
  progress: state => ({ value: state.board.filter((value, i) => value && value === i + 1).length, label: 'на месте' }),
  victory: 'Пятнашки собраны',
};
