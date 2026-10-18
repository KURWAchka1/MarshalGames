import { midiFrequency } from './games/music-model.js';

export function createSynth(onError){
  let context,master,analyser,volume=.35,disposed=false;
  const voices=new Set();
  const samples=new Float32Array(256);
  function ensure(){
    if(disposed)throw new Error('Synth disposed');
    if(!context){
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)throw new Error('Звук не поддерживается этим браузером');
      context=new Audio({latencyHint:'interactive'});master=context.createGain();master.gain.value=volume*.5;
      const limiter=context.createDynamicsCompressor();limiter.threshold.value=-8;limiter.knee.value=10;limiter.ratio.value=8;limiter.attack.value=.005;limiter.release.value=.15;
      analyser=context.createAnalyser();analyser.fftSize=256;master.connect(limiter).connect(analyser).connect(context.destination);
    }
    if(context.state==='suspended')context.resume().catch(()=>onError?.('Нажми клавишу ещё раз, чтобы включить звук'));
    return context;
  }
  function noteOn(midi,instrument='soft',scheduled){
    const audio=ensure(),time=Math.max(audio.currentTime,scheduled??audio.currentTime);
    if(voices.size>=24)voices.values().next().value.stop();
    const envelope=audio.createGain(),filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=instrument==='synth'?1800:9000;filter.Q.value=.6;filter.connect(envelope).connect(master);
    const gain=envelope.gain;gain.setValueAtTime(.0001,time);gain.exponentialRampToValueAtTime(.17,time+(instrument==='synth'?.025:.008));gain.exponentialRampToValueAtTime(instrument==='bell'?.001:.07,time+(instrument==='bell'?2.4:.3));
    const fundamental=audio.createOscillator(),partial=audio.createOscillator(),partialGain=audio.createGain();
    fundamental.type=instrument==='synth'?'sawtooth':instrument==='bell'?'sine':'triangle';partial.type='sine';
    fundamental.frequency.value=midiFrequency(midi);partial.frequency.value=midiFrequency(midi)*(instrument==='bell'?2.76:2);partialGain.gain.value=instrument==='bell'?.35:.18;
    fundamental.connect(filter);partial.connect(partialGain).connect(filter);fundamental.start(time);partial.start(time);
    let ended=0,released=false;
    const voice={midi,release(at=audio.currentTime){if(released)return;released=true;const t=Math.max(at,time+.06),release=instrument==='synth'?.16:.4;if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(t);else{gain.cancelScheduledValues(t);gain.setValueAtTime(Math.max(.0001,gain.value),t);}gain.exponentialRampToValueAtTime(.0001,t+release);fundamental.stop(t+release+.02);partial.stop(t+release+.02);},stop(){const t=audio.currentTime;try{gain.cancelScheduledValues(t);gain.setValueAtTime(Math.max(.0001,gain.value),t);gain.exponentialRampToValueAtTime(.0001,t+.012);fundamental.stop(t+.02);partial.stop(t+.02);}catch{}voices.delete(voice);}};
    function cleanup(){ended++;if(ended<2)return;voices.delete(voice);fundamental.disconnect();partial.disconnect();partialGain.disconnect();filter.disconnect();envelope.disconnect();}
    fundamental.onended=cleanup;partial.onended=cleanup;voices.add(voice);return voice;
  }
  return{
    noteOn,
    now(){return ensure().currentTime;},
    setVolume(value){volume=Math.max(0,Math.min(1,value));if(master)master.gain.setTargetAtTime(volume*.5,context.currentTime,.02);},
    level(){if(!analyser||context.state!=='running')return 0;analyser.getFloatTimeDomainData(samples);let sum=0;for(const value of samples)sum+=value*value;return Math.min(1,Math.sqrt(sum/samples.length)*8);},
    stopAll(){for(const voice of [...voices])voice.stop();},
    dispose(){disposed=true;for(const voice of [...voices])voice.stop();if(context)context.close().catch(()=>{});},
  };
}
