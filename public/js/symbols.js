const paths = [
  '<path d="m20 3 4.4 12.6L37 20l-12.6 4.4L20 37l-4.4-12.6L3 20l12.6-4.4Z"/>',
  '<circle cx="20" cy="20" r="10"/><path d="M18 1h4v6h-4zM18 33h4v6h-4zM1 18h6v4H1zM33 18h6v4h-6zM5 7l3-3 5 5-3 3zM27 30l3-3 5 5-3 3zM4 32l5-5 3 3-5 5zM27 9l5-5 3 3-5 5z"/>',
  '<path d="M20 2S7 17 7 25a13 13 0 0 0 26 0C33 17 20 2 20 2Z"/>',
  '<path d="M31 5A17 17 0 1 0 35 31 16 16 0 0 1 31 5Z"/>',
  '<path d="m23 2-16 21h11l-2 15 17-22H22Z"/>',
  '<path fill-rule="evenodd" d="M20 3a17 17 0 1 1 0 34 17 17 0 0 1 0-34Zm0 8a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/>',
  '<path d="M2 9c9-9 16 9 25 0 4-4 8-3 11-1v8c-8-7-15 9-25 0-4-4-8-3-11-1Zm0 17c9-9 16 9 25 0 4-4 8-3 11-1v8c-8-7-15 9-25 0-4-4-8-3-11-1Z"/>',
  '<path d="M20 1c7 0 7 10 7 10s10-3 12 4-8 11-8 11 6 8 0 12-11-6-11-6-5 10-11 6 0-12 0-12S-1 22 1 15s12-4 12-4S13 1 20 1Z"/>',
  '<path d="M20 3 39 36H1Z"/>',
  '<path d="M20 36 5 21C-8 7 10-4 20 10 30-4 48 7 35 21Z"/>',
];

export const symbolNames = ['звезда', 'солнце', 'капля', 'луна', 'молния', 'кольцо', 'волны', 'цветок', 'треугольник', 'сердце'];
export const symbol = index => `<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true" focusable="false">${paths[index]}</svg>`;
export const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const controlPaths = {
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 0 1 4.9.7c0 1.8-2.5 1.9-2.5 3.8m0 2.5h.01"/>',
  restart: '<path d="M3 11a9 9 0 1 1 2.8 7M3 4v7h7"/>',
  undo: '<path d="m8 5-5 5 5 5M3 10h11a6 6 0 0 1 0 12" transform="translate(0 -2)"/>',
  hint: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
};
export const controlIcon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${controlPaths[name]}</svg>`;
