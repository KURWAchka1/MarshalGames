import { shuffle } from './pairs.js';

export const CARDS={
  jab:{name:'Выпад',cost:1,damage:3,effect:'3 урона',kind:'attack',description:'Наносит 3 урона. Щит поглощает урон первым.'},
  strike:{name:'Удар',cost:2,damage:6,effect:'6 урона',kind:'attack',description:'Наносит 6 урона. Щит поглощает урон первым.'},
  heavy:{name:'Натиск',cost:3,damage:10,effect:'10 урона',kind:'attack',description:'Наносит 10 урона за всю энергию хода.'},
  guard:{name:'Щит',cost:1,shield:5,effect:'+5 щита',kind:'guard',description:'Добавляет 5 щита, максимум 12. Щит исчезает в начале твоего следующего хода.'},
  heal:{name:'Лечение',cost:2,heal:5,effect:'+5 здоровья',kind:'heal',description:'Восстанавливает 5 здоровья, не выше 24.'},
  focus:{name:'Усиление',cost:1,boost:3,effect:'+3 к атаке',kind:'boost',description:'Следующая атака нанесёт на 3 урона больше. Усиление сохраняется до атаки, максимум +9.'},
  pierce:{name:'Пробой',cost:2,damage:5,pierce:true,effect:'5 сквозь щит',kind:'attack',description:'Наносит 5 урона, не расходуя и не учитывая щит соперника.'},
  poison:{name:'Яд',cost:2,poison:2,effect:'2 урона × 2',kind:'poison',description:'Наносит по 2 урона в начале двух следующих ходов соперника, минуя щит. Повторное применение обновляет срок.'},
};
const DECK=[...Array(5).fill('jab'),...Array(4).fill('strike'),...Array(2).fill('heavy'),...Array(4).fill('guard'),...Array(2).fill('heal'),...Array(2).fill('focus'),'pierce',...Array(2).fill('poison')];
const opposite=side=>side==='player'?'opponent':'player';
function draw(actor,random){
  while(actor.hand.length<5){if(!actor.deck.length){if(!actor.discard.length)break;actor.deck=shuffle(actor.discard,random);actor.discard=[];}actor.hand.push(actor.deck.pop());}
}
function actor(random){const value={hp:24,shield:0,boost:0,poison:0,energy:3,deck:shuffle(DECK,random),discard:[],hand:[]};draw(value,random);if(!value.hand.some(id=>CARDS[id].damage)){const i=value.deck.findIndex(id=>CARDS[id].damage);if(i>=0)[value.hand[0],value.deck[i]]=[value.deck[i],value.hand[0]];}return value;}
export function createDuel(random=Math.random){return{status:'playing',turn:'player',round:1,player:actor(random),opponent:actor(random),log:[]};}
function addLog(state,text){state.log.push(text);if(state.log.length>60)state.log.shift();}
function finish(state){if(state.player.hp<=0)state.status='lost';else if(state.opponent.hp<=0)state.status='won';}
export function canPlayDuel(state,side,index){
  const a=state[side],card=CARDS[a?.hand[index]];
  return Boolean(state.status==='playing'&&state.turn===side&&card&&a.energy>=card.cost&&!(card.heal&&a.hp===24)&&!(card.boost&&a.boost>=9)&&!(card.shield&&a.shield>=12)&&!(card.poison&&state[opposite(side)].poison>=2));
}
export function playDuelCard(state,side,index){
  if(!canPlayDuel(state,side,index))return false;
  const a=state[side],target=state[opposite(side)],id=a.hand[index],card=CARDS[id];
  a.energy-=card.cost;a.hand.splice(index,1);a.discard.push(id);
  if(card.damage){let damage=card.damage+a.boost;a.boost=0;if(!card.pierce){const blocked=Math.min(target.shield,damage);target.shield-=blocked;damage-=blocked;}target.hp=Math.max(0,target.hp-damage);}
  if(card.shield)a.shield=Math.min(12,a.shield+card.shield);
  if(card.heal)a.hp=Math.min(24,a.hp+card.heal);
  if(card.boost)a.boost=Math.min(9,a.boost+card.boost);
  if(card.poison)target.poison=2;
  addLog(state,`${side==='player'?'Ты':'Соперник'}: ${card.name}`);finish(state);return true;
}
export function endDuelTurn(state,random=Math.random){
  if(state.status!=='playing')return;
  state.turn=opposite(state.turn);if(state.turn==='player')state.round++;
  const a=state[state.turn];a.shield=0;a.energy=3;
  if(a.poison){a.hp=Math.max(0,a.hp-2);a.poison--;addLog(state,`${state.turn==='player'?'Ты':'Соперник'}: яд, −2 здоровья`);finish(state);}
  if(state.status==='playing')draw(a,random);
}
export function chooseDuelCard(state,side=state.turn){
  if(state.status!=='playing'||state.turn!==side)return -1;
  const a=state[side],target=state[opposite(side)];let best=-1,bestScore=-Infinity;
  a.hand.forEach((id,index)=>{
    if(!canPlayDuel(state,side,index))return;
    const card=CARDS[id];let score=0;
    if(card.damage){const damage=Math.max(0,card.damage+a.boost-(card.pierce?0:target.shield));score=damage*7;if(damage>=target.hp)score+=1000;}
    if(card.heal)score=Math.min(card.heal,24-a.hp)*7+(a.hp<=8?35:0);
    if(card.shield)score=Math.min(card.shield,12-a.shield)*3+(24-a.hp)*1.1-a.shield*2;
    if(card.boost)score=a.hand.some((other,i)=>i!==index&&CARDS[other].damage&&CARDS[other].cost<=a.energy-card.cost)?25:8;
    if(card.poison)score=target.hp>4?27:7;
    if(score>bestScore){bestScore=score;best=index;}
  });return best;
}
