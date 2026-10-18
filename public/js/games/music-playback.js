import { recordingPlan } from './music-model.js';

// Queue only the next fraction of a second: long recordings must not evict
// their opening notes from the synth's live polyphony budget.
export function startPlayback({synth,notes,instrument,onNote=()=>{},onFinish=()=>{},setTimer=setTimeout,clearTimer=clearTimeout}){
  const plan=recordingPlan(notes),timers=new Set(),voices=[];
  const start=synth.now()+.06;
  let cursor=0,stopped=false;
  function later(callback,delay){const timer=setTimer(()=>{timers.delete(timer);if(!stopped)callback();},Math.max(0,delay));timers.add(timer);}
  function stop(){if(stopped)return;stopped=true;for(const timer of timers)clearTimer(timer);timers.clear();for(const voice of voices)voice.stop();}
  function pump(){
    if(stopped)return;
    const now=synth.now();
    while(cursor<plan.notes.length&&start+plan.notes[cursor].time<=now+.12){
      const index=cursor++,note=plan.notes[index],at=start+note.time;
      const voice=synth.noteOn(note.midi,instrument,at);voice.release(at+note.duration);voices.push(voice);
      later(()=>onNote(index,note.midi,true),(at-now)*1000);
      later(()=>onNote(index,note.midi,false),(at+note.duration-now)*1000);
    }
    if(cursor<plan.notes.length)later(pump,40);
  }
  pump();later(()=>{stop();onFinish();},(plan.duration+.06)*1000);
  return{stop};
}
