import { createWords, submitWord, nextWord, hintWord, availableLetters, normalizeWord } from './words-model.js';
import { controlIcon, arrow } from '../symbols.js';

export const words={
  id:'words',title:'Словосбор',category:'words',tag:'Слова',theme:'words',newLabel:'Новая серия',
  instruction:'Собери слово по определению из предложенных букв. Можно печатать ответ или нажимать на буквы. Кнопка с лампочкой подставляет следующую правильную букву. В серии десять разных слов.',
  keyboard:'Вводи ответ русскими буквами. Enter — проверить, Backspace — удалить букву. Ё и Е считаются одинаковыми.',
  preview:'<svg viewBox="0 0 100 80"><rect x="4" y="5" width="92" height="70" rx="7" fill="#efe5d6"/><g fill="#fffaf2" stroke="#cbb897"><rect x="14" y="28" width="23" height="27" rx="4"/><rect x="39" y="20" width="23" height="27" rx="4"/><rect x="64" y="28" width="23" height="27" rx="4"/></g><g font-family="sans-serif" font-size="17" text-anchor="middle" fill="#806344"><text x="25" y="48">А</text><text x="50" y="40">Б</text><text x="75" y="48">В</text></g></svg>',
  mount(host,{announce}){
    const events=new AbortController();let state=createWords();
    host.innerHTML=`<section class="word-stage"><div class="word-toolbar"><span>Слова <strong id="word-progress"></strong></span><button type="button" class="icon-button" id="word-hint" aria-label="Открыть букву" title="Открыть букву">${controlIcon('hint')}</button></div><div class="word-area"><div id="word-content"></div><section class="game-result" id="word-result" hidden aria-label="Серия завершена"><div class="result-panel"><h2>Серия завершена</h2><p>10 из 10 слов</p><button class="button button-primary" id="words-again" type="button">Новая серия ${arrow}</button></div></section></div></section>`;
    function render(){
      const item=state.items[state.index];
      host.querySelector('#word-content').innerHTML=`<p class="word-clue">${item.clue}</p>
        <form class="word-form" autocomplete="off"><label class="sr-only" for="word-answer">Ответ</label>
        <input id="word-answer" type="text" inputmode="text" maxlength="${item.word.length}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ответ" aria-describedby="word-feedback">
        <div class="letter-bank">${state.letters.map((char,i)=>`<button type="button" class="letter-key" data-letter="${i}" aria-label="Буква ${char.toLocaleUpperCase('ru')}">${char.toLocaleUpperCase('ru')}</button>`).join('')}</div>
        <p class="word-feedback" id="word-feedback" role="status"></p>
        <div class="word-action-row"><button type="button" class="letter-backspace" id="word-backspace" aria-label="Удалить букву" title="Удалить букву">⌫</button><button class="button button-primary" id="word-submit" type="submit">Проверить</button><button class="button button-primary" id="word-next" type="button" hidden>Следующее ${arrow}</button></div></form>`;
      sync();
    }
    function sync(){
      const input=host.querySelector('#word-answer');input.value=state.answer.toLocaleUpperCase('ru');input.disabled=state.status!=='playing';
      const available=availableLetters(state);host.querySelectorAll('[data-letter]').forEach(button=>{button.disabled=state.status!=='playing'||!available[Number(button.dataset.letter)];});
      host.querySelector('#word-progress').textContent=`${state.solved}/10`;
      host.querySelector('#word-feedback').textContent=state.message;
      host.querySelector('#word-submit').hidden=state.status!=='playing';host.querySelector('#word-next').hidden=state.status!=='between';
      host.querySelector('#word-hint').disabled=state.status!=='playing';host.querySelector('#word-backspace').hidden=state.status!=='playing';host.querySelector('#word-backspace').disabled=!state.answer.length;
      host.querySelector('#word-result').hidden=state.status!=='won';
    }
    host.addEventListener('input',event=>{if(event.target.id==='word-answer'){state.answer=normalizeWord(event.target.value).slice(0,state.items[state.index].word.length);state.message='';sync();}},{signal:events.signal});
    host.addEventListener('submit',event=>{event.preventDefault();if(submitWord(state)){announce(state.status==='won'?'Серия завершена':'Верно');sync();host.querySelector(state.status==='won'?'#words-again':'#word-next').focus({preventScroll:true});}else sync();},{signal:events.signal});
    host.addEventListener('click',event=>{
      const letter=event.target.closest('[data-letter]');
      if(letter&&!letter.disabled){state.answer+=state.letters[Number(letter.dataset.letter)];state.message='';sync();}
      else if(event.target.closest('#word-backspace')){state.answer=state.answer.slice(0,-1);state.message='';sync();}
      else if(event.target.closest('#word-hint')){hintWord(state);sync();}
      else if(event.target.closest('#word-next')){nextWord(state);render();}
      else if(event.target.closest('#words-again'))restart();
    },{signal:events.signal});
    function restart(){state=createWords();render();}
    render();return{restart,destroy(){events.abort();}};
  },
};
