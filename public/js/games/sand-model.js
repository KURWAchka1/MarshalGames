export function createSand(width=180,height=120){return{width,height,cells:new Uint8Array(width*height),moved:new Uint8Array(width*height),count:0,tick:0};}
export function paintSand(state,x,y,radius,material){
  x=Math.round(x);y=Math.round(y);
  for(let row=Math.max(0,y-radius);row<=Math.min(state.height-1,y+radius);row++)for(let col=Math.max(0,x-radius);col<=Math.min(state.width-1,x+radius);col++){
    if((row-y)**2+(col-x)**2>radius**2)continue;
    const i=row*state.width+col,old=state.cells[i];
    if(old===material)continue;
    if(!old&&material)state.count++;else if(old&&!material)state.count--;
    state.cells[i]=material;
  }
}
export function paintSandLine(state,from,to,radius,material){
  const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/Math.max(1,radius/2)));
  for(let i=0;i<=steps;i++)paintSand(state,from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps,radius,material);
}
export function stepSand(state,random=Math.random){
  const {width:w,height:h,cells,moved}=state;moved.fill(0);state.tick++;
  const direction=random()<.5?1:-1;
  function move(from,to){const value=cells[from];cells[from]=cells[to];cells[to]=value;moved[from]=1;moved[to]=1;}
  for(let y=h-1;y>=0;y--)for(let n=0;n<w;n++){
    const x=direction>0?n:w-1-n,index=y*w+x,type=cells[index];
    if(!type||type===3||moved[index])continue;
    const canFall=(target)=>cells[target]===0||(type===1&&cells[target]===2);
    if(y<h-1&&canFall(index+w)){move(index,index+w);continue;}
    const side=random()<.5?-1:1;
    let changed=false;
    for(const dx of[side,-side])if(y<h-1&&x+dx>=0&&x+dx<w&&canFall(index+w+dx)){move(index,index+w+dx);changed=true;break;}
    if(changed||type!==2)continue;
    for(const dx of[side,-side])if(x+dx>=0&&x+dx<w&&!cells[index+dx]){move(index,index+dx);break;}
  }
}
