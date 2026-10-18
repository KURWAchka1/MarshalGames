export const wildlifeNames=['Лиса','Рысь','Сипуха','Белка','Ворон','Барсук','Заяц','Ёж','Олень','Куница','Волк','Зимородок'];
const wildlifeFiles=['fox','lynx','owl','squirrel','raven','badger','hare','hedgehog','deer','marten','wolf','kingfisher'];
export function wildlifeArt(index){const src=new URL(`../assets/games/wildlife/${wildlifeFiles[index]}.webp`,import.meta.url);return `<img class="wildlife-art" src="${src}" alt="" draggable="false" aria-hidden="true">`;}
