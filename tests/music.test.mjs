import test from 'node:test';
import assert from 'node:assert/strict';
import {midiFrequency,keyboardMidi,noteLabel,normalizeRecording,recordingPlan} from '../public/js/games/music-model.js';
import {startPlayback} from '../public/js/games/music-playback.js';
test('musical pitches use equal temperament and octave-correct physical key mapping',()=>{assert.equal(midiFrequency(69),440);assert.ok(Math.abs(midiFrequency(60)-261.625565)<.00001);assert.equal(midiFrequency(81),880);assert.equal(keyboardMidi('KeyA',4),60);assert.equal(keyboardMidi('KeyK',4),72);assert.equal(keyboardMidi('KeyW',3),49);assert.equal(keyboardMidi('Escape',4),null);assert.equal(noteLabel(69),'Ля 4');assert.throws(()=>midiFrequency(-1));});
test('music recording rejects corrupt notes and bounds playback memory and duration',()=>{const recording=normalizeRecording([{midi:60,time:2,duration:.5},{midi:62,time:1,duration:100},{midi:200,time:0,duration:1},{midi:64,time:-1,duration:1},{midi:NaN,time:0,duration:1}]);assert.equal(recording.length,2);assert.equal(recording[0].midi,62);assert.equal(recording[0].duration,8);assert.equal(normalizeRecording(Array(500).fill({midi:60,time:1,duration:1})).length,120);assert.deepEqual(normalizeRecording(null),[]);});
test('music playback removes empty lead-in and preserves note timing',()=>{const plan=recordingPlan([{midi:60,time:3,duration:.2},{midi:64,time:3.5,duration:.3}]);assert.equal(plan.notes[0].time,0);assert.equal(plan.notes[1].time,.5);assert.ok(Math.abs(plan.duration-1.3)<.001);assert.equal(recordingPlan([]).duration,0);});
test('long recordings schedule voices shortly before each note and stopping cancels future notes',()=>{
  let now=0,id=0,finished=false;const queue=new Map(),calls=[],stops=[];
  const synth={now:()=>now,noteOn(midi,instrument,at){calls.push({midi,at,created:now});return{release(){},stop(){stops.push(midi);}};}};
  const options={synth,notes:Array.from({length:100},(_,n)=>({midi:60+n%12,time:n*.25,duration:.1})),instrument:'soft',onFinish(){finished=true;},setTimer(callback,delay){queue.set(++id,{callback,at:now+delay/1000});return id;},clearTimer:timer=>queue.delete(timer)};
  const advance=until=>{while(queue.size){const [key,next]=[...queue].sort((a,b)=>a[1].at-b[1].at)[0];if(next.at>until)break;now=next.at;queue.delete(key);next.callback();}now=until;};
  startPlayback(options);assert.equal(calls.length,1);advance(26);assert.equal(calls.length,100);assert.ok(finished);assert.ok(calls.every(note=>note.at-note.created>=-.001&&note.at-note.created<=.121));
  calls.length=0;finished=false;const playback=startPlayback(options);advance(26.5);assert.ok(calls.length<5);playback.stop();const count=calls.length;advance(60);assert.equal(calls.length,count);assert.equal(queue.size,0);assert.ok(!finished);assert.ok(stops.length>=count);
});
