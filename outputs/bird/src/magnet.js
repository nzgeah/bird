import {releaseGrab} from './snake-grab.js';
import {snakeSpheres} from './snake-hitbox.js';
import {hitSnakeRaftAttack} from './snake-raft-attack.js';
import {consumeEnergy} from './energy.js';
export const MAGNET_RANGE=520,MAGNET_COOLDOWN=.65,MAGNET_SPEED=600,MAGNET_RADIUS=120;
const AXES=['x','y','z'];
function rayHit(start,d,centre,radius){
 const v={x:centre.x-start.x,y:centre.y-start.y,z:centre.z-start.z};
 const along=v.x*d.x+v.y*d.y+v.z*d.z,square=v.x*v.x+v.y*v.y+v.z*v.z;
 if(square<=radius*radius)return 0;
 const side=square-along*along;if(along<0||side>radius*radius)return Infinity;
 return Math.max(0,along-Math.sqrt(radius*radius-side));
}
export function fireMagnet(g,target){
 if(g.over||g.won||g.tool!=='hook'||g.droppedTools?.hook||g.time<(g.magnetReadyAt??0))return false;
 const start={x:g.player.x,y:g.player.y,z:g.player.z},length=Math.hypot(target.x-start.x,target.y-start.y,target.z-start.z);
 if(!Number.isFinite(length)||length<.001||!consumeEnergy(g,2))return false;
 const direction=Object.fromEntries(AXES.map(a=>[a,(target[a]-start[a])/length]));
 (g.magnetProjectiles??=[]).push({...start,direction,remaining:g.upgrades.hook?820:MAGNET_RANGE});
 g.magnetReadyAt=g.time+MAGNET_COOLDOWN;return true;
}
function burst(g,p,hit){
 (g.magnetWaves??=[]).push({x:p.x,y:p.y,z:p.z,age:0,duration:.1625,radius:MAGNET_RADIUS/2});
 for(const r of g.resources){
  const offset={x:r.x-p.x,y:r.y-p.y,z:r.z-p.z},distance=Math.hypot(offset.x,offset.y,offset.z);
  if(distance>MAGNET_RADIUS)continue;
  const strength=r===hit?.resource?180:140*(1-distance/MAGNET_RADIUS);
  for(const a of AXES)r['v'+a]=(r['v'+a]??0)+(distance>.001?offset[a]/distance:p.direction[a])*strength;
 }
 const enemy=g.enemy;
 const snakeHit=hit?.snake||snakeSpheres(enemy).some(s=>Math.hypot(s.x-p.x,s.y-p.y,s.z-p.z)<=MAGNET_RADIUS+s.radius);
 if(snakeHit){
  hitSnakeRaftAttack(g);
  enemy.magnetHits=g.time-(enemy.magnetLastHit??-Infinity)<=3?(enemy.magnetHits??0)+1:1;enemy.magnetLastHit=g.time;
  if(enemy.magnetHits>=3){enemy.stun=Math.max(enemy.stun??0,5);enemy.magnetRepelUntil=g.time+5;enemy.magnetHits=0;releaseGrab(g);g.log='Магнитная волна: змейка отступает на 5 секунд';}
  else g.log='Магнитная волна: попадание '+enemy.magnetHits+'/3';
 }else g.log='Магнитная волна: ближайшие обломки отброшены';
}
export function updateMagnet(g,dt){
 if(g.over||g.won||!(dt>0))return;
 g.magnetWaves=(g.magnetWaves??[]).filter(w=>{w.age+=dt;return w.age<w.duration;});
 const live=[];
 for(const p of g.magnetProjectiles??[]){
  const travel=Math.min(p.remaining,MAGNET_SPEED*dt);let nearest=travel,hit=null;
  for(const resource of g.resources){const t=rayHit(p,p.direction,resource,25);if(t<=nearest){nearest=t;hit={resource};}}
  for(const sphere of snakeSpheres(g.enemy)){const t=rayHit(p,p.direction,sphere,sphere.radius+4);if(t<=nearest){nearest=t;hit={snake:true};}}
  for(const a of AXES)p[a]+=p.direction[a]*nearest;p.remaining-=nearest;
  if(hit||p.remaining<=.0001)burst(g,p,hit);else live.push(p);
 }
 g.magnetProjectiles=live;
}
