import {onRaft,moveWithCollisions} from './raft.js';
import {advanceSnake} from './snake-motion.js';

export function releaseGrab(g){
  if(!g.enemy.grab)return;
  g.enemy.grab=null;g.enemy.bite=Math.max(g.enemy.bite,2.5);
  g.log='Пасть разжалась. Уходите от уборщика!';
}
export function startGrab(g){
  if(onRaft(g)||g.enemy.stun>0||g.enemy.grab)return;
  const direction=g.enemy.motion?.heading??{x:0,y:0,z:1};
  g.enemy.grab={remaining:3.5,damageTimer:0,direction:{...direction}};
  g.log='Уборщик удерживает вас! Резак или бластер — освободиться.';
}
export function updateGrab(g,dt){
  const e=g.enemy,grab=e.grab;
  if(!grab)return false;
  if(e.stun>0||onRaft(g)||g.player.hp<=0){releaseGrab(g);return false;}
  grab.remaining-=dt;
  if(grab.remaining<=0){releaseGrab(g);return false;}
  advanceSnake(e,{x:e.x+grab.direction.x*200,y:e.y+grab.direction.y*200,z:e.z+grab.direction.z*200},dt);
  const heading=e.motion.heading,delta={};
  // Mouth is just ahead of the head mesh; smoothly pull toward it.
  for(const a of ['x','y','z'])delta[a]=(e[a]+heading[a]*28-g.player[a])*(1-Math.exp(-16*dt));
  // Keep walls solid, but do not collide with the captor's own head.
  const enemy=g.enemy;
  let contacts;
  try{g.enemy=null;contacts=moveWithCollisions(g,delta);}finally{g.enemy=enemy;}
  if(contacts.size){releaseGrab(g);return true;}
  g.player.velocity={x:heading.x*e.motion.speed,y:heading.y*e.motion.speed,z:heading.z*e.motion.speed};
  grab.damageTimer+=dt;
  if(grab.damageTimer>=1){grab.damageTimer-=1;g.player.hp=Math.max(0,g.player.hp-6);}
  return true;
}
