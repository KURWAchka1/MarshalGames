import test from 'node:test';
import assert from 'node:assert/strict';
import { createDuel,playDuelCard,endDuelTurn,chooseDuelCard,canPlayDuel } from '../public/js/games/duel-model.js';
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};}

test('duel enforces energy, shields, and turn ownership',()=>{
  const s=createDuel();s.player.hand=['strike','guard','heavy'];s.opponent.shield=4;
  assert.equal(playDuelCard(s,'opponent',0),false);assert.equal(playDuelCard(s,'player',0),true);
  assert.equal(s.opponent.hp,22);assert.equal(s.opponent.shield,0);assert.equal(s.player.energy,1);
  assert.equal(playDuelCard(s,'player',0),true);assert.equal(s.player.shield,5);assert.equal(s.player.energy,0);assert.equal(playDuelCard(s,'player',0),false);
});
test('duel boosts are consumed by attacks, piercing bypasses shields, and poison ticks on turn start',()=>{
  const s=createDuel();s.player.hand=['focus','jab'];playDuelCard(s,'player',0);playDuelCard(s,'player',0);assert.equal(s.opponent.hp,18);assert.equal(s.player.boost,0);
  s.player.energy=3;s.player.hand=['pierce'];s.opponent.shield=8;playDuelCard(s,'player',0);assert.equal(s.opponent.hp,13);assert.equal(s.opponent.shield,8);
  s.player.energy=3;s.player.hand=['poison'];playDuelCard(s,'player',0);endDuelTurn(s);assert.equal(s.opponent.hp,11);assert.equal(s.opponent.poison,1);assert.equal(s.opponent.shield,0);
});
test('duel healing and guard caps are safe and lethal damage ends play',()=>{
  const s=createDuel();s.player.hand=['heal'];assert.equal(canPlayDuel(s,'player',0),false);s.player.hp=22;playDuelCard(s,'player',0);assert.equal(s.player.hp,24);
  s.player.energy=3;s.player.hand=['guard'];s.player.shield=10;playDuelCard(s,'player',0);assert.equal(s.player.shield,12);
  s.player.energy=3;s.player.hand=['heavy'];s.opponent.hp=3;playDuelCard(s,'player',0);assert.equal(s.status,'won');assert.equal(s.opponent.hp,0);assert.equal(playDuelCard(s,'player',0),false);
});
test('duel AI plays legal actions and fifty simulated matches finish without invalid state',()=>{
  for(let seed=1;seed<=50;seed++){
    const random=seeded(seed),s=createDuel(random);let turns=0;
    while(s.status==='playing'&&turns<160){let actions=0;while(actions<3){const index=chooseDuelCard(s);if(index<0)break;assert.equal(playDuelCard(s,s.turn,index),true);actions++;}if(s.status==='playing')endDuelTurn(s,random);turns++;
      for(const side of ['player','opponent']){assert.ok(s[side].energy>=0&&s[side].energy<=3);assert.ok(s[side].hp>=0&&s[side].hp<=24);assert.ok(s[side].hand.length<=5);assert.ok(s[side].shield<=12);}
    }
    assert.notEqual(s.status,'playing',`unfinished seed ${seed}`);assert.ok(s.log.length<=60);
  }
});
