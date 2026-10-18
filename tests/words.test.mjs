import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS,createWords,submitWord,nextWord,hintWord,availableLetters,normalizeWord } from '../public/js/games/words-model.js';

test('word collection is curated, unique, and every anagram has precisely the answer letters',()=>{
  assert.ok(WORDS.length>=60);assert.equal(new Set(WORDS.map(x=>normalizeWord(x.word))).size,WORDS.length);
  const state=createWords(()=>.99);assert.equal(new Set(state.items.map(x=>x.word)).size,WORDS.length);
  assert.notEqual(state.letters.join(''),state.items[0].word);
  assert.deepEqual([...state.letters].sort(),[...state.items[0].word].sort());
  assert.ok(WORDS.every(x=>x.clue.length>5&&/^[а-яё]+$/i.test(x.word)));
});
test('word answers normalize Ё and Е, duplicate letters are consumed once, and hints reveal a prefix',()=>{
  const state=createWords();state.items[0]={word:'елка',clue:'Дерево'};state.letters=[...'елка'];state.answer='ЁЛКА';
  assert.equal(submitWord(state),true);
  const repeated=createWords();repeated.items[0]={word:'мама',clue:'Родитель'};repeated.letters=[...'мама'];repeated.answer='ма';
  assert.equal(availableLetters(repeated).filter(Boolean).length,2);
  repeated.answer='мк';hintWord(repeated);assert.equal(repeated.answer,'ма');
});
test('words reject errors and continue through multiple full decks without adjacent repeats',()=>{
  const state=createWords();state.answer='неверно';assert.equal(submitWord(state),false);assert.equal(state.solved,0);
  const seen=new Set();let previous='';
  for(let i=0;i<200;i++){const word=state.items[state.index].word;assert.notEqual(word,previous);if(i<WORDS.length)seen.add(word);previous=word;state.answer=word;assert.equal(submitWord(state),true);assert.equal(state.status,'between');assert.equal(submitWord(state),false);nextWord(state,()=>0);}
  assert.equal(seen.size,WORDS.length);assert.equal(state.status,'playing');assert.equal(state.solved,200);assert.equal(state.items.length,WORDS.length);
});
