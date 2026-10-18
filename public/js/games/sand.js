import { createStage } from '../stage.js';
import { createSand, paintSand, paintSandLine, stepSand } from './sand-model.js';
import { controlIcon } from '../symbols.js';

const materials=[['Песок',1,'#d9a64f'],['Вода',2,'#6aaccf'],['Камень',3,'#697482'],['Ластик',0,'#f0efec']];
export const sand={
  id:'sand',title:'Песок',category:'sandbox',tag:'Песочница',theme:'sand',newLabel:'Очистить',
  instruction:'Выбери материал и рисуй по полю. Песок осыпается и тонет в воде, вода растекается, камень остаётся на месте. Размер кисти меняется кнопками. Готовую сцену можно скачать как PNG.',
  keyboard:'Мышь или касание — рисовать. P или Escape — приостановить физику. Ластик удаляет материал.',
  preview:'<svg viewBox="0 0 100 80"><rect x="4" y="5" width="92" height="70" rx="7" fill="#f5f1e8"/><path d="M12 66 41 30 70 66Z" fill="#d7a64f"/><path d="M59 58h29v10H59z" fill="#76b2d1"/><path d="M12 69h76" stroke="#7a8187" stroke-width="4"/><g fill="#c28e36"><circle cx="32" cy="48" r="1"/><circle cx="40" cy="54" r="1"/><circle cx="45" cy="44" r="1"/></g></svg>',
  mount(host,{announce}){
    let state=createSand(),material=1,radius=5,painting=false,previous=null,cursor=null,clock=0;
    const events=new AbortController();
    paintSandLine(state,{x:42,y:108},{x:138,y:108},2,3);paintSandLine(state,{x:42,y:94},{x:42,y:108},2,3);paintSandLine(state,{x:138,y:94},{x:138,y:108},2,3);
    paintSand(state,70,25,9,1);paintSand(state,112,65,9,2);
    const layer=document.createElement('canvas');layer.width=state.width;layer.height=state.height;
    const layerContext=layer.getContext('2d');const pixels=layerContext.createImageData(state.width,state.height);
    const colors=[[247,244,237],[216,166,79],[102,170,207],[102,112,125]];
    const stage=createStage(host,{
      width:720,height:480,label:'Песок',announce,
      status:()=> 'playing',start(){},restart(){state=createSand();painting=false;previous=null;cursor=null;clock=0;},
      stats:()=>[{label:'Частицы',value:state.count}],result:()=>({title:'Песок',description:''}),
      pointer(type,point){
        const target={x:point.x/4,y:point.y/4};cursor=target;
        if(type==='down'){painting=true;previous=target;paintSand(state,target.x,target.y,radius,material);}
        else if(type==='move'&&painting){paintSandLine(state,previous||target,target,radius,material);previous=target;}
        else if(type==='up'){painting=false;previous=null;}
      },
      cancelInput(){painting=false;previous=null;cursor=null;},
      step(dt){clock+=dt;while(clock>=1/40){stepSand(state);clock-=1/40;}},
      draw(ctx){
        for(let i=0;i<state.cells.length;i++){const type=state.cells[i],color=colors[type];const noise=type===1?((i*13+i%state.width*7)%13)-6:0;const j=i*4;pixels.data[j]=color[0]+noise;pixels.data[j+1]=color[1]+noise;pixels.data[j+2]=color[2]+noise;pixels.data[j+3]=255;}
        layerContext.putImageData(pixels,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(layer,0,0,720,480);
        if(cursor){ctx.strokeStyle='#363e4f88';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cursor.x*4,cursor.y*4,radius*4,0,Math.PI*2);ctx.stroke();}
      },
    });
    const tools=document.createElement('div');tools.className='sand-tools';tools.innerHTML=`<div class="material-picker" role="group" aria-label="Материал">${materials.map(([name,id,color])=>`<button type="button" data-material="${id}" aria-pressed="${id===material}"><i style="background:${color}" aria-hidden="true"></i><span>${name}</span></button>`).join('')}</div><div class="brush-picker" role="group" aria-label="Размер кисти">${[2,5,9].map((size,i)=>`<button type="button" data-brush="${size}" aria-label="${['Маленькая','Средняя','Большая'][i]} кисть" aria-pressed="${size===radius}"><i style="width:${5+i*4}px;height:${5+i*4}px" aria-hidden="true"></i></button>`).join('')}</div>`;
    host.querySelector('.canvas-frame').before(tools);
    tools.addEventListener('click',event=>{const mat=event.target.closest('[data-material]'),brush=event.target.closest('[data-brush]');if(mat){material=Number(mat.dataset.material);tools.querySelectorAll('[data-material]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.material)===material)));}if(brush){radius=Number(brush.dataset.brush);tools.querySelectorAll('[data-brush]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.brush)===radius)));}},{signal:events.signal});
    const save=document.createElement('a');save.className='icon-button';save.href='#';save.download='marshal-sand.png';save.setAttribute('aria-label','Скачать PNG');save.title='Скачать PNG';save.innerHTML=controlIcon('download');host.querySelector('.stage-controls').append(save);
    save.addEventListener('click',()=>{const output=document.createElement('canvas');output.width=720;output.height=480;const context=output.getContext('2d');context.imageSmoothingEnabled=false;context.drawImage(layer,0,0,720,480);save.href=output.toDataURL('image/png');announce('PNG подготовлен к скачиванию');},{signal:events.signal});
    host.querySelector('canvas').addEventListener('pointerleave',()=>{if(!painting)cursor=null;},{signal:events.signal});
    return{restart:()=>stage.restart(),destroy(){events.abort();stage.destroy();}};
  },
};
