import {raftColliders,DECK_TOP} from './raft.js';
import {objectBounds} from './placement.js';
const axes=['x','y','z'];
export function snakeObstacles(g){
 const boxes=raftColliders(g);
 if(g.ship.battery?.installed){
  const b=objectBounds(g.ship.battery);
  boxes.push({min:{x:g.ship.x+b.minX,y:g.ship.y+DECK_TOP,z:g.ship.z+b.minZ},max:{x:g.ship.x+b.maxX,y:g.ship.y+DECK_TOP+b.height,z:g.ship.z+b.maxZ}});
 }
 if(g.station){
  // Conservative rotated bounds for the station's core and panel wings.
  for(const [x,w,h,d] of [[0,190,136,100],[-160,140,8,110],[160,140,8,110]]){
   const points=[];
   for(const dx of [-w/2,w/2])for(const dy of [-h/2,h/2])for(const dz of [-d/2,d/2]){
    const xx=(x+dx)*Math.cos(-.3)+dz*Math.sin(-.3),zz=-(x+dx)*Math.sin(-.3)+dz*Math.cos(-.3);
    points.push({x:g.station.x+xx*Math.cos(.22)-dy*Math.sin(.22),y:g.station.y+xx*Math.sin(.22)+dy*Math.cos(.22),z:g.station.z+zz});
   }
   boxes.push({min:Object.fromEntries(axes.map(a=>[a,Math.min(...points.map(p=>p[a]))])),max:Object.fromEntries(axes.map(a=>[a,Math.max(...points.map(p=>p[a]))]))});
  }
 }
 for(const a of g.asteroids??[])boxes.push({center:a,radius:a.size/2});
 // Only nearby solids can touch the head or its 400-unit trail this frame.
 const points=[g.enemy,...(g.enemy.segments??[])],min={},max={};
 for(const a of axes){min[a]=Math.min(...points.map(p=>p[a]))-80;max[a]=Math.max(...points.map(p=>p[a]))+80;}
 return boxes.filter(b=>axes.every(a=>b.center?b.center[a]+b.radius>=min[a]&&b.center[a]-b.radius<=max[a]:b.max[a]>=min[a]&&b.min[a]<=max[a]));
}
export function resolveSnakePoint(p,radius,obstacles){
 let collided=false;
 for(let pass=0;pass<6;pass++){
  let changed=false;
  for(const b of obstacles??[]){
   if(b.center){
    const delta=axes.map(a=>p[a]-b.center[a]),length=Math.hypot(...delta),r=radius+b.radius;
    if(length>=r)continue;
    const direction=length>1e-9?delta.map(v=>v/length):[0,1,0];
    axes.forEach((a,i)=>p[a]=b.center[a]+direction[i]*(r+.001));
   }else{
    if(!axes.every(a=>p[a]>b.min[a]-radius&&p[a]<b.max[a]+radius))continue;
    let best=null;
    for(const a of axes)for(const value of [b.min[a]-radius-.001,b.max[a]+radius+.001]){
     const distance=Math.abs(p[a]-value);if(!best||distance<best.distance)best={a,value,distance};
    }
    p[best.a]=best.value;
   }
   changed=collided=true;
  }
  if(!changed)break;
 }
 return collided;
}
export function resolveSnakeBody(enemy){
 resolveSnakePoint(enemy,22,enemy.obstacles);
 for(const p of enemy.segments??[])resolveSnakePoint(p,14,enemy.obstacles);
}
