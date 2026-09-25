import {releaseGrab} from './snake-grab.js';
import {snakeSpheres} from './snake-hitbox.js';
import {hitSnakeRaftAttack} from './snake-raft-attack.js';

export const MAGNET_RANGE=520, MAGNET_COOLDOWN=.65;
function rayHit(start,direction,centre,radius){
 const v={x:centre.x-start.x,y:centre.y-start.y,z:centre.z-start.z};
 const along=v.x*direction.x+v.y*direction.y+v.z*direction.z;
 const square=v.x*v.x+v.y*v.y+v.z*v.z;
 if(square<=radius*radius)return 0;
 const side=square-along*along;
 if(along<0||side>radius*radius)return Infinity;
 return Math.max(0,along-Math.sqrt(radius*radius-side));
}
export function fireMagnet(g,target){
 if(g.over||g.won||g.tool!=='hook'||g.droppedTools?.hook||g.time<(g.magnetReadyAt??0))return false;
 const start={x:g.player.x,y:g.player.y,z:g.player.z};
 const length=Math.hypot(target.x-start.x,target.y-start.y,target.z-start.z);
 if(!Number.isFinite(length)||length<.001)return false;
 const d={x:(target.x-start.x)/length,y:(target.y-start.y)/length,z:(target.z-start.z)/length};
 let nearest=g.upgrades.hook?820:MAGNET_RANGE,hit=null;
 for(const resource of g.resources){
   const t=rayHit(start,d,resource,22);
   if(t<nearest){nearest=t;hit={resource};}
 }
 for(const sphere of snakeSpheres(g.enemy)){
   const t=rayHit(start,d,sphere,sphere.radius+3);
   if(t<nearest){nearest=t;hit={snake:true};}
 }
 const end={x:start.x+d.x*nearest,y:start.y+d.y*nearest,z:start.z+d.z*nearest};
 g.magnetReadyAt=g.time+MAGNET_COOLDOWN;
 g.shot={start,end,ttl:.22,magnetic:true};
 if(hit?.resource){
   for(const resource of g.resources){
     const offset={x:resource.x-end.x,y:resource.y-end.y,z:resource.z-end.z};
     const radius=Math.hypot(offset.x,offset.y,offset.z);
     if(radius>100&&resource!==hit.resource)continue;
     const strength=resource===hit.resource?180:110*(1-radius/100);
     for(const axis of ['x','y','z'])resource['v'+axis]=(resource['v'+axis]??0)+d[axis]*strength+offset[axis]/Math.max(radius,1)*strength*.65;
   }
   g.log='Магнитный импульс: обломки отброшены';
 }else if(hit?.snake){
   hitSnakeRaftAttack(g);
   const enemy=g.enemy;
   enemy.magnetHits=g.time-(enemy.magnetLastHit??-Infinity)<=3?(enemy.magnetHits??0)+1:1;
   enemy.magnetLastHit=g.time;
   if(enemy.magnetHits>=3){
     enemy.stun=Math.max(enemy.stun??0,5);enemy.magnetRepelUntil=g.time+5;enemy.magnetHits=0;
     releaseGrab(g);g.log='Магнитный импульс: змейка отступает на 5 секунд';
   }else g.log='Магнитный импульс: попадание '+enemy.magnetHits+'/3';
 }
 return true;
}
