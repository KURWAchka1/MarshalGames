import { CARDS,createDuel,playDuelCard,endDuelTurn,chooseDuelCard,canPlayDuel } from './duel-model.js';
import { controlIcon,arrow } from '../symbols.js';

const icons={attack:'<path d="m5 4 14 14m-1-14L4 18M3 13l8 8m2-18 8 8M2 22l4-4m12 0 4 4"/>',guard:'<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z"/>',heal:'<path d="M12 4v16M4 12h16" stroke-width="4"/>',boost:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',poison:'<path d="M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14Z"/><path d="M9 17h6"/>'};
const icon=kind=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[kind]}</svg>`;
export const duel={
  id:'duel',title:'Дуэль',category:'strategy',tag:'Тактика',theme:'duel',newLabel:'Новая дуэль',
  instruction:'Снизь здоровье соперника до нуля. В начале каждого хода у тебя 3 энергии и до пяти карт. Стоимость указана в углу карты. Щит действует до твоего следующего хода, усиление — до следующей атаки. Яд и пробой обходят щит. Соперник играет по тем же правилам.',
  keyboard:'Нажимай на карты, затем заверши ход. Tab — переход между картами, Enter или пробел — сыграть выбранную. История ходов открывается кнопкой с часами.',
  preview:'<svg viewBox="0 0 100 80"><rect x="4" y="5" width="92" height="70" rx="7" fill="#e3e8ed"/><rect x="21" y="19" width="29" height="44" rx="4" fill="#f3d7cb" stroke="#c48b74" transform="rotate(-10 35 40)"/><rect x="49" y="17" width="29" height="44" rx="4" fill="#d0dbe9" stroke="#8398b3" transform="rotate(10 63 40)"/><path d="m28 32 14 16m-13 0 13-16" stroke="#a45a43" stroke-width="2"/><path d="m62 30 8 3v7c0 5-8 9-8 9s-8-4-8-9v-7Z" fill="none" stroke="#5d789d" stroke-width="2"/></svg>',
  mount(host,{announce}){
    const events=new AbortController();let state=createDuel(),timer,destroyed=false;
    function combatant(side){
      const a=state[side],name=side==='player'?'Ты':'Соперник';
      return `<section class="combatant ${side}" aria-label="${name}: ${a.hp} здоровья, ${a.shield} щита"><div class="combatant-name"><span>${name}</span><strong>${a.hp}<small>/24</small></strong></div><div class="health-track"><i style="width:${a.hp/24*100}%"></i></div><div class="combatant-effects">${a.shield?`<span title="Щит">${icon('guard')}${a.shield}</span>`:''}${a.boost?`<span title="Усиление следующей атаки">${icon('boost')}+${a.boost}</span>`:''}${a.poison?`<span title="Осталось ходов с ядом">${icon('poison')}${a.poison}</span>`:''}</div></section>`;
    }
    function render(focusHand=false){
      const historyOpen=host.querySelector('details')?.open;
      const ended=state.status!=='playing';
      host.innerHTML=`<section class="duel-stage"><div class="duel-status"><span>${state.turn==='player'?'Твой ход':'Ход соперника'}</span><span>Раунд ${state.round}</span></div><div class="duel-field"><div class="duel-combatants">${combatant('opponent')}${combatant('player')}</div><p class="duel-last-action" role="status">${state.log.at(-1)||''}</p><div class="duel-hand" role="group" aria-label="Карты в руке">${state.player.hand.map((id,index)=>{const card=CARDS[id];return `<button type="button" class="duel-card card-${card.kind}" data-card="${index}" ${canPlayDuel(state,'player',index)?'':'disabled'} aria-label="${card.name}, ${card.effect}, стоимость ${card.cost}" title="${card.description}"><span class="card-energy" aria-label="Энергия">${card.cost}</span><span class="duel-card-symbol">${icon(card.kind)}</span><strong>${card.name}</strong><span class="duel-card-effect">${card.effect}</span></button>`;}).join('')}</div><section class="game-result" id="duel-result" ${ended?'':'hidden'} aria-label="Результат дуэли"><div class="result-panel"><h2>${state.status==='won'?'Победа':'Поражение'}</h2><p>Раундов: ${state.round}</p><button type="button" class="button button-primary" id="duel-again">Новая дуэль ${arrow}</button></div></section></div><div class="duel-actions"><span class="duel-energy" aria-label="Энергия ${state.player.energy} из 3">${[0,1,2].map(i=>`<i class="${i<state.player.energy?'full':''}"></i>`).join('')}<small>Энергия</small></span><div class="duel-action-buttons"><details class="duel-history" ${historyOpen?'open':''}><summary class="icon-button" aria-label="История ходов" title="История ходов">${controlIcon('history')}</summary><div>${(state.log.length?state.log:['Ходов пока нет']).map(line=>`<p>${line}</p>`).join('')}</div></details><button type="button" class="button button-primary" id="end-turn" ${state.turn==='player'&&!ended?'':'disabled'}>Завершить ход</button></div></div></section>`;
      if(ended)host.querySelector('#duel-again').focus({preventScroll:true});
      else if(focusHand)(host.querySelector('[data-card]:not(:disabled)')||host.querySelector('#end-turn')).focus({preventScroll:true});
    }
    function runAI(){
      if(destroyed||document.hidden||state.turn!=='opponent'||state.status!=='playing')return;
      const index=chooseDuelCard(state,'opponent');
      if(index>=0){playDuelCard(state,'opponent',index);render();if(state.status==='playing')timer=setTimeout(runAI,450);else announce(state.status==='won'?'Победа':'Поражение');}
      else{endDuelTurn(state);render();announce(state.status==='playing'?'Твой ход':state.status==='won'?'Победа':'Поражение');}
    }
    host.addEventListener('click',event=>{
      const card=event.target.closest('[data-card]');
      if(card&&!card.disabled){if(playDuelCard(state,'player',Number(card.dataset.card))){render(true);if(state.status!=='playing')announce('Победа');}}
      else if(event.target.closest('#end-turn')&&state.turn==='player'&&state.status==='playing'){endDuelTurn(state);render();if(state.status==='playing')timer=setTimeout(runAI,600);}
      else if(event.target.closest('#duel-again'))restart();
    },{signal:events.signal});
    document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden&&state.turn==='opponent'&&state.status==='playing')timer=setTimeout(runAI,450);},{signal:events.signal});
    function restart(){clearTimeout(timer);state=createDuel();render();}
    render();return{restart,destroy(){destroyed=true;clearTimeout(timer);events.abort();}};
  },
};
