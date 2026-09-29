import {raftColliders,DECK_TOP,onRaft} from './raft.js';
import {objectBounds} from './placement.js';
const axes=['x','y','z'];
export function snakeObstacles(g){
 const boxes=raftColliders(g).map(b=>({...b,owner:g.ship}));
 if(g.ship.battery?.installed){
  const b=objectBounds(g.ship.battery);
  boxes.push({owner:g.ship,min:{x:g.ship.x+b.minX,y:g.ship.y+DECK_TOP,z:g.ship.z+b.minZ},max:{x:g.ship.x+b.maxX,y:g.ship.y+DECK_TOP+b.height,z:g.ship.z+b.maxZ}});
 }
 if(g.station){
  // Conservative rotated bounds for the station's core and panel wings.
  for(const [x,w,h,d] of [[0,190,136,100],[-160,140,8,110],[160,140,8,110]]){
   const points=[];
   for(const dx of [-w/2,w/2])for(const dy of [-h/2,h/2])for(const dz of [-d/2,d/2]){
    const xx=(x+dx)*Math.cos(-.3)+dz*Math.sin(-.3),zz=-(x+dx)*Math.sin(-.3)+dz*Math.cos(-.3);
    points.push({x:g.station.x+xx*Math.cos(.22)-dy*Math.sin(.22),y:g.station.y+xx*Math.sin(.22)+dy*Math.cos(.22),z:g.station.z+zz});
   }
   boxes.push({owner:g.station,min:Object.fromEntries(axes.map(a=>[a,Math.min(...points.map(p=>p[a]))])),max:Object.fromEntries(axes.map(a=>[a,Math.max(...points.map(p=>p[a]))]))});
  }
 }
 for(const a of g.asteroids??[])boxes.push({center:a,radius:a.size/2,owner:a});
 for(const item of g.resources??[])if(item.type==='item')boxes.push({center:item,radius:9,owner:item});
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
   const before={x:p.x,y:p.y,z:p.z};
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
   if(b.owner){const delta={x:before.x-p.x,y:before.y-p.y,z:before.z-p.z},depth=Math.hypot(delta.x,delta.y,delta.z);if(depth>(b.contact?.depth??0))b.contact={...delta,depth};}
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
export function pushSnakeContacts(g,dt){
 // One impulse per rigid object, regardless of how many body samples touch it.
 const contacts=new Map();
 for(const b of g.enemy.obstacles??[])if(b.owner&&b.contact&&b.contact.depth>(contacts.get(b.owner)?.depth??0))contacts.set(b.owner,b.contact);
 const carried=contacts.has(g.ship)&&onRaft(g);
 for(const [owner,c] of contacts){
  const mass=owner===g.ship?3:owner===g.station?5:Math.max(1,(owner.size??100)/100);
  const velocity=owner===g.ship?(owner.velocity??={x:0,y:0,z:0}):owner===g.station?(owner.pushVelocity??={x:0,y:0,z:0}):null;
  for(const a of axes){
   const normal=c[a]/c.depth,shift=normal*Math.min(c.depth,20)*Math.min(1,dt*8)/mass;
   owner[a]+=shift;
   if(owner===g.ship&&carried)g.player[a]+=shift;
   if(velocity)velocity[a]+=normal*100*dt/mass;
   else owner['v'+a]=(owner['v'+a]??0)+normal*100*dt/mass;
  }
 }
}
export function driftPushedStation(g,dt){
 const station=g.station,v=station?.pushVelocity;if(!v)return;
 for(const a of axes){station[a]+=v[a]*dt;v[a]*=Math.exp(-.4*dt);}
}
