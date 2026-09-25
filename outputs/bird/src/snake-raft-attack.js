import {onRaft,TILE} from './raft.js';
import {objectBounds} from './placement.js';
import {distance} from './spatial.js';
import {advanceSnake} from './snake-motion.js';

export const FIRST_RAFT_ATTACK=30, RAFT_BITE_TIME=5, HITS_TO_RELEASE=2;
const EDGES=[[1,0],[-1,0],[0,1],[0,-1]];
const key=t=>t.x+','+t.z;
function connectedWithout(tiles,removed){
 const left=tiles.filter(t=>t!==removed);if(left.length<2)return true;
 const unseen=new Set(left.map(key)),queue=[left[0]];unseen.delete(key(left[0]));
 while(queue.length){const t=queue.shift();for(const [x,z] of EDGES){const k=(t.x+x)+','+(t.z+z);if(unseen.delete(k))queue.push({x:t.x+x,z:t.z+z});}}
 return unseen.size===0;
}
function exposed(tile,tiles){const occupied=new Set(tiles.map(key));return EDGES.filter(([x,z])=>!occupied.has((tile.x+x)+','+(tile.z+z)));}
function chooseTarget(g){
 const tiles=g.ship.tiles??[];if(tiles.length<=2)return null;
 const edgeTiles=tiles.filter(t=>exposed(t,tiles).length&&connectedWithout(tiles,t));
 const candidates=edgeTiles.sort((a,b)=>Number(!!b.placed)-Number(!!a.placed)||distance({x:g.ship.x+a.x*TILE,y:g.ship.y,z:g.ship.z+a.z*TILE},g.enemy)-distance({x:g.ship.x+b.x*TILE,y:g.ship.y,z:g.ship.z+b.z*TILE},g.enemy));
 const tile=candidates[0];if(!tile)return null;
 const edge=exposed(tile,tiles).sort((a,b)=>{
   const d=e=>distance({x:g.ship.x+tile.x*TILE+e[0]*TILE/2,y:g.ship.y,z:g.ship.z+tile.z*TILE+e[1]*TILE/2},g.enemy);
   return d(a)-d(b);
 })[0];
 return {tile,edge:{x:edge[0],z:edge[1]}};
}
function attackPoint(g,attack){return {x:g.ship.x+attack.tile.x*TILE+attack.edge.x*(TILE/2+20),y:g.ship.y+12,z:g.ship.z+attack.tile.z*TILE+attack.edge.z*(TILE/2+20)};}
function scheduleNext(g){g.enemy.nextRaftAttack=g.time+35+(g.random?.()??.5)*20;}
function release(g){g.enemy.raftAttack=null;g.enemy.stun=Math.max(g.enemy.stun??0,4);g.enemy.magnetRepelUntil=g.time+4;scheduleNext(g);}
function detachTarget(g,attack){
 const tile=attack.tile;
 const minX=tile.x*TILE-TILE/2,maxX=tile.x*TILE+TILE/2,minZ=tile.z*TILE-TILE/2,maxZ=tile.z*TILE+TILE/2;
 for(const object of [...g.ship.objects]){const b=objectBounds(object);if(b.minX<maxX&&b.maxX>minX&&b.minZ<maxZ&&b.maxZ>minZ){g.ship.objects.splice(g.ship.objects.indexOf(object),1);g.resources.push({type:'item',itemKey:object.type,x:g.ship.x+object.x,y:g.ship.y+18,z:g.ship.z+object.z,vx:attack.edge.x*45,vy:18,vz:attack.edge.z*45,pickupAfter:g.time+1.2});}}
 g.ship.tiles.splice(g.ship.tiles.indexOf(tile),1);g.ship.modules=Math.max(0,g.ship.modules-1);g.ship.max=Math.max(0,g.ship.max-(tile.placed?40:30));g.ship.hp=Math.min(g.ship.hp,g.ship.max);
 g.resources.push({type:'item',itemKey:'hull',x:g.ship.x+tile.x*TILE,y:g.ship.y+8,z:g.ship.z+tile.z*TILE,vx:attack.edge.x*52,vy:22,vz:attack.edge.z*52,pickupAfter:g.time+1.2});
 g.enemy.raftAttack=null;scheduleNext(g);
}
export function hitSnakeRaftAttack(g){
 const attack=g.enemy.raftAttack;if(!attack||attack.phase!=='bite')return false;
 attack.hits++;
 if(attack.hits>=HITS_TO_RELEASE)release(g);
 return true;
}
export function updateSnakeRaftAttack(g,dt){
 const enemy=g.enemy;
 if(enemy.nextRaftAttack==null)enemy.nextRaftAttack=FIRST_RAFT_ATTACK;
 let attack=enemy.raftAttack;
 if(!attack){
   if(g.time<enemy.nextRaftAttack||enemy.stun>0||enemy.grab||!onRaft(g))return false;
   const target=chooseTarget(g);if(!target){scheduleNext(g);return false;}
   attack=enemy.raftAttack={...target,phase:'approach',remaining:RAFT_BITE_TIME,hits:0,jerk:0,showHint:!enemy.raftAttackHintShown};
 }
 if(!g.ship.tiles.includes(attack.tile)){enemy.raftAttack=null;scheduleNext(g);return false;}
 const point=attackPoint(g,attack);
 if(attack.phase==='approach'){
   advanceSnake(enemy,point,dt);
   if(distance(enemy,point)<42){attack.phase='bite';attack.remaining=RAFT_BITE_TIME;if(attack.showHint){enemy.raftAttackHintShown=true;g.log='Змейка вцепилась в палубу — дважды ударьте её в голову!';}}
   return true;
 }
 attack.remaining=Math.max(0,attack.remaining-dt);
 const phase=((RAFT_BITE_TIME-attack.remaining)%.72)/.72;
 attack.jerk=phase<.16?1-phase/.16:0;
 enemy.x=point.x+attack.edge.x*attack.jerk*6;enemy.y=point.y+attack.jerk*1.5;enemy.z=point.z+attack.edge.z*attack.jerk*6;
 enemy.motion??={heading:{x:-attack.edge.x,y:0,z:-attack.edge.z},speed:0,last:{...enemy}};
 enemy.motion.heading={x:-attack.edge.x,y:0,z:-attack.edge.z};enemy.motion.last={x:enemy.x,y:enemy.y,z:enemy.z};
 if(attack.remaining<=0)detachTarget(g,attack);
 return true;
}

