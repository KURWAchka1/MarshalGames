import { createStage,roundRect } from '../stage.js';
import { createShooter,stepShooter } from './shooter-model.js';

export const shooter={
  id:'shooter',title:'Звёздный дозор',category:'action',tag:'Шутер',theme:'shooter',
  instruction:'Продержись как можно дольше. Корабль стреляет автоматически: веди его к противникам и уклоняйся от выстрелов. Пропущенный вниз противник тоже повреждает корпус. Зелёные капсулы восстанавливают корпус. После группы противников начинается следующая, без финальной волны.',
  keyboard:'Стрелки или WASD — движение. Можно управлять мышью или пальцем. P или Escape — пауза.',
  preview:'<svg viewBox="0 0 100 80"><rect x="4" y="5" width="92" height="70" rx="7" fill="#17273d"/><g fill="#f0a58d"><path d="m22 16 7 12 7-12-7 4Z"/><path d="m64 21 7 12 7-12-7 4Z"/></g><path d="m50 44 12 22-12-5-12 5Z" fill="#b8def1"/><path d="M50 38v-9" stroke="#9cd1ed" stroke-width="3"/><g fill="#526e8e"><circle cx="19" cy="47" r="1"/><circle cx="79" cy="56" r="1"/></g></svg>',
  mount(host,{announce}){
    const mobile=matchMedia('(max-width:600px)').matches,SW=mobile?420:720,SH=mobile?620:540;
    let state=createShooter(SW,SH),target;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    return createStage(host,{
      width:SW,height:SH,label:'Звёздный дозор',announce,
      status:()=>state.status,start:()=>{state.status='playing';},restart:()=>{state=createShooter(SW,SH);target=undefined;},
      stats:()=>[{label:'Сбито',value:state.kills},{label:'Очки',value:state.score},{label:'Корпус',value:state.player.hp}],
      result:()=>({title:state.status==='won'?'Сектор защищён':'Корабль потерян',description:`Очки: ${state.score}`}),
      pointer(type,point,event){if(type==='down'||type==='move')target={x:point.x,y:point.y-(event.pointerType==='touch'?45:0)};},cancelInput(){target=undefined;},
      step(dt,keys){const dx=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA')),dy=Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'));if(dx||dy)target=undefined;const hp=state.player.hp;stepShooter(state,dt,{dx,dy,target});if(state.player.hp<hp)announce(`Корпус: ${state.player.hp} из 3`);if(state.status!=='playing')target=undefined;},
      draw(ctx){
        ctx.fillStyle='#152438';ctx.fillRect(0,0,SW,SH);
        for(let i=0;i<75;i++){const depth=1+i%3;ctx.fillStyle=['#49617c','#66809c','#8aa0b8'][i%3];const y=((i*137+(motion.matches?0:state.time*depth*12))%(SH+12))-6;ctx.fillRect(i*97%SW,y,depth===3?2:1,depth===3?3:2);}
        for(const shot of state.shots)roundRect(ctx,shot.x-2,shot.y-8,4,16,2,'#b6e3fa');
        for(const shot of state.threats){ctx.fillStyle='#f3b789';ctx.beginPath();ctx.arc(shot.x,shot.y,5,0,Math.PI*2);ctx.fill();}
        for(const e of state.enemies){ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle=e.heavy?'#c88bba':'#e5a18a';ctx.beginPath();if(e.heavy){ctx.moveTo(-22,-9);ctx.lineTo(-13,15);ctx.lineTo(0,21);ctx.lineTo(13,15);ctx.lineTo(22,-9);ctx.lineTo(0,-18);}else{ctx.moveTo(-17,-13);ctx.lineTo(-12,12);ctx.lineTo(0,19);ctx.lineTo(12,12);ctx.lineTo(17,-13);ctx.lineTo(0,-3);}ctx.closePath();ctx.fill();roundRect(ctx,-4,-7,8,12,3,'#543e63');if(e.heavy){ctx.fillStyle='#e9c9df';for(let i=0;i<e.hp;i++)ctx.fillRect(-8+i*6,7,4,3);}ctx.restore();}
        for(const pickup of state.pickups){ctx.strokeStyle='#8bd4b6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(pickup.x,pickup.y,10,0,Math.PI*2);ctx.moveTo(pickup.x-4,pickup.y);ctx.lineTo(pickup.x+4,pickup.y);ctx.moveTo(pickup.x,pickup.y-4);ctx.lineTo(pickup.x,pickup.y+4);ctx.stroke();}
        if(!motion.matches)for(const p of state.particles){ctx.globalAlpha=p.life/.4;ctx.fillStyle='#efd0ad';ctx.fillRect(p.x-2,p.y-2,4,4);}ctx.globalAlpha=1;
        const p=state.player;ctx.save();ctx.translate(p.x,p.y);if(p.invulnerable>0){ctx.strokeStyle='#9ed4ef66';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.65;}
        ctx.fillStyle='#f4c27f';ctx.beginPath();ctx.moveTo(-5,14);ctx.lineTo(0,24+Math.sin(state.time*30)*3);ctx.lineTo(5,14);ctx.fill();
        ctx.fillStyle='#b6ddec';ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(21,19);ctx.lineTo(0,10);ctx.lineTo(-21,19);ctx.closePath();ctx.fill();roundRect(ctx,-4,-10,8,18,4,'#f3f8ff');ctx.restore();
      },
    });
  },
};
