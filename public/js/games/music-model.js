export const KEY_CODES=['KeyA','KeyW','KeyS','KeyE','KeyD','KeyF','KeyT','KeyG','KeyY','KeyH','KeyU','KeyJ','KeyK'];
export const NOTE_NAMES=['До','До♯','Ре','Ре♯','Ми','Фа','Фа♯','Соль','Соль♯','Ля','Ля♯','Си'];
export const WHITE_OFFSETS=[0,2,4,5,7,9,11,12];
export const BLACK_KEYS=[{offset:1,position:1},{offset:3,position:2},{offset:6,position:4},{offset:8,position:5},{offset:10,position:6}];
export function midiFrequency(note){if(!Number.isInteger(note)||note<0||note>127)throw new RangeError('Invalid MIDI note');return 440*2**((note-69)/12);}
export function keyboardMidi(code,octave){const offset=KEY_CODES.indexOf(code);return offset>=0&&Number.isInteger(octave)&&octave>=1&&octave<=6?12*(octave+1)+offset:null;}
export function noteLabel(midi){return `${NOTE_NAMES[((midi%12)+12)%12]} ${Math.floor(midi/12)-1}`;}
export function normalizeRecording(value){
  if(!Array.isArray(value))return[];
  return value.slice(0,120).filter(event=>event&&Number.isInteger(event.midi)&&event.midi>=24&&event.midi<=96&&Number.isFinite(event.time)&&event.time>=0&&event.time<30&&Number.isFinite(event.duration)&&event.duration>=.04)
    .map(event=>({midi:event.midi,time:event.time,duration:Math.min(8,event.duration,30-event.time)})).filter(event=>event.duration>=.04).sort((a,b)=>a.time-b.time);
}
export function recordingPlan(events){const notes=normalizeRecording(events);if(!notes.length)return{notes:[],duration:0};const origin=notes[0].time;return{notes:notes.map(note=>({...note,time:note.time-origin})),duration:Math.max(...notes.map(note=>note.time-origin+note.duration))+.5};}
