import { createStage,roundRect } from '../stage.js';
import { golfCourse,createGolf,stepGolf,shootGolf,golfAtRest,GW,GH,FRICTION } from './golf-model.js';

export const golf={
  id:'golf',title:'Мини-гольф',category:'physics',tag:'Физика',theme:'golf',
  instruction:'Попади в лунку за меньшее число ударов. После попадания появляется новое поле: игра продолжается без финальной лунки. Укажи направление удара и отпусти: чем точка дальше от мяча, тем сильнее удар. Следующий удар доступен после остановки мяча.',
  keyboard:'Стрелки влево/вправо — направление, вверх/вниз — сила, пробел или Enter — удар. P или Escape — пауза.',
  preview:'<svg viewBox="0 0 100 80"><rect x="4" y="5" width="92" height="70" rx="7" fill="#8ab79a"/><rect x="13" y="14" width="74" height="52" rx="5" fill="#5c9274"/><circle cx="28" cy="53" r="5" fill="#fff8e6"/><circle cx="72" cy="29" r="6" fill="#234c38"/><path d="M72 29V12l12 5-12 5" fill="#e3a182" stroke="#f5e8d2" stroke-width="1.5"/><rect x="46" y="28" width="7" height="30" rx="2" fill="#d8decf"/></svg>',
  mount(host,{announce}){
    const mobile=matchMedia('(max-width:600px)').matches;
    let state=createGolf(),aiming=false;
    function aim(point){if(!golfAtRest(state))return;if(mobile)point={x:GW-point.y,y:point.x};const hole=golfCourse(state).hole;if(Math.hypot(point.x-hole.x,point.y-hole.y)<25)point=hole;state.angle=Math.atan2(point.y-state.ball.y,point.x-state.ball.x);state.power=Math.max(60,Math.min(720,Math.hypot(point.x-state.ball.x,point.y-state.ball.y)*FRICTION+35));}
    return createStage(host,{
      width:mobile?GH:GW,height:mobile?GW:GH,label:'Мини-гольф',announce,
      status:()=>state.status,start:()=>{state.status='playing';},restart:()=>{state=createGolf();aiming=false;},
      stats:()=>[{label:'Пройдено',value:state.course},{label:'Удары',value:state.strokes},{label:'Сила',value:`${Math.round(state.power/720*100)}%`}],
      result:()=>({title:'Все лунки пройдены',description:`Ударов: ${state.strokes}`}),
      pointer(type,point){if(type==='down'&&golfAtRest(state)){aiming=true;aim(point);}else if(type==='move'&&golfAtRest(state))aim(point);else if(type==='up'&&aiming){aim(point);shootGolf(state);aiming=false;}},
      cancelInput(){aiming=false;},key(key){if([' ','Enter'].includes(key))shootGolf(state);},
      step(dt,keys){if(golfAtRest(state)){state.angle+=(Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')))*1.7*dt;state.power=Math.max(60,Math.min(720,state.power+(Number(keys.has('ArrowUp'))-Number(keys.has('ArrowDown')))*300*dt));}stepGolf(state,dt);},
      draw(ctx){
        ctx.save();if(mobile){ctx.translate(0,GW);ctx.rotate(-Math.PI/2);}
        const c=golfCourse(state),b=state.ball;
        ctx.fillStyle='#b9cdb8';ctx.fillRect(0,0,GW,GH);roundRect(ctx,20,20,GW-40,GH-40,13,'#5f9476');
        ctx.save();ctx.beginPath();ctx.roundRect(24,24,GW-48,GH-48,10);ctx.clip();for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#649a7b':'#609677';ctx.fillRect(24+i*60,24,60,GH-48);}ctx.restore();
        for(const wall of c.walls){roundRect(ctx,wall.x+2,wall.y+4,wall.width,wall.height,3,'#325c4766');roundRect(ctx,wall.x,wall.y,wall.width,wall.height,3,'#d9e2d2');}
        ctx.fillStyle='#244d39';ctx.beginPath();ctx.arc(c.hole.x,c.hole.y,13,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#f4ecd8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(c.hole.x,c.hole.y);ctx.lineTo(c.hole.x,c.hole.y-44);ctx.stroke();
        ctx.fillStyle='#e3a182';ctx.beginPath();ctx.moveTo(c.hole.x+1,c.hole.y-43);ctx.lineTo(c.hole.x+28,c.hole.y-34);ctx.lineTo(c.hole.x+1,c.hole.y-25);ctx.fill();
        if(golfAtRest(state)){const length=38+state.power/7;ctx.strokeStyle='#fff5d5aa';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+Math.cos(state.angle)*length,b.y+Math.sin(state.angle)*length);ctx.stroke();ctx.setLineDash([]);}
        const radius=b.radius*(state.holeDelay?Math.max(.1,state.holeDelay/.6):1);
        ctx.fillStyle='#25433355';ctx.beginPath();ctx.ellipse(b.x+2,b.y+3,radius+1,radius*.7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff8e6';ctx.beginPath();ctx.arc(b.x,b.y,radius,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(b.x-2,b.y-2,Math.max(1,radius*.28),0,Math.PI*2);ctx.fill();
        ctx.restore();
      },
    });
  },
};
