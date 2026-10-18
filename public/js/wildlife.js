export const wildlifeNames=['Лиса','Рысь','Сипуха','Белка','Ворон','Барсук','Заяц','Ёж','Олень','Куница','Волк','Зимородок'];
export function wildlifeArt(index){return `<span class="wildlife-art" style="--animal-x:${index%4*100/3}%;--animal-y:${Math.floor(index/4)*50}%" aria-hidden="true"></span>`;}
