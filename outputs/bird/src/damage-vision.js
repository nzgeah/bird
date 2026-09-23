export function damageLevel(hp){return 1-Math.max(0,Math.min(100,hp))/100;}
export class DamageVision{
  constructor(world,overlay){this.world=world;this.overlay=overlay;this.ctx=overlay.getContext('2d');overlay.width=320;overlay.height=180;this.previous=100;this.shock=0;this.lastNoise=-1;this.noise=this.ctx.createImageData(320,180);}
  update(hp,time,dt,visible){
    const damage=damageLevel(hp);
    if(hp<this.previous)this.shock=Math.min(1,this.shock+(this.previous-hp)/20);
    if(hp>this.previous)this.shock=0;
    this.previous=hp;this.shock=Math.max(0,this.shock-dt*1.4);
    this.overlay.hidden=!visible||(damage===0&&this.shock===0);
    this.world.style.filter=visible&&damage>0?'blur('+(damage*damage*3.4+this.shock*.7).toFixed(2)+'px) saturate('+(1-damage*.65)+') contrast('+(1-damage*.18)+')':'';
    if(this.overlay.hidden)return;
    if(time-this.lastNoise<.085&&time>=this.lastNoise)return;this.lastNoise=time;
    const ctx=this.ctx,w=320,h=180;ctx.clearRect(0,0,w,h);
    const strength=damage*.22+this.shock*.15;
    for(let i=0;i<this.noise.data.length;i+=4){const value=Math.random()*255;this.noise.data[i]=value*.7;this.noise.data[i+1]=value*.95;this.noise.data[i+2]=value;this.noise.data[i+3]=Math.random()*strength*255;}
    ctx.putImageData(this.noise,0,0);
    ctx.fillStyle='rgba(5,15,22,'+(damage*.18)+')';for(let y=0;y<h;y+=3)ctx.fillRect(0,y,w,1);
    if(Math.random()<damage*.5+this.shock*.3){const y=Math.random()*h;ctx.fillStyle='rgba(88,190,196,'+(damage*.15+this.shock*.1)+')';ctx.fillRect(0,y,w,1+damage*5);ctx.fillStyle='rgba(0,4,10,'+(damage*.35)+')';ctx.fillRect(0,y+7,w,2);}
    const vignette=ctx.createRadialGradient(160,90,45,160,90,185);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'rgba(0,7,13,'+(damage*.85)+')');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  }
}
