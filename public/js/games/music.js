import { createSynth } from '../synth.js';
import { KEY_CODES,WHITE_OFFSETS,BLACK_KEYS,keyboardMidi,noteLabel,normalizeRecording } from './music-model.js';
import { startPlayback } from './music-playback.js';
import { controlIcon } from '../symbols.js';

const SAVE_KEY='marshal-games:music-recording:v1';
export const music={
  id:'music',title:'Клавиши',category:'music',tag:'Музыка',theme:'music',newLabel:'Остановить',
  instruction:'Играй на клавишах, выбирай тембр и октаву. Круглая кнопка начинает запись, повторное нажатие завершает её. Треугольник воспроизводит запись. Запись длится до 30 секунд и сохраняется в этом браузере. Несколько клавиш можно нажимать одновременно.',
  keyboard:'Белые клавиши: A S D F G H J K. Чёрные: W E T Y U. Работает и в русской раскладке. Escape останавливает звук. На телефоне можно играть несколькими пальцами.',
  preview:'<svg viewBox="0 0 100 80"><rect x="4" y="5" width="92" height="70" rx="7" fill="#343b48"/><rect x="14" y="16" width="72" height="10" rx="2" fill="#b9d5c8"/><g fill="#fffaf0" stroke="#9c9b96"><rect x="14" y="33" width="12" height="31"/><rect x="26" y="33" width="12" height="31"/><rect x="38" y="33" width="12" height="31"/><rect x="50" y="33" width="12" height="31"/><rect x="62" y="33" width="12" height="31"/><rect x="74" y="33" width="12" height="31"/></g><g fill="#303746"><rect x="21" y="33" width="8" height="19"/><rect x="33" y="33" width="8" height="19"/><rect x="57" y="33" width="8" height="19"/><rect x="69" y="33" width="8" height="19"/></g></svg>',
  mount(host,{announce}){
    const events=new AbortController(),held=new Map(),pointers=new Set(),playNotes=new Map(),timers=new Set();
    let octave=4,instrument='soft',recording=false,recordStart=0,recorded=[],saved=[],playing=false,playback,frame,destroyed=false;
    const recordHeld=new Map();
    try{saved=normalizeRecording(JSON.parse(localStorage.getItem(SAVE_KEY)));}catch{}
    host.innerHTML=`<section class="music-stage"><div class="music-console"><label class="instrument-picker">Тембр<select id="music-instrument"><option value="soft">Мягкий</option><option value="bell">Колокол</option><option value="synth">Синт</option></select></label><div class="music-readout"><span id="music-note">—</span><meter id="music-level" min="0" max="1" value="0" aria-label="Уровень сигнала"></meter></div><div class="octave-picker" role="group" aria-label="Октава"><button type="button" id="octave-down" aria-label="Понизить октаву">−</button><span><small>Октава</small><strong id="octave-value">4</strong></span><button type="button" id="octave-up" aria-label="Повысить октаву">+</button></div></div><div class="piano-board" role="group" aria-label="Клавиатура инструмента"><div class="white-keys">${WHITE_OFFSETS.map(offset=>`<button type="button" class="piano-key white" data-note="${offset}"><span class="note-name"></span><small>${KEY_CODES[offset].replace('Key','')}</small></button>`).join('')}</div>${BLACK_KEYS.map(({offset,position})=>`<button type="button" class="piano-key black" data-note="${offset}" style="--position:${position}"><small>${KEY_CODES[offset].replace('Key','')}</small></button>`).join('')}</div><div class="music-bottom"><div class="music-transport"><button type="button" class="icon-button" id="music-record" aria-label="Записать" title="Записать" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg></button><button type="button" class="icon-button" id="music-play" aria-label="Воспроизвести" title="Воспроизвести">${controlIcon('play')}</button><span id="record-time" hidden></span><span id="music-status" role="status"></span></div><label class="music-volume"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Zm13-1c3 2 3 6 0 8"/></svg><input id="music-volume" type="range" min="0" max="100" value="35" aria-label="Громкость"></label></div></section>`;
    const status=host.querySelector('#music-status');
    const synth=createSynth(message=>{status.textContent=message;announce(message);});
    function drawKeys(){
      const active=[...held.values()].map(v=>v.midi).concat([...playNotes.values()]);
      host.querySelectorAll('[data-note]').forEach(key=>{const midi=12*(octave+1)+Number(key.dataset.note);const pressed=active.includes(midi);key.classList.toggle('is-playing',pressed);key.setAttribute('aria-pressed',String(pressed));key.setAttribute('aria-label',`${noteLabel(midi)}, клавиша ${KEY_CODES[Number(key.dataset.note)].replace('Key','')}`);key.title=noteLabel(midi);const label=key.querySelector('.note-name');if(label)label.textContent=noteLabel(midi).split(' ')[0];});
      host.querySelector('#music-note').textContent=active.length?`${noteLabel(active.at(-1))}${active.length>1?` +${active.length-1}`:''}`:'—';
      host.querySelector('#octave-value').textContent=octave;host.querySelector('#octave-down').disabled=octave===1;host.querySelector('#octave-up').disabled=octave===6;
    }
    function transport(){
      const rec=host.querySelector('#music-record'),play=host.querySelector('#music-play');rec.setAttribute('aria-pressed',String(recording));rec.setAttribute('aria-label',recording?'Остановить запись':'Записать');rec.title=recording?'Остановить запись':'Записать';
      play.disabled=!saved.length||recording;play.setAttribute('aria-label',playing?'Остановить воспроизведение':'Воспроизвести');play.title=playing?'Остановить воспроизведение':'Воспроизвести';play.innerHTML=controlIcon(playing?'pause':'play');host.querySelector('#record-time').hidden=!recording;
      if(!recording&&!playing)status.textContent=saved.length?`Нот: ${saved.length}`:'';
    }
    function press(offset,token){
      if(held.has(token))return;
      const midi=12*(octave+1)+offset;
      try{held.set(token,synth.noteOn(midi,instrument));if(recording)recordHeld.set(token,{midi,time:(performance.now()-recordStart)/1000});drawKeys();}catch(error){status.textContent=error.message;announce(error.message);}
    }
    function release(token){
      const voice=held.get(token);if(!voice)return;voice.release();held.delete(token);
      const rec=recordHeld.get(token);if(recording&&rec){recorded.push({...rec,duration:Math.max(.06,(performance.now()-recordStart)/1000-rec.time)});recordHeld.delete(token);}drawKeys();
    }
    function releaseAll(){for(const token of [...held.keys()])release(token);pointers.clear();}
    function stopRecord(){
      if(!recording)return;releaseAll();recording=false;const clean=normalizeRecording(recorded);if(clean.length){saved=clean;try{localStorage.setItem(SAVE_KEY,JSON.stringify(saved));}catch{}announce(`Записано нот: ${saved.length}`);}recordHeld.clear();transport();
    }
    function stopPlayback(){playback?.stop();playback=null;playNotes.clear();playing=false;drawKeys();transport();}
    function later(callback,delay){const timer=setTimeout(()=>{timers.delete(timer);if(!destroyed)callback();},delay);timers.add(timer);}
    function playRecording(){
      if(playing){stopPlayback();return;}stopRecord();stopPlayback();if(!saved.length)return;
      try{playing=true;playback=startPlayback({synth,notes:saved,instrument,onNote(index,midi,pressed){if(pressed)playNotes.set(index,midi);else playNotes.delete(index);drawKeys();},onFinish:stopPlayback});status.textContent='Воспроизведение';transport();}catch(error){stopPlayback();status.textContent=error.message;}
    }
    function stop(){stopRecord();releaseAll();stopPlayback();for(const timer of timers)clearTimeout(timer);timers.clear();synth.stopAll();drawKeys();}
    host.addEventListener('pointerdown',event=>{const key=event.target.closest('[data-note]');if(!key)return;event.preventDefault();key.setPointerCapture(event.pointerId);pointers.add(event.pointerId);press(Number(key.dataset.note),`pointer:${event.pointerId}`);},{signal:events.signal});
    host.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId))return;const key=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-note]');const token=`pointer:${event.pointerId}`;const offset=key?Number(key.dataset.note):null;const current=held.get(token)?.midi;if(offset===null){release(token);return;}if(current!==12*(octave+1)+offset){release(token);press(offset,token);}},{signal:events.signal});
    function pointerUp(event){release(`pointer:${event.pointerId}`);pointers.delete(event.pointerId);}
    host.addEventListener('pointerup',pointerUp,{signal:events.signal});host.addEventListener('pointercancel',pointerUp,{signal:events.signal});
    host.addEventListener('click',event=>{
      const key=event.target.closest('[data-note]');if(key&&event.detail===0){const token=`assistive:${key.dataset.note}`;press(Number(key.dataset.note),token);later(()=>release(token),180);return;}
      if(event.target.closest('#octave-down')){releaseAll();octave=Math.max(1,octave-1);drawKeys();}
      else if(event.target.closest('#octave-up')){releaseAll();octave=Math.min(6,octave+1);drawKeys();}
      else if(event.target.closest('#music-record')){if(recording)stopRecord();else{stopPlayback();releaseAll();recorded=[];recordHeld.clear();recordStart=performance.now();recording=true;status.textContent='';transport();}}
      else if(event.target.closest('#music-play'))playRecording();
    },{signal:events.signal});
    host.querySelector('#music-instrument').addEventListener('change',event=>{releaseAll();instrument=event.target.value;},{signal:events.signal});
    host.querySelector('#music-volume').addEventListener('input',event=>synth.setVolume(Number(event.target.value)/100),{signal:events.signal});
    window.addEventListener('keydown',event=>{
      if(event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;
      if(event.key==='Escape'){stop();return;}
      if(event.target instanceof Element&&event.target.matches('textarea,select,input:not([type="range"])'))return;
      const midi=keyboardMidi(event.code,octave);if(midi===null)return;event.preventDefault();press(midi-12*(octave+1),`key:${event.code}`);
    },{signal:events.signal});
    window.addEventListener('keyup',event=>release(`key:${event.code}`),{signal:events.signal});window.addEventListener('blur',stop,{signal:events.signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},{signal:events.signal});
    function tick(){if(destroyed)return;host.querySelector('#music-level').value=synth.level();if(recording){const seconds=Math.floor((performance.now()-recordStart)/1000);host.querySelector('#record-time').textContent=`${seconds} с`;if(seconds>=30||recorded.length>=120)stopRecord();}frame=requestAnimationFrame(tick);}
    drawKeys();transport();frame=requestAnimationFrame(tick);
    return{restart:stop,destroy(){stop();destroyed=true;cancelAnimationFrame(frame);events.abort();synth.dispose();}};
  },
};
