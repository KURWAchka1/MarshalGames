const PREFIX = 'marshal-games:v1:';

export function loadGame(game) {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFIX + game.id));
    if (saved?.version === 1 && game.levels.some(item => item.id === saved.level) && game.valid(saved.state, saved.level)) return saved;
  } catch { /* Corrupt or unavailable storage must never prevent playing. */ }
  return null;
}

export function saveGame(game, level, state) {
  try {
    localStorage.setItem(PREFIX + game.id, JSON.stringify({ version: 1, level, state }));
    return true;
  } catch { return false; }
}
